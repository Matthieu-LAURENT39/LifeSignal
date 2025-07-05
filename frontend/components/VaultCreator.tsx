'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { User, VaultFile } from '../types/models';

interface VaultCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    files: File[];
    selectedContacts: string[];
  }) => void;
  availableContacts: User[];
}

type Step = 'name' | 'files' | 'contacts';

export default function VaultCreator({ isOpen, onClose, onSubmit, availableContacts }: VaultCreatorProps) {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [step, setStep] = useState<Step>('name');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, files, selectedContacts });
    // Reset form
    setName('');
    setFiles([]);
    setSelectedContacts([]);
    setStep('name');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Vault Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. Family Documents"
                required
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('files')}
                disabled={!name.trim()}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Add Files
              </motion.button>
            </div>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-4">
            <div
              onDrop={handleFileDrop}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-emerald-400/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Drag & drop files here</p>
                  <p className="text-white/50 text-sm">or click to select files</p>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">Selected Files ({files.length})</h3>
                  <button
                    onClick={() => setFiles([])}
                    className="text-white/60 hover:text-white/80 text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-white/50 text-sm">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('name')}
                className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('contacts')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                Next: Add Contacts
              </motion.button>
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/80 text-sm font-medium">
                  Select Contacts
                </label>
                <span className="text-white/60 text-xs">
                  {selectedContacts.length} selected
                </span>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {availableContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => toggleContact(contact.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedContacts.includes(contact.id)
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">
                        {contact.firstname} {contact.lastname}
                      </div>
                      <div className="text-white/60 text-sm font-mono">
                        {contact.address.slice(0,6)}...{contact.address.slice(-4)}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedContacts.includes(contact.id)
                        ? 'border-emerald-500 bg-emerald-500/20'
                        : 'border-white/20'
                    }`}>
                      {selectedContacts.includes(contact.id) && (
                        <span className="text-emerald-500">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStep('files')}
                className="px-6 py-2 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20"
              >
                Back
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl backdrop-blur-md border border-white/20 shadow-lg"
              >
                Create Vault
              </motion.button>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-xl bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 border border-white/20 rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          onClick={onClose}
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold text-white mb-6">Create New Vault</h2>

        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </motion.div>
    </div>
  );
} 