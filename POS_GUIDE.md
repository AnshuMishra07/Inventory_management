# Point of Sale (POS) System - Shopkeeper Guide

## 🛒 Quick Start for Shopkeepers

The POS system lets you scan products with a barcode scanner and quickly create sales orders.

### Access the POS
**URL**: http://localhost:5173/pos

You'll see a **shopping cart-style interface** perfect for retail checkout.

---

## 📱 How to Use (Step-by-Step)

### 1. **Plug in Your USB Barcode Scanner**
   - No setup needed - it works like a keyboard
   - Scanner automatically types the barcode when you scan

### 2. **Start Scanning Products**
   
   **Method 1: Barcode Scanner (Recommended)**
   - Make sure the "Scan Barcode" input field is focused (it auto-focuses)
   - Point scanner at product barcode
   - Pull trigger to scan
   - Product automatically adds to cart!
   - Scanner keeps input focused for next scan

   **Method 2: Manual Entry**
   - Type barcode in the "Scan Barcode" field
   - Click "Search" or press Enter
   - Product adds to cart

### 3. **Review Your Cart**
   
   For each item in cart, you can:
   - **Adjust Quantity**: Change number of units
   - **Add Discount**: Enter dollar amount discount per item
   - **Remove Item**: Click the × button
   - See real-time subtotal for each item

### 4. **Select Customer**
   - Choose customer from dropdown (required)
   - If customer doesn't exist, go to Customers page to add them first

### 5. **Add Tax & Discount (Optional)**
   - **Tax**: Enter tax amount in dollars
   - **Order Discount**: Enter discount for entire order

### 6. **Review Total**
   - See real-time calculation:
     - Subtotal (all items)
     - + Tax
     - - Discount
     - = **TOTAL** (big blue number)

### 7. **Complete Sale**
   - Click **"Complete Sale"** button
   - Order is created instantly
   - Inventory is reserved
   - Cart clears for next customer
   - Success message appears

---

## 💡 Pro Tips for Shopkeepers

### Speed Up Checkout
1. **Keep barcode field focused** - The scanner will work automatically
2. **Scan multiple items** - Just keep scanning, products add to cart
3. **Scan same item twice** - Quantity increases automatically
4. **Use keyboard shortcuts**:
   - Tab to move between fields
   - Enter to search barcode
   - Arrow keys to adjust quantities

### Handle Common Scenarios

**Customer Wants 5 of the Same Item:**
- Scan once
- Change quantity to 5

**Customer Returns an Item:**
- Click × to remove from cart before checkout

**Apply Store-Wide Discount:**
- Use "Order Discount" field

**Product Not Scanning:**
- Manually type the barcode
- Or click "Search"
- Check if product exists in system

**Clear Entire Cart:**
- Click "Clear Cart" button
- Confirm the action

---

## 🎯 Complete Example Workflow

```
SCENARIO: Customer buys 2 widgets and 1 gadget

1. SCAN FIRST ITEM
   → Scan Widget barcode: 123456789
   → ✓ Added: Blue Widget
   → Cart shows: 1x Blue Widget @ $25.00

2. SCAN SECOND WIDGET
   → Scan same barcode again: 123456789
   → Quantity automatically increases to 2

3. SCAN DIFFERENT ITEM
   → Scan Gadget barcode: 987654321
   → ✓ Added: Red Gadget
   → Cart shows both items

4. SELECT CUSTOMER
   → Choose "John Doe" from dropdown

5. ADD TAX
   → Enter $4.50 in Tax field
   → Total updates automatically

6. REVIEW TOTAL
   → Subtotal: $50.00 (2 widgets) + $15.00 (gadget) = $65.00
   → Tax: $4.50
   → Total: $69.50

7. COMPLETE SALE
   → Click "Complete Sale"
   → ✓ Sale completed successfully!
   → Cart clears
   → Ready for next customer
```

---

## 🔧 Troubleshooting

### Scanner Not Working
**Problem**: Barcode doesn't scan  
**Solutions**:
- Make sure barcode input field is focused (click on it)
- Check scanner is plugged in to USB
- Try scanning a different barcode
- Manually type barcode and click Search

### Product Not Found
**Problem**: "Product not found" message  
**Solutions**:
- Check barcode is correct
- Verify product exists in Products page
- Make sure product has barcode set
- Add product to system first

### Can't Complete Sale
**Problem**: Button is disabled  
**Solutions**:
- Cart must have at least 1 item
- Customer must be selected
- Wait for any loading to finish

### Cart Cleared Accidentally
**Problem**: Lost items in cart  
**Solution**:
- Start scanning again
- There's no undo for clearCart

---

## ⚡ Quick Reference Card

```
┌─────────────────────────────────────┐
│        POS QUICK REFERENCE          │
├─────────────────────────────────────┤
│ 1. Scan products (auto-adds to cart)│
│ 2. Adjust quantities if needed      │
│ 3. Select customer                  │
│ 4. Add tax/discount (optional)      │
│ 5. Review total                     │
│ 6. Click "Complete Sale"            │
│ 7. Cart clears - ready for next!   │
└─────────────────────────────────────┘
```

---

## 🎨 Screen Layout

```
┌────────────────────────────────────────────────────┐
│  Point of Sale                                      │
├─────────────────────────┬───────────────────────────┤
│  CART (Left Side)       │  CHECKOUT (Right Side)    │
│                         │                           │
│ ┌─────────────┐        │ ┌──────────────────┐     │
│ │Scan Barcode │        │ │ Customer         │     │
│ └─────────────┘        │ └──────────────────┘     │
│                         │                           │
│ ┌─────────────┐        │ ┌──────────────────┐     │
│ │ Cart Items  │        │ │ Tax              │     │
│ │  • Widget   │        │ └──────────────────┘     │
│ │  • Gadget   │        │                           │
│ └─────────────┘        │ ┌──────────────────┐     │
│                         │ │ Order Discount   │     │
│                         │ └──────────────────┘     │
│                         │                           │
│                         │ ┌──────────────────┐     │
│                         │ │  TOTAL: $69.50   │     │
│                         │ └──────────────────┘     │
│                         │                           │
│                         │ [Complete Sale Button]    │
└─────────────────────────┴───────────────────────────┘
```

---

## 📊 What Happens Behind the Scenes

When you complete a sale:

1. **Sales Order Created**
   - Order number generated (e.g., SO20241125001)
   - Order status: Confirmed
   - Payment status: Unpaid

2. **Inventory Reserved**
   - Stock marked as "reserved"
   - Prevents selling same items twice
   - Available quantity decreases

3. **Transaction Logged**
   - Complete audit trail
   - Who, what, when recorded

4. **Can Be Fulfilled Later**
   - Go to Sales page
   - Click "Fulfill" to complete
   - Inventory permanently deducted

---

## 🚀 Getting Started Today

**First Time Setup:**
1. Add customers (Customers page)
2. Add products with barcodes (Products page)
3. Add inventory (Inventory page)
4. Start using POS!

**Daily Use:**
1. Open http://localhost:5173/pos
2. Start scanning products
3. Complete sales
4. That's it!

The POS system is designed to be **fast, simple, and intuitive** for daily retail operations! 🎉
