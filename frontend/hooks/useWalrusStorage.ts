import { useState, useCallback } from 'react';

// Types for Walrus storage
interface WalrusUploadResponse {
  cid: string;
  size: number;
  url: string;
}

interface WalrusMetadata {
  cid: string;
  originalName: string;
  size: number;
  mimeType: string;
  iv: string;
  uploadDate: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface WalrusStorageHook {
  uploadFile: (
    encryptedData: string,
    metadata: Omit<WalrusMetadata, 'cid' | 'uploadDate'>
  ) => Promise<WalrusUploadResponse>;
  retrieveFile: (cid: string) => Promise<string>;
  getFileMetadata: (cid: string) => Promise<WalrusMetadata>;
  deleteFile: (cid: string) => Promise<boolean>;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
}

export function useWalrusStorage(): WalrusStorageHook {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_WALRUS_API_URL || 'https://api.walrus.com';

  const uploadFile = useCallback(
    async (
      encryptedData: string,
      metadata: Omit<WalrusMetadata, 'cid' | 'uploadDate'>
    ): Promise<WalrusUploadResponse> => {
      setIsUploading(true);
      setError(null);
      setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

      try {
        // Convert base64 encrypted data to blob
        const binaryString = atob(encryptedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/octet-stream' });

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', blob, 'encrypted_file');
        formData.append('metadata', JSON.stringify({
          ...metadata,
          uploadDate: new Date().toISOString(),
        }));

        // Upload to Walrus
        const response = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WALRUS_API_KEY}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Upload failed: ${response.status}`);
        }

        const result = await response.json();
        
        setUploadProgress({ loaded: 100, total: 100, percentage: 100 });
        
        return {
          cid: result.cid,
          size: result.size,
          url: result.url || `${apiUrl}/retrieve/${result.cid}`,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown upload error';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [apiUrl]
  );

  const retrieveFile = useCallback(
    async (cid: string): Promise<string> => {
      setError(null);
      
      try {
        const response = await fetch(`${apiUrl}/retrieve/${cid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WALRUS_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to retrieve file: ${response.status}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert to base64 string
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        
        return btoa(binaryString);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown retrieval error';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [apiUrl]
  );

  const getFileMetadata = useCallback(
    async (cid: string): Promise<WalrusMetadata> => {
      setError(null);
      
      try {
        const response = await fetch(`${apiUrl}/metadata/${cid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WALRUS_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get metadata: ${response.status}`);
        }

        const metadata = await response.json();
        return {
          cid: metadata.cid,
          originalName: metadata.originalName,
          size: metadata.size,
          mimeType: metadata.mimeType,
          iv: metadata.iv,
          uploadDate: metadata.uploadDate,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown metadata error';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [apiUrl]
  );

  const deleteFile = useCallback(
    async (cid: string): Promise<boolean> => {
      setError(null);
      
      try {
        const response = await fetch(`${apiUrl}/delete/${cid}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_WALRUS_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete file: ${response.status}`);
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown deletion error';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [apiUrl]
  );

  return {
    uploadFile,
    retrieveFile,
    getFileMetadata,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
  };
}

// Mock implementation for development/testing
export function useMockWalrusStorage(): WalrusStorageHook {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      encryptedData: string,
      metadata: Omit<WalrusMetadata, 'cid' | 'uploadDate'>
    ): Promise<WalrusUploadResponse> => {
      setIsUploading(true);
      setError(null);
      setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress({ loaded: i, total: 100, percentage: i });
      }

      const mockCid = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store in localStorage for mock retrieval
      localStorage.setItem(`walrus_${mockCid}`, encryptedData);
      localStorage.setItem(`walrus_meta_${mockCid}`, JSON.stringify({
        ...metadata,
        cid: mockCid,
        uploadDate: new Date().toISOString(),
      }));

      setIsUploading(false);
      
      return {
        cid: mockCid,
        size: encryptedData.length,
        url: `mock://walrus/${mockCid}`,
      };
    },
    []
  );

  const retrieveFile = useCallback(async (cid: string): Promise<string> => {
    setError(null);
    
    const data = localStorage.getItem(`walrus_${cid}`);
    if (!data) {
      throw new Error('File not found in mock storage');
    }
    
    return data;
  }, []);

  const getFileMetadata = useCallback(async (cid: string): Promise<WalrusMetadata> => {
    setError(null);
    
    const metadataStr = localStorage.getItem(`walrus_meta_${cid}`);
    if (!metadataStr) {
      throw new Error('Metadata not found in mock storage');
    }
    
    return JSON.parse(metadataStr);
  }, []);

  const deleteFile = useCallback(async (cid: string): Promise<boolean> => {
    setError(null);
    
    localStorage.removeItem(`walrus_${cid}`);
    localStorage.removeItem(`walrus_meta_${cid}`);
    
    return true;
  }, []);

  return {
    uploadFile,
    retrieveFile,
    getFileMetadata,
    deleteFile,
    isUploading,
    uploadProgress,
    error,
  };
} 