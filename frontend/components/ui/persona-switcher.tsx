"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

export default function PersonaSwitcher() {
  const { user, setAuth } = useAuthStore();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  if (process.env.NEXT_PUBLIC_ENABLE_PERSONA_SWITCHER !== "true") {
    return null;
  }

  // TODO: Future enterprise "view as role" requirements:
  // 1. Every impersonated action must write to the audit log with both the real user ID and the impersonated role.
  // 2. Impersonation sessions must be time-limited (e.g., 30 min max).
  // 3. A visible UI banner must be shown during impersonation so users know they're in that mode.

  const getSwitchableUsers = () => {
    const baseMockUsers = [
      { id: 901, email: "admin@company.com", full_name: "Org Admin" },
      { id: 902, email: "ops@company.com", full_name: "Ops Manager" },
      { id: 903, email: "engineer@company.com", full_name: "Engineer Staff" },
    ];
    if (typeof window !== "undefined") {
      try {
        const localUsers = JSON.parse(localStorage.getItem("forgeflow_users") || "[]");
        const all = [...localUsers, ...baseMockUsers];
        const unique = all.filter((u, index, self) => 
          self.findIndex(other => other.email === u.email) === index
        );
        return unique;
      } catch (e) {
        console.error("Failed to load local users", e);
      }
    }
    return baseMockUsers;
  };

  const handleSwitchUser = (selectedUser: { id: number; email: string; full_name: string | null }) => {
    setAuth({
      id: selectedUser.id,
      email: selectedUser.email,
      full_name: selectedUser.full_name,
      is_active: true
    }, "mock-access-token", "mock-refresh-token");
    
    setUserDropdownOpen(false);
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        className="p-2 hover:bg-muted/60 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        title="Switch User"
      >
        <Users className="size-5" />
      </button>

      {userDropdownOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
          <div className="absolute right-0 z-25 mt-2 w-56 origin-top-right rounded-lg glass-strong focus:outline-none py-1 border border-border/40 shadow-xl">
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
              Switch User Profile
            </div>
            <div className="max-h-48 overflow-y-auto">
              {getSwitchableUsers().map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleSwitchUser(u)}
                  className={cn(
                    "flex w-full items-center px-4 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors duration-150",
                    user.email === u.email
                      ? "text-primary font-bold bg-primary/10"
                      : "text-foreground"
                  )}
                >
                  <div className="size-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[10px] mr-2 shrink-0">
                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-left">
                    <div className="text-xs font-medium leading-none">
                      {u.full_name || "User"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
