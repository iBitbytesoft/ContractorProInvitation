// Serverless-compatible Firebase Admin SDK initialization
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Clean up and properly format the private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

// Initialize Firebase Admin SDK
let adminAuth;
let adminDb;
let adminStorage;

try {
  // Check for required environment variables
  if (!privateKey) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY environment variable");
  }
  if (!process.env.VITE_FIREBASE_PROJECT_ID) {
    throw new Error("Missing VITE_FIREBASE_PROJECT_ID environment variable");
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL environment variable");
  }

  const serviceAccount = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  // Initialize Firebase Admin SDK
  const admin = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  });

  // Create the services
  adminAuth = getAuth(admin);
  adminDb = getFirestore(admin);
  adminStorage = getStorage(admin);

  console.log("Firebase Admin SDK initialized successfully for serverless function");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error);
  throw error;
}

export { adminAuth, adminDb, adminStorage };