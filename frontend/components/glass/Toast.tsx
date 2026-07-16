import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useToastStore, ToastMessage } from "@/store/toast";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "framer-motion";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2.5 z-60 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const prefersReduced = useReducedMotion();

  const iconMap = {
    success: <CheckCircle className="size-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="size-4 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="size-4 text-amber-500 shrink-0" />,
    info: <Info className="size-4 text-blue-500 shrink-0" />,
  };

  const borderColors = {
    success: "border-l-emerald-500 border-l-4",
    error: "border-l-red-500 border-l-4",
    warning: "border-l-amber-500 border-l-4",
    info: "border-l-blue-500 border-l-4",
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 15, scale: 0.95 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      transition={{ duration: prefersReduced ? 0.01 : 0.2 }}
      className={cn(
        "glass-regular rounded-[var(--radius-glass-lg)] flex items-center gap-3 px-4 py-3 shadow-[var(--shadow-glass-md)] border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] pointer-events-auto",
        borderColors[toast.type]
      )}
    >
      {iconMap[toast.type]}
      <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-1 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] rounded transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
