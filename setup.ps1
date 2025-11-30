# Inventory Management System - Automated Windows Setup
# This script automates the complete installation and setup process

param(
    [string]$MySQLRootPassword = "RootPass@123",
    [string]$AppDBPassword = "AppPass@123",
    [switch]$SkipMySQLInstall = $false
)

$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Header { param($msg) Write-Host "`n==== $msg ====`n" -ForegroundColor Magenta }

# Check if running as Administrator
function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error "This script must be run as Administrator!"
    Write-Info "Right-click and select 'Run as Administrator'"
    exit 1
}

Write-Header "Inventory Management System - Automated Setup"

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Step 1: Install Chocolatey
Write-Header "Step 1: Installing Chocolatey Package Manager"
try {
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Info "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Success "Chocolatey installed successfully"
    } else {
        Write-Success "Chocolatey already installed"
    }
} catch {
    Write-Error "Failed to install Chocolatey: $_"
    exit 1
}

# Step 2: Install Prerequisites
Write-Header "Step 2: Installing Prerequisites"

# Install Python
Write-Info "Installing Python 3.11..."
try {
    choco install python --version=3.11.0 -y --force
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "Python installed"
} catch {
    Write-Warning "Python installation encountered issues (may already exist)"
}

# Install Node.js
Write-Info "Installing Node.js 18..."
try {
    choco install nodejs --version=18.0.0 -y --force
    refreshenv
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Success "Node.js installed"
} catch {
    Write-Warning "Node.js installation encountered issues (may already exist)"
}

# Install MySQL
if (-not $SkipMySQLInstall) {
    Write-Info "Installing MySQL 8.0..."
    try {
        choco install mysql --version=8.0.33 -y --force
        refreshenv
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Success "MySQL installed"
    } catch {
        Write-Warning "MySQL installation encountered issues (may already exist)"
    }
} else {
    Write-Info "Skipping MySQL installation (user requested)"
}

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Step 3: Configure MySQL
Write-Header "Step 3: Configuring MySQL Database"

Write-Info "Starting MySQL service..."
try {
    Start-Service MySQL -ErrorAction SilentlyContinue
    Write-Success "MySQL service started"
} catch {
    Write-Warning "MySQL service may already be running or not installed"
}

Write-Info "Creating database and user..."
$mysqlCommands = @"
CREATE DATABASE IF NOT EXISTS inventory_management;
CREATE USER IF NOT EXISTS 'inventory_user'@'localhost' IDENTIFIED BY '$AppDBPassword';
GRANT ALL PRIVILEGES ON inventory_management.* TO 'inventory_user'@'localhost';
FLUSH PRIVILEGES;
"@

try {
    $mysqlCommands | mysql -u root --password=$MySQLRootPassword 2>$null
    Write-Success "Database and user created"
} catch {
    Write-Info "Attempting without password (fresh MySQL install)..."
    try {
        $mysqlCommands | mysql -u root 2>$null
        
        # Set root password for future use
        "ALTER USER 'root'@'localhost' IDENTIFIED BY '$MySQLRootPassword';" | mysql -u root 2>$null
        Write-Success "Database created and root password set"
    } catch {
        Write-Error "Failed to configure MySQL. Please check MySQL installation and credentials."
        Write-Info "You may need to manually create the database and user"
    }
}

# Step 4: Backend Setup
Write-Header "Step 4: Setting Up Backend"

Set-Location "$scriptDir\backend"

Write-Info "Creating Python virtual environment..."
python -m venv venv
Write-Success "Virtual environment created"

Write-Info "Activating virtual environment..."
& ".\venv\Scripts\Activate.ps1"

Write-Info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
Write-Success "Dependencies installed"

Write-Info "Creating backend .env file..."
$backendEnv = @"
# Database Configuration
DATABASE_URL=mysql+pymysql://inventory_user:$AppDBPassword@localhost:3306/inventory_management

# Security
SECRET_KEY=$(New-Guid)
JWT_SECRET_KEY=$(New-Guid)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
PROJECT_NAME="Inventory Management System"
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Alert Configuration (optional)
ALERT_EMAIL_RECIPIENTS=admin@example.com
"@

$backendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Success "Backend .env file created"

Write-Info "Running database migrations..."
try {
    alembic upgrade head
    Write-Success "Database migrations completed"
} catch {
    Write-Error "Migration failed: $_"
    Write-Info "You may need to run migrations manually: alembic upgrade head"
}

Write-Info "Creating admin user..."
$createAdminScript = @"
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
try:
    admin = db.query(User).filter(User.email == 'admin@test.com').first()
    if not admin:
        admin = User(
            email='admin@test.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Admin User',
            is_active=True
        )
        db.add(admin)
        db.commit()
        print('Admin user created: admin@test.com / admin123')
    else:
        print('Admin user already exists')
finally:
    db.close()
"@

$createAdminScript | Out-File -FilePath "create_admin.py" -Encoding UTF8
try {
    python create_admin.py
    Remove-Item "create_admin.py"
    Write-Success "Admin user setup complete"
} catch {
    Write-Warning "Could not create admin user automatically"
}

# Step 5: Frontend Setup
Write-Header "Step 5: Setting Up Frontend"

Set-Location "$scriptDir\frontend"

Write-Info "Installing Node.js dependencies..."
npm install
Write-Success "Node.js dependencies installed"

Write-Info "Creating frontend .env file..."
$frontendEnv = @"
VITE_API_URL=http://localhost:8000
"@

$frontendEnv | Out-File -FilePath ".env" -Encoding UTF8
Write-Success "Frontend .env file created"

# Step 6: Final Summary
Write-Header "Setup Complete!"

Write-Host ""
Write-Success "Installation completed successfully!"
Write-Host ""
Write-Info "Database Details:"
Write-Host "  • Database: inventory_management"
Write-Host "  • User: inventory_user"
Write-Host "  • Password: $AppDBPassword"
Write-Host ""
Write-Info "Default Admin Credentials:"
Write-Host "  • Email: admin@test.com"
Write-Host "  • Password: admin123"
Write-Host ""
Write-Info "To start the application:"
Write-Host "  1. Run: .\run.bat"
Write-Host "  2. Open browser to: http://localhost:5173"
Write-Host ""
Write-Success "Happy inventory managing!"
Write-Host ""

Set-Location $scriptDir
