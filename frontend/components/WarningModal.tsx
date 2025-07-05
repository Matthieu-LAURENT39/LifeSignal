'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function WarningModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon,
  actionText = "Got it",
  onAction 
}: WarningModalProps) {
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="backdrop-blur-md bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            {icon && (
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-400/50 rounded-full flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
              <p className="text-white/70 mb-6 leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white font-medium rounded-xl transition-all duration-300"
              >
                {actionText}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 