"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { CreateClientPayload } from "@/types";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClientPayload) => void;
  isSubmitting: boolean;
}

export function ClientModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
    });
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <GlassPanel intensity="heavy" className="w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--color-glass-text-secondary)] hover:text-[var(--color-glass-text-primary)]"
        >
          <X className="size-4" />
        </button>

        <h3 className="text-lg font-bold text-[var(--color-glass-text-primary)] mb-4">
          Add New Client
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-glass-text-secondary)] mb-1">
              Client / Contact Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--color-glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-glass-text-secondary)] mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--color-glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-glass-text-secondary)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--color-glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-glass-text-secondary)] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[var(--color-glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--color-glass-text-secondary)] hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
            >
              Save Client
            </button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
