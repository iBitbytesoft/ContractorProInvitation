import { getDownloadURL, ref, uploadBytes, getMetadata } from "firebase/storage";
import { storage, auth } from "./firebase";

/**
 * Upload a file to Firebase Storage
 * @param file The file object to upload
 * @param folder Optional folder path within storage
 * @returns Promise that resolves to the download URL
 */
export async function uploadFile(file: File): Promise<string> {
  const timestamp = Date.now();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error("User must be logged in to upload files");
  }

  if (!file.type.startsWith('image/')) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB");
  }

  // Ensure the path matches the storage.rules structure (logos/{userId}/{fileName})
  const storageRef = ref(storage, `logos/${userId}/${timestamp}_${file.name}`);

  // Set custom metadata including userId for security rules
  const metadata = {
    customMetadata: {
      userId: userId,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  };

  console.log(`Uploading file to ${folder}/${timestamp}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file, metadata);
  const downloadUrl = await getDownloadURL(snapshot.ref);

  console.log("File uploaded successfully, URL:", downloadUrl);
  return downloadUrl;
}

/**
 * Delete a file from Firebase Storage
 * @param fileUrl The complete URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;

  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log('File deleted successfully:', fileUrl);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
};