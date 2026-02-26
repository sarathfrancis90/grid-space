# Database Backup Strategy

## Overview

GridSpace uses PostgreSQL 16 as its primary database. This document covers
backup procedures, scheduling, retention, and restore operations.

## Backup Methods

### 1. pg_dump (Logical Backup)

Full database dump in custom format (compressed, restorable):

```bash
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=gridspace \
  --dbname=gridspace \
  --format=custom \
  --compress=9 \
  --file=/backups/gridspace_$(date +%Y%m%d_%H%M%S).dump
```

SQL-only backup (human-readable, portable):

```bash
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=gridspace \
  --dbname=gridspace \
  --format=plain \
  --file=/backups/gridspace_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Docker-Based Backup

When running in Docker Compose:

```bash
docker compose exec postgres pg_dump \
  -U gridspace \
  -Fc \
  gridspace > /backups/gridspace_$(date +%Y%m%d_%H%M%S).dump
```

## Automated Schedule (Cron)

Add to the host machine's crontab (`crontab -e`):

```cron
# Daily full backup at 2:00 AM UTC
0 2 * * * /opt/gridspace/scripts/backup.sh >> /var/log/gridspace-backup.log 2>&1

# Weekly comprehensive backup (Sundays at 3:00 AM UTC)
0 3 * * 0 /opt/gridspace/scripts/backup-weekly.sh >> /var/log/gridspace-backup.log 2>&1
```

### backup.sh

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/gridspace/daily"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="gridspace_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

# Create backup
docker compose -f /opt/gridspace/docker-compose.prod.yml exec -T postgres \
  pg_dump -U gridspace -Fc gridspace > "${BACKUP_DIR}/${FILENAME}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${FILENAME}" \
  "s3://gridspace-backups/daily/${FILENAME}" \
  --storage-class STANDARD_IA

# Remove local backups older than 7 days
find "${BACKUP_DIR}" -name "*.dump" -mtime +7 -delete

echo "[$(date)] Backup complete: ${FILENAME}"
```

## Upload to S3

Prerequisites:

- AWS CLI installed and configured (`aws configure`)
- S3 bucket created: `gridspace-backups`
- IAM user with `s3:PutObject` and `s3:GetObject` permissions

```bash
# Manual upload
aws s3 cp /backups/gridspace_20260101_020000.dump \
  s3://gridspace-backups/daily/ \
  --storage-class STANDARD_IA
```

## Retention Policy

| Tier    | Frequency | Retention | Storage Class       |
| ------- | --------- | --------- | ------------------- |
| Daily   | Every day | 7 days    | S3 Standard-IA      |
| Weekly  | Sundays   | 4 weeks   | S3 Standard-IA      |
| Monthly | 1st of mo | 12 months | S3 Glacier Flexible |

Use S3 Lifecycle Rules to automate transitions:

```json
{
  "Rules": [
    {
      "ID": "DailyCleanup",
      "Prefix": "daily/",
      "Status": "Enabled",
      "Expiration": { "Days": 7 }
    },
    {
      "ID": "WeeklyCleanup",
      "Prefix": "weekly/",
      "Status": "Enabled",
      "Expiration": { "Days": 28 }
    },
    {
      "ID": "MonthlyToGlacier",
      "Prefix": "monthly/",
      "Status": "Enabled",
      "Transitions": [{ "Days": 30, "StorageClass": "GLACIER" }],
      "Expiration": { "Days": 365 }
    }
  ]
}
```

## Restore Procedures

### From custom format (.dump)

```bash
# Restore to existing database (drops and recreates objects)
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=gridspace \
  --dbname=gridspace \
  --clean \
  --if-exists \
  /backups/gridspace_20260101_020000.dump
```

### From S3

```bash
# Download from S3
aws s3 cp s3://gridspace-backups/daily/gridspace_20260101_020000.dump /tmp/

# Restore
pg_restore -U gridspace -d gridspace --clean --if-exists /tmp/gridspace_20260101_020000.dump
```

### Docker restore

```bash
cat /backups/gridspace_20260101_020000.dump | \
  docker compose exec -T postgres pg_restore \
    -U gridspace -d gridspace --clean --if-exists
```

## Verification

After each restore, verify data integrity:

```bash
# Check table counts
psql -U gridspace -d gridspace -c "
  SELECT 'users' AS t, count(*) FROM \"User\"
  UNION ALL SELECT 'spreadsheets', count(*) FROM \"Spreadsheet\"
  UNION ALL SELECT 'sheets', count(*) FROM \"Sheet\";
"
```

## Monitoring

- Alert if daily backup cron fails (check exit code)
- Alert if backup file size is 0 or below expected minimum
- Monitor S3 bucket size for unexpected growth
- Test restore to staging environment monthly
