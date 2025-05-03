import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { log } from "./vite";

// Clean up and properly format the private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// Check for required environment variables
const requiredEnvVars = [
  { name: 'FIREBASE_PRIVATE_KEY', value: privateKey },
  { name: 'VITE_FIREBASE_PROJECT_ID', value: process.env.VITE_FIREBASE_PROJECT_ID },
  { name: 'FIREBASE_CLIENT_EMAIL', value: process.env.FIREBASE_CLIENT_EMAIL }
];

const missingVars = requiredEnvVars.filter(v => !v.value);
if (missingVars.length > 0) {
  const missing = missingVars.map(v => v.name).join(', ');
  throw new Error(`Missing required environment variables: ${missing}`);
}

const serviceAccount = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: privateKey,
};

// Initialize Firebase Admin SDK
const admin = initializeApp({
  credential: cert(serviceAccount as any),
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
});

// Create and export the services
const adminAuth = getAuth(admin);
const adminDb = getFirestore(admin);
const adminStorage = getStorage(admin);

try {
  log("Firebase Admin SDK initialized successfully", "firebase-admin");
} catch (error) {
  log(`Failed to initialize Firebase Admin SDK: ${error}`, "firebase-admin");
  throw error;
}

export { adminAuth, adminDb, adminStorage };