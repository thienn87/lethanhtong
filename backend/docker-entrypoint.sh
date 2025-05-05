#!/bin/sh
set -e

# Run Laravel migrations (optional, comment out if not desired on every start)
# php artisan migrate --force

# Start the main container command
exec "$@"