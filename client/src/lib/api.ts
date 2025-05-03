
import { auth } from './firebase';

/**
 * Helper function to make authenticated API calls to our backend
 */
export async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  data?: any
): Promise<T> {
  try {
    // Get current user's auth token
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to perform this action');
    }

    const token = await user.getIdToken();
    console.log(`Making ${method} request to ${endpoint} with auth token`);
    
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error:', errorData);
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    // Get the current user's ID token
    const token = await auth.currentUser?.getIdToken(true);
    
    // If no token, the user is not authenticated
    if (!token) {
      throw new Error('User not authenticated');
    }
    
    // Add the token to the Authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Return the fetch promise with the auth headers
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error ${response.status}`
      }));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Helper for GET requests
export async function getWithAuth(url: string) {
  const response = await fetchWithAuth(url);
  return response.json();
}

// Helper for POST requests
export async function postWithAuth(url: string, data: any) {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper for PUT requests
export async function putWithAuth(url: string, data: any) {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Helper for DELETE requests
export async function deleteWithAuth(url: string) {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });
  return response.json();
}
