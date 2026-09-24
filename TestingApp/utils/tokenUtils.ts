import { tokenStorage } from './tokenStorage';

/**
 * Decodes a JWT token and returns the payload
 * Works in both web and React Native/Expo environments
 */
export const decodeToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // atob should be available in Expo/React Native
    // If not, we'll catch the error and return null
    const decoded = atob(base64);
    
    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Gets the student ID from the stored token
 */
export const getStudentIdFromToken = async (): Promise<string | null> => {
  try {
    const token = await tokenStorage.getToken();
    if (!token) {
      return null;
    }
    const decoded = decodeToken(token);
    return decoded?.userId || decoded?.id || null;
  } catch (error) {
    console.error('Error getting student ID from token:', error);
    return null;
  }
};
