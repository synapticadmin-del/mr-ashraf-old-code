import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ToastOptions {
  title: string;
  description?: string;
}

export function useToast() {
  const toast = useCallback(({ title, description }: ToastOptions) => {
    // For React Native, we'll use Alert. You can replace this with a custom toast component
    Alert.alert(title, description || '', [{ text: 'OK' }]);
  }, []);

  return { toast };
}

// Export toast function for direct use
export const toast = ({ title, description }: ToastOptions) => {
  Alert.alert(title, description || '', [{ text: 'OK' }]);
};

