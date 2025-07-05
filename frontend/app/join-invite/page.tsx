'use client';

import { WalletConnectButton } from '../../components/WalletConnectButton';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import type { Contact } from '../../types/models';

// Mock data to simulate fetching contact info
const mockContactData: { [key: string]: Partial<Contact> } = {
  'a1b2c3d4e5': {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
  },
  'f6g7h8i9j0': {
    firstName: 'Mike',
    lastName: 'Wilson',
    phone: '+33612345678',
  },
  'k1l2m3n4o5': {
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice.brown@example.com',
  }
};

type VerificationStep = 'initial' | 'selfId' | 'completed';

export default function JoinInvite() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const contactId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<Partial<Contact> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('initial');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch contact info
    const fetchContactInfo = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        if (!contactId) {
          throw new Error('No contact ID provided');
        }

        const info = mockContactData[contactId];
        if (!info) {
          throw new Error('Invalid invitation link');
        }

        setContactInfo(info);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setContactInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, [contactId]);

  useEffect(() => {
    if (isConnected && verificationStep === 'initial') {
      setVerificationStep('selfId');
    }
  }, [isConnected]);

  const handleStartVerification = async () => {
    setIsVerifying(true);
    try {
      // Simulate Self.ID verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVerificationStep('completed');
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderVerificationStep = () => {
    switch (verificationStep) {
      case 'selfId':
        return (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Identity Verification</h2>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">Why verify your identity?</h3>
                <p className="text-white/70 text-sm">
                  As a trusted contact, you play a crucial role in the inheritance vault system. 
                  Identity verification helps ensure the security and integrity of the process.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-lg font-medium text-white mb-2">What you&apos;ll need:</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    A valid government-issued ID
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    A device with a camera
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    About 5 minutes of your time
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartVerification}
                disabled={isVerifying}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                  isVerifying
                    ? 'bg-emerald-500/50 text-white/50 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Start Verification'
                )}
              </button>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Complete!</h2>
              <p className="text-white/70 mb-6">
                Your identity has been verified successfully. You can now access the vaults.
              </p>
              <Link
                href="/heirs-portal"
                className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-colors"
              >
                Go to Heirs Portal
              </Link>
            </div>
          </div>
        );

      default:
        return (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-white/70 text-sm mb-4">
              To complete your registration and access the inheritance vault system, please connect your wallet.
            </p>
            <div className="flex justify-center">
              <WalletConnectButton size="lg" />
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading invitation details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
            <p className="text-white/70 mb-6">{error}</p>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Welcome to LifeSignal
            </h1>
            <p className="text-lg text-white/80">
              You&apos;ve been invited to be a trusted contact
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Name</label>
                  <div className="text-white">
                    {contactInfo?.firstName} {contactInfo?.lastName}
                  </div>
                </div>
                {contactInfo?.email && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">Email</label>
                    <div className="text-white">{contactInfo.email}</div>
                  </div>
                )}
                {contactInfo?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-1">Phone</label>
                    <div className="text-white">{contactInfo.phone}</div>
                  </div>
                )}
              </div>
            </div>

            {renderVerificationStep()}
          </div>

          <p className="text-center text-white/40 text-sm mt-8">
            Having trouble? Contact support at support@lifesignal.example
          </p>
        </div>
      </div>
    </div>
  );
} 