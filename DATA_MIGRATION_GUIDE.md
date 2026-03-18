# Data Migration Guide

## Overview

When moving from one machine to another (e.g., Windows to Mac), you need to migrate:
1. **Database data** (MySQL)
2. **Media files** (uploaded images, videos, etc.)

## Quick Migration Steps

### On Source Machine (Windows/Linux)

#### 1. Export Database

```bash
# Make sure containers are running
docker compose ps

# Export database to SQL file
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > database_backup.sql

# Or use the MySQL user
docker compose exec db mysqldump -u aiu -paiu123 aiu_mediahub > database_backup.sql
```

#### 2. Copy Media Files

```bash
# The media folder contains all uploaded files
# Simply copy the entire media folder
# Location: ./media/
```

#### 3. Package Everything

```bash
# Create a backup archive
tar -czf aiu_backup.tar.gz database_backup.sql media/

# Or on Windows (using PowerShell):
Compress-Archive -Path database_backup.sql,media -DestinationPath aiu_backup.zip
```

### On Target Machine (Mac)

#### 1. Setup Project

```bash
# Clone the repository
git clone <your-repo-url>
cd aiu_media_hub

# Pull latest changes
git pull origin version1

# Copy your backup file here
# (transfer aiu_backup.tar.gz via USB, cloud, etc.)
```

#### 2. Extract Backup

```bash
# Extract the backup
tar -xzf aiu_backup.tar.gz

# Or on Mac with zip:
unzip aiu_backup.zip
```

#### 3. Start Docker Containers

```bash
# Start containers (this creates fresh database)
docker compose up -d

# Wait for all services to be healthy
docker compose ps
```

#### 4. Import Database

```bash
# Import the database backup
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < database_backup.sql

# Or using the aiu user:
docker compose exec -T db mysql -u aiu -paiu123 aiu_mediahub < database_backup.sql
```

#### 5. Verify Media Files

```bash
# Media files should already be in ./media/ from extraction
# Verify they exist:
ls -la media/

# The media folder is mounted as a volume in docker-compose.yml
# So the backend will automatically see these files
```

#### 6. Restart Containers

```bash
# Restart to ensure everything is loaded
docker compose restart

# Check logs
docker compose logs -f
```

#### 7. Test the Application

```bash
# Access the application
open http://localhost

# Login with your existing credentials
# All data should be present
```

## Alternative: Manual File Transfer

If you prefer not to use archives:

### Transfer Database

**On Source Machine:**
```bash
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > backup.sql
```

**Transfer `backup.sql` to target machine via:**
- USB drive
- Cloud storage (Google Drive, Dropbox)
- Email (if file is small)
- Git (add to .gitignore first if sensitive)

**On Target Machine:**
```bash
docker compose up -d
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < backup.sql
```

### Transfer Media Files

**Copy the entire `media/` folder:**
- Via USB drive
- Via cloud storage
- Via network share

**Place in project root on target machine:**
```
aiu_media_hub/
├── media/           ← Copy here
│   ├── equipment/
│   ├── tutorials/
│   └── ...
├── docker-compose.yml
└── ...
```

## Automated Migration Script

Create a file `migrate.sh` on source machine:

```bash
#!/bin/bash

echo "=== AIU Media Hub Data Migration ==="
echo "Creating backup..."

# Export database
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > database_backup.sql

# Create archive
tar -czf aiu_migration_$(date +%Y%m%d_%H%M%S).tar.gz database_backup.sql media/

echo "✓ Backup created: aiu_migration_*.tar.gz"
echo "Transfer this file to your target machine"
```

Create a file `restore.sh` on target machine:

```bash
#!/bin/bash

echo "=== AIU Media Hub Data Restoration ==="

# Check if backup file exists
if [ ! -f "database_backup.sql" ]; then
    echo "Error: database_backup.sql not found"
    echo "Please extract your backup archive first"
    exit 1
fi

# Start containers
echo "Starting Docker containers..."
docker compose up -d

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 15

# Import database
echo "Importing database..."
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < database_backup.sql

# Restart containers
echo "Restarting containers..."
docker compose restart

echo "✓ Migration complete!"
echo "Access your application at http://localhost"
```

Make scripts executable:
```bash
chmod +x migrate.sh restore.sh
```

## Important Notes

### Database Compatibility
- MySQL version should be the same (we use MySQL 8.0)
- Character encoding is preserved in the dump
- All tables, data, and relationships are included

### Media Files
- Preserve file permissions when copying
- Maintain directory structure
- File paths in database are relative, so they'll work on any machine

### User Accounts
- All user accounts are in the database
- Passwords are hashed and will work on the new machine
- Admin account: username `admin`, password `admin123`

### What Gets Migrated
✓ User accounts and passwords
✓ Equipment inventory
✓ Lab bookings
✓ Equipment rentals
✓ Tutorials and videos
✓ CV submissions
✓ All uploaded images and files
✓ System settings

### What Doesn't Get Migrated
✗ Docker volumes (recreated fresh)
✗ Container logs
✗ Local development files (node_modules, etc.)

## Troubleshooting

### "Access denied" during import
```bash
# Try with root user
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < database_backup.sql

# Or recreate the database first
docker compose exec db mysql -u root -proot123 -e "DROP DATABASE IF EXISTS aiu_mediahub; CREATE DATABASE aiu_mediahub;"
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < database_backup.sql
```

### Media files not showing
```bash
# Check if media folder exists and has files
ls -la media/

# Check Docker volume mount
docker compose exec backend ls -la /app/media/

# Restart backend
docker compose restart backend
```

### Database import hangs
```bash
# Check MySQL is running
docker compose ps

# Check MySQL logs
docker compose logs db

# Try smaller chunks if file is large
split -l 10000 database_backup.sql backup_part_
for file in backup_part_*; do
    docker compose exec -T db mysql -u root -proot123 aiu_mediahub < "$file"
done
```

## Cloud Backup Option

For regular backups, you can use cloud storage:

```bash
# Backup script with cloud upload
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aiu_backup_${DATE}.tar.gz"

# Create backup
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > database_backup.sql
tar -czf "$BACKUP_FILE" database_backup.sql media/

# Upload to cloud (example with rclone)
# rclone copy "$BACKUP_FILE" remote:backups/

echo "Backup created: $BACKUP_FILE"
```

## Quick Reference

**Export data:**
```bash
docker compose exec db mysqldump -u root -proot123 aiu_mediahub > backup.sql
tar -czf backup.tar.gz backup.sql media/
```

**Import data:**
```bash
tar -xzf backup.tar.gz
docker compose up -d
docker compose exec -T db mysql -u root -proot123 aiu_mediahub < backup.sql
docker compose restart
```

**Verify:**
```bash
docker compose ps
docker compose logs -f
open http://localhost
```
