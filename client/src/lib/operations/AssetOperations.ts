import { db, storage, auth, collections } from '@/lib/firebase';
import { 
  collection, 
  addDoc,
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Asset } from '@/lib/types';
import { handleApiError } from '@/lib/utils/errorHandling';

const uploadAssetImage = async (file: File): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }

  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const storageRef = ref(storage, `assets/${auth.currentUser.uid}/${fileName}`);

  const uploadResult = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(uploadResult.ref);
  return downloadURL;
};

export const AssetOperations = {
  async createAsset(assetData: any, imageFile?: File): Promise<string> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let assetPhotoURL = null;
      if (imageFile) {
        assetPhotoURL = await uploadAssetImage(imageFile);
      }

      const asset = {
        ...assetData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assetPhotoURL,
        purchaseDate: assetData.purchaseDate ? Timestamp.fromDate(new Date(assetData.purchaseDate)) : null,
        warrantyExpiry: assetData.warrantyExpiry ? Timestamp.fromDate(new Date(assetData.warrantyExpiry)) : null,
        lastMaintenanceDate: assetData.lastMaintenanceDate ? Timestamp.fromDate(new Date(assetData.lastMaintenanceDate)) : null,
        nextMaintenanceDate: assetData.nextMaintenanceDate ? Timestamp.fromDate(new Date(assetData.nextMaintenanceDate)) : null
      };

      const docRef = await addDoc(collections.assets, asset);
      return docRef.id;
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  },

  async getAllAssets(): Promise<Asset[]> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const q = query(
        collections.assets,
        where('userId', '==', auth.currentUser.uid),
        orderBy('assetName', 'asc'), 
        orderBy('createdAt', 'desc') 
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null,
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate().toISOString() : null,
        purchaseDate: doc.data().purchaseDate ? doc.data().purchaseDate.toDate().toISOString() : null,
        warrantyExpiry: doc.data().warrantyExpiry ? doc.data().warrantyExpiry.toDate().toISOString() : null,
        lastMaintenanceDate: doc.data().lastMaintenanceDate ? doc.data().lastMaintenanceDate.toDate().toISOString() : null,
        nextMaintenanceDate: doc.data().nextMaintenanceDate ? doc.data().nextMaintenanceDate.toDate().toISOString() : null,
      }));
    } catch (error) {
      handleApiError(error, 'Error fetching assets');
      throw error;
    }
  },

  async getAsset(assetId: string): Promise<Asset> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(collections.assets, assetId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Asset not found');
      }

      const data = docSnap.data();
      if (data.userId !== auth.currentUser.uid) {
        throw new Error('Unauthorized access to asset');
      }

      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        purchaseDate: data.purchaseDate ? data.purchaseDate.toDate().toISOString() : null,
        warrantyExpiry: data.warrantyExpiry ? data.warrantyExpiry.toDate().toISOString() : null,
        lastMaintenanceDate: data.lastMaintenanceDate ? data.lastMaintenanceDate.toDate().toISOString() : null,
        nextMaintenanceDate: data.nextMaintenanceDate ? data.nextMaintenanceDate.toDate().toISOString() : null,
      };
    } catch (error) {
      handleApiError(error, 'Error fetching asset');
      throw error;
    }
  },

  async updateAsset(assetId: string, assetData: any, imageFile?: File): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      let assetPhotoURL = assetData.assetPhotoURL;
      if (imageFile) {
        assetData.assetPhotoURL = await uploadAssetImage(imageFile);
      }

      const updateData = {
        ...assetData,
        assetPhotoURL,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(collections.assets, assetId), updateData);
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  },

  async deleteAsset(assetId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const docRef = doc(collections.assets, assetId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Asset not found');
      }

      if (docSnap.data().userId !== auth.currentUser.uid) {
        throw new Error('Unauthorized access to asset');
      }

      await deleteDoc(docRef);
    } catch (error) {
      handleApiError(error, 'Error deleting asset');
      throw error;
    }
  },

  async getRecentAssets(limit: number = 5): Promise<Asset[]> {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const q = query(
        collections.assets,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null,
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate().toISOString() : null,
      }));
    } catch (error) {
      handleApiError(error, 'Error fetching recent assets');
      throw error;
    }
  }
};