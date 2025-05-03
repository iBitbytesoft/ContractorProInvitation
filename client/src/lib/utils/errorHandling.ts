// Error handling utility functions

import { toast } from 'sonner';

/**
 * Checks if the user is authenticated and throws a standardized error if not
 * @param currentUser The current authenticated user or null
 * @throws {Error} If no user is authenticated
 */
export function requireAuthentication(currentUser: any): void {
  if (!currentUser) {
    throw new Error("User not authenticated. Please sign in to continue.");
  }
}

/**
 * Format Firebase error messages for user display
 * @param error The error object from Firebase
 * @returns A user-friendly error message
 */
export function formatFirebaseError(error: any): string {
  // Handle Firebase Auth errors
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/invalid-credential':
        return 'Invalid login credentials. Please try again.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials.';
      case 'auth/requires-recent-login':
        return 'This operation is sensitive and requires recent authentication. Please log in again.';
      // Firestore permission errors
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'failed-precondition':
        return 'The operation failed because a condition was not met. You may need to log in again.';
      default:
        return `An error occurred: ${error.message || error.code}`;
    }
  }

  // Handle generic errors
  return error.message || 'An unknown error occurred. Please try again.';
}


export function handleApiError(error: any, fallbackMessage: string = 'An error occurred'): void {
  console.error(error);

  // Extract error message
  let errorMessage = fallbackMessage;

  if (error instanceof Error) {
    // Standard JS Error object
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Firebase or other structured error
    if ('message' in error) {
      errorMessage = error.message;
    } else if ('code' in error) {
      // Handle Firebase error codes
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'User not found. Please check your credentials.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use. Please use a different email.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use a stronger password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address. Please check the email format.';
          break;
        case 'permission-denied':
        case 'failed-precondition':
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 'not-found':
          errorMessage = 'The requested resource was not found.';
          break;
        default:
          errorMessage = `Error: ${error.code}`;
      }
    }
  }

  // Display error message to user
  toast.error(errorMessage);
}