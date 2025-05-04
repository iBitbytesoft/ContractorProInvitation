import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Firestore,
} from "firebase/firestore";
import type { Asset, Vendor, Document, BusinessProfile } from "./types";

// Direct access to environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "development-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "development"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "development",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "development"}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || "development-app-id",
};

console.log("Initializing Firebase with config:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "********************" : undefined,
});

// Initialize Firebase instances with proper typing
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase client SDK initialized successfully");
} catch (error: any) {
  console.error("Error initializing Firebase:", error.message);
  throw error;
}

const auth: Auth = getAuth(app);
const storage = getStorage(app);
const db: Firestore = getFirestore(app);

// Export Firebase instances
export { app, auth, storage, db };

// Firebase collections
export const collections = {
  assets: collection(db, "assets"),
  vendors: collection(db, "vendors"),
  documents: collection(db, "documents"),
  businessProfiles: collection(db, "businessProfiles"),
  team: collection(db, "team"),
  maintenanceLogs: collection(db, "maintenanceLogs"),
  users: collection(db, "users"),
  invitations: collection(db, "invitations"),
};

// Firestore service methods
export const firestoreService = {
  // Asset methods
  async createAsset(asset: Asset): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const assetData = {
      ...asset,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collections.assets, assetData);
    return docRef.id;
  },

  async updateAsset(assetId: string, asset: Partial<Asset>): Promise<void> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const docRef = doc(db, "assets", assetId);
    await updateDoc(docRef, {
      ...asset,
      updatedAt: new Date().toISOString(),
    });
  },

  async getAsset(assetId: string): Promise<Asset | null> {
    const docRef = doc(db, "assets", assetId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Asset;
    }
    return null;
  },

  async getUserAssets(): Promise<Asset[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const q = query(
      collections.assets,
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
  },

  // Vendor methods
  async createVendor(vendor: Vendor): Promise<string> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const vendorData = {
      ...vendor,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collections.vendors, vendorData);
    return docRef.id;
  },

  async getUserVendors(): Promise<Vendor[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const q = query(
      collections.vendors,
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Vendor[];
  },

  async getUserDocuments(): Promise<Document[]> {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const q = query(
      collections.documents,
      where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[];
  },
};

// Invitation methods
export async function createInvitation(email: string): Promise<string> {
  const token = Math.random().toString(36).substr(2);
  await addDoc(collections.invitations, { email, token, status: "pending" });
  return token;
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  const invitationRef = doc(collections.invitations, invitationId);
  await updateDoc(invitationRef, { status: "accepted" });
}

export async function verifyToken(token: string): Promise<boolean> {
  const q = query(collections.invitations, where("token", "==", token));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, { status: "accepted" });
    console.log(`Token verified successfully for user: ${docRef.id}`);
    return true;
  }
  console.log("Token verification failed.");
  return false;
}

export async function getInvitationStatus(email: string): Promise<string> {
  const q = query(collections.invitations, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data().status;
  }
  return "not invited";
}

export async function fetchInvitations(): Promise<any[]> {
  const querySnapshot = await getDocs(collections.invitations);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
