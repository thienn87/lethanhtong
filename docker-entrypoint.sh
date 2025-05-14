#!/bin/bash
set -e

# Print current directory and list files for debugging
echo "Current directory: $(pwd)"
ls -la /usr/local/bin/

# Start cron
echo "Starting cron service..."
service cron start || echo "Failed to start cron service"

# Execute the main container command
echo "Executing command: $@"
if [ $# -eq 0 ]; then
    # If no command is provided, run a default command
    echo "No command provided, running default command"
    exec php -a
else
    # Execute the provided command
    exec "$@"
fi