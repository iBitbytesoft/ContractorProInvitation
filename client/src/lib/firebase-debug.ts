
import { db, auth } from './firebase';
import { enableIndexedDbPersistence } from 'firebase/firestore';

/**
 * Enable Firestore debugging utilities
 */
export const enableFirestoreDebugging = async () => {
  try {
    // Enable offline persistence
    await enableIndexedDbPersistence(db);
    console.log("Firestore offline persistence enabled");
  } catch (err: any) {
    console.error("Firestore persistence error:", err.code, err);
  }
};

/**
 * Log detailed information about the current authentication state
 */
export const logAuthState = () => {
  const user = auth.currentUser;
  console.log("Current auth state:", {
    isAuthenticated: !!user,
    userId: user?.uid,
    email: user?.email,
    isAnonymous: user?.isAnonymous,
    emailVerified: user?.emailVerified,
    providerData: user?.providerData
  });
};

/**
 * Debug Firestore operations with detailed logging
 * @param collectionName The collection to operate on
 */
export const debugFirestore = (collectionName: string) => {
  logAuthState();
  
  if (!auth.currentUser) {
    console.error(`Cannot access ${collectionName} - User not authenticated`);
    return;
  }
  
  const userId = auth.currentUser.uid;
  console.log(`Querying ${collectionName} for userId:`, userId);
  
  return db.collection(collectionName)
    .where("userId", "==", userId)
    .get()
    .then(snapshot => {
      console.log(`Fetched ${snapshot.docs.length} ${collectionName} documents:`, 
        snapshot.empty ? "No documents found" : snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      );
      return snapshot;
    })
    .catch(error => {
      console.error(`Firestore error querying ${collectionName}:`, {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    });
};

/**
 * Debug a specific document in Firestore
 * @param collectionName The collection to check
 * @param documentId The document ID to retrieve
 */
export const debugDocument = (collectionName: string, documentId: string) => {
  logAuthState();
  
  console.log(`Fetching document ${collectionName}/${documentId}`);
  
  return db.collection(collectionName).doc(documentId).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();
        console.log(`Document ${collectionName}/${documentId} exists:`, {
          id: doc.id,
          data,
          hasUserIdField: data?.userId ? true : false,
          userIdMatches: data?.userId === auth.currentUser?.uid
        });
      } else {
        console.log(`Document ${collectionName}/${documentId} does not exist`);
      }
      return doc;
    })
    .catch(error => {
      console.error(`Firestore error fetching document ${collectionName}/${documentId}:`, {
        code: error.code,
        message: error.message,
        details: error
      });
      throw error;
    });
};
