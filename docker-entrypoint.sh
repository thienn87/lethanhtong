#!/bin/bash
set -e

# Start cron
service cron start

# Execute the main container command
exec "$@"