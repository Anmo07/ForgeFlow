# Data Retention & Deletion Policy (DATA_RETENTION_POLICY.md)

This document establishes the retention schedules for different types of data processed by ForgeFlow and details the secure deletion procedures.

## Retention Schedules

| Data Category | Retention Period | Justification |
| :--- | :--- | :--- |
| **User Profile PII** | Duration of active contract + 30 days. | Contractual necessity and user lifecycle. |
| **Invoices & Financial Records** | 7 Years. | Local tax, accounting, and legal requirements. |
| **CRM Logs, Projects & Tasks** | Duration of active contract. Deletions processed within 30 days of tenant removal. | Data minimisation and client control. |
| **Activity/Audit Logs** | 1 Year. | SOC2 compliance and security auditing targets. |
| **System Cache / Session States** | Up to 30 days. | Performance cache and session revocation TTLs. |
| **SSO Configs & Custom Roles** | Duration of active contract. | Data minimisation and security control boundaries. |

## Secure Deletion & Anonymization Procedures
- **Soft Deletion**: When an organization deletes a project or task, it is marked as deleted and excluded from queries. It is permanently purged from database backups after 30 days.
- **PII Anonymization**: Upon user account deletion or request, the user record is anonymized. Identifiers (names, emails, profile info) are completely replaced with random cryptographic hashes to prevent re-identification, while retaining system referential integrity for audit and task records.
- **Object Storage purging**: Deleted PDFs and attachments in MinIO buckets are deleted immediately via API. Lifecycle policies ensure that objects marked for deletion are permanently garbage collected.
- **SSO Credentials Purging**: Disabling or deleting tenant OIDC configuration immediately purges client credentials and encrypted client secrets from the database. Complete tenant removal deletes all linked configurations.
- **Custom Roles Cleanup**: Deleting a custom role (permitted only when unassigned to active members) permanently deletes the role record and its permission associations from the database immediately.
