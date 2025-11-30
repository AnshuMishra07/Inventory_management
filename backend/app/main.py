from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
import logging

from app.core.config import settings
from app.core.database import engine, Base
# Import routers
from app.api.routes import (
    auth, products, inventory, sales, customers,
    reports, alerts, warehouses, audit, invoices
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount static files
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting application...")
    # Create tables if they don't exist (for development only)
    # In production, use Alembic migrations
    if settings.DEBUG:
        Base.metadata.create_all(bind=engine)
    logger.info("Application started successfully")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}


# Include routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(products.router, prefix=f"{settings.API_PREFIX}/products", tags=["Products"])
app.include_router(inventory.router, prefix=f"{settings.API_PREFIX}/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix=f"{settings.API_PREFIX}/sales", tags=["Sales"])
app.include_router(customers.router, prefix=f"{settings.API_PREFIX}/customers", tags=["Customers"])
app.include_router(reports.router, prefix=f"{settings.API_PREFIX}/reports", tags=["Reports"])
app.include_router(alerts.router, prefix=f"{settings.API_PREFIX}/alerts", tags=["Alerts"])
app.include_router(warehouses.router, prefix=f"{settings.API_PREFIX}/warehouses", tags=["Warehouses"])
app.include_router(invoices.router, prefix=f"{settings.API_PREFIX}/invoices", tags=["Invoices"])
app.include_router(audit.router, prefix=f"{settings.API_PREFIX}/audit", tags=["Audit"])


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Inventory Management API",
        "docs": "/docs",
        "health": "/health"
    }
