import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useContractWrite, CONTRACT_ADDRESSES, LIFE_SIGNAL_REGISTRY_ABI } from '../lib/contracts';
import type { Vault } from '../types/models';

interface ContactCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    contactAddress: string;
    hasVotingRight: boolean;
    selectedVaultAddresses: string[];
  }) => void;
  availableVaults: Vault[];
}

export default function ContactCreator({ isOpen, onClose, onSubmit, availableVaults }: ContactCreatorProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, isPending, error: writeError } = useContractWrite();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [hasVotingRight, setHasVotingRight] = useState(false);
  const [selectedVaultAddresses, setSelectedVaultAddresses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (!contactAddress.trim()) newErrors.contactAddress = 'Contact address is required';
    if (selectedVaultAddresses.length === 0) newErrors.vaults = 'Please select at least one vault';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!/^\+?[\d\s-]{8,}$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(contactAddress)) {
      newErrors.contactAddress = 'Invalid Ethereum address format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!isConnected || !address || !writeContract) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Convert selected vault addresses to bigint (vault IDs)
      const authorizedVaults = selectedVaultAddresses.map(vaultId => BigInt(vaultId));
      
      console.log('Calling addContact with:', {
        contact: contactAddress,
        firstName,
        lastName,
        email,
        phone,
        hasVotingRight,
        authorizedVaults
      });

      // Call the smart contract
      const result = await writeContract({
        address: CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY,
        abi: LIFE_SIGNAL_REGISTRY_ABI,
        functionName: 'addContact',
        args: [
          contactAddress as `0x${string}`,
          firstName,
          lastName,
          email,
          phone,
          hasVotingRight,
          authorizedVaults
        ],
      });

      console.log('Contact creation transaction result:', result);
      
      // Log contract information
      console.log('=== CONTRACT INFORMATION ===');
      console.log('Contract Address:', CONTRACT_ADDRESSES.LIFESIGNAL_REGISTRY);
      console.log('Contract Function:', 'addContact');
      console.log('Transaction Hash:', result);
      console.log('Network:', 'Ethereum');
      console.log('Contact Address:', contactAddress);
      console.log('Authorized Vaults:', selectedVaultAddresses);
      console.log('Contact Name:', `${firstName} ${lastName}`);
      console.log('Contact Email:', email);
      console.log('Contact Phone:', phone);
      console.log('Has Voting Right:', hasVotingRight);
      console.log('=== END CONTRACT INFO ===');
      
      // Call the original onSubmit for UI updates
      onSubmit({
        firstName,
        lastName,
        email,
        phone,
        contactAddress,
        hasVotingRight,
        selectedVaultAddresses
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setContactAddress('');
      setHasVotingRight(false);
      setSelectedVaultAddresses([]);
      setErrors({});
      onClose();
      
    } catch (error) {
      console.error('Error creating contact:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to create contact. Please try again.';
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        
        if (errorStr.includes('owner not registered')) {
          errorMessage = 'You must register as an owner first before adding contacts.';
        } else if (errorStr.includes('contact already exists')) {
          errorMessage = 'This contact address is already registered.';
        } else if (errorStr.includes('cannot add yourself')) {
          errorMessage = 'You cannot add yourself as a contact.';
        } else if (errorStr.includes('user rejected') || errorStr.includes('user denied')) {
          errorMessage = 'Transaction was cancelled by user.';
        } else if (errorStr.includes('insufficient funds') || errorStr.includes('gas')) {
          errorMessage = 'Insufficient funds for transaction. Please check your wallet balance.';
        } else if (errorStr.includes('network') || errorStr.includes('connection')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVault = (vaultId: string) => {
    setSelectedVaultAddresses(prev => 
      prev.includes(vaultId)
        ? prev.filter(id => id !== vaultId)
        : [...prev, vaultId]
    );
  };

  const getVaultIcon = (vaultName: string) => {
    if (vaultName.toLowerCase().includes('family')) return '🏦';
    if (vaultName.toLowerCase().includes('business')) return '💼';
    if (vaultName.toLowerCase().includes('property')) return '🏠';
    return '📄';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 text-white/60 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold text-white mb-6">Add New Contact</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-2 bg-white/5 border ${errors.firstName ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-2 bg-white/5 border ${errors.lastName ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Email</label>
                <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
              placeholder="john@example.com"
                />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Phone</label>
                <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-4 py-2 bg-white/5 border ${errors.phone ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
              placeholder="+1234567890"
                />
            {errors.phone && (
              <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
            )}
            </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Contact Address</label>
            <input
              type="text"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              className={`w-full px-4 py-2 bg-white/5 border ${errors.contactAddress ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
              placeholder="0x..."
            />
            {errors.contactAddress && (
              <p className="text-red-400 text-xs mt-1">{errors.contactAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Select Vaults</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {availableVaults.map(vault => (
                <label
                  key={vault.id}
                  className={`flex items-center p-3 rounded-xl border transition-colors cursor-pointer ${
                    selectedVaultAddresses.includes(vault.id)
                      ? 'bg-white/10 border-white/40'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVaultAddresses.includes(vault.id)}
                    onChange={() => toggleVault(vault.id)}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getVaultIcon(vault.name)}</span>
                    <span className="text-white">{vault.name}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.vaults && (
              <p className="text-red-400 text-xs mt-1">{errors.vaults}</p>
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={hasVotingRight}
                onChange={(e) => setHasVotingRight(e.target.checked)}
                className="mr-2"
              />
              <span className="text-white/80">Grant voting rights for death declaration</span>
            </label>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70">
            <p className="mb-2">
              <span className="text-cyan-400">ℹ️ Information:</span> The contact will receive an invitation to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Connect their wallet</li>
              <li>Verify their identity using Self.ID</li>
              <li>Accept their role as your heir</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isPending}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isPending ? 'Adding Contact...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 