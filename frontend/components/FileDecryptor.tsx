'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface FileDecryptorProps {
  isOpen: boolean;
  onClose: () => void;
}

// Decryption utilities
const importKey = async (keyData: string): Promise<CryptoKey> => {
  const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
};

const decryptFile = async (encryptedData: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> => {
  const encryptedArray = new Uint8Array(encryptedData);
  
  // Extract IV from the beginning (first 12 bytes)
  const iv = encryptedArray.slice(0, 12);
  const ciphertext = encryptedArray.slice(12);
  
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
  
  return decryptedData;
};

const downloadFile = (data: ArrayBuffer, filename: string) => {
  const blob = new Blob([data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function FileDecryptor({ isOpen, onClose }: FileDecryptorProps) {
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEncryptedFile(file);
      setError(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setEncryptedFile(file);
      setError(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDecrypt = async () => {
    if (!encryptedFile || !encryptionKey.trim()) {
      setError('Please select a file and enter the encryption key');
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      // Import the encryption key
      const key = await importKey(encryptionKey.trim());
      
      // Read the encrypted file
      const encryptedData = await encryptedFile.arrayBuffer();
      
      // Decrypt the file
      const decryptedData = await decryptFile(encryptedData, key);
      
      // Determine the original filename (remove .encrypted extension if present)
      const originalFilename = encryptedFile.name.endsWith('.encrypted')
        ? encryptedFile.name.slice(0, -10)
        : encryptedFile.name + '.decrypted';
      
      // Download the decrypted file
      downloadFile(decryptedData, originalFilename);
      
      console.log('=== FILE DECRYPTION SUCCESS ===');
      console.log('Original file:', encryptedFile.name);
      console.log('Decrypted file:', originalFilename);
      console.log('Decrypted size:', decryptedData.byteLength, 'bytes');
      console.log('=== END DECRYPTION SUCCESS ===');
      
    } catch (error) {
      console.error('Decryption failed:', error);
      setError('Failed to decrypt file. Please check the encryption key and try again.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleReset = () => {
    setEncryptedFile(null);
    setEncryptionKey('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-xl bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold text-white mb-6">Decrypt File</h2>

        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Select Encrypted File
            </label>
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-white/30 rounded-2xl p-6 text-center hover:border-emerald-400/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              
              {encryptedFile ? (
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{encryptedFile.name}</p>
                    <p className="text-white/60 text-sm">{formatFileSize(encryptedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Select encrypted file</p>
                    <p className="text-white/50 text-sm">Drag & drop or click to select</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Encryption Key Input */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Encryption Key (Base64)
            </label>
            <textarea
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm resize-none"
              placeholder="Paste the Base64 encryption key here..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Decryption Status */}
          {isDecrypting && (
            <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Decrypting file...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-colors"
            >
              Reset
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleDecrypt}
              disabled={!encryptedFile || !encryptionKey.trim() || isDecrypting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDecrypting ? 'Decrypting...' : 'Decrypt & Download'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 