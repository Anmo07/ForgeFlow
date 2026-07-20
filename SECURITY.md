# Security Policy (SECURITY.md)

At ForgeFlow, security is an core foundational principle. We implement a defense-in-depth architecture combining database-enforced multi-tenant isolation, cryptographic session protection, strict perimeter controls, and automated vulnerability auditing.

---

## 🛡️ Multi-Layer Security Architecture

### 1. Database-Enforced Tenant Isolation (PostgreSQL RLS)
- **Row-Level Security (RLS):** All tenant-scoped database tables (`projects`, `tasks`, `clients`, `leads`, `deals`, `invoices`, `attachments`) have PostgreSQL Row-Level Security enabled with `FORCE ROW LEVEL SECURITY`.
- **Transaction Session Binding:** The backend ORM automatically executes `SET LOCAL app.current_org_id = :org_id` on every active transaction session, making cross-tenant data access structurally impossible at the database engine level.

### 2. Authentication, Session & Access Controls
- **Password Hashing:** Passwords hashed using industry-recommended Argon2id via `argon2-cffi`.
- **JWT & Token Validation:** Authentication token generation and verification enforced strictly with `PyJWT` using explicit `HS256` signature validation.
- **Cookie Security:** Authentication sessions utilize `HttpOnly`, `Secure`, `SameSite=Strict` cookies. Persistent store local storage (`Zustand`) is audited to persist only non-sensitive profile fields (`partialize`).
- **MFA / TOTP:** Supports two-factor authentication via standard TOTP authenticator apps, backed by single-use recovery codes.

### 3. API Protection & Perimeter Safeguards
- **Rate Limiting & Lockout:** Redis-backed `SlowAPI` rate limiting active on sensitive endpoints. Failed authentication attempts trigger exponential lockout backoff delays (`30s`, `60s`, `120s`, `300s`, `900s`).
- **CSRF Defense:** Double-submit cookie CSRF protection (`fastapi-csrf-protect`) enforced on all mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
- **CORS Hardening:** Strict origin allowlists (`CORS_ALLOWED_ORIGINS`) with explicit allowed headers and methods.
- **Bot Defense:** Cloudflare Turnstile captcha integrated into public registration and login flows, with environment test-mode bypass guards (`is_testing`).
- **Container Hardening:** Backend Docker containers run under a non-privileged system user (`USER forgeflow`). Nginx metrics endpoints (`/metrics`) are restricted to internal subnets (`172.0.0.0/8`, `127.0.0.1`).

### 4. Secure Storage & Presigned Uploads
- **Presigned URLs:** PDF billing documents and attachments in MinIO object storage are served exclusively via presigned URL generation following tenant authorization validation (`pdf_object_key`).

---

## 📧 Vulnerability Disclosure Policy

If you suspect or discover a security vulnerability in our platform, please report it to us immediately via our secure disclosure channel.

### How to Report
Please email security details to: **security@forgeflow.com**

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue (proof-of-concept code, HTTP requests, or screenshots).
- Target component or endpoint affected.
- Potential impact on users or data.

---

## 🤝 Safe Harbor & Guidelines

We support responsible disclosure. Under this policy, we promise not to pursue legal action against security researchers who:
- Provide us reasonable time to investigate and remediate the issue prior to public disclosure.
- Do not exploit the vulnerability (e.g. downloading more data than necessary to demonstrate proof-of-concept, or altering operational user data).
- Avoid Denial of Service (DoS) attacks, social engineering, or physical security testing.

---

## ⏱️ SLA Response & Remediation Timelines

- **Acknowledgement**: Within 24 hours of report receipt.
- **Initial Assessment & Classification**: Within 72 hours.
- **Remediation Target Window**: 
  - *Critical / High Severity*: Resolved and deployed within 14 days.
  - *Medium / Low Severity*: Resolved and deployed within 30 to 45 days.
