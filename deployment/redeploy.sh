#!/bin/bash
#########################################
# Selective Redeployment Script
# Redeploys specific services only
#########################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE=$1

# Check if service name is provided
if [ -z "$SERVICE" ]; then
    echo "Usage: ./redeploy.sh <service_name>"
    echo "Available services: backend, frontend, mysql"
    echo "Example: ./redeploy.sh backend"
    exit 1
fi

echo "========================================="
echo "  Redeploying Service: $SERVICE"
echo "========================================="

# Navigate to deployment directory
cd "$SCRIPT_DIR"

# Check if docker-compose file exists
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "ERROR: docker-compose.prod.yml not found!"
    exit 1
fi

echo ">>> Pulling latest code..."
git pull || echo "Git pull failed (ignoring)"

echo ">>> Rebuilding $SERVICE..."
sudo docker-compose -f docker-compose.prod.yml build --no-cache $SERVICE

echo ">>> Recreating $SERVICE..."
# stop current container
sudo docker-compose -f docker-compose.prod.yml stop $SERVICE
# start new container (recreate)
sudo docker-compose -f docker-compose.prod.yml up -d --no-deps $SERVICE

echo ">>> Checking status..."
sudo docker-compose -f docker-compose.prod.yml ps $SERVICE

echo ">>> Done!"
