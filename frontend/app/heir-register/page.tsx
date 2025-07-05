"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import Link from "next/link";
import { WalletConnectButton } from "../../components/WalletConnectButton";

interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  relationshipToOwner: string;
  emergencyContact: string;
  emergencyPhone: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
}

interface InvitationDetails {
  vaultOwner: string;
  vaultName: string;
  invitationDate: string;
  expiryDate: string;
  isValid: boolean;
}

export default function HeirRegisterPage() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    fullName: "",
    email: "",
    phone: "",
    relationshipToOwner: "",
    emergencyContact: "",
    emergencyPhone: "",
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
  });
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Get token from URL
  const token = searchParams.get("token");

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invitation token");
      setIsValidating(false);
      return;
    }

    // Mock validation - in real app, this would call your backend
    setTimeout(() => {
      // Simulate API call to validate token
      const mockInvitationDetails: InvitationDetails = {
        vaultOwner: "John Doe",
        vaultName: "Family Inheritance Vault",
        invitationDate: "2024-01-15",
        expiryDate: "2024-02-15",
        isValid: true,
      };

      setInvitationDetails(mockInvitationDetails);
      setIsValidating(false);
    }, 1000);
  }, [token]);

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setError("Please connect your wallet to continue");
      return;
    }

    if (!registrationData.acceptedTerms || !registrationData.acceptedPrivacyPolicy) {
      setError("Please accept the terms and privacy policy to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mock registration API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would:
      // 1. Submit registration data to backend
      // 2. Link wallet address to heir profile
      // 3. Activate heir status for the vault
      
      console.log("Registration submitted:", {
        ...registrationData,
        walletAddress: address,
        token,
      });

      setIsRegistered(true);
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      registrationData.fullName.trim() !== "" &&
      registrationData.email.trim() !== "" &&
      registrationData.phone.trim() !== "" &&
      registrationData.relationshipToOwner.trim() !== "" &&
      registrationData.emergencyContact.trim() !== "" &&
      registrationData.emergencyPhone.trim() !== "" &&
      registrationData.acceptedTerms &&
      registrationData.acceptedPrivacyPolicy &&
      isConnected
    );
  };

  // Loading state while validating invitation
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Validating invitation...</p>
        </motion.div>
      </div>
    );
  }

  // Invalid invitation
  if (!invitationDetails || !invitationDetails.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Invitation</h1>
          <p className="text-white/80 mb-6">
            {error || "This invitation link is invalid or has expired."}
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  // Registration successful
  if (isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md"
        >
          <div className="text-green-400 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-white mb-4">Registration Complete!</h1>
          <p className="text-white/80 mb-6">
            You have been successfully registered as an heir for{" "}
            <span className="font-semibold text-white">{invitationDetails.vaultName}</span>.
          </p>
          <p className="text-white/60 text-sm mb-6">
            You will receive access to the inheritance vault when the conditions are met.
          </p>
          <div className="space-y-3">
            <Link 
              href="/heir-decrypt"
              className="block w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Access Inheritance Vaults
            </Link>
            <Link 
              href="/"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Heir Registration
          </h1>
          <p className="text-white/80">
            Complete your registration to become an heir
          </p>
        </motion.div>

        {/* Invitation Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Invitation Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Vault Owner:</span>
              <span className="text-white font-semibold">{invitationDetails.vaultOwner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Vault Name:</span>
              <span className="text-white font-semibold">{invitationDetails.vaultName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Invitation Date:</span>
              <span className="text-white">{invitationDetails.invitationDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Expires:</span>
              <span className="text-white">{invitationDetails.expiryDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Wallet Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Wallet Connection</h2>
          <div className="flex items-center justify-between">
            <span className="text-white/70">
              {isConnected ? "Wallet Connected" : "Connect your wallet to continue"}
            </span>
            <WalletConnectButton />
          </div>
          {isConnected && (
            <p className="text-green-400 text-sm mt-2">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          )}
        </motion.div>

        {/* Registration Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Registration Information</h2>
          
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={registrationData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={registrationData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Relationship to Vault Owner *
                </label>
                <input
                  type="text"
                  value={registrationData.relationshipToOwner}
                  onChange={(e) => handleInputChange("relationshipToOwner", e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Son, Daughter, Friend"
                  required
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t border-white/20 pt-4">
              <h3 className="text-lg font-semibold text-white mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    value={registrationData.emergencyContact}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/70 text-sm font-medium mb-2">
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={registrationData.emergencyPhone}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Emergency contact phone"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="border-t border-white/20 pt-4">
              <div className="space-y-3">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={registrationData.acceptedTerms}
                    onChange={(e) => handleInputChange("acceptedTerms", e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                  />
                  <span className="text-white/80 text-sm">
                    I accept the{" "}
                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                      Terms and Conditions
                    </a>{" "}
                    and understand my responsibilities as an heir.
                  </span>
                </label>
                
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={registrationData.acceptedPrivacyPolicy}
                    onChange={(e) => handleInputChange("acceptedPrivacyPolicy", e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                  />
                  <span className="text-white/80 text-sm">
                    I accept the{" "}
                    <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                      Privacy Policy
                    </a>{" "}
                    and consent to data processing.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mt-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg mt-6 transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Registering...
              </div>
            ) : (
              "Complete Registration"
            )}
          </button>
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-white/60 text-sm">
            Need help? Contact{" "}
            <a href="mailto:support@lifesignal.com" className="text-blue-400 hover:text-blue-300">
              support@lifesignal.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
} 