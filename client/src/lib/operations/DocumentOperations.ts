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
  Timestamp,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Document } from '@/lib/types';
import { handleApiError } from '@/lib/utils/errorHandling';

/**
 * Generate a unique filename for storage
 */
const generateUniqueFileName = (file: File): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${timestamp}-${randomString}-${originalName}`;
};

/**
 * Upload document file to Firebase Storage
 */
const uploadDocumentFile = async (file: File): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    const uniqueFileName = generateUniqueFileName(file);
    const storageRef = ref(storage, `documents/${userId}/${uniqueFileName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading document file:', error);
    handleApiError(error, 'Failed to upload document file');
    throw error;
  }
};

/**
 * Document Operations implementation
 */
export const DocumentOperations = {
  /**
   * Create a new document
   */
  async createDocument(documentData: Partial<Document>, file: File): Promise<string> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Upload file first
      const fileURL = await uploadDocumentFile(file);

      // Create document with file URL
      const docData = {
        ...documentData,
        fileURL,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collections.documents, docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating document:', error);
      handleApiError(error, 'Failed to create document');
      throw error;
    }
  },

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<Document[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collections.documents, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
    } catch (error) {
      console.error('Error getting documents:', error);
      handleApiError(error, 'Failed to get documents');
      throw error;
    }
  },

  /**
   * Get documents by vendor
   */
  async getDocumentsByVendor(vendorId: string): Promise<Document[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collections.documents, 
        where("userId", "==", userId),
        where("vendorId", "==", vendorId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
    } catch (error) {
      console.error('Error getting vendor documents:', error);
      handleApiError(error, 'Failed to get vendor documents');
      throw error;
    }
  },

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<Document> {
    try {
      const documentRef = doc(collections.documents, documentId);
      const documentSnapshot = await getDoc(documentRef);
      
      if (!documentSnapshot.exists()) {
        throw new Error('Document not found');
      }
      
      return {
        id: documentSnapshot.id,
        ...documentSnapshot.data()
      } as Document;
    } catch (error) {
      console.error('Error getting document:', error);
      handleApiError(error, 'Failed to get document');
      throw error;
    }
  },

  /**
   * Update an existing document
   */
  async updateDocument(documentId: string, documentData: Partial<Document>, file?: File): Promise<void> {
    try {
      const documentRef = doc(collections.documents, documentId);
      
      let updateData: Partial<Document> = {
        ...documentData,
        updatedAt: new Date().toISOString()
      };
      
      // If a new file is provided, upload it and update the URL
      if (file) {
        const fileURL = await uploadDocumentFile(file);
        updateData.fileURL = fileURL;
        
        // Get the old document to delete its file
        const oldDoc = await this.getDocument(documentId);
        if (oldDoc.fileURL) {
          try {
            const oldFileRef = ref(storage, oldDoc.fileURL);
            await deleteObject(oldFileRef);
          } catch (e) {
            console.warn('Could not delete old file:', e);
          }
        }
      }
      
      await updateDoc(documentRef, updateData);
    } catch (error) {
      console.error('Error updating document:', error);
      handleApiError(error, 'Failed to update document');
      throw error;
    }
  },

  /**
   * Delete a document and its file
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Get the document to delete its file
      const document = await this.getDocument(documentId);
      
      // Delete the document
      const documentRef = doc(collections.documents, documentId);
      await deleteDoc(documentRef);
      
      // Delete the file if it exists
      if (document.fileURL) {
        try {
          const fileRef = ref(storage, document.fileURL);
          await deleteObject(fileRef);
        } catch (e) {
          console.warn('Could not delete file:', e);
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      handleApiError(error, 'Failed to delete document');
      throw error;
    }
  },

  /**
   * Get recent documents
   */
  async getRecentDocuments(limitCount: number = 5): Promise<Document[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collections.documents, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
    } catch (error) {
      console.error('Error getting recent documents:', error);
      handleApiError(error, 'Failed to get recent documents');
      throw error;
    }
  }
};

export default DocumentOperations;