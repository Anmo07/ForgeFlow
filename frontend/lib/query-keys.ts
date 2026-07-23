/**
 * ForgeFlow Query Key Registry
 * All TanStack Query keys defined here.
 * Import from this file everywhere — never write raw string arrays.
 */

export const queryKeys = {
  // Dashboard
  dashboard: (orgId: string | number) => ['dashboard', String(orgId)] as const,
  dashboardActivity: (orgId: string | number) => ['dashboard-activity', String(orgId)] as const,

  // Projects
  projects: (orgId: string | number) => ['projects', String(orgId)] as const,
  project: (orgId: string | number, projectId: string | number) =>
    ['project', String(orgId), String(projectId)] as const,
  projectTasks: (orgId: string | number, projectId: string | number) =>
    ['project-tasks', String(orgId), String(projectId)] as const,

  // CRM
  crmClients: (orgId: string | number) => ['crm-clients', String(orgId)] as const,
  crmLeads: (orgId: string | number) => ['crm-leads', String(orgId)] as const,
  crmDeals: (orgId: string | number) => ['crm-deals', String(orgId)] as const,
  crmPipelineSummary: (orgId: string | number) => ['crm-pipeline-summary', String(orgId)] as const,

  // Invoices
  invoices: (orgId: string | number) => ['invoices', String(orgId)] as const,
  invoice: (orgId: string | number, invoiceId: string | number) =>
    ['invoice', String(orgId), String(invoiceId)] as const,
  invoiceMetrics: (orgId: string | number) => ['invoice-metrics', String(orgId)] as const,

  // Org Settings
  orgMembers: (orgId: string | number) => ['org-members', String(orgId)] as const,
  orgRoles: (orgId: string | number) => ['org-roles', String(orgId)] as const,
  orgPermissions: () => ['org-permissions'] as const,
  orgSessions: (orgId: string | number) => ['org-sessions', String(orgId)] as const,
  orgApiKeys: (orgId: string | number) => ['org-api-keys', String(orgId)] as const,
  orgAuditLogs: (orgId: string | number) => ['org-audit-logs', String(orgId)] as const,

  // Global / App
  organizations: () => ['organizations'] as const,
} as const;
