# Docker Development Guide

## Overview

This document provides instructions for setting up and using our Docker development environment. Our application uses PHP 8.2 with various extensions and utilities configured for local development.

## Docker Configuration

### Dockerfile

Our `Dockerfile` is configured with PHP 8.2 and includes all necessary extensions and dependencies for development. The container uses a custom entrypoint script for initialization.

```dockerfile
FROM php:8.2-cli
# ... other configuration ...
ENTRYPOINT ["docker-entrypoint.sh"]
```

### Entrypoint Script

The Docker container uses `docker-entrypoint.sh` as its entrypoint script. This script runs when the container starts and performs several important initialization tasks:

1. Sets up environment variables
2. Runs database migrations if needed
3. Configures PHP settings
4. Starts the application server

## Development Setup

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git for version control

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Create the entrypoint script:
   ```bash
   touch docker-entrypoint.sh
   chmod +x docker-entrypoint.sh
   ```

3. Add the following content to `docker-entrypoint.sh`:
   ```bash
   #!/bin/bash
   set -e

   # Wait for database to be ready
   if [ "$DB_CONNECTION" = "pgsql" ]; then
     echo "Waiting for PostgreSQL..."
     while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME; do
       sleep 1
     done
   fi

   # Run migrations if needed
   if [ "$APP_ENV" != "production" ] || [ "$MIGRATE_ON_STARTUP" = "true" ]; then
     php artisan migrate --force
   fi

   # Start cron service if enabled
   if [ "$ENABLE_CRON" = "true" ]; then
     crontab /etc/cron.d/app-cron
     service cron start
   fi

   # Execute the passed command or start PHP server
   if [ $# -gt 0 ]; then
     exec "$@"
   else
     php artisan serve --host=0.0.0.0 --port=9000
   fi
   ```

4. Build and start the Docker containers:
   ```bash
   docker-compose up -d
   ```

## Common Issues and Solutions

### "Cannot copy docker-entrypoint.sh" Error

If you encounter an error like "docker cannot copy my file" during the build process, check the following:

1. **File existence**: Ensure `docker-entrypoint.sh` exists in the same directory as your Dockerfile:
   ```bash
   ls -la docker-entrypoint.sh
   ```

2. **File permissions**: Make sure the file is executable:
   ```bash
   chmod +x docker-entrypoint.sh
   ```

3. **Build context**: Ensure you're running `docker build` from the correct directory:
   ```bash
   docker build -t your-image-name .
   ```

4. **Line endings**: If developing on Windows, ensure the file has Unix-style line endings (LF, not CRLF).

## Customizing the Environment

### Environment Variables

The following environment variables can be set to customize the container behavior:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_CONNECTION` | Database type (mysql/pgsql) | pgsql |
| `DB_HOST` | Database hostname | db |
| `DB_PORT` | Database port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `MIGRATE_ON_STARTUP` | Run migrations on startup | false |
| `ENABLE_CRON` | Enable cron service | false |

### Adding Custom Initialization Steps

To add custom initialization steps, modify the `docker-entrypoint.sh` script. For example, to seed the database:

```bash
# Add after migrations
if [ "$SEED_ON_STARTUP" = "true" ]; then
  php artisan db:seed
fi
```

## Production Deployment

For production, we recommend:

1. Using a multi-stage build to reduce image size
2. Setting appropriate environment variables
3. Implementing health checks
4. Using Docker secrets for sensitive information

## Further Resources

- [Official PHP Docker Image](https://hub.docker.com/_/php)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Laravel Docker Best Practices](https://laravel.com/docs/8.x/deployment#docker)