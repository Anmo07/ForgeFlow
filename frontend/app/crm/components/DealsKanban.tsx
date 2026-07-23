"use client";

import React from "react";
import { Plus, DollarSign } from "lucide-react";
import { GlassPanel } from "@/components/glass/GlassPanel";
import type { Deal } from "@/types";

interface DealsKanbanProps {
  deals: Deal[];
  onOpenModal: () => void;
}

const STAGES = [
  { id: "discovery", label: "Discovery / Qualification" },
  { id: "proposal", label: "Proposal Sent" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed_won", label: "Closed Won" },
  { id: "closed_lost", label: "Closed Lost" },
];

export function DealsKanban({ deals, onOpenModal }: DealsKanbanProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-[var(--color-glass-text-primary)]">
          Deals Pipeline
        </h3>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="size-4" />
          <span>New Deal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.status === stage.id || d.stage === stage.id);
          const totalValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <GlassPanel key={stage.id} intensity="clear" className="p-4 flex flex-col min-h-[350px]">
              <div className="mb-3 border-b border-white/10 pb-2">
                <h4 className="text-xs font-bold uppercase text-[var(--color-glass-text-primary)] truncate">
                  {stage.label}
                </h4>
                <div className="flex justify-between items-center text-xs text-[var(--color-glass-text-secondary)] mt-1">
                  <span>{stageDeals.length} deals</span>
                  <span className="font-semibold text-emerald-400">${totalValue.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <GlassPanel key={deal.id} intensity="regular" className="p-3 hover:border-primary/50 transition-colors">
                    <div className="font-medium text-xs text-[var(--color-glass-text-primary)] mb-1">
                      {deal.name}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-400 font-bold">${(deal.value || 0).toLocaleString()}</span>
                      <span className="text-[var(--color-glass-text-secondary)] text-[10px]">
                        {deal.win_probability ? `${deal.win_probability}% win` : ""}
                      </span>
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}
