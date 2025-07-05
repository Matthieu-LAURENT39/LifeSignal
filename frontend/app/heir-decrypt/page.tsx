import { HeirDecrypt } from '../../components/HeirDecrypt';
import { WalletConnectButton } from '../../components/WalletConnectButton';

export default function HeirDecryptPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Heir Access</h1>
          <WalletConnectButton />
        </div>
        
        <HeirDecrypt />
      </div>
    </div>
  );
} 