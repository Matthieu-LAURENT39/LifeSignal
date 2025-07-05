'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLifeSignalRegistryWrite, contractUtils } from '../lib/contracts';
import { motion } from 'framer-motion';

interface OwnerRegistrationProps {
  onRegistrationComplete: () => void;
  onCancel: () => void;
}

export default function OwnerRegistration({ onRegistrationComplete, onCancel }: OwnerRegistrationProps) {
  const { address } = useAccount();
  const { writeContract, isPending } = useLifeSignalRegistryWrite();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    graceInterval: 30 // Default 30 days
  });
  
  const isLoading = isPending;
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !writeContract) {
      setError('Wallet not connected or contract not available');
      return;
    }

    // Validate form data
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.graceInterval < 1 || formData.graceInterval > 365) {
      setError('Grace interval must be between 1 and 365 days');
      return;
    }

    setError(null);

    try {
      console.log('Registering owner with encrypted data...');
      
      // Use the contract utility to register owner
      const hash = await contractUtils.registerOwner(
        writeContract,
        formData.firstName,
        formData.lastName,
        formData.email,
        formData.phone,
        formData.graceInterval
      );
      
      console.log('Owner registration successful:', hash);
      onRegistrationComplete();
      
    } catch (err) {
      console.error('Registration failed:', err);
      
      // Handle specific error types
      let errorMessage = 'Registration failed. Please try again.';
      
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
      
      setError(errorMessage);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Register as Owner</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="graceInterval" className="block text-sm font-medium text-gray-700 mb-1">
                Grace Interval (days) *
              </label>
              <input
                type="number"
                id="graceInterval"
                name="graceInterval"
                value={formData.graceInterval}
                onChange={handleInputChange}
                min="1"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white placeholder-gray-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of days before your contacts can declare you deceased
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Your registration will be recorded on the blockchain</li>
              <li>• You can add contacts who can vote on death declarations</li>
              <li>• Send heartbeats to prove you're alive</li>
              <li>• Your contacts can declare your death if you don't respond</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-medium text-green-800">Oasis Sapphire Protected</h3>
            </div>
            <p className="text-xs text-green-700">
              Your personal data is encrypted using Oasis Sapphire's confidential computing technology before being stored on the blockchain. This ensures your privacy is protected even on a public ledger.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 