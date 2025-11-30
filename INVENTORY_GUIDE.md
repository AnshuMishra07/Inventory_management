# Inventory Management Feature - Quick Guide

## ✅ What's Been Implemented

### 1. **Inventory Page** (`/inventory`)
- **Stock Levels Tab**: View all inventory across warehouses
  - Shows: On Hand, Reserved, and Available quantities
  - Color-coded status (In Stock, Low Stock, Out of Stock)
  - Real-time availability calculations
  
- **Transaction History Tab**: Complete audit trail
  - All stock movements (purchases, sales, adjustments, transfers)
  - Timestamped records with user tracking
  - Notes for each transaction

### 2. **Stock Adjustment**
- Add or remove inventory
- Supports multiple warehouses
- Transaction notes for auditing
- Immediate inventory updates

### 3. **Warehouse Management**
- API endpoints for warehouse CRUD operations
- Warehouse creation and management

## 🚀 How to Use

### Create a Warehouse (Required First Step)

Since you need a warehouse to store inventory, create one first via API:

```bash
# Get your access token first
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token \
  -d 'username=admin@test.com&password=admin123' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Create a warehouse
curl -X POST http://localhost:8000/api/warehouses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Warehouse",
    "location": "Building A",
    "address": "123 Main Street"
  }'
```

Or use the API docs at http://localhost:8000/docs

### Add Stock to Products

1. **Go to Inventory Page**: http://localhost:5173/inventory
2. **Click "Adjust Stock"** button
3. **Fill in the form**:
   - Select a product (you need to create products first if you haven't)
   - Enter warehouse ID (use the ID from the warehouse you created)
   - Enter quantity: 
     - Positive number (e.g., `100`) to ADD stock
     - Negative number (e.g., `-10`) to REMOVE stock
   - Add optional notes
4. **Click "Adjust Stock"**

### View Inventory

**Stock Levels Tab** shows:
- Product name and SKU
- Warehouse location
- Quantity on hand
- Reserved quantity (for pending orders)
- Available quantity (on hand - reserved)
- Stock status badge
- Last update timestamp

**Transaction History Tab** shows:
- Complete audit trail of all stock movements
- Date and time of each transaction
- Transaction type (purchase, sale, adjustment, transfer, return)
- Quantity change (positive or negative)
- Notes from the transaction

## 📊 Features in Detail

### Inventory Status Badges

- 🟢 **In Stock**: Available quantity > 10
- 🟡 **Low Stock**: Available quantity 1-9
- 🔴 **Out of Stock**: Available quantity = 0

### Transaction Types

- **Purchase**: Stock added from supplier
- **Sale**: Stock removed for customer order
- **Adjustment**: Manual stock correction
- **Transfer**: Moved between warehouses
- **Return**: Returned stock

## 🔄 Complete Workflow Example

```bash
# 1. Create a product (if not done)
curl -X POST http://localhost:8000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "WIDGET001",
    "name": "Blue Widget",
    "cost_price": 10.00,
    "selling_price": 25.00,
    "reorder_point": 5
  }'

# 2. Add initial stock
# Use the frontend: Inventory → Adjust Stock
# Product: Blue Widget
# Warehouse: <your-warehouse-id>
# Quantity: 100
# Notes: Initial stock

# 3. View inventory
# Go to /inventory page - you'll see:
# - Blue Widget with 100 units on hand
# - 0 reserved
# - 100 available
# - "In Stock" badge
```

## ⚙️ Technical Details

### API Endpoints Used

- `GET /api/inventory` - Get all inventory records
- `POST /api/inventory/adjust` - Adjust stock levels
- `GET /api/inventory/transactions` - Get transaction history
- `GET /api/products` - Get products list
- `POST /api/warehouses` - Create warehouse
- `GET /api/warehouses` - Get warehouses

### Components

- `InventoryPage.tsx` - Main page with tabs
- `InventoryAdjustmentForm.tsx` - Modal for stock adjustments
- `CreateWarehouse.tsx` - Warehouse creation form

## 🎯 Next Steps

After setting up inventory:

1. **Create Sales Orders** - Automatically reserves and deducts inventory
2. **Set Up Alerts** - Get notified when stock is low
3. **View Reports** - Analyze inventory value and turnover
4. **Transfer Stock** - Move between warehouses (coming soon)

## 💡 Tips

- Always create a warehouse before adding inventory
- Use the "default" warehouse ID for simple setups
- Transaction history provides complete audit trail
- Reserved quantity shows stock allocated to pending orders
- Available = On Hand - Reserved (what you can actually sell)

---

**The inventory management feature is now fully functional!** 🎉

Go to http://localhost:5173/inventory to start managing your stock.
