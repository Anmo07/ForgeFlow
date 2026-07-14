# Disaster Recovery Plan (DISASTER_RECOVERY.md)

## Recovery Objectives
- **RTO (Recovery Time Objective)**: < 4 hours. The target time within which system operations must be restored after a disruption.
- **RPO (Recovery Point Objective)**: < 1 hour. The maximum tolerable data loss window from the last backup.

## Backup Strategy
1. **PostgreSQL Relational Data**:
   - Automated daily full snapshots with a 30-day retention period.
   - Continuous WAL (Write-Ahead Logging) archiving to secure S3 buckets to support Point-in-Time Recovery (PITR).
2. **MinIO / Object Storage**:
   - Versioned buckets to prevent accidental deletion or ransomware overwrites.
   - Cross-region replication enabled for production attachment and invoice storage.
3. **Redis Cache / State**:
   - Redis configurations and ACL rules backed up daily. Active session states are ephemeral and do not block core recovery.
4. **SSO Keys & Cryptographic Secrets**:
   - The `FIELD_ENCRYPTION_KEY` used to encrypt OIDC client secrets is backed up in highly secure, geo-replicated hardware security modules or Secret Managers (e.g., Vault or cloud-native secrets vault) separate from database snapshots. Losing these keys blocks OIDC credentials decryption.

## Replication & High Availability
- **Database**: Hot-standby replica database instances located in a separate Availability Zone (AZ) or region with synchronous/asynchronous replication enabled.
- **Application Services**: Running across multiple container pods across isolated target hosts behind high-availability load balancers.

## Incident & Failover Procedure
1. **Detection**: Alerts triggered via Prometheus/Alertmanager on node/database failure.
2. **Declaration**: DevOps lead assesses the outage and declares disaster status if recovery exceeds 15 minutes.
3. **Failover**:
   - DB: Promote primary hot-standby replica.
   - DNS: Reroute traffic via Cloudflare load balancers to the secondary disaster recovery target environment.
4. **Validation & Fallback**:
   - Validation: Smoke test core auth, Google SSO redirection capability, key manager availability (decryption of tenant SSO configurations), tenancy checks, and MinIO storage paths.
   - Emergency Override: If Google OIDC provider is completely offline, administrators can use secure local local-auth credentials to bypass SSO and modify/disable OIDC settings.
