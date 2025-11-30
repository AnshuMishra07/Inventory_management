# Reports Module - User Guide

## 📊 Overview

The Reports module provides comprehensive analytics and insights into your inventory, sales, and product performance. Access it at: **http://localhost:5173/reports**

---

## 📈 Available Reports

### 1. **Inventory Valuation Report** 📊

**What it shows:**
- Total inventory value across all warehouses
- Number of unique products
- Total units in stock
- Breakdown by warehouse

**Key Metrics:**
- **Total Inventory Value**: Sum of (quantity × cost price) for all products
- **Total Products**: Number of unique products
- **Total Units**: Sum of all product quantities

**Use cases:**
- Financial reporting
- Insurance valuation
- Asset tracking
- Warehouse performance comparison

---

### 2. **Sales Summary Report** 💰

**What it shows:**
- Total revenue for selected period
- Number of orders
- Total items sold
- Average order value

**Date Range:** Customizable (default: last 30 days)

**Key Metrics:**
- **Total Revenue**: Sum of all completed orders
- **Total Orders**: Count of sales orders
- **Items Sold**: Total quantity of products sold
- **Average Order Value**: Revenue ÷ Orders

**Use cases:**
- Performance tracking
- Period-over-period comparison
- Revenue forecasting
- Sales team evaluation

---

### 3. **Product Performance Report** ⭐

**What it shows:**
- Top-selling products ranked by revenue
- Units sold per product
- Revenue per product
- Visual performance bars

**Date Range:** Customizable

**Features:**
- **Ranking**: Products ordered by revenue (#1 = best seller)
- **Visual Bars**: Quick comparison at a glance
- **Gold Highlight**: #1 product highlighted in gold

**Use cases:**
- Identify bestsellers
- Inventory planning
- Marketing focus
- Product discontinuation decisions

---

### 4. **Low Stock Report** ⚠️

**What it shows:**
- Products below reorder point
- Out-of-stock items
- Recommended reorder quantities
- Warehouse-specific stock levels

**Alert Levels:**
- 🔴 **Out of Stock**: 0 units available
- 🟡 **Low Stock**: Below reorder point but not zero

**Use cases:**
- Prevent stockouts
- Purchase order planning
- Inventory optimization
- Supplier management

---

## 🎯 How to Use

### **Generate Reports:**

1. **Select Report Type**
   - Click tab: Inventory / Sales / Performance / Low Stock

2. **Set Date Range** (Sales & Performance only)
   - Choose start date
   - Choose end date
   - Click "Generate Report"

3. **View Results**
   - Reports auto-load on tab change
   - Refresh with "Generate Report" button

---

## 💡 Report Details

### **Inventory Valuation**

**Summary Cards:**
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ $12,500.00       │  │    45            │  │    1,250         │
│ Total Value      │  │ Total Products   │  │ Total Units      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Warehouse Table:**
| Warehouse | Products | Units | Value |
|-----------|----------|-------|-------|
| Main      | 30       | 800   | $8,000|
| Store A   | 15       | 450   | $4,500|

---

### **Sales Summary**

**Date Range Selector:**
- Start: `2025-10-25`
- End: `2025-11-25`
- Button: [Generate Report]

**Metrics Grid:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ $5,230.00   │  │    42       │  │    156      │  │  $124.52    │
│ Revenue     │  │   Orders    │  │ Items Sold  │  │  Avg Value  │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

### **Product Performance**

**Top Products Table:**
| Rank | Product      | Sold | Revenue  | Performance |
|------|--------------|------|----------|-------------|
| 🥇#1 | Blue Widget  | 45   | $1,125   |████████████|
| #2   | Red Gadget   | 30   | $750     |████████    |
| #3   | Green Tool   | 25   | $625     |██████      |

- **Rank**: #1 highlighted in gold
- **Performance Bar**: Visual comparison
- **Auto-sorted**: By revenue (highest first)

---

### **Low Stock Report**

**Alert Table:**
| Product     | Warehouse | Available | Reorder | Status      | Action      |
|-------------|-----------|-----------|---------|-------------|-------------|
| Widget A    | Main      | 0         | 10      | Out of Stock| Order 50    |
| Gadget B    | Store     | 3         | 10      | Low Stock   | Order 50    |

**Color Coding:**
- 🔴 Red: Out of stock (0 units)
- 🟡 Orange: Low stock (below reorder point)
- ✅ Green: No issues

---

## 📊 Best Practices

### **Daily:**
- Check **Low Stock Report** each morning
- Place orders for out-of-stock items

### **Weekly:**
- Review **Product Performance**
- Adjust inventory levels for bestsellers
- Identify slow-moving items

### **Monthly:**
- Generate **Sales Summary**
- Compare to previous months
- Review **Inventory Valuation** for financial reports

### **Quarterly:**
- Deep dive into all reports
- Strategic planning
- Inventory optimization

---

## 🎨 Visual Features

- **Color-Coded Cards**: Each report type has unique colors
- **Progress Bars**: Visual performance comparison
- **Status Badges**: Quick status identification
- **Responsive Layout**: Works on all screen sizes
- **Auto-Refresh**: Data updates when you switch tabs

---

## 🔄 Data Freshness

**Real-Time Data:**
- Inventory Valuation: Live from database
- Low Stock: Current stock levels
- Sales Summary: Updated on order creation
- Product Performance: Updated on order fulfillment

**Refresh:**
- Switch tabs to reload
- Click "Generate Report" with new dates
- Reports auto-load on page visit

---

## 💡 Tips

1. **Compare Periods**: Run Sales Summary for different date ranges to compare
2. **Export Data**: Use browser print (Ctrl/Cmd+P) to save as PDF
3. **Monitor Low Stock Daily**: Prevent stockouts
4. **Track Bestsellers**: Stock more of top performers
5. **Seasonal Planning**: Use date ranges to identify seasonal trends

---

## 🚀 Quick Actions

**To find bestsellers:**
→ Product Performance tab

**To check stock levels:**
→ Low Stock tab

**To see total inventory value:**
→ Inventory Valuation tab

**To track monthly sales:**
→ Sales Summary tab (last 30 days)

---

The Reports module gives you complete visibility into your business performance! 📈
