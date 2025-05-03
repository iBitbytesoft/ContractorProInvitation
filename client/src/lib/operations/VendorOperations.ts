import { db, collections, auth } from '@/lib/firebase';
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
  limit
} from 'firebase/firestore';
import { Vendor } from '@/lib/types';
import { handleApiError } from '@/lib/utils/errorHandling';

/**
 * Vendor operations implementation
 */
const VendorOperations = {
  /**
   * Get all vendors for the current user
   */
  async getAllVendors(): Promise<Vendor[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collections.vendors, 
        where("userId", "==", userId),
        orderBy("companyName")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vendor[];
    } catch (error) {
      console.error('Error getting vendors:', error);
      handleApiError(error, 'Failed to fetch vendors');
      throw error;
    }
  },

  /**
   * Get a single vendor by ID
   */
  async getVendor(vendorId: string): Promise<Vendor> {
    try {
      const vendorRef = doc(collections.vendors, vendorId);
      const vendorSnapshot = await getDoc(vendorRef);
      
      if (!vendorSnapshot.exists()) {
        throw new Error('Vendor not found');
      }
      
      return {
        id: vendorSnapshot.id,
        ...vendorSnapshot.data()
      } as Vendor;
    } catch (error) {
      console.error('Error getting vendor:', error);
      handleApiError(error, 'Failed to get vendor');
      throw error;
    }
  },

  /**
   * Create a new vendor
   */
  async createVendor(vendorData: Partial<Vendor>): Promise<string> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docData = {
        ...vendorData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collections.vendors, docData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vendor:', error);
      handleApiError(error, 'Failed to create vendor');
      throw error;
    }
  },

  /**
   * Update an existing vendor
   */
  async updateVendor(vendorId: string, vendorData: Partial<Vendor>): Promise<void> {
    try {
      const vendorRef = doc(collections.vendors, vendorId);
      
      const updateData = {
        ...vendorData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(vendorRef, updateData);
    } catch (error) {
      console.error('Error updating vendor:', error);
      handleApiError(error, 'Failed to update vendor');
      throw error;
    }
  },

  /**
   * Delete a vendor
   */
  async deleteVendor(vendorId: string): Promise<void> {
    try {
      const vendorRef = doc(collections.vendors, vendorId);
      await deleteDoc(vendorRef);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      handleApiError(error, 'Failed to delete vendor');
      throw error;
    }
  },

  /**
   * Get recent vendors
   */
  async getRecentVendors(limitCount: number = 5): Promise<Vendor[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const q = query(
        collections.vendors, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vendor[];
    } catch (error) {
      console.error('Error getting recent vendors:', error);
      handleApiError(error, 'Failed to get recent vendors');
      throw error;
    }
  }
};

export default VendorOperations;