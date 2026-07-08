"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore, Organization } from "@/store/organization";
import { Building2, ChevronDown, Plus, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function OrgSwitcher() {
  const router = useRouter();
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
  }, [currentOrg, setCurrentOrg]);

  const handleSelect = (org: Organization) => {
    setCurrentOrg(org);
    setOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orgChanged"));
    }
  };

  const handleCreateOrg = () => {
    setOpen(false);
    router.push("/organizations/create");
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex w-full items-center justify-between gap-x-2.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold text-foreground glass glass-hover transition-all duration-200"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <Building2 className="size-4 text-primary" />
          <span className="truncate max-w-[140px]">
            {loading
              ? "Loading..."
              : currentOrg
                ? currentOrg.name
                : "Select Tenant"}
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-lg glass-strong focus:outline-none transition-all duration-200"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
          >
            <div className="py-1" role="none">
              <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                Switch Organization
              </div>
              <div className="max-h-48 overflow-y-auto">
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelect(org)}
                    className={cn(
                      "flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted/50 transition-colors duration-150",
                      currentOrg?.id === org.id
                        ? "text-primary font-bold bg-primary/10"
                        : "text-foreground",
                    )}
                    role="menuitem"
                  >
                    <Building2 className="size-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="border-t border-border mt-1 pt-1 flex flex-col gap-0.5">
                <button
                  onClick={handleCreateOrg}
                  className="flex w-full items-center px-4 py-2 text-sm text-left text-primary hover:bg-primary/5 transition-colors duration-150 font-medium"
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
                  className="flex w-full items-center px-4 py-2 text-sm text-left text-primary hover:bg-primary/5 transition-colors duration-150 font-medium"
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
