#!/bin/bash
# Daily database backup
BACKUP_DIR="/root/creatoros/backups"
DB_NAME="creatoros"
DB_USER="creatoros"
DB_PASS="Creatoros2024!"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
PGPASSWORD=$DB_PASS pg_dump -h 127.0.0.1 -U $DB_USER $DB_NAME > $BACKUP_DIR/creatoros_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: creatoros_$DATE.sql"
