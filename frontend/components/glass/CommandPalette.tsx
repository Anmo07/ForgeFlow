import React, { useEffect, useState, useRef } from "react";
import { Search, FileText, Briefcase, X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOrgStore } from "@/store/organization";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; name: string; type: "project" | "crm" | "invoice"; url: string }[]
  >([]);
  const { currentOrg } = useOrgStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleToggleEvent = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggleEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggleEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query || !currentOrg) {
      setResults([]);
      return;
    }

    const searchItems = async () => {
      try {
        const projects = await apiFetch<any[]>("/api/projects", {
          orgId: currentOrg.id,
        });

        const projectResults = (projects || [])
          .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p) => ({
            id: `p-${p.id}`,
            name: p.name,
            type: "project" as const,
            url: `/projects/${p.id}`,
          }));

        setResults(projectResults.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(searchItems, 200);
    return () => clearTimeout(timer);
  }, [query, currentOrg]);

  const handleSelect = (url: string) => {
    router.push(url);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px] z-50"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              duration: prefersReduced ? 0.01 : 0.18,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[600px] glass-heavy rounded-[var(--radius-glass-xl)] z-50 overflow-hidden border border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)] shadow-[var(--shadow-glass-lg)] dark:shadow-[var(--shadow-glass-dark-lg)]"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-glass-regular-border)] dark:border-[var(--color-glass-dark-regular-border)]">
              <Search
                size={18}
                className="text-[var(--color-glass-text-tertiary)] dark:text-[var(--color-glass-dark-text-tertiary)]"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)] placeholder:text-[var(--color-glass-text-tertiary)] dark:placeholder:text-[var(--color-glass-dark-text-tertiary)]"
              />
              <kbd className="px-1.5 py-0.5 text-xs glass-clear rounded text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)]">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto py-2">
              {results.length === 0 ? (
                <div className="py-6 text-center text-sm text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)]">
                  {query ? "No results found." : "Type to search projects..."}
                </div>
              ) : (
                results.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleSelect(res.url)}
                    className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[var(--color-glass-hover)] dark:hover:bg-[var(--color-glass-dark-hover)] transition-colors text-left"
                  >
                    {res.type === "project" ? (
                      <Briefcase size={16} className="text-blue-500" />
                    ) : (
                      <FileText size={16} className="text-amber-500" />
                    )}
                    <span className="text-sm font-semibold text-[var(--color-glass-text-primary)] dark:text-[var(--color-glass-dark-text-primary)]">
                      {res.name}
                    </span>
                    <span className="text-xs text-[var(--color-glass-text-secondary)] dark:text-[var(--color-glass-dark-text-secondary)] ml-auto capitalize">
                      {res.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
