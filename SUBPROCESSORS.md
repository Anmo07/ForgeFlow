# Subprocessors List (SUBPROCESSORS.md)

This page lists the subprocessors and infrastructure partners authorized by ForgeFlow to process client and organization business data.

| Subprocessor | Processing Activity / Purpose | Location |
| :--- | :--- | :--- |
| **AWS S3 / MinIO** | Storage of uploaded invoices, documents, and quarantined attachments. | United States (or local region per tenant) |
| **PostgreSQL (AWS RDS)** | Relational database storage of organization structures, CRM data, user profiles, and audit logs. | United States (or local region per tenant) |
| **Redis** | Storage of revoked tokens, session keys, failed login trackers, and rate limiter buckets. | United States |
| **Cloudflare** | Edge routing, turnstile bot protection, network firewalling, and tunnel management. | Global Edge Network |
| **SMTP Provider (e.g. AWS SES / Mailgun)** | Dispatching verification emails, team invites, and breach reports. | United States / EU |
