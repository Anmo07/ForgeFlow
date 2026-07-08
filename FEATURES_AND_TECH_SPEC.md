# ForgeFlow - Technical Features & Specifications

ForgeFlow is a production-grade, multi-tenant B2B SaaS platform specifically engineered for Managed Service Providers (MSPs) and IT consultancies. Below is the comprehensive breakdown of the platform's features, architecture, security controls, and dependency specifications.

---

## 🛠️ Technology Stack & Architecture

ForgeFlow operates as a containerized, decoupled monorepo combining a modern React SPA client with an asynchronous Python API backend.

```
                  ┌─────────────────────────────────┐
                  │      Client Browser (SPA)       │
                  │   Next.js 15 (React 18 / TS)    │
                  └────────────────┬────────────────┘
                                   │
                                   │ HTTPS REST / WebSockets
                                   ▼
                  ┌─────────────────────────────────┐
                  │        FastAPI Gateway          │
                  │    Uvicorn / ASGI Routing       │
                  └────────┬───────────────┬────────┘
                           │               │
               DB Queries  │               │ Publish Event
                           ▼               ▼
                  ┌────────┴──────┐   ┌────┴────────────────┐
                  │  PostgreSQL   │   │  Redis Broker /     │
                  │  (Main DB)    │   │  Celery Workers     │
                  └───────────────┘   └─────────────────────┘
```

* **Frontend**: Next.js 15 App Router SPA, TypeScript 5.4, Zustand (state persistence), Tailwind CSS v4, Lucide Icons, and Recharts.
* **Backend**: FastAPI (Python 3.12), SQLAlchemy 2.0 (async engine), Celery (distributed tasks), Alembic (migrations).
* **Datastore & Queues**: PostgreSQL (transactional), Redis 7 (caching/message broker), MinIO (S3-compatible object storage).
* **Infrastructure & Orchestration**: Docker Compose, Nginx (Reverse Proxy & SSL termination), Prometheus (operations monitoring).

---

## ✨ Implemented Core Modules & Features

### 1. Operations Overview (Dashboard)
* **Real-time Metrics Widgets**: Dynamic display of critical operational parameters:
  * **Active Projects**: Active customer engagements and boards.
  * **CRM Pipeline Value**: Current business opportunity pipeline and lead conversion percentages.
  * **Outstanding Invoices**: Total outstanding vs. total billed revenue collections.
* **Aggregated Activity Feeds**: Displays recent system audit logs, user movements, and pipeline events.
* **Visual Navigation Guides**: Direct click-through links to specialized operational boards.

### 2. CRM Opportunity Pipeline
* **Dynamic Lead Pipeline**: Full visual stage progression interface (Leads, Contacted, Proposal, Negotiation, Won, Lost).
* **Deal Ingestion & Management**: Create new deals, assign pipeline values, set win probability, update client info, and edit notes.
* **Dynamic Interceptor Integration**: Changes feed instantly into local storage configurations for the active client context.

### 3. Projects Kanban Board
* **Task Management**: Visual task columns representing project status (To Do, In Progress, Review, Completed).
* **Task Controls**: Add tasks, assign descriptions, priorities (Low, Medium, High), and drag-and-drop or edit to change state.
* **Multi-tenant Board Scope**: Board isolation enforces that project data changes depend exclusively on the selected tenant context.

### 4. Financial Invoicing Engine
* **Invoice Workspace**: Issue customized client invoices with multiple line items, tax parameters, and payment terms.
* **Interactive Invoice Wizard**: Auto-calculates subtotals, VAT/Tax rates, outstanding balances, and total collections.
* **PDF Billing Exporter**: Server-side PDF document compiler generating production-grade invoices.

### 5. Multi-Tenant Organization Switcher
* **Isolated Organization Management**: Multi-step wizard form located at `/organizations/create` allowing users to configure new organizations with settings like size, industry sector, and team invitation lists.
* **Dynamic User Switching**: Top-right corner menu component that lists and allows immediate switching between different mock personas (Admin, Operations, Engineer) to validate permission sets.
* **Active Data Seeding**: Creating an organization automatically seeds mock workspaces, activity logs, memberships, custom roles, and API keys.

---

## 🔒 Security & Privacy Engineering

ForgeFlow implements defense-in-depth principles to keep MSP and client client-company data secure and isolated.

### 1. Multi-Tenant Data Containment (Zero Data Leakage)
* **Logical Tenant Separation**: The backend parses incoming requests using a custom FastAPI dependency (`get_current_tenant`) that extracts the context from the authenticated user token or session.
* **SQLAlchemy Event Listeners**: Enforces query-level isolation by automatically binding tenant restrictions on database compile events. Cross-tenant queries are blocked structurally.
* **Client-side Interception Isolation**: In environments where local mock databases are active, the API interceptor [lib/api.ts](file:///Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/frontend/lib/api.ts) binds request paths to the currently active organization ID loaded from the persisted Zustand store. It is impossible to view details of other companies' organizations.

### 2. Hardened Access Controls
* **Argon2id Password Hashing**: Utilizes the industry-recommended Argon2id hashing algorithm via `argon2-cffi` to prevent credential exposure.
* **Secure Cookie Storage**: Auth sessions inject `access_token` cookies with `Secure`, `HttpOnly`, and `SameSite` flags enabled to protect against XSS and CSRF attacks.
* **Security & Terms Public Gateways**: Public access rules are registered in the Next.js middleware to permit viewing of the Terms of Service and Privacy Policy while blocking access to `/dashboard` or workspace settings directories for unauthenticated guests.

### 3. Platform Disclaimer & Privacy Controls
* **Creators Liability Shield**: Explicitly outlines in the Terms of Service that the SaaS engine is an AI-powered system and creators are protected against unpredicted client losses.
* **Improvement Data Collection Consent**: The platform explicitly requests and logs user consent during signup, clarifying that telemetry and platform usage logs may be processed to train and improve the AI models and systems.

---

## 📦 Software Dependency Specifications

### Frontend (Next.js Node Stack)
* **Framework**: `next` (15.5.19)
* **View Layer**: `react` (18.2.0), `react-dom` (18.2.0)
* **State Management**: `zustand` (4.5.0) - handles persistent auth cookies and company selection.
* **Design & Styling**: `tailwindcss` (4.3.1) - vanilla CSS theme declarations, `class-variance-authority` (0.7.1), `tailwind-merge` (3.6.0).
* **Layout Blocks & Icons**: `lucide-react` (1.21.0), `radix-ui` (1.6.0), `framer-motion` (11.18.0).
* **Form Logic & Validation**: `react-hook-form` (7.50.0), `zod` (3.22.4).
* **Data Visualization**: `recharts` (2.12.4), `@tanstack/react-table` (8.15.3).
* **Query Caching**: `@tanstack/react-query` (5.28.0).

### Backend (FastAPI Python Stack)
* **API Engine**: `fastapi` (0.115.0), `uvicorn[standard]` (0.30.5)
* **Database ORM & Migrations**: `sqlalchemy` (2.0.35), `alembic` (1.13.2), `psycopg2-binary` (2.9.9)
* **Cryptographic & Auth Utilities**: `argon2-cffi` (23.1.0), `python-jose[cryptography]` (3.3.0), `passlib[bcrypt]` (1.7.4), `pyotp` (2.9.0)
* **Task Queuing**: `celery` (5.4.0), `redis` (5.0.5)
* **Object Store SDK**: `minio` (7.2.7)
* **Document Compilation**: `reportlab` (4.2.5) - prints PDF billing receipts.
* **Observability**: `prometheus-client` (0.20.0)
