// Shared entity types — match backend Pydantic schemas exactly

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
  role?: string;
}

export interface Project {
  id: number;
  organization_id: number;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'in_progress' | 'completed' | 'archived' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  total_tasks?: number;
  tasks_completed?: number;
  tasks?: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string | null;
  assigned_to?: number | string | null;
  version?: number; // Optimistic locking field
  created_at: string;
  updated_at: string;
}

export interface CRMClient {
  id: number;
  organization_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  status?: string;
  created_at: string;
}

export interface Lead {
  id: number;
  organization_id: number;
  client_id: number;
  client_name?: string;
  client_company?: string;
  name?: string;
  email?: string;
  status: 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost' | 'followed_up';
  value?: number;
  source?: string;
  assigned_to?: number | null;
  created_at: string;
}

export interface Deal {
  id: number;
  organization_id: number;
  lead_id: number;
  name: string;
  value: number;
  status: string;
  stage?: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  win_probability?: number;
  assigned_to?: number | null;
  version?: number; // Optimistic locking field
  closed_at?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  organization_id: number;
  client_id: number;
  invoice_number: string;
  client_name?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string;
  notes?: string;
  pdf_url?: string;
  pdf_status?: 'pending' | 'ready' | 'failed';
  created_at: string;
}

export interface Membership {
  id: number;
  user_id: number;
  organization_id: number;
  role_id: number;
  role_name?: string;
  user_email?: string;
  user_name?: string;
  status: 'active' | 'pending' | 'invited' | 'suspended';
  joined_at: string;
  user?: {
    id: number;
    email: string;
    full_name: string;
  };
  role?: {
    id: number;
    name: string;
  };
}

export interface Role {
  id: number;
  organization_id?: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: (Permission | string)[];
  created_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Payload types for creation
export type CreateProjectPayload = Pick<Project, 'name'> & Partial<Pick<Project, 'description' | 'status' | 'priority' | 'due_date'>>;
export type CreateTaskPayload = Pick<Task, 'title'> & Partial<Pick<Task, 'description' | 'status' | 'priority' | 'due_date' | 'assigned_to'>>;
export type CreateClientPayload = Pick<CRMClient, 'name'> & Partial<Pick<CRMClient, 'email' | 'phone' | 'company'>>;
export type CreateLeadPayload = Pick<Lead, 'client_id'> & Partial<Pick<Lead, 'status' | 'value' | 'source' | 'assigned_to'>>;
export type CreateDealPayload = Pick<Deal, 'lead_id' | 'name' | 'value'> & Partial<Pick<Deal, 'stage' | 'win_probability' | 'assigned_to' | 'status'>>;
export type CreateInvoicePayload = Pick<Invoice, 'client_id' | 'issue_date' | 'due_date'> & Partial<Pick<Invoice, 'notes' | 'subtotal' | 'tax_rate' | 'tax_amount' | 'total'>>;
