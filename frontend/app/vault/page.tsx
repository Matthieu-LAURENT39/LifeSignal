'use client';

import { VaultCreator } from '../../components/VaultCreator';

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <VaultCreator 
          onVaultCreated={(files, masterKey) => {
            console.log('Vault created:', { files, masterKey });
          }}
        />
      </div>
    </div>
  );
} 