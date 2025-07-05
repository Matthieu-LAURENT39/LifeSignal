import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLifeSignalRegistryWrite, contractUtils } from '../lib/contracts';
import type { Vault } from '../types/models';

interface ContactCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: {
    firstname: string;
    lastname: string;
    contact: string;
    contactType: 'email' | 'phone';
    hasVotingRight: boolean;
    selectedVaultIds: string[];
  }) => void;
  availableVaults: Vault[];
}

export default function ContactCreator({ isOpen, onClose, onSubmit, availableVaults }: ContactCreatorProps) {
  const { address } = useAccount();
  const { writeContract, isPending } = useLifeSignalRegistryWrite();
  
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [hasVotingRight, setHasVotingRight] = useState(false);
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contractError, setContractError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstname.trim()) newErrors.firstname = 'First name is required';
    if (!lastname.trim()) newErrors.lastname = 'Last name is required';
    if (!contact.trim()) newErrors.contact = `${contactType === 'email' ? 'Email' : 'Phone'} is required`;
    if (selectedVaultIds.length === 0) newErrors.vaults = 'Please select at least one vault';

    if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      newErrors.contact = 'Invalid email format';
    }
    if (contactType === 'phone' && !/^\+?[\d\s-]{8,}$/.test(contact)) {
      newErrors.contact = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', {
      firstname,
      lastname,
      contact,
      contactType,
      hasVotingRight,
      selectedVaultIds
    });
    
    if (!address || !writeContract) {
      setContractError('Wallet not connected or contract not available');
      return;
    }
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setContractError(null);

    try {
      console.log('Adding contact to blockchain...');
      
      // Call the smart contract to add contact
      const hash = await contractUtils.addContact(
        writeContract,
        firstname,
        lastname,
        contact, // Use the contact field as email
        contact, // Use the contact field as phone (in real implementation, you'd separate these)
        hasVotingRight
      );
      
      console.log('Contact added successfully:', hash);
      
      // Call the parent onSubmit to update local state
      onSubmit({
        firstname,
        lastname,
        contact,
        contactType,
        hasVotingRight,
        selectedVaultIds
      });
      
      // Reset form
      setFirstname('');
      setLastname('');
      setContact('');
      setContactType('email');
      setHasVotingRight(false);
      setSelectedVaultIds([]);
      setErrors({});
      onClose();
      
    } catch (err) {
      console.error('Adding contact failed:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to add contact. Please try again.';
      
      if (err instanceof Error) {
        const errorStr = err.message.toLowerCase();
        
        if (errorStr.includes('user rejected') || errorStr.includes('user denied')) {
          errorMessage = 'Transaction was cancelled by user.';
        } else if (errorStr.includes('insufficient funds') || errorStr.includes('gas')) {
          errorMessage = 'Insufficient funds for transaction. Please check your wallet balance.';
        } else if (errorStr.includes('network') || errorStr.includes('connection')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (errorStr.includes('contract') || errorStr.includes('execution')) {
          errorMessage = 'Smart contract execution failed. The contract may not be deployed or there might be an issue with the blockchain.';
        } else if (errorStr.includes('encryption') || errorStr.includes('encrypt')) {
          errorMessage = 'Data encryption failed. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setContractError(errorMessage);
    }
  };

  const toggleVault = (vaultId: string) => {
    setSelectedVaultIds(prev => 
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

  // Check if form is ready to submit
  const isFormReady = () => {
    return firstname.trim() && 
           lastname.trim() && 
           contact.trim() && 
           selectedVaultIds.length > 0 &&
           (!errors.firstname && !errors.lastname && !errors.contact && !errors.vaults);
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
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                className={`w-full px-4 py-2 bg-white/5 border ${errors.firstname ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
                placeholder="John"
              />
              {errors.firstname && (
                <p className="text-red-400 text-xs mt-1">{errors.firstname}</p>
              )}
            </div>
            <div>
              <label className="block text-white/80 text-sm mb-2">Last Name</label>
              <input
                type="text"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                className={`w-full px-4 py-2 bg-white/5 border ${errors.lastname ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
                placeholder="Doe"
              />
              {errors.lastname && (
                <p className="text-red-400 text-xs mt-1">{errors.lastname}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Contact Method</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={contactType === 'email'}
                  onChange={() => setContactType('email')}
                  className="mr-2"
                />
                <span className="text-white/80">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={contactType === 'phone'}
                  onChange={() => setContactType('phone')}
                  className="mr-2"
                />
                <span className="text-white/80">Phone</span>
              </label>
            </div>
            <input
              type={contactType === 'email' ? 'email' : 'tel'}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className={`w-full px-4 py-2 bg-white/5 border ${errors.contact ? 'border-red-500/50' : 'border-white/20'} rounded-xl text-white focus:outline-none focus:border-white/40`}
              placeholder={contactType === 'email' ? 'john@example.com' : '+1234567890'}
            />
            {errors.contact && (
              <p className="text-red-400 text-xs mt-1">{errors.contact}</p>
            )}
          </div>

          <div>
            <label className="block text-white/80 text-sm mb-2">Select Vaults</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {availableVaults.map(vault => (
                <label
                  key={vault.id}
                  className={`flex items-center p-3 rounded-xl border transition-colors cursor-pointer ${
                    selectedVaultIds.includes(vault.id)
                      ? 'bg-white/10 border-white/40'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVaultIds.includes(vault.id)}
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

          {contractError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
              {contractError}
            </div>
          )}

          {isFormReady() && !isPending && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
              ✅ Form is ready! Click "Add Contact" to register on the blockchain.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormReady() || isPending}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Contact'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 