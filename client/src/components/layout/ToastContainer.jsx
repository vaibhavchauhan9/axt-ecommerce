import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const iconFor = (type) => {
  if (type === 'error') return <XCircle size={18} className="text-red-400 shrink-0" />;
  if (type === 'info') return <Info size={18} className="text-blue-400 shrink-0" />;
  return <CheckCircle2 size={18} className="text-brand-accentNeon shrink-0" />;
};

const borderFor = (type) => {
  if (type === 'error') return 'border-red-500/30';
  if (type === 'info') return 'border-blue-500/30';
  return 'border-brand-accentNeon/30';
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed z-[100] flex flex-col gap-2 pointer-events-none
        bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm
        sm:left-auto sm:right-4 sm:translate-x-0 sm:bottom-6 sm:w-full"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 bg-neutral-900/95 backdrop-blur-md border ${borderFor(toast.type)} rounded-xl px-4 py-3 shadow-2xl`}
          >
            {iconFor(toast.type)}
            <p className="text-xs font-bold text-white flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-neutral-500 hover:text-white transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
