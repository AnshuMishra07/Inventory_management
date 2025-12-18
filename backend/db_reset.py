import sys
import os
from getpass import getpass
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add current directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.auth import get_password_hash
from app.models.models import Base

def reset_database():
    print("=========================================")
    print("   Database Reset and Seeding Utility")
    print("=========================================")
    print("\nWARNING: This will PERMANENTLY DELETE all data.")
    confirm = input("Are you absolutely sure you want to continue? (y/N): ")
    
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    # Prompt for admin password securely
    print("\n--- Initial Seed Data ---")
    admin_password = ""
    while not admin_password:
        admin_password = getpass("Enter password for admin@test.com: ")
        if not admin_password:
            print("Password cannot be empty.")
            
    confirm_password = getpass("Confirm admin password: ")
    if admin_password != confirm_password:
        print("Passwords do not match. Operation cancelled.")
        return

    # Database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("\n1. Clearing existing data...")
        # Disable foreign key checks for clean truncation
        db.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        tables = [
            "audit_logs",
            "inventory_alerts",
            "purchase_order_items",
            "purchase_orders",
            "sales_order_items",
            "sales_orders",
            "inventory_transactions",
            "inventory",
            "products",
            "suppliers",
            "categories",
            "warehouses",
            "user_profiles",
            "users",
            "customers"
        ]
        
        for table in tables:
            print(f"   Trunacting table: {table}")
            db.execute(text(f"TRUNCATE TABLE {table};"))
        
        db.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        db.commit()
        print("Successfully cleared all tables.")

        print("\n2. Seeding initial data...")
        
        # Create Admin User
        from app.models.models import User, UserRole, Warehouse, UserProfile
        
        admin_user = User(
            email="08.anshu@gmail.com",
            password_hash=get_password_hash(admin_password),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.flush() # Get user ID
        
        # Create User Profile for Admin
        admin_profile = UserProfile(
            user_id=admin_user.id,
            company_name="Software Solutions LLC",
            city="New Delhi",
            country="India"
        )
        db.add(admin_profile)
        
        # Create Default Warehouse
        main_warehouse = Warehouse(
            name="User Warehouse",
            location="User Location",
            address="Address of user",
            manager_id=admin_user.id,
            is_active=True
        )
        db.add(main_warehouse)
        
        db.commit()
        print("Successfully seeded Admin user and Main Warehouse.")
        
        print("\n=========================================")
        print("   Database Reset Complete! 🎉")
        print("=========================================")
        print(f"Login Email: admin@test.com")
        print(f"Password: (as entered)")
        print("=========================================")

    except Exception as e:
        db.rollback()
        print(f"\nERROR occurred: {str(e)}")
        print("Database changes have been rolled back.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()
