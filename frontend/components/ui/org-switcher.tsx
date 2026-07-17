"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore, Organization } from "@/store/organization";
import { Building2, ChevronDown, Plus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function OrgSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentOrg, setCurrentOrg } = useOrgStore();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    try {
      const data = await apiFetch<Organization[]>("/api/organizations/");
      setOrgs(data);

      // Enforce data isolation: currentOrg must belong to the active user's org list
      const isValidOrg = data.some(o => o.id === currentOrg?.id);
      if (data.length > 0 && (!currentOrg || !isValidOrg)) {
        setCurrentOrg(data[0]);
      } else if (data.length === 0) {
        setCurrentOrg(null);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (org: Organization) => {
    // #region agent log
    fetch('http://127.0.0.1:7846/ingest/267f0349-e68d-4b55-853c-b4f3450e0194',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea4260'},body:JSON.stringify({sessionId:'ea4260',location:'org-switcher.tsx:handleSelect',message:'Org switched',data:{newOrgId:org.id,newOrgName:org.name,prevOrgId:currentOrg?.id},timestamp:Date.now(),hypothesisId:'B',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    setCurrentOrg(org);
    setOpen(false);
    queryClient.clear();

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orgChanged"));
    }

    router.push("/dashboard");
  };

  const handleCreateOrg = () => {
    setOpen(false);
    router.push("/organizations/create");
  };

  return (
    <div className="relative inline-block text-left w-full max-w-[130px]">
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex w-full items-center justify-between gap-x-1.5 rounded-[var(--radius-glass-pill)] px-2.5 py-1 text-xs font-semibold glass-clear hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-all duration-200 text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <span className="truncate flex-1 text-left">
            {loading
              ? "..."
              : currentOrg
                ? currentOrg.name
                : "Select Tenant"}
          </span>
          <ChevronDown className="size-3 shrink-0 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]" />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 sm:left-0 z-20 mt-2 w-56 origin-top-left rounded-[var(--radius-glass-lg)] glass-heavy focus:outline-none transition-all duration-200 border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)]"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
          >
            <div className="py-1" role="none">
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] mb-1">
                Switch Organization
              </div>
              <div className="max-h-48 overflow-y-auto">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(org)}
                    className={cn(
                      "flex w-full items-center px-4 py-2 text-sm text-left transition-colors duration-120 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)]",
                      currentOrg?.id === org.id
                        ? "text-blue-500 font-semibold bg-[var(--color-glass-selected)] dark:bg-[var(--color-glass-dark-selected)]"
                        : "text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]",
                    )}
                    role="menuitem"
                  >
                    <Building2 className="size-3.5 mr-2 text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]" />
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] mt-1 pt-1 flex flex-col gap-0.5">
                <button
                  onClick={handleCreateOrg}
                  className="flex w-full items-center px-4 py-2 text-sm text-left text-blue-500 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-colors duration-120 font-medium"
                  role="menuitem"
                >
                  <Plus className="size-4 mr-2" />
                  Create Organization
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push("/login");
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-left text-blue-500 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-colors duration-120 font-medium"
                  role="menuitem"
                >
                  <LogIn className="size-4 mr-2" />
                  Login to Organization
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
