import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { toast } from "sonner";
import { Asset, Vendor, Document, BusinessProfile } from "./types";

// Helper function to upload image to Firebase Storage
async function uploadImageToStorage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

// Helper function to generate unique file name
function generateUniqueFileName(file: File): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Helper to get current user ID with better error handling
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No authenticated user found");
    return null; // Return null instead of throwing an error
  }
  return user.uid;
};

const AssetOperationsImpl = {
  getAssets: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error("User not authenticated");

      const assetsRef = collection(db, "assets");
      // Match the composite index exactly as configured in Firestore
      const q = query(
        assetsRef,
        where("userId", "==", userId),
        orderBy("assetName", "asc"),
        orderBy("createdAt", "desc"),
        orderBy("__name__", "desc")
      );

      console.log("Executing Firestore query..."); // Debug log
      const querySnapshot = await getDocs(q);
      console.log(
        "Raw Firestore data:",
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      if (querySnapshot.empty) {
        console.log("No assets found for user:", userId);
        return [];
      }

      const assets = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          assetName: data.assetName || "",
          category: data.category || "",
          status: data.status || "",
          location: data.location || "",
          assetPhotoURL: data.assetPhotoURL || "",
          serialNumber: data.serialNumber || "",
          purchaseDate: data.purchaseDate || null,
          internalNotes: data.internalNotes || "",
          manufacturer: data.manufacturer || "",
          model: data.model || "",
          condition: data.condition || "",
          purchasePrice: data.purchasePrice || 0,
          warrantyExpiry: data.warrantyExpiry || null,
          assignedTo: data.assignedTo || "",
          usageType: data.usageType || "",
          lastMaintenanceDate: data.lastMaintenanceDate || null,
          nextMaintenanceDate: data.nextMaintenanceDate || null,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      console.log("Processed assets:", assets); // Debug log
      return assets;
    } catch (error) {
      console.error("Error fetching assets:", error);
      throw error; // Let the React Query error boundary handle this
    }
  },
  getRecentAssets: async (limit = 5) => {
    try {
      const userId = getCurrentUserId();
      const assetsRef = collection(db, "assets");
      const q = query(assetsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return [];
      }

      // Sort and limit in memory since we can't rely on the index
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Format fields to match what's expected in the RecentActivity component
          name: doc.data().name || "Unnamed Asset",
          type: doc.data().category || "No Category",
          createdAt: doc.data().createdAt || new Date().toISOString(),
        }))
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime(); // descending order
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent assets:", error);
      return [];
    }
  },
  getAssetCount: async () => {
    try {
      const userId = getCurrentUserId();
      const assetsRef = collection(db, "assets");
      const q = query(assetsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.size;
    } catch (error) {
      console.error("Error fetching asset count:", error);
      throw error;
    }
  },
  getAsset: async (id: string) => {
    try {
      const assetDoc = await getDoc(doc(db, "assets", id));

      if (!assetDoc.exists()) {
        throw new Error("Asset not found");
      }

      const data = assetDoc.data();

      return {
        id: assetDoc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        purchaseDate: data.purchaseDate?.toDate()?.toISOString() || null,
        warrantyExpiry: data.warrantyExpiry?.toDate()?.toISOString() || null,
        serviceDate: data.serviceDate?.toDate()?.toISOString() || null,
      } as Asset;
    } catch (error) {
      console.error("Error fetching asset:", error);
      throw error;
    }
  },
  createAsset: async (asset: Omit<Asset, "id" | "createdAt">) => {
    try {
      const userId = getCurrentUserId();

      // Convert dates to Firestore Timestamps
      const assetWithTimestamps = {
        ...asset,
        userId,
        createdAt: serverTimestamp(),
        purchaseDate: asset.purchaseDate
          ? Timestamp.fromDate(new Date(asset.purchaseDate))
          : null,
        warrantyExpiry: asset.warrantyExpiry
          ? Timestamp.fromDate(new Date(asset.warrantyExpiry))
          : null,
        serviceDate: asset.serviceDate
          ? Timestamp.fromDate(new Date(asset.serviceDate))
          : null,
      };

      const docRef = await addDoc(
        collection(db, "assets"),
        assetWithTimestamps
      );

      return {
        id: docRef.id,
        ...assetWithTimestamps,
        createdAt: new Date(),
      } as Asset;
    } catch (error) {
      console.error("Error creating asset:", error);
      throw error;
    }
  },
  updateAsset: async (id: string, asset: Partial<Asset>) => {
    try {
      const assetRef = doc(db, "assets", id);

      // Convert dates to Firestore Timestamps
      const updates: any = { ...asset };
      if (asset.purchaseDate)
        updates.purchaseDate = Timestamp.fromDate(new Date(asset.purchaseDate));
      if (asset.warrantyExpiry)
        updates.warrantyExpiry = Timestamp.fromDate(
          new Date(asset.warrantyExpiry)
        );
      if (asset.serviceDate)
        updates.serviceDate = Timestamp.fromDate(new Date(asset.serviceDate));

      await updateDoc(assetRef, updates);

      const updatedDoc = await getDoc(assetRef);
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt.toDate() || new Date(),
        purchaseDate: data?.purchaseDate?.toDate() || null,
        warrantyExpiry: data?.warrantyExpiry?.toDate() || null,
        serviceDate: data?.serviceDate?.toDate() || null,
      } as Asset;
    } catch (error) {
      console.error("Error updating asset:", error);
      throw error;
    }
  },
  deleteAsset: async (id: string) => {
    try {
      await deleteDoc(doc(db, "assets", id));
      return true;
    } catch (error) {
      console.error("Error deleting asset:", error);
      throw error;
    }
  },
  uploadAssetImage: async (file: File) => {
    try {
      const userId = getCurrentUserId();
      const storageRef = ref(
        storage,
        `assets/${userId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading asset image:", error);
      throw error;
    }
  },
};

export const VendorOperations = {
  getVendors: async () => {
    try {
      const userId = getCurrentUserId();
      const vendorsRef = collection(db, "vendors");
      // Query without orderBy to match the existing index
      const q = query(vendorsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      // Sort the results in memory after fetching
      return querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          // Handle sorting after data is retrieved
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime(); // descending order
        });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error;
    }
  },

  getVendorCount: async () => {
    try {
      const userId = getCurrentUserId();
      const vendorsRef = collection(db, "vendors");
      const q = query(vendorsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting vendor count:", error);
      return 0;
    }
  },

  getRecentVendors: async (limit = 5) => {
    try {
      const userId = getCurrentUserId();
      const vendorsRef = collection(db, "vendors");
      const q = query(vendorsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return [];
      }

      // Sort and limit in memory since we can't rely on the index
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Format fields to match what's expected in the RecentActivity component
          name: doc.data().companyName || "Unnamed Vendor",
          type: doc.data().industry || "No Industry",
          createdAt: doc.data().createdAt || new Date().toISOString(),
        }))
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime(); // descending order
        })
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching recent vendors:", error);
      return [];
    }
  },

  async getVendor(id) {
    try {
      const userId = getCurrentUserId();
      const vendorDoc = doc(db, "vendors", id);
      const vendorSnap = await getDoc(vendorDoc);

      if (!vendorSnap.exists()) {
        throw new Error("Vendor not found");
      }

      const vendorData = vendorSnap.data();

      // Security check - ensure user only accesses their own data
      if (vendorData.userId !== userId) {
        throw new Error("You do not have permission to access this vendor");
      }

      return {
        id: vendorSnap.id,
        ...vendorData,
      };
    } catch (error) {
      console.error("Error fetching vendor:", error);
      throw new Error(`Failed to fetch vendor: ${error.message}`);
    }
  },

  async addVendor(vendorData) {
    try {
      const userId = getCurrentUserId();

      const timestamp = serverTimestamp();
      const newVendor = {
        ...vendorData,
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await addDoc(collection(db, "vendors"), newVendor);
      return {
        id: docRef.id,
        ...newVendor,
        createdAt: new Date().toISOString(), // Client-side fallback for immediate UI update
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error adding vendor:", error);
      throw new Error(`Failed to add vendor: ${error.message}`);
    }
  },

  async updateVendor(id, vendorData) {
    try {
      const userId = getCurrentUserId();
      const vendorRef = doc(db, "vendors", id);

      // Verify ownership before update
      const vendorSnap = await getDoc(vendorRef);
      if (!vendorSnap.exists()) {
        throw new Error("Vendor not found");
      }

      const existingData = vendorSnap.data();
      if (existingData.userId !== userId) {
        throw new Error("You do not have permission to update this vendor");
      }

      const updateData = {
        ...vendorData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(vendorRef, updateData);

      return {
        id,
        ...existingData,
        ...updateData,
        updatedAt: new Date().toISOString(), // Client-side fallback for immediate UI update
      };
    } catch (error) {
      console.error("Error updating vendor:", error);
      throw new Error(`Failed to update vendor: ${error.message}`);
    }
  },

  async deleteVendor(id) {
    try {
      const userId = getCurrentUserId();
      const vendorRef = doc(db, "vendors", id);

      // Verify ownership before delete
      const vendorSnap = await getDoc(vendorRef);
      if (!vendorSnap.exists()) {
        throw new Error("Vendor not found");
      }

      const vendorData = vendorSnap.data();
      if (vendorData.userId !== userId) {
        throw new Error("You do not have permission to delete this vendor");
      }

      await deleteDoc(vendorRef);
      return true;
    } catch (error) {
      console.error("Error deleting vendor:", error);
      throw new Error(`Failed to delete vendor: ${error.message}`);
    }
  },
};

export const DocumentOperations = {
  getRecentDocuments: async (count = 5) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.log("No authenticated user, returning empty documents array");
        return [];
      }

      const documentsRef = collection(db, "documents");
      const q = query(
        documentsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(count)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || doc.data().documentName,
        description: doc.data().description,
        createdAt: doc.data().createdAt,
      }));
    } catch (error) {
      console.error("Error fetching recent documents:", error);
      return [];
    }
  },
  getDocuments: async () => {
    try {
      const userId = getCurrentUserId();
      const documentsRef = collection(db, "documents");
      const q = query(
        documentsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          } as Document)
      );
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },
  getDocumentCount: async () => {
    try {
      const userId = getCurrentUserId();
      const documentsRef = collection(db, "documents");
      const q = query(documentsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.size;
    } catch (error) {
      console.error("Error fetching document count:", error);
      throw error;
    }
  },
  getDocument: async (id: string) => {
    try {
      const documentDoc = await getDoc(doc(db, "documents", id));

      if (!documentDoc.exists()) {
        throw new Error("Document not found");
      }

      const data = documentDoc.data();

      return {
        id: documentDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Document;
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  },
  createDocument: async (document: Omit<Document, "id" | "createdAt">) => {
    try {
      const userId = getCurrentUserId();

      const documentWithTimestamps = {
        ...document,
        userId,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "documents"),
        documentWithTimestamps
      );

      return {
        id: docRef.id,
        ...documentWithTimestamps,
        createdAt: new Date(),
      } as Document;
    } catch (error) {
      console.error("Error creating document:", error);
      throw error;
    }
  },
  updateDocument: async (id: string, document: Partial<Document>) => {
    try {
      const documentRef = doc(db, "documents", id);

      await updateDoc(documentRef, document);

      const updatedDoc = await getDoc(documentRef);
      const data = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...data,
        createdAt: data?.createdAt.toDate() || new Date(),
      } as Document;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  },
  deleteDocument: async (id: string) => {
    try {
      await deleteDoc(doc(db, "documents", id));
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },
  uploadDocumentFile: async (file: File) => {
    try {
      const userId = getCurrentUserId();
      const storageRef = ref(
        storage,
        `documents/${userId}/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading document file:", error);
      throw error;
    }
  },
};

export const BusinessProfileOperations = {
  getBusinessProfile: async () => {
    try {
      const userId = getCurrentUserId();
      const profilesRef = collection(db, "businessProfiles");
      const q = query(profilesRef, where("userId", "==", userId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as BusinessProfile;
    } catch (error) {
      console.error("Error fetching business profile:", error);
      throw error;
    }
  },
  saveBusinessProfile: async (profile: Omit<BusinessProfile, "id">) => {
    try {
      const userId = getCurrentUserId();

      // Check if profile already exists
      const profilesRef = collection(db, "businessProfiles");
      const q = query(profilesRef, where("userId", "==", userId), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new profile
        const docRef = await addDoc(collection(db, "businessProfiles"), {
          ...profile,
          userId,
        });

        return {
          id: docRef.id,
          ...profile,
        } as BusinessProfile;
      } else {
        // Update existing profile
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "businessProfiles", existingDoc.id), profile);

        return {
          id: existingDoc.id,
          ...profile,
        } as BusinessProfile;
      }
    } catch (error) {
      console.error("Error saving business profile:", error);
      throw error;
    }
  },
  uploadBusinessLogo: async (file: File) => {
    try {
      const userId = getCurrentUserId();
      const storageRef = ref(storage, `businessLogos/${userId}/${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading business logo:", error);
      throw error;
    }
  },
};
export const AssetOperations = AssetOperationsImpl;
