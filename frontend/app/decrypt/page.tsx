'use client';

import { useState } from 'react';
import FileDecryptor from '../../components/FileDecryptor';

export default function DecryptPage() {
  const [isDecryptorOpen, setIsDecryptorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-4">File Decryptor</h1>
        <p className="text-white/70 mb-8">
          Decrypt files that were encrypted by the LifeSignal Vault Creator
        </p>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">How to Use</h2>
          <div className="text-white/60 text-sm space-y-2">
            <p>1. Select an encrypted file (with .encrypted extension)</p>
            <p>2. Enter the Base64 encryption key from the console</p>
            <p>3. Click "Decrypt & Download" to get your original file</p>
          </div>
        </div>

        <button
          onClick={() => setIsDecryptorOpen(true)}
          className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg transform hover:scale-105 transition-all"
        >
          Open File Decryptor
        </button>
      </div>

      <FileDecryptor
        isOpen={isDecryptorOpen}
        onClose={() => setIsDecryptorOpen(false)}
      />
    </div>
  );
} 