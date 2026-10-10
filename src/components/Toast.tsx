import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import type { ToastMessage } from '@/lib/types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  info: Info,
  error: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
};

const colorMap = {
  info: 'pixel-border-teal',
  error: 'pixel-border-crimson',
  success: 'pixel-border',
  warning: 'pixel-border-gold',
};

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return <ToastItem key={toast.id} toast={toast} Icon={Icon} onDismiss={onDismiss} colorClass={colorMap[toast.type]} />;
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, Icon, onDismiss, colorClass }: { toast: ToastMessage; Icon: typeof Info; onDismiss: (id: string) => void; colorClass: string }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`pixel-panel ${colorClass} flex items-start gap-3 min-w-[280px]`}
    >
      <Icon size={20} className="mt-1 shrink-0 text-cream-500" />
      <span className="font-terminal text-base text-cream-500 flex-1">{toast.text}</span>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </motion.div>
  );
}
