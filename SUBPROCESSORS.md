# Authorized Subprocessors List (SUBPROCESSORS.md)

This document lists the third-party subprocessors and infrastructure service providers authorized by ForgeFlow to process customer operational and personal data in connection with the platform services.

---

## 🏢 Authorized Subprocessors

| Subprocessor | Processing Activity / Purpose | Storage Location | Compliance & Certification |
| :--- | :--- | :--- | :--- |
| **AWS S3 / MinIO** | Secure S3-compatible object storage of invoice PDF exports, workspace attachments, and quarantined files. | United States / EU (Region Pinning Available) | SOC 1/2/3, ISO 27001, GDPR |
| **PostgreSQL (AWS RDS)** | Relational database hosting organization structures, CRM data, projects, tasks, user profiles, and RLS audit logs. | United States / EU (Tenant Region Option) | SOC 1/2/3, ISO 27001, HIPAA compliant |
| **Redis Cloud / ElastiCache** | In-memory storage for token revocation lists, rate limiting buckets, failed login lockout counters, and invoice idempotency responses. | United States / EU | SOC 2 Type II, ISO 27001 |
| **Cloudflare** | Edge routing, WAF firewall, DDoS mitigation, global CDN, and Turnstile bot protection. | Global Edge Network | SOC 2 Type II, ISO 27001, PCI-DSS |
| **Google Cloud Identity (OIDC)** | Enterprise Single Sign-On (SSO) identity verification and OAuth token exchange. | Global / United States | SOC 2/3, ISO 27001, GDPR |
| **Transactional SMTP Provider (AWS SES / Mailgun)** | Dispatching verification emails, password reset notifications, team invites, and security reports. | United States / EU | SOC 2, ISO 27001 |

---

## 🔒 Data Protection Safeguards

1. **Tenant Data Isolation:** All database infrastructure enforces PostgreSQL Row-Level Security (RLS), preventing subprocessors from commingling client organization data.
2. **Encryption Standards:** All data in transit is encrypted using TLS 1.3. Data at rest across PostgreSQL, Redis, and MinIO S3 object storage is encrypted using AES-256.
3. **Zero Unauthorized Model Training:** Customer operational data, invoices, CRM pipelines, and workspace activity logs are strictly excluded from third-party AI training sets without explicit opt-in consent.
4. **Subprocessor Updates:** ForgeFlow provides at least 30 days' advance notice to subscribers prior to engaging any new infrastructure subprocessor.
