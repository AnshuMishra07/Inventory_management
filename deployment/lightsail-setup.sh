#!/bin/bash
#########################################
# AWS Lightsail Instance Setup Script
# For Inventory Management System
# Ubuntu 22.04 LTS
#########################################

set -e  # Exit on error

echo "========================================="
echo "  Lightsail Instance Setup"
echo "  Inventory Management System"
echo "========================================="
echo ""

# Update system
echo ">>> Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo ">>> Installing essential tools..."
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    nano \
    vim \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
echo ">>> Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo "Docker installed successfully!"
else
    echo "Docker is already installed."
fi

# Install Docker Compose standalone (v2)
echo ">>> Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed successfully!"
else
    echo "Docker Compose is already installed."
fi

# Configure firewall (Lightsail uses its own firewall in console)
echo ">>> Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (for future SSL)
sudo ufw allow 8000/tcp  # API
sudo ufw status

# Create application directory
echo ">>> Creating application directory..."
mkdir -p ~/apps
cd ~/apps

# Configure swap (important for 1GB RAM)
echo ">>> Configuring swap space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap configured: 2GB"
else
    echo "Swap already exists."
fi

# Optimize system for low memory
echo ">>> Optimizing system settings..."
sudo sysctl -w vm.swappiness=10
sudo sysctl -w vm.vfs_cache_pressure=50
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
echo "vm.vfs_cache_pressure=50" | sudo tee -a /etc/sysctl.conf

# Enable Docker service
echo ">>> Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# Display versions
echo ""
echo "========================================="
echo "  Installation Complete!"
echo "========================================="
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker-compose --version
echo ""
echo "System Info:"
free -h
echo ""
echo "========================================="
echo "IMPORTANT: You may need to log out and"
echo "log back in for Docker permissions to"
echo "take effect (usermod -aG docker)."
echo ""
echo "Next steps:"
echo "1. Clone your repository"
echo "2. Configure .env file"
echo "3. Run deploy.sh"
echo "========================================="
