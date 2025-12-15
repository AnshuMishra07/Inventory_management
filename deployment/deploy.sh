#!/bin/bash
#########################################
# Deployment Script for Inventory System
# Handles Docker build and deployment
#########################################

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "  Deploying Inventory Management System"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.production to .env and configure it:"
    echo "  cp $SCRIPT_DIR/.env.production $SCRIPT_DIR/.env"
    echo "  nano $SCRIPT_DIR/.env"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)

# Validate required variables
if [ "$VITE_API_URL" == "http://34.202.29.170:8000" ]; then
    echo "WARNING: VITE_API_URL is not configured!"
    echo "Please update .env file with your actual Lightsail public IP"
    echo ""
    read -p "Continue anyway? (y/N): " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to deployment directory
cd "$SCRIPT_DIR"

echo ">>> Pulling latest code (if using git)..."
if [ -d "$PROJECT_ROOT/.git" ]; then
    cd "$PROJECT_ROOT"
    git pull || echo "Git pull failed or not a git repository"
    cd "$SCRIPT_DIR"
fi

echo ">>> Stopping existing containers..."
sudo docker-compose -f docker-compose.prod.yml down || true

echo ">>> Building Docker images..."
sudo docker-compose -f docker-compose.prod.yml build --no-cache

echo ">>> Starting services..."
sudo docker-compose -f docker-compose.prod.yml up -d

echo ">>> Waiting for services to be healthy..."
sleep 10

echo ">>> Checking service status..."
sudo docker-compose -f docker-compose.prod.yml ps

echo ""
echo ">>> Service Logs (last 20 lines):"
sudo docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Services Status:"
sudo docker-compose -f docker-compose.prod.yml ps
echo ""
echo "Access Points:"
echo "  Frontend:  http://$(curl -s ifconfig.me)"
echo "  API:       http://$(curl -s ifconfig.me):8000"
echo "  API Docs:  http://$(curl -s ifconfig.me):8000/docs"
echo ""
echo "Useful Commands:"
echo "  View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop all:      docker-compose -f docker-compose.prod.yml down"
echo "  Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "  Check status:  docker-compose -f docker-compose.prod.yml ps"
echo "  Monitor:       docker stats"
echo ""
echo "========================================="
