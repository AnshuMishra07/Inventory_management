"""add_product_tax_fields

Revision ID: b27d3d468196
Revises: 
Create Date: 2025-11-25 18:36:43.065948

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b27d3d468196'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get connection and check existing columns
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check existing columns in products table
    products_columns = [col['name'] for col in inspector.get_columns('products')]
    
    # Add tax fields to products table if they don't exist
    if 'tax_rate' not in products_columns:
        op.add_column('products', sa.Column('tax_rate', sa.Float(), server_default='18.0', nullable=True))
    if 'is_tax_inclusive' not in products_columns:
        op.add_column('products', sa.Column('is_tax_inclusive', sa.Boolean(), server_default=sa.text('0'), nullable=True))
    
    # Check existing columns in sales_order_items table
    items_columns = [col['name'] for col in inspector.get_columns('sales_order_items')]
    
    # Add tax fields to sales_order_items table if they don't exist
    if 'tax_rate' not in items_columns:
        op.add_column('sales_order_items', sa.Column('tax_rate', sa.Float(), server_default='18.0', nullable=True))
    if 'tax_amount' not in items_columns:
        op.add_column('sales_order_items', sa.Column('tax_amount', sa.Float(), server_default='0.0', nullable=True))


def downgrade() -> None:
    # Remove columns from sales_order_items
    op.drop_column('sales_order_items', 'tax_amount')
    op.drop_column('sales_order_items', 'tax_rate')
    
    # Remove columns from products
    op.drop_column('products', 'is_tax_inclusive')
    op.drop_column('products', 'tax_rate')
