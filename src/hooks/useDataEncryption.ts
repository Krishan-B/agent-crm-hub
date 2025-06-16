
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDataEncryption = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encryptData = async (
    tableName: string,
    recordId: string,
    fieldName: string,
    value: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('encrypt-data', {
        body: {
          tableName,
          recordId,
          fieldName,
          value
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error encrypting data:', err);
      setError('Failed to encrypt data');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptData = async (
    tableName: string,
    recordId: string,
    fieldName: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('decrypt-data', {
        body: {
          tableName,
          recordId,
          fieldName
        }
      });

      if (error) throw error;
      return data.value;
    } catch (err) {
      console.error('Error decrypting data:', err);
      setError('Failed to decrypt data');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    encryptData,
    decryptData
  };
};
