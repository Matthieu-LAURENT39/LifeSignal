'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  generateEncryptionKey, 
  encryptFile, 
  decryptFile 
} from '../../lib/crypto/encryption';

interface EncryptedFileData {
  encryptedData: string;
  iv: string;
  originalName: string;
  size: number;
  mimeType: string;
  encryptionKey: string;
}

export default function TestEncryptionPage() {
  // Encryption Section State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptedFileData, setEncryptedFileData] = useState<EncryptedFileData | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);

  // Decryption Section State
  const [encryptedFileForDecryption, setEncryptedFileForDecryption] = useState<File | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptionIv, setDecryptionIv] = useState('');
  const [originalFileName, setOriginalFileName] = useState('');
  const [originalMimeType, setOriginalMimeType] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const encryptedFileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileEncryption = async () => {
    if (!selectedFile) return;

    setIsEncrypting(true);
    setEncryptionError(null);

    try {
      // Generate encryption key
      const encryptionKey = generateEncryptionKey();
      
      // Encrypt the file
      const result = await encryptFile(selectedFile, encryptionKey);
      
      setEncryptedFileData({
        ...result,
        encryptionKey
      });

    } catch (error) {
      setEncryptionError(error instanceof Error ? error.message : 'Encryption failed');
    } finally {
      setIsEncrypting(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (!encryptedFileData) return;

    // Convert base64 to blob
    const binaryString = atob(encryptedFileData.encryptedData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_${encryptedFileData.originalName}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileDecryption = async () => {
    if (!encryptedFileForDecryption || !decryptionKey || !decryptionIv) {
      setDecryptionError('Please provide encrypted file, key, and IV');
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(null);

    try {
      // Read encrypted file as base64
      const arrayBuffer = await encryptedFileForDecryption.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const encryptedBase64 = btoa(binaryString);

      // Decrypt the file
      const decryptedBlob = await decryptFile(
        encryptedBase64,
        decryptionKey,
        decryptionIv,
        originalMimeType || 'application/octet-stream'
      );

      setDecryptedBlob(decryptedBlob);

    } catch (error) {
      setDecryptionError(error instanceof Error ? error.message : 'Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  const downloadDecryptedFile = () => {
    if (!decryptedBlob) return;

    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = originalFileName || 'decrypted_file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resetEncryption = () => {
    setSelectedFile(null);
    setEncryptedFileData(null);
    setEncryptionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetDecryption = () => {
    setEncryptedFileForDecryption(null);
    setDecryptionKey('');
    setDecryptionIv('');
    setOriginalFileName('');
    setOriginalMimeType('');
    setDecryptionError(null);
    setDecryptedBlob(null);
    if (encryptedFileInputRef.current) {
      encryptedFileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🔐 Encryption Test Lab
          </h1>
          <p className="text-white/70 text-lg">
            Test the AES-256 encryption and decryption functionality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Encryption Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔒</span>
              </div>
              File Encryption
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Select File to Encrypt</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setSelectedFile(file || null);
                    setEncryptedFileData(null);
                    setEncryptionError(null);
                  }}
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30"
                />
              </div>

              {selectedFile && (
                <div className="bg-black/20 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-2">Selected File:</h3>
                  <p className="text-white/70">{selectedFile.name}</p>
                  <p className="text-white/50 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
              )}

              <button
                onClick={handleFileEncryption}
                disabled={!selectedFile || isEncrypting}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl border border-white/20 transition-all duration-300 disabled:cursor-not-allowed"
              >
                {isEncrypting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Encrypting...
                  </div>
                ) : (
                  'Encrypt File'
                )}
              </button>

              {encryptedFileData && (
                <div className="bg-green-500/10 border border-green-400/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-green-400 font-medium">✅ File Encrypted Successfully!</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Encryption Key:</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-black/30 text-green-400 p-2 rounded text-xs font-mono break-all">
                          {encryptedFileData.encryptionKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(encryptedFileData.encryptionKey)}
                          className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 rounded text-indigo-300 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white/70 text-sm mb-1">IV (Initialization Vector):</label>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-black/30 text-green-400 p-2 rounded text-xs font-mono break-all">
                          {encryptedFileData.iv}
                        </code>
                        <button
                          onClick={() => copyToClipboard(encryptedFileData.iv)}
                          className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 rounded text-indigo-300 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-3">
                      <p className="text-white/70 text-sm">Original: {encryptedFileData.originalName}</p>
                      <p className="text-white/70 text-sm">Size: {formatFileSize(encryptedFileData.size)}</p>
                      <p className="text-white/70 text-sm">Type: {encryptedFileData.mimeType}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadEncryptedFile}
                      className="flex-1 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/50 rounded-lg text-indigo-300 transition-colors"
                    >
                      📥 Download Encrypted File
                    </button>
                    <button
                      onClick={resetEncryption}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {encryptionError && (
                <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-4">
                  <p className="text-red-400">❌ {encryptionError}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Decryption Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔓</span>
              </div>
              File Decryption
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Upload Encrypted File</label>
                <input
                  ref={encryptedFileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setEncryptedFileForDecryption(file || null);
                    setDecryptedBlob(null);
                    setDecryptionError(null);
                  }}
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">Encryption Key</label>
                  <input
                    type="text"
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    placeholder="Paste encryption key here"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">IV (Initialization Vector)</label>
                  <input
                    type="text"
                    value={decryptionIv}
                    onChange={(e) => setDecryptionIv(e.target.value)}
                    placeholder="Paste IV here"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20 font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">Original File Name</label>
                    <input
                      type="text"
                      value={originalFileName}
                      onChange={(e) => setOriginalFileName(e.target.value)}
                      placeholder="e.g., document.pdf"
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">MIME Type</label>
                    <input
                      type="text"
                      value={originalMimeType}
                      onChange={(e) => setOriginalMimeType(e.target.value)}
                      placeholder="e.g., application/pdf"
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {encryptedFileForDecryption && (
                <div className="bg-black/20 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-2">Encrypted File:</h3>
                  <p className="text-white/70">{encryptedFileForDecryption.name}</p>
                  <p className="text-white/50 text-sm">{formatFileSize(encryptedFileForDecryption.size)}</p>
                </div>
              )}

              {encryptedFileData && (
                <button
                  onClick={() => {
                    setDecryptionKey(encryptedFileData.encryptionKey);
                    setDecryptionIv(encryptedFileData.iv);
                    setOriginalFileName(encryptedFileData.originalName);
                    setOriginalMimeType(encryptedFileData.mimeType);
                  }}
                  className="w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 rounded-lg text-yellow-300 transition-colors"
                >
                  ⚡ Auto-fill from encrypted file above
                </button>
              )}

              <button
                onClick={handleFileDecryption}
                disabled={!encryptedFileForDecryption || !decryptionKey || !decryptionIv || isDecrypting}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500/90 hover:to-cyan-500/90 disabled:from-gray-600/50 disabled:to-gray-600/50 text-white font-medium rounded-xl border border-white/20 transition-all duration-300 disabled:cursor-not-allowed"
              >
                {isDecrypting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Decrypting...
                  </div>
                ) : (
                  'Decrypt File'
                )}
              </button>

              {decryptedBlob && (
                <div className="bg-blue-500/10 border border-blue-400/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-blue-400 font-medium">✅ File Decrypted Successfully!</h3>
                  
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-white/70 text-sm">File Name: {originalFileName}</p>
                    <p className="text-white/70 text-sm">Size: {formatFileSize(decryptedBlob.size)}</p>
                    <p className="text-white/70 text-sm">Type: {originalMimeType}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadDecryptedFile}
                      className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 rounded-lg text-blue-300 transition-colors"
                    >
                      📥 Download Decrypted File
                    </button>
                    <button
                      onClick={resetDecryption}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {decryptionError && (
                <div className="bg-red-500/10 border border-red-400/50 rounded-xl p-4">
                  <p className="text-red-400">❌ {decryptionError}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">📋 How to Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">🔒 Encryption Test</h3>
              <ol className="space-y-2 text-white/70">
                <li>1. Select any file you want to encrypt</li>
                <li>2. Click "Encrypt File" to generate encrypted version</li>
                <li>3. Copy the encryption key and IV (you'll need these!)</li>
                <li>4. Download the encrypted file</li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">🔓 Decryption Test</h3>
              <ol className="space-y-2 text-white/70">
                <li>1. Upload the encrypted file you downloaded</li>
                <li>2. Paste the encryption key and IV</li>
                <li>3. Enter the original filename and MIME type</li>
                <li>4. Click "Decrypt File" and download the result</li>
              </ol>
            </div>
          </div>
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/50 rounded-xl">
            <p className="text-yellow-400 font-medium">💡 Pro Tip:</p>
            <p className="text-white/70 text-sm mt-1">
              Use the "Auto-fill" button in the decryption section to automatically fill in the values from a file you just encrypted above!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 