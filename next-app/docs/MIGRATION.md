# Queens Care Laboratories — Hosting & Database Migration Runbook

This runbook describes the zero-downtime migration procedures for transferring Queens Care between cloud platforms (e.g., from Vercel to a self-hosted VPS, or from local storage to Cloudflare R2 / AWS S3).

---

## 1. Database & Configuration Migration

### 1.1 Exporting Database State
Queens Care supports standard PostgreSQL (via Prisma) and file-based state storage:
1. **JSON Snapshot Export**:
   - Access **Admin → Data Export & Backup** (`/admin?tab=data-export`).
   - Click **"Export Full Database Snapshot (JSON)"** or **"Export Customers & Orders (CSV)"**.
   - Or programmatically download via API:
     ```bash
     curl -H "Cookie: session_token=..." https://queenscare.in/api/admin/export?format=json > queenscare_backup.json
     ```
2. **PostgreSQL Dump**:
   ```bash
   pg_dump -U queenscare -h current-db-host -d queenscare -Fc > queenscare_prod_dump.dump
   ```

### 1.2 Restoring to Target Infrastructure
1. **Target PostgreSQL Restore**:
   ```bash
   pg_restore -U queenscare -h new-db-host -d queenscare --clean --if-exists queenscare_prod_dump.dump
   ```
2. **Target Prisma Schema Sync**:
   ```bash
   npm run db:migrate
   ```

---

## 2. Media & Uploads Migration to Cloud S3 / Cloudflare R2

When transitioning from local storage (`public/uploads`) to cloud S3 or Cloudflare R2:

### 2.1 Syncing Existing Media Assets
Use the AWS CLI or Rclone to sync existing files:
```bash
# Example: Syncing local uploads to Cloudflare R2 / S3
aws s3 sync ./public/uploads s3://queenscare-media-prod/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
  --acl public-read
```

### 2.2 Updating Environment Variables
Set the following on the new environment without touching any code:
```text
STORAGE_PROVIDER=s3_compatible
STORAGE_BUCKET=queenscare-media-prod
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=<your-r2-access-key>
STORAGE_SECRET_ACCESS_KEY=<your-r2-secret-key>
STORAGE_PUBLIC_URL=https://media.queenscare.in
```
The application will automatically route all subsequent uploads and media queries to your S3/R2 CDN.

---

## 3. Zero-Downtime DNS Cutover

1. **Lower TTL**: 24 hours prior to cutover, reduce DNS TTL for `queenscare.in` and `www.queenscare.in` to `300` (5 minutes).
2. **Staging Smoke Test**: Deploy to the target host and run the automated verification suite against the staging URL.
3. **Switch DNS Records**: Update the `A` / `CNAME` records at your DNS registrar (Cloudflare / Route 53 / GoDaddy) to point to the new hosting IP or CNAME.
4. **Monitor Error Logs**: Watch real-time logs for 60 minutes post-cutover.
5. **Restore TTL**: Once confirmed stable, restore TTL to standard `86400` (24 hours).

---

## 4. Rollback Plan

If unexpected failures occur post-cutover:
1. Immediately switch DNS `A`/`CNAME` records back to the previous host.
2. The low 5-minute TTL guarantees global resolution will revert within 300 seconds.
3. Synchronize any orders placed during the interim window using the `/api/admin/orders` export/import endpoint.
