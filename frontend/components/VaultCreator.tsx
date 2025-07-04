'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateEncryptionKey, encryptFile } from '../lib/crypto/encryption';
import { useMockWalrusStorage } from '../hooks/useWalrusStorage';

interface EncryptedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  cid: string;
  iv: string;
  uploadDate: string;
  encryptionKey: string;
}

interface VaultCreatorProps {
  onVaultCreated?: (files: EncryptedFile[], masterKey: string) => void;
  className?: string;
}

export function VaultCreator({ onVaultCreated, className = '' }: VaultCreatorProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [encryptedFiles, setEncryptedFiles] = useState<EncryptedFile[]>([]);
  const [masterKey, setMasterKey] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [vaultName, setVaultName] = useState<string>('');
  const [vaultDescription, setVaultDescription] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress, error: storageError } = useMockWalrusStorage();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  }, []);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
    setError(null);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createVault = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!vaultName.trim()) {
      setError('Please enter a vault name');
      return;
    }

    setIsProcessing(true);
    setError(null);
    const processedFiles: EncryptedFile[] = [];

    try {
      // Generate master encryption key
      const generatedMasterKey = generateEncryptionKey();
      setMasterKey(generatedMasterKey);
      setProcessingStep('Generated master encryption key');

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStep(`Encrypting ${file.name}... (${i + 1}/${files.length})`);

        // Encrypt the file
        const encryptedFileData = await encryptFile(file, generatedMasterKey);

        setProcessingStep(`Uploading ${file.name} to Walrus...`);

        // Upload to Walrus
        const uploadResult = await uploadFile(encryptedFileData.encryptedData, {
          originalName: encryptedFileData.originalName,
          size: encryptedFileData.size,
          mimeType: encryptedFileData.mimeType,
          iv: encryptedFileData.iv,
        });

        // Create encrypted file record
        const encryptedFile: EncryptedFile = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalName: encryptedFileData.originalName,
          size: encryptedFileData.size,
          mimeType: encryptedFileData.mimeType,
          cid: uploadResult.cid,
          iv: encryptedFileData.iv,
          uploadDate: new Date().toISOString(),
          encryptionKey: generatedMasterKey,
        };

        processedFiles.push(encryptedFile);
      }

      setEncryptedFiles(processedFiles);
      setProcessingStep('Vault created successfully!');
      
      // Call the callback with the results
      if (onVaultCreated) {
        onVaultCreated(processedFiles, generatedMasterKey);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Vault creation failed:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [files, vaultName, uploadFile, onVaultCreated]);

  const resetVault = useCallback(() => {
    setFiles([]);
    setEncryptedFiles([]);
    setMasterKey('');
    setVaultName('');
    setVaultDescription('');
    setError(null);
    setProcessingStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const containerClasses = `
    backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 
    shadow-2xl hover:shadow-indigo-500/25 transition-all duration-300 
    ${className}
  `;

  if (encryptedFiles.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={containerClasses}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Vault Created Successfully!</h2>
          <p className="text-white/70">Your files have been encrypted and uploaded to Walrus storage</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Master Encryption Key</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/20 text-green-400 p-3 rounded-lg text-sm font-mono break-all">
                {masterKey}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(masterKey)}
                className="px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 rounded-lg text-indigo-300 transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-yellow-400 text-sm mt-2">
              ⚠️ Store this key securely. It's required to decrypt your files.
            </p>
          </div>

          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Encrypted Files ({encryptedFiles.length})</h3>
            <div className="space-y-2">
              {encryptedFiles.map((file, index) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.originalName}</p>
                      <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 text-sm">Encrypted</p>
                    <p className="text-white/50 text-xs">CID: {file.cid.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetVault}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500/90 hover:to-purple-500/90 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300"
          >
            Create Another Vault
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={containerClasses}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Create Inheritance Vault</h2>
        <p className="text-white/70">Upload and encrypt your files for secure inheritance</p>
      </div>

      <div className="space-y-6">
        {/* Vault Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Vault Name *</label>
            <input
              type="text"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="Enter vault name"
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Description (Optional)</label>
            <textarea
              value={vaultDescription}
              onChange={(e) => setVaultDescription(e.target.value)}
              placeholder="Describe the contents of this vault"
              rows={3}
              className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
        </div>

        {/* File Upload Area */}
        <div
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          className="relative border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-indigo-400/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Drag & drop files here</p>
              <p className="text-white/50 text-sm">or click to select files</p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <h3 className="text-white font-medium">Selected Files ({files.length})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Status */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-white font-medium">Creating Vault...</p>
                  <p className="text-white/70 text-sm">{processingStep}</p>
                </div>
              </div>
              
              {uploadProgress && (
                <div className="w-full bg-black/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {(error || storageError) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="backdrop-blur-sm bg-red-500/10 border border-red-400/50 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400">{error || storageError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={createVault}
            disabled={isProcessing || files.length === 0 || !vaultName.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500/90 hover:to-purple-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Create Vault'
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetVault}
            disabled={isProcessing}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 transition-all duration-300 disabled:cursor-not-allowed"
          >
            Reset
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 