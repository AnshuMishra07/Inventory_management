# 🚀 AWS EC2 Free Tier Deployment Guide

Complete step-by-step guide to deploy the Inventory Management System on AWS EC2 Free Tier.

**Cost**: FREE for 12 months  
**Instance**: t2.micro or t3.micro (1 vCPU, 1GB RAM, 30GB storage)  
**Requirements**: AWS Account (new or existing)  
**Time**: ~30-40 minutes

---

## 📋 EC2 Free Tier Specifications

✅ **750 hours/month** of t2.micro (or t3.micro in newer regions)  
✅ **30 GB** of EBS General Purpose (SSD) storage  
✅ **15 GB** of bandwidth out per month  
✅ **Free for 12 months** from account creation

---

## Step 1: Launch EC2 Instance

### 1.1 Access EC2 Console

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **EC2** (search for "EC2" in services)
3. Click **"Launch Instance"**

### 1.2 Configure Instance

**Name and Tags:**
- Name: `inventory-management-prod`

**Application and OS Images (AMI):**
- **Quick Start**: Ubuntu
- **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
- Architecture: 64-bit (x86)

**Instance Type:**
- Select **t2.micro** (or t3.micro) - "Free tier eligible" label
- 1 vCPU, 1 GiB Memory

**Key Pair:**
- Click **"Create new key pair"**
  - Name: `inventory-key`
  - Type: RSA
  - Format: `.pem` (for Mac/Linux) or `.ppk` (for Windows/PuTTY)
- Click **"Create key pair"** and save the file securely

### 1.3 Network Settings

Click **"Edit"** on Network settings:

**Firewall (Security Groups):**
- Create new security group
- Name: `inventory-sg`
- Description: `Security group for inventory management system`

**Inbound Security Group Rules:**

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | Anywhere (0.0.0.0/0) | Frontend |
| Custom TCP | TCP | 8000 | Anywhere (0.0.0.0/0) | API |

> [!TIP]
> For SSH, use "My IP" for better security. For HTTP and API, use "Anywhere" to allow public access.

### 1.4 Configure Storage

- **Size**: 30 GiB (max for free tier)
- **Volume Type**: gp2 (General Purpose SSD)
- **Delete on Termination**: ✅ (checked)

### 1.5 Advanced Details (Optional but Recommended)

Scroll to **User data** and paste this to auto-run setup on first boot:

```bash
#!/bin/bash
# This will run on first boot
apt-get update
apt-get upgrade -y
```

### 1.6 Launch Instance

1. Review the **Summary** panel on right
2. Click **"Launch instance"**
3. Wait ~2 minutes for instance to initialize

---

## Step 2: Allocate Elastic IP (Static IP)

> [!IMPORTANT]
> Without an Elastic IP, your instance IP changes on restart!

1. In EC2 Console, go to **"Elastic IPs"** (left sidebar under Network & Security)
2. Click **"Allocate Elastic IP address"**
3. Click **"Allocate"**
4. Select the new IP, click **"Actions"** → **"Associate Elastic IP address"**
5. Instance: Select your `inventory-management-prod` instance
6. Click **"Associate"**
7. **Note your Elastic IP** (e.g., `54.123.45.67`) - this is your public URL!

---

## Step 3: Connect to EC2 Instance

### Option A: EC2 Instance Connect (Browser-Based - Easiest)

1. Go to **EC2** → **Instances**
2. Select your instance
3. Click **"Connect"** button at top
4. Choose **"EC2 Instance Connect"** tab
5. Click **"Connect"**
6. Browser terminal opens ✅

### Option B: SSH from Terminal

```bash
# Make key file read-only (required)
chmod 400 ~/Downloads/inventory-key.pem

# Connect (replace with your Elastic IP)
ssh -i ~/Downloads/inventory-key.pem ubuntu@54.123.45.67
```

---

## Step 4: Run Setup Script

```bash
# Download setup script
wget https://raw.githubusercontent.com/AnshuMishra07/Inventory_management/master/deployment/lightsail-setup.sh -O ec2-setup.sh

# Make executable and run
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

**This will:**
- Install Docker & Docker Compose
- Configure 2GB swap (critical for 1GB RAM!)
- Set up firewall
- Optimize system for low memory

**Duration**: ~5-10 minutes

**After setup completes, log out and back in:**

```bash
exit
# Then reconnect
ssh -i ~/Downloads/inventory-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## Step 5: Deploy Application

### 5.1 Clone Repository

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/AnshuMishra07/Inventory_management.git
cd Inventory_management/deployment
```

### 5.2 Configure Environment

```bash
cp .env.production .env
nano .env
```

**Update these values in `.env`:**

```bash
# Replace with your Elastic IP
VITE_API_URL=http://54.123.45.67:8000
CORS_ORIGINS=http://54.123.45.67

# Choose strong, unique passwords for production!
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_db_user_password
SECRET_KEY=generate_a_random_32_char_string
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

### 5.3 Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

**Duration**: 15-20 minutes (first build)

**Expected output:**
```
>>> Building Docker images...
>>> Starting services...
>>> Services Status:
inventory_backend    Up (healthy)
inventory_frontend   Up (healthy)
inventory_mysql      Up (healthy)
```

---

## Step 6: Access Application

### Access Points

Replace `YOUR_ELASTIC_IP` with your EC2 Elastic IP:

- **Frontend**: `http://YOUR_ELASTIC_IP`
- **API**: `http://YOUR_ELASTIC_IP:8000`
- **API Docs**: `http://YOUR_ELASTIC_IP:8000/docs`

### Create Admin User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123!",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Login

Open `http://YOUR_ELASTIC_IP` in browser and login with:
- Email: `admin@test.com`
- Password: `admin123!`

🎉 **Success! Your application is live on EC2!**

---

## Maintenance

### View Logs

```bash
cd ~/apps/Inventory_management/deployment
sudo docker-compose -f docker-compose.prod.yml logs -f
```

### Restart Services

```bash
sudo docker-compose -f docker-compose.prod.yml restart
```

### Stop Services

```bash
sudo docker-compose -f docker-compose.prod.yml down
```

### Update Application

```bash
cd ~/apps/Inventory_management
git pull
cd deployment
./deploy.sh
```

### Backup Database

```bash
cd ~/apps/Inventory_management/deployment
./backup.sh
```

### Reset Database (Destructive)

> [!CAUTION]
> This will PERMANENTLY DELETE all data and seed a fresh admin user and warehouse.

```bash
cd ~/apps/Inventory_management/deployment
sudo docker-compose -f docker-compose.prod.yml exec -it backend python db_reset.py
```


---

## Cost Management

### Free Tier Limits

- ✅ **750 hours/month** = Run 24/7 for entire month
- ⚠️ **Elastic IP**: Free ONLY when attached to running instance
- ⚠️ **Data Transfer**: 15 GB/month free (out to internet)

### To Avoid Charges

1. **Don't stop instance frequently** - Elastic IP charges $0.005/hour when not attached
2. **Monitor data transfer** - Excessive traffic may exceed 15GB
3. **Delete unused snapshots/volumes**
4. **After 12 months**: Instance charges $0.0116/hour (~$8.50/month for t2.micro)

### Stop Instance (to save money after free tier)

```bash
# Gracefully stop services first
cd ~/apps/Inventory_management/deployment
sudo docker-compose -f docker-compose.prod.yml down
```

Then in AWS Console: **Actions** → **Instance State** → **Stop**

---

## Troubleshooting

### Can't Connect via SSH

```bash
# Check security group allows SSH from your IP
# Verify key file permissions
chmod 400 inventory-key.pem
```

### Out of Memory

```bash
# Check memory usage
free -h

# Check swap
swapon --show

# If swap not enabled, run setup script again
```

### Slow Docker Build

EC2 t2.micro can be slow for Docker builds. Solutions:
- Use `docker build --no-cache` (rebuild forces memory cleanup)
- Build during low-traffic times
- Consider t3.micro (better burst performance)

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8000
sudo lsof -i :80

# Kill process if needed
sudo kill -9 <PID>
```

---

## EC2 vs Lightsail Comparison

| Feature | EC2 Free Tier | Lightsail |
|---------|---------------|-----------|
| **Cost (Year 1)** | FREE (12 months) | $45 ($0 + 9×$5) |
| **RAM** | 1GB | 1GB ($5 plan) |
| **Storage** | 30GB | 20GB |
| **Setup Complexity** | Medium (more steps) | Easy (simplified) |
| **Best For** | 12-month free trial | Long-term $5/month |

---

## Next Steps

- [ ] Set up SSL/HTTPS with Let's Encrypt
- [ ] Configure custom domain name  
- [ ] Set up CloudWatch monitoring
- [ ] Configure automated backups to S3
- [ ] Set up auto-scaling (after free tier)

---

**Ready to deploy! 🚀**
