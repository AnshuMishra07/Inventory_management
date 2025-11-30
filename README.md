# Inventory Management System

A comprehensive end-to-end inventory management product with features including inventory tracking, barcode scanning, sales management, automated alerts, and reporting.

## 🚀 Quick Start for Windows Users

**Windows 10/11 users can use our automated installer:**

1. Right-click `install.bat` and select **"Run as Administrator"**
2. Press any key to start automated installation
3. After installation, run `run.bat` to start the application

📖 **See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for complete Windows installation guide**

---

## Features

- **Inventory Management**: Track products across multiple warehouses with real-time stock levels
- **Barcode Scanning**: USB barcode scanner integration for quick product lookup and transactions
- **Sales Management**: Create and manage sales orders with automatic inventory updates
- **Low Inventory Alerts**: Automated notifications when stock falls below reorder points
- **Reporting**: Comprehensive reports and analytics with data visualization

## Technology Stack

### Backend
- Python 3.10+
- FastAPI for REST API
- MySQL 8.0+ database
- SQLAlchemy ORM
- Alembic for migrations
- Pydantic for validation

### Frontend
- React 18+ with TypeScript
- Vite for development
- React Router for navigation
- TanStack Query for data fetching
- Chart.js for visualizations

## Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm
- MySQL 8.0+
- USB Barcode Scanner (optional, for barcode scanning features)

## Installation

### 1. Clone the Repository

```bash
cd /Users/Project/Inventory_management
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE inventory_management;
exit;

# Run migrations
alembic upgrade head
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

## Running the Application

### Start Backend Server

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

## USB Barcode Scanner Setup

USB barcode scanners work via keyboard emulation - they act as a keyboard input device:

1. **Plug in your USB barcode scanner** - no drivers needed, it's recognized as a keyboard
2. **Configure scanner settings** (if needed):
   - Set to add Enter/Return key after scan (most scanners default to this)
   - Ensure scanner is in the correct barcode format (EAN-13, Code-128, etc.)
3. **Using in the application**:
   - Click on any barcode input field
   - Scan a barcode - it will automatically input the value and submit
   - Can also type barcode manually

## Project Structure

```
inventory_management/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # API endpoints
│   │   ├── core/               # Configuration, auth
│   │   ├── models/             # Database models
│   │   ├── services/           # Business logic
│   │   ├── jobs/               # Scheduled tasks
│   │   └── main.py             # FastAPI app
│   ├── alembic/                # Database migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities, API client
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
└── README.md
```

## API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

## Default Credentials

After running the initial migration, you can create an admin user:

```bash
python -m app.scripts.create_admin
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Creating Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check credentials in `.env` file
- Verify database exists: `SHOW DATABASES;`

### Barcode Scanner Not Working
- Ensure scanner is plugged in and recognized by OS
- Check that input field has focus when scanning
- Verify scanner is configured to send Enter key after scan

### Port Already in Use
- Backend: Change port in uvicorn command: `--port 8001`
- Frontend: Vite will automatically use next available port

## License

MIT License
