/**
 * useOrg — Primary hook for accessing organization context.
 *
 * Use this instead of reading from Zustand stores directly in page
 * components. Centralizes null-checking and provides a consistent
 * interface for org-dependent operations.
 */
import { useOrgStore } from '@/store/organization';

interface UseOrgReturn {
  orgId: string;               // Active org ID string (e.g., "1") — empty when loading
  orgIdNum: number;            // Active org ID number (e.g., 1) — 0 when loading
  orgIdOrNull: string | null;  // Null when no org selected
  orgName: string | undefined; // Display name for the active org
  isOrgLoaded: boolean;        // True when org context is ready
}

export function useOrg(): UseOrgReturn {
  const currentOrg = useOrgStore((s) => s.currentOrg);

  const orgIdNum = currentOrg?.id ? Number(currentOrg.id) : 0;
  const orgIdOrNull = currentOrg?.id ? String(currentOrg.id) : (currentOrg?.uuid || null);

  return {
    orgId: orgIdOrNull ?? '',
    orgIdNum,
    orgIdOrNull,
    orgName: currentOrg?.name,
    isOrgLoaded: !!orgIdOrNull,
  };
}
