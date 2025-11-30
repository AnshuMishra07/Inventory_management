# Sales Order Module - User Guide

## ✅ Features Implemented

The Sales Order module is a comprehensive system for managing customer orders from creation to fulfillment.

### 1. **Sales Order Creation**
- Multi-line item orders with dynamic calculations
- Customer selection from existing customers
- Product selection with auto-filled prices
- Individual item discounts
- Order-level tax, discount, and shipping
- Real-time total calculation
- Order notes

### 2. **Order Management**
- View all sales orders in a list
- Filter by status (pending, confirmed, shipped, delivered)
- Order number auto-generation
- Status tracking (order status and payment status)
- Detailed order view with all line items

### 3. **Order Fulfillment**
- One-click fulfillment process
- Automatic inventory deduction
- Inventory reservation on order creation
- Prevents overselling

### 4. **Customer Management**
- Customer creation and management
- Auto-generated customer numbers
- Credit limit tracking
- Outstanding balance monitoring
- Full contact information

---

## 🚀 How to Use

### Step 1: Create Customers

Before creating orders, you need customers:

1. Go to **Customers** page: http://localhost:5173/customers
2. Click **"+ Add Customer"**
3. Fill in the form:
   - **Required**: Name, Email
   - **Optional**: Phone, Address, City, State, Postal Code, Country, Credit Limit, Notes
4. Click **"Create Customer"**

The system auto-generates a unique customer number (e.g., `CUST20241125001`).

### Step 2: Create a Sales Order

1. Go to **Sales Orders** page: http://localhost:5173/sales
2. Click **"+ Create Order"**
3. Fill in the order form:

   **Customer & Warehouse:**
   - Select customer from dropdown
   - Verify/update warehouse ID (default is set)

   **Order Items:**
   - Click **"+ Add Item"** to add products
   - Select product (price auto-fills from product catalog)
   - Enter quantity
   - Adjust unit price if needed
   - Add discount per item if applicable
   - Remove items with "Remove" button

   **Additional Charges:**
   - Tax Amount: Enter tax in dollars
   - Discount: Order-level discount
   - Shipping: Shipping cost

   **Notes:**
   - Add any order-specific notes

   **Order Summary:**
   - Real-time calculation shows:
     - Subtotal (all items)
     - Tax
     - Discount
     - Shipping
     - **Total** (highlighted in blue)

4. Click **"Create Order"**

### Step 3: View Order Details

1. In the sales orders list, click **"View"** on any order
2. Order details modal shows:
   - Order number and IDs
   - Order and payment status
   - All line items with pricing
   - Calculated totals
   - Notes
   - Action buttons

### Step 4: Fulfill an Order

**Important**: Fulfillment deducts inventory!

1. Find a **confirmed** order in the list
2. Click **"Fulfill"** button
3. Confirm the fulfillment
4. System will:
   - Deduct reserved inventory
   - Update inventory on-hand
   - Change order status to "delivered"
   - Create inventory transaction record

---

## 📊 Order Statuses

### Order Status
- 🟡 **Pending**: Order created, awaiting confirmation
- 🔵 **Confirmed**: Order confirmed, inventory reserved
- 🔵 **Shipped**: Order shipped to customer
- 🟢 **Delivered**: Order fulfilled, inventory deducted
- 🔴 **Cancelled**: Order cancelled

### Payment Status
- 🔴 **Unpaid**: No payment received
- 🟡 **Partial**: Partial payment received
- 🟢 **Paid**: Fully paid

---

## 💡 Example Workflow

### Complete Order Process:

```
1. CREATE CUSTOMER
   → Navigate to Customers
   → Add customer "John Doe"
   → Customer# CUST20241125001 created

2. CREATE PRODUCTS (if not done)
   → Navigate to Products
   → Add product "Widget A" - $25.00

3. ADD INVENTORY (if not done)
   → Navigate to Inventory
   → Adjust stock for "Widget A"
   → Add 100 units to warehouse

4. CREATE SALES ORDER
   → Navigate to Sales
   → Create new order
   → Customer: John Doe
   → Items: Widget A x 5 @ $25 = $125
   → Tax: $10
   → Total: $135
   → Order# SO20241125001 created
   → Status: Confirmed
   → Inventory: 5 units RESERVED

5. VIEW ORDER
   → Click "View" on order
   → See all details
   → Verify line items and totals

6. FULFILL ORDER
   → Click "Fulfill"
   → Confirm fulfillment
   → Inventory: 5 units DEDUCTED
   → Status: Delivered
   → Available inventory: 95 units
```

---

## 🔧 Technical Details

### API Endpoints Used

**Sales Orders:**
- `GET /api/sales` - List all orders
- `GET /api/sales/{id}` - Get order details
- `POST /api/sales` - Create new order
- `POST /api/sales/{id}/fulfill` - Fulfill order

**Customers:**
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `DELETE /api/customers/{id}` - Delete customer

### Data Flow

1. **Order Creation**:
   - Creates sales_orders record
   - Creates sales_order_items records
   - Reserves inventory (quantity_reserved += quantity)
   - Creates inventory transaction (type: sale, pending)

2. **Order Fulfillment**:
   - Deducts inventory (quantity_on_hand -= quantity)
   - Removes reservation (quantity_reserved -= quantity)
   - Updates order status to "delivered"
   - Completes inventory transaction

### Components

- `SalesOrderForm.tsx` - Order creation modal
- `SalesPage.tsx` - Order list and details
- `CustomersPage.tsx` - Customer management

---

## ⚠️ Important Notes

1. **Inventory Reservation**: When an order is created, inventory is reserved immediately. This prevents overselling.

2. **Fulfillment is Final**: Once fulfilled, inventory is permanently deducted. Make sure orders are correct before fulfilling.

3. **Customer Required**: You must create customers before creating orders.

4. **Warehouse Requirement**: Orders must specify a warehouse. Use the default warehouse created earlier.

5. **Product Prices**: Product prices auto-fill from the product catalog but can be adjusted per order.

6. **Calculations**: All calculations (subtotals, totals) happen in real-time as you enter data.

---

## 🎯 Features in Action

### Real-Time Calculations
- Add items → Subtotal updates
- Change quantity → Line total updates
- Add tax/shipping → Total updates
- Everything recalculates instantly

### Status Badges
- Color-coded for quick identification
- Order status: yellow/blue/green/red
- Payment status: red/yellow/green

###Multi-Line Orders
- Add unlimited line items
- Each item can have:
  - Different products
  - Different quantities
  - Different unit prices
  - Individual discounts

---

## 🚀 Next Steps

1. **Create your first customer**
2. **Create a sales order** with multiple items
3. **View the order details** to verify
4. **Fulfill the order** to complete the cycle
5. **Check inventory** to see the deduction

The Sales Order module is now fully functional and ready for production use! 🎉

**Access the module**: http://localhost:5173/sales
