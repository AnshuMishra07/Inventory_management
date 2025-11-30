# Quick Start Guide

## Option 1: Using Docker (Recommended - Easiest)

This will start MySQL, Redis, and all services automatically:

```bash
# From project root
docker-compose up -d

# Backend will be at: http://localhost:8000
# Frontend will be at: http://localhost:5173
# phpMyAdmin will be at: http://localhost:8080
```

## Option 2: Manual Setup (MySQL needs to be installed and running)

### Start MySQL

If you have MySQL installed via Homebrew:
```bash
brew services start mysql
```

Or if you have MySQL.app or MAMP:
- Start MySQL через the application

Or install MySQL:
```bash
brew install mysql
brew services start mysql
```

### Create Database
```bash
mysql -u root -p
# Enter password (or just press Enter if no password)
CREATE DATABASE inventory_management;
exit;
```

### Update .env file
Edit `backend/.env` and update the DATABASE_URL with your MySQL password:
```
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/inventory_management
```

### Create Tables & Start Backend

```bash
cd backend
source venv/bin/activate

# Create tables
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend API will be running at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### Start Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend will be running at: **http://localhost:5173**

## Option 3: Use SQLite (No MySQL needed - Quick Testing)

Edit `backend/.env`:
```
DATABASE_URL=sqlite:///./inventory.db
```

Then:
```bash
cd backend
source venv/bin/activate
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
uvicorn app.main:app --reload --port 8000
```

## Create First User

After backend is running, create an admin user:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

Then login at http://localhost:5173 with:
- Email: admin@test.com
- Password: admin123

## Troubleshooting

### Can't connect to MySQL
- Make sure MySQL is running: `mysql.server status` or `brew services list`
- Check your password in the .env file
- Try: `mysql -u root -p` to test connection

### Port already in use
- Backend: Change port in command: `uvicorn app.main:app --reload --port 8001`
- Frontend: Vite will automatically try the next port
