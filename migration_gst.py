import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to sys.path
import os
import sys
# Assuming script is in project root and backend is in 'backend' subdir
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.config import settings

def migrate_db():
    print("Migrating database schema to include GST fields...")
    
    # Use the database URL from settings, adjusting for localhost if running outside container
    # Found credentials in docker-compose.yml: inventory_user:inventory_pass
    db_url = "mysql+pymysql://inventory_user:inventory_pass@localhost:3306/inventory_management"
    print(f"Connecting to: {db_url}")

    try:
        engine = create_engine(db_url)
        with engine.connect() as connection:
            # Check if columns exist
            result = connection.execute(text("SHOW COLUMNS FROM products LIKE 'cost_price_inc_tax'"))
            if result.fetchone():
                print("Columns already exist. Skipping.")
                return

            print("Adding columns...")
            connection.execute(text("ALTER TABLE products ADD COLUMN cost_price_inc_tax FLOAT DEFAULT 0.0"))
            connection.execute(text("ALTER TABLE products ADD COLUMN selling_price_inc_tax FLOAT DEFAULT 0.0"))
            connection.commit()
            print("Migration successful: Added cost_price_inc_tax and selling_price_inc_tax.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        print("Please run this SQL manually if needed:")
        print("ALTER TABLE products ADD COLUMN cost_price_inc_tax FLOAT DEFAULT 0.0;")
        print("ALTER TABLE products ADD COLUMN selling_price_inc_tax FLOAT DEFAULT 0.0;")

if __name__ == "__main__":
    migrate_db()
