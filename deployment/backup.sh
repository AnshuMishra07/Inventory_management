#!/bin/bash
#########################################
# Database Backup Script
# Creates MySQL dumps with rotation
#########################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inventory_backup_$DATE.sql.gz"
KEEP_DAYS=7

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "ERROR: .env file not found!"
    exit 1
fi

echo "========================================="
echo "  Database Backup"
echo "========================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo ">>> Creating database backup..."
docker exec inventory_mysql mysqldump \
    -u root \
    -p"${MYSQL_ROOT_PASSWORD}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "${MYSQL_DATABASE}" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully: $BACKUP_FILE"
    echo "  Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Rotate old backups
echo ""
echo ">>> Removing backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "inventory_backup_*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
echo "  Remaining backups:"
ls -lh "$BACKUP_DIR"/inventory_backup_*.sql.gz 2>/dev/null || echo "  No backups found"

# Optional: Upload to S3
if [ ! -z "$S3_BACKUP_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo ""
    echo ">>> Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/backups/" && \
        echo "✓ Uploaded to S3 successfully" || \
        echo "✗ S3 upload failed"
fi

echo ""
echo "========================================="
echo "  Backup Complete!"
echo "========================================="
echo ""
echo "To restore from this backup:"
echo "  gunzip < $BACKUP_FILE | docker exec -i inventory_mysql mysql -u root -p${MYSQL_DATABASE}"
echo ""
