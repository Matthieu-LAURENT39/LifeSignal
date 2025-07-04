import { VaultDashboard } from '../../components/VaultDashboard';
import { WalletConnectButton } from '../../components/WalletConnectButton';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Vault Dashboard</h1>
          <WalletConnectButton />
        </div>
        
        <VaultDashboard />
      </div>
    </div>
  );
} 