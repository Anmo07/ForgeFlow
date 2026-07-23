"use client";

import React from "react";
import { X, CheckCircle2, Copy, ExternalLink, FileText } from "lucide-react";

export interface InviteEmailPreview {
  email: string;
  roleName: string;
  roleId: number;
  inviteToken: string;
  inviteLink: string;
  subject: string;
  body: string;
}

interface InviteMemberModalProps {
  preview: InviteEmailPreview | null;
  copiedLink: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function InviteMemberModal({
  preview,
  copiedLink,
  onClose,
  onCopy,
}: InviteMemberModalProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <span>Generated Invitation & Email Preview</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-foreground">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Direct Acceptance URL
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={preview.inviteLink}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs font-mono text-foreground focus:outline-none"
              />
              <button
                onClick={() => onCopy(preview.inviteLink)}
                className="px-3 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedLink ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Subject Line
            </label>
            <div className="p-2.5 bg-muted/30 border border-border rounded-lg text-xs font-medium">
              {preview.subject}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Body Text
            </label>
            <pre className="p-3 bg-muted/30 border border-border rounded-lg text-xs font-sans whitespace-pre-wrap text-muted-foreground">
              {preview.body}
            </pre>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
          <a
            href={preview.inviteLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            <span>Open Link in New Tab</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
