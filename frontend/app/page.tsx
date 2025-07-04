import { WalletConnectButton } from '../components/WalletConnectButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="backdrop-blur-md bg-white/5 border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
            LifeSignal
          </h1>
          
          <p className="text-xl md:text-2xl text-white/80 mb-8 leading-relaxed">
            Secure your digital legacy with confidential blockchain technology
          </p>
          
          <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
            Create encrypted inheritance vaults on the Sapphire network. 
            Your files are protected by AES-256 encryption and confidential smart contracts.
          </p>
          
          {/* Wallet Connect Button Demo */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <WalletConnectButton size="lg" />
            <div className="flex gap-2">
              <WalletConnectButton variant="secondary" size="md" />
              <WalletConnectButton variant="outline" size="md" />
            </div>
          </div>
          
          <div className="text-sm text-white/50 mt-8">
            Connect your wallet to get started with creating your inheritance vault
          </div>
          
          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Confidential Smart Contracts</h3>
              <p className="text-white/60">Powered by Sapphire network for private key management</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AES-256 Encryption</h3>
              <p className="text-white/60">Client-side encryption for maximum security</p>
            </div>
            
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Walrus Storage</h3>
              <p className="text-white/60">Decentralized storage for your encrypted files</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
