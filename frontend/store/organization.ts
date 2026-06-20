import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Organization {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  logo_url?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  description?: string;
}

interface OrganizationState {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
}

export const useOrgStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrg: null,
      setCurrentOrg: (org) => set({ currentOrg: org }),
    }),
    {
      name: 'forgeflow-organization',
    }
  )
);
