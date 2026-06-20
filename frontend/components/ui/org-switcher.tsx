"use client";

import React, { useEffect, useState } from "react";
import { useOrgStore, Organization } from "@/store/organization";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OrgSwitcher() {
  const { currentOrg, setCurrentOrg } = useOrgStore();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/organizations/");
        if (res.ok) {
          const data = await res.json();
          setOrgs(data);

          if (data.length > 0 && !currentOrg) {
            setCurrentOrg(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrgs();
  }, [currentOrg, setCurrentOrg]);

  const handleSelect = (org: Organization) => {
    setCurrentOrg(org);
    setOpen(false);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("orgChanged"));
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex w-full items-center justify-between gap-x-2.5 rounded-lg bg-card border border-border px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted transition-all duration-200"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
        >
          <Building2 className="size-4 text-blue-500" />
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
          {}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-20 mt-2 w-56 origin-top-left rounded-lg bg-card border border-border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200"
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
                      "flex w-full items-center px-4 py-2 text-sm text-left hover:bg-muted transition-colors duration-150",
                      currentOrg?.id === org.id
                        ? "text-blue-500 font-bold bg-muted/40"
                        : "text-foreground",
                    )}
                    role="menuitem"
                  >
                    <Building2 className="size-3.5 mr-2 text-muted-foreground" />
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
