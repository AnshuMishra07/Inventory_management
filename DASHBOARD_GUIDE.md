# Dashboard - User Guide

## 🏠 Overview

The Dashboard is your command center - the first thing you see after logging in. It provides a real-time overview of your business with key metrics, alerts, and quick actions.

**Access:** http://localhost:5173/ (auto-loads after login)

---

## 📊 Dashboard Features

### **1. Key Metrics Cards** (Top Row)

Four gradient cards showing critical business metrics:

#### 📦 Total Products
- **Shows:** Number of unique products in system
- **Click:** Navigate to Products page
- **Color:** Purple gradient

#### 💰 Inventory Value
- **Shows:** Total value of all inventory (cost price × quantity)
- **Click:** Navigate to Reports page
- **Color:** Pink gradient

#### 💵 Today's Revenue
- **Shows:** Total sales revenue for today
- **Subtext:** Number of orders today
- **Click:** Navigate to Sales page
- **Color:** Blue gradient

#### 📋 Pending Orders
- **Shows:** Orders awaiting fulfillment
- **Click:** Navigate to Sales page to fulfill
- **Color:** Green gradient

---

### **2. Low Stock Alert Banner** (Conditional)

**Appears when:** Products fall below reorder point

**Features:**
- ⚠️ Warning icon
- Count of low-stock products
- Click-through to reports page
- Yellow alert styling
- "View Low Stock" button

**Example:**
```
⚠️ Low Stock Alert!
5 products below reorder point. Click to view details.
[View Low Stock →]
```

---

### **3. Recent Orders** (Bottom Left)

**Shows:** Last 5 sales orders

**Columns:**
- Order # (clickable)
- Customer ID (truncated)
- Amount
- Status (color-coded badge)

**Actions:**
- Click row → Navigate to Sales page
- "View All" button → Full order list
- "Create First Order" (if no orders)

**Empty State:**
- Shows when no orders exist
- Button to create first order via POS

---

### **4. Top Selling Products** (Top Right)

**Shows:** Top 5 products by revenue (last 30 days)

**Columns:**
- Rank (#1 in gold)
- Product name
- Units sold
- Total revenue

**Actions:**
- "View All" → Reports page for complete list

**Empty State:**
- Shows when no sales data available

---

### **5. Low Stock Items** (Bottom Left Middle)

**Shows:** First 5 products below reorder point

**Columns:**
- Product name
- Available (red if 0, orange if low)
- Reorder point threshold
- Status badge (Out/Low)

**Actions:**
- "View All" → Reports page for complete list

**All Stocked State:**
- ✅ Green checkmark
- "All Products In Stock" message
- Positive feedback

---

### **6. Quick Actions** (Bottom Right)

**Provides:** One-click access to common tasks

**Actions Available:**
1. 🛒 **Open Point of Sale** - Start selling
2. 📦 **Add New Product** - Add to catalog
3. 📊 **Adjust Inventory** - Update stock levels
4. 👥 **Add New Customer** - Create customer record
5. 📈 **View Reports** - Access analytics

**Each button:**
- Has an emoji icon
- Descriptive text
- Navigates to relevant page

---

## 🎨 Visual Design

### **Color Coding:**
- **Purple** - Products/Inventory
- **Pink** - Financial Value
- **Blue** - Sales/Revenue
- **Green** - Orders/Actions
- **Yellow** - Alerts/Warnings
- **Red** - Critical (out of stock)
- **Orange** - Warning (low stock)

### **Interactive Elements:**
- Metric cards are clickable
- Hover effects on buttons
- Smooth transitions
- Gradient backgrounds

---

## 🔄 Data Refresh

**Auto-loads on:**
- Page load
- Login
- Navigation to dashboard

**Manual Refresh:**
- Reload browser (F5)
- Navigate away and back

**Data Sources:**
- Real-time from database
- Aggregated from reports
- Live order status

---

## 💡 Best Practices

### **Morning Routine:**
1. Check dashboard for alerts
2. Review pending orders
3. Note low stock items
4. Check today's revenue

### **Throughout Day:**
5. Monitor pending orders count
6. Watch inventory value
7. Check for new alerts

### **End of Day:**
8. Review total orders
9. Check revenue vs target
10. Plan tomorrow's orders

---

## 🎯 Quick Navigation

**From Dashboard, you can reach:**
- Products (click purple card OR quick action)
- Sales Orders (click blue/green cards)
- Reports (click pink card OR alert banner)
- POS (primary button OR quick action)
- Inventory (quick action)
- Customers (quick action)

---

## 📱 Responsive Design

**Desktop:**
- 4 metric cards in row
- 2-column grid for widgets
- Full data tables

**Tablet:**
- 2 metric cards per row
- 2-column grid maintained

**Mobile:**
- 1 metric card per row
- 1-column grid
- Scrollable tables

---

## 🔔 Alert System

### **Low Stock Alerts:**
- Banner appears automatically
- Shows product count
- Click to see details
- Yellow warning color

### **No Alerts:**
- Clean dashboard
- No banner shown
- Focus on metrics

---

## 📊 Metrics Explained

### **Total Products:**
- Counts unique SKUs
- Includes all active products
- Excludes deleted items

### **Inventory Value:**
- Sum of (quantity × cost price)
- Across all warehouses
- Real-time calculation

### **Today's Revenue:**
- Sum of completed orders
- Today's date only
- Excludes cancelled orders

### **Pending Orders:**
- Status = confirmed OR pending
- Awaiting fulfillment
- Action required

---

## 🚀 Power User Tips

1. **Pin Dashboard:** Set as browser homepage
2. **Keyboard Shortcut:** Alt+H to home (if configured)
3. **Quick Start:** Use "Open POS" for fast checkouts
4. **Monitor Low Stock:** Act on alerts immediately
5. **Daily Review:** Check metrics every morning
6. **Trend Analysis:** Compare today vs yesterday (mental note)
7. **Quick Actions:** Memorize keyboard shortcuts
8. **Alert Response:** Click banner for instant details

---

## 🎨 Customization

**Future Enhancements:**
- Custom date ranges
- Configurable widgets
- Personalized metrics
- Chart visualizations
- Export capabilities

---

Your Dashboard is the heartbeat of your business - check it often! 📈
