// Firestore collection interfaces
export interface Asset {
  id?: string;
  assetName: string;
  assetPhotoURL: string;
  category: string;
  location: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  condition?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  warrantyExpiry?: string;
  assignedTo?: string;
  usageType?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  serviceDate?: string;
  internalNotes?: string;
  status: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vendor {
  id?: string;
  companyName: string;
  abn: string;
  industry: string;
  address: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  licenseNumber: string;
  insuranceExpiry: string;
  complianceStatus: string;
  bankName: string;
  accountName: string;
  bsb: string;
  bankAccount: string;
  paymentTerms: string;
  rating: number;
  approvalStatus: string;
  internalNotes: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id?: string;
  documentName: string;
  category: string;
  description: string;
  fileURL: string;
  vendorId?: string;  // Optional reference to a vendor
  vendorName?: string; // Denormalized vendor name for easier display
  fileName?: string;   // Original file name
  fileType?: string;   // File type/extension
  fileSize?: number;   // File size in bytes
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfile {
  id?: string;
  businessName: string;
  abn: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  paymentTerms: string;
  notificationPreferences: Record<string, boolean>;
  logoURL: string;
  documents: string[];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}