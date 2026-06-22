# <p align="center"><img src="https://raw.githubusercontent.com/Anmo07/ForgeFlow/main/frontend/public/logo.png" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80';this.style.borderRadius='12px'" width="80" height="80" alt="ForgeFlow Logo" /><br>⚙️ ForgeFlow</p>

<p align="center">
  <strong>The Unified Command Center & Billing Automation Engine for Modern MSPs</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## ⚡ What is ForgeFlow?

**ForgeFlow** is a production-grade, multi-tenant B2B SaaS platform specifically adapted for **Small and Medium IT Managed Service Providers (MSPs)** and IT Enterprise consultants. It bridges the gap between engineering operations and back-office finance by consolidating project management, CRM ticketing, client portals, and billing automation into a single, high-performance portal.

No more switching between bloated PSAs, disconnected CRM spreadsheets, and manual time trackers. Run your entire IT operations from one screen.

---

## ✨ Key Enterprise Capabilities

### 🛡️ Hardened Multi-Tenancy & Security
*   **Logical Tenant Isolation:** Dynamic tenant context extraction via `get_current_tenant` dependency.
*   **Automatic ORM Filtering:** Database-level SQLAlchemy event listeners automatically inject tenant constraints—making cross-tenant data leakage structurally impossible.
*   **Advanced Authentication:** Includes Argon2id password hashing, secure session revocation, email verification, and encrypted MFA/TOTP setup with single-use backup codes.

### 💼 Automated MSP Billing Engine
*   **Dynamic Retainers:** Automated fixed-monthly billing contracts.
*   **Per-Seat Subscriptions:** Dynamic counts of active client contacts mapped straight to monthly licensing.
*   **Time & Materials (T&M):** Aggregate billable task logging that feeds directly into automated billing runs.

### 📬 Cryptographically-Signed Email Ingress
*   **Inbound Support Tickets:** Automatically processes inbound support mail hooks.
*   **Signature Verification:** Validates webhook authenticity using HMAC/SHA-256 (`X-Signature`).
*   **Attachment Quarantine:** Automatically quarantines raw file uploads for async antivirus and safety scans before promotion.

---

## 🏗️ Repository Architecture

ForgeFlow is organized as a lightweight, clean monorepo:

```text
├── frontend/          # Next.js 15 App Router, Tailwind CSS v4, daisyUI (Cupcake Theme), Recharts
├── backend/           # FastAPI (Python 3.12), SQLAlchemy 2.0, Celery, Alembic
├── infra/             # Docker Compose stack, Nginx reverse proxy, Prometheus monitoring
└── scripts/           # Seeding, database utilities, and test tools
```

---

## 🚀 Getting Started

### 🐳 Running with Docker Compose (Recommended)

Boot up the entire stack locally (database, queues, storage, monitoring, backend, and frontend) with a single command:

```bash
docker compose -f infra/docker-compose.yml up --build
```

#### Services Spawned:
*   🔑 **Nginx Reverse Proxy:** [http://localhost](http://localhost)
*   💻 **Next.js Frontend:** [http://localhost/](http://localhost/)
*   ⚡ **FastAPI Backend:** [http://localhost/api](http://localhost/api) (OpenAPI docs at `/docs`)
*   🗄️ **MinIO Console:** [http://localhost:9001](http://localhost:9001)
*   📊 **Prometheus Metrics:** [http://localhost:9090](http://localhost:9090)

---

### 🛠️ Local Development Setup

#### 1. Backend API (FastAPI)
```bash
# Navigate to backend
cd backend

# Initialize & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt email-validator pytest httpx

# Start the dev server
./run_backend.sh
```

#### 2. Frontend client (Next.js)
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install --legacy-peer-deps

# Spin up Dev Server
npm run dev
```

---

## 🧪 Testing Suite

Run the full backend integration and unit testing suites:

```bash
PYTHONPATH=backend .venv/bin/pytest backend
```

Includes specific regression checks for tenant isolation, Celery task runners, invite flows, and cryptographic webhook signatures.
