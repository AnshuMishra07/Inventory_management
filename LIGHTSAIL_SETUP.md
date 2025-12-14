# 🚀 AWS Lightsail Deployment Guide

Complete step-by-step guide to deploy the Inventory Management System on AWS Lightsail.

**Cost**: $5/month (FREE for first 3 months)  
**Requirements**: AWS Account, SSH client  
**Time**: ~30 minutes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Lightsail Instance](#step-1-create-lightsail-instance)
3. [Step 2: Configure Security & Networking](#step-2-configure-security--networking)
4. [Step 3: Connect to Instance](#step-3-connect-to-instance)
5. [Step 4: Run Setup Script](#step-4-run-setup-script)
6. [Step 5: Deploy Application](#step-5-deploy-application)
7. [Step 6: Access Application](#step-6-access-application)
8. [Maintenance & Operations](#maintenance--operations)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ AWS Account (new accounts get 3 months free on Lightsail)
- ✅ SSH key pair (or use Lightsail browser-based SSH)
- ✅ Git repository with your code (optional but recommended)

---

## Step 1: Create Lightsail Instance

### 1.1 Access Lightsail Console

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Lightsail** (search for "Lightsail" in services)
3. Click **"Create instance"**

### 1.2 Configure Instance

**Instance Location:**
- Choose region closest to you (e.g., `us-east-1`, `ap-south-1`, `eu-west-1`)

**Instance Image:**
- Platform: **Linux/Unix**
- Blueprint: **OS Only** → **Ubuntu 22.04 LTS**

**Instance Plan:**
- Select **$5 USD/month** plan
  - 1 GB RAM
  - 2 vCPUs
  - 20 GB SSD
  - 1 TB transfer
- ✨ **3 months FREE** for new customers

**Instance Name:**
- Name: `inventory-management-prod` (or your choice)

### 1.3 Add SSH Key (Optional)

- Click **"Change SSH key pair"**
- Either upload your public key OR download Lightsail default key
- Download and save the private key (.pem file) securely

### 1.4 Create Instance

- Click **"Create instance"**
- Wait ~2 minutes for instance to provision

---

## Step 2: Configure Security & Networking

### 2.1 Configure Firewall

1. Click on your instance name
2. Go to **"Networking"** tab
3. Under **"IPv4 Firewall"**, add these rules:

| Application | Protocol | Port | Source |
|-------------|----------|------|---------|
| SSH | TCP | 22 | Custom (Your IP or 0.0.0.0/0) |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| Custom | TCP | 8000 | 0.0.0.0/0 |

> [!TIP]
> For SSH, you can restrict to your IP for better security. Use `0.0.0.0/0` if your IP changes frequently.

### 2.2 Note Your Public IP

- Find **"Public IP"** on the instance page
- Copy this IP address (e.g., `12.34.56.78`)
- **This is your application's public URL!**

> [!IMPORTANT]
> Save this IP address - you'll need it for configuration!

### 2.3 (Optional) Create Static IP

To prevent IP from changing if instance restarts:

1. Go to **"Networking"** tab
2. Click **"Create static IP"**
3. Attach to your instance
4. Click **"Create"**

---

## Step 3: Connect to Instance

### Option A: Browser-Based SSH (Easiest)

1. On instance page, click **"Connect using SSH"** button
2. Browser terminal will open
3. You're connected! ✅

### Option B: SSH from Terminal

```bash
# Replace with your key file and public IP
chmod 400 ~/Downloads/LightsailDefaultKey.pem
ssh -i ~/Downloads/LightsailDefaultKey.pem ubuntu@YOUR_PUBLIC_IP
```

---

## Step 4: Run Setup Script

### 4.1 Download Setup Script

```bash
# Download the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/Inventory_management/main/deployment/lightsail-setup.sh

# OR if you don't have git repository yet, copy the content manually
nano lightsail-setup.sh
# Paste the content from deployment/lightsail-setup.sh
```

### 4.2 Run Setup Script

```bash
# Make executable
chmod +x lightsail-setup.sh

# Run setup (will install Docker, configure swap, etc.)
sudo ./lightsail-setup.sh
```

**This script will:**
- ✅ Update system packages
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Create 2GB swap space (important for 1GB RAM!)
- ✅ Optimize system for low memory

**Duration**: ~5-10 minutes

### 4.3 Log Out and Back In

```bash
exit
# Then reconnect via SSH
ssh -i ~/Downloads/LightsailDefaultKey.pem ubuntu@YOUR_PUBLIC_IP
```

> [!NOTE]
> This is necessary for Docker permissions to take effect

---

## Step 5: Deploy Application

### 5.1 Clone Repository

```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone your repository
git clone https://github.com/YOUR_USERNAME/Inventory_management.git
cd Inventory_management
```

> [!TIP]
> If you don't have a git repository, you can use `scp` to copy files:
> ```bash
> # On your local machine:
> scp -i ~/Downloads/LightsailDefaultKey.pem -r /Users/Project/Inventory_management ubuntu@YOUR_PUBLIC_IP:~/apps/
> ```

### 5.2 Configure Environment

```bash
cd ~/apps/Inventory_management/deployment

# Copy environment template
cp .env.production .env

# Edit configuration
nano .env
```

**Update these critical values in `.env`:**

```bash
# Replace YOUR_LIGHTSAIL_PUBLIC_IP with your actual IP
VITE_API_URL=http://12.34.56.78:8000

# Set strong passwords (IMPORTANT!)
MYSQL_ROOT_PASSWORD=YourSecureRootPassword123!
MYSQL_PASSWORD=YourSecureUserPassword456!
SECRET_KEY=your-very-long-random-secret-key-at-least-32-characters-long

# Optional: Add CORS origin
CORS_ORIGINS=http://12.34.56.78
```

> [!CAUTION]
> **Security**: Use strong, unique passwords! Never use default passwords in production!

Save and exit (`Ctrl+X`, then `Y`, then `Enter`)

### 5.3 Deploy Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**This will:**
- ✅ Build Docker images (backend & frontend)
- ✅ Start all services (MySQL, Backend, Frontend)
- ✅ Run database migrations automatically
- ✅ Display service status

**Duration**: ~10-15 minutes (first time - building images)

### 5.4 Verify Deployment

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Should show all services as "Up" and "healthy"
```

Expected output:
```
NAME                  STATUS          PORTS
inventory_backend     Up (healthy)    0.0.0.0:8000->8000/tcp
inventory_frontend    Up (healthy)    0.0.0.0:80->80/tcp
inventory_mysql       Up (healthy)    127.0.0.1:3306->3306/tcp
```

---

## Step 6: Access Application

### 6.1 Access Points

Replace `YOUR_PUBLIC_IP` with your Lightsail instance IP:

- **Frontend Application**: `http://YOUR_PUBLIC_IP`
- **API Backend**: `http://YOUR_PUBLIC_IP:8000`
- **API Documentation**: `http://YOUR_PUBLIC_IP:8000/docs`

### 6.2 Create First Admin User

```bash
# Using curl on the Lightsail instance
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "YourAdminPassword123!",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### 6.3 Login

1. Open `http://YOUR_PUBLIC_IP` in browser
2. Login with credentials:
   - Email: `admin@yourcompany.com`
   - Password: `YourAdminPassword123!`

🎉 **Success! Your application is live!**

---

## Maintenance & Operations

### View Logs

```bash
cd ~/apps/Inventory_management/deployment

# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Monitor Resources

```bash
# Real-time container stats
docker stats

# System resources
htop

# Disk usage
df -h
```

### Database Backup

```bash
cd ~/apps/Inventory_management/deployment

# Run backup
./backup.sh

# Backups saved to: deployment/backups/
```

**Setup Automatic Backups (Cron):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/ubuntu/apps/Inventory_management/deployment/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### Update Application

```bash
cd ~/apps/Inventory_management

# Pull latest code
git pull

# Redeploy
cd deployment
./deploy.sh
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs container_name

# Check resource usage
docker stats

# Restart container
docker-compose -f docker-compose.prod.yml restart container_name
```

### Out of Memory

```bash
# Check memory usage
free -h

# Check swap
swapon --show

# View container memory limits
docker stats
```

If memory issues persist:
- Reduce container memory limits in `docker-compose.prod.yml`
- Upgrade to $10/month plan (2GB RAM)

### Can't Access Application

1. **Check firewall:**
   ```bash
   sudo ufw status
   ```

2. **Check Lightsail firewall:**
   - Go to Lightsail console
   - Check "Networking" tab
   - Ensure ports 80, 8000 are open

3. **Check containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

### Database Connection Issues

```bash
# Check MySQL container
docker logs inventory_mysql

# Test MySQL connection
docker exec -it inventory_mysql mysql -u root -p
```

### High Memory Usage

```bash
# Check what's using memory
docker stats

# Optimize MySQL (edit docker-compose.prod.yml):
# Reduce innodb_buffer_pool_size to 96M
```

---

## Cost Optimization Tips

1. **3-Month Free Trial**: New AWS accounts get 3 months free
2. **After Free Period**:
   - Consider downgrading to $3.50/month plan (512MB RAM, IPv6 only)
   - Or migrate to Hetzner (€3.49/month, 4GB RAM)
3. **Stop When Not Using**: Lightsail charges only when running
4. **Snapshots**: $0.05/GB/month - useful for backups

---

## Next Steps

- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Configure custom domain name
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups to S3
- [ ] Set up CI/CD pipeline

---

## Support & Resources

- **Lightsail Documentation**: https://lightsail.aws.amazon.com/ls/docs
- **Docker Documentation**: https://docs.docker.com
- **Application Logs**: `docker-compose logs -f`

---

**Happy Deploying! 🚀**
