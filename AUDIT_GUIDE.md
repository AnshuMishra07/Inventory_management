# Audit Logging System - User Guide

## 🔍 Overview

The Audit Logging System automatically tracks all create, update, and delete operations for comprehensive traceability and compliance.

**Automatically Audited Entities:**
- Products
- Sales Orders  
- Customers
- Inventory (coming soon)

---

## 📋 What Gets Logged

### **For Each Operation:**
- **User ID**: Who performed the action
- **Action Type**: CREATE, UPDATE, DELETE, FULFILL
- **Entity Type**: What was modified (Product, SalesOrder, Customer)
- **Entity ID**: Specific record ID
- **Old Values**: State before change (UPDATE/DELETE)
- **New Values**: State after change (CREATE/UPDATE)
- **Timestamp**: When the action occurred
- **IP Address**: Where the request came from (if available)

---

## 🎯 Audit Actions Tracked

### **CREATE**
- Product creation
- Sales order creation
- Customer creation
- Records: new_values only

### **UPDATE**
- Product edits
- Customer information updates
- Records: old_values + new_values

### **DELETE**
- Product deletion
- Customer deletion
- Records: old_values only

### **FULFILL**
- Sales order fulfillment
- Records: status change

---

## 🔌 API Endpoints

### **Get All Audit Logs**
```
GET /api/audit/
```

**Query Parameters:**
- `skip`: Pagination offset (default: 0)
- `limit`: Max results (default: 100, max: 1000)
- `entity_type`: Filter by entity (Product, SalesOrder, Customer)
- `entity_id`: Filter by specific record ID
- `action`: Filter by action type (CREATE, UPDATE, DELETE)
- `user_id`: Filter by user who performed action
- `start_date`: From date (ISO format: 2025-11-25)
- `end_date`: Until date (ISO format: 2025-11-25)

**Example:**
```bash
GET /api/audit/?entity_type=Product&action=DELETE&limit=50
```

**Response:**
```json
[
  {
    "id": "audit-log-id",
    "user_id": "user-id",
    "action": "DELETE",
    "entity_type": "Product",
    "entity_id": "product-id",
    "old_values": "{\"name\": \"Widget\", \"sku\": \"W123\"}",
    "new_values": null,
    "ip_address": "192.168.1.1",
    "created_at": "2025-11-25T18:20:00"
  }
]
```

### **Get Specific Audit Log**
```
GET /api/audit/{log_id}
```

**Example:**
```bash
GET /api/audit/abc-123-def-456
```

### **Get Entity Audit Trail**
```
GET /api/audit/entity/{entity_type}/{entity_id}
```

**Example:**
```bash
GET /api/audit/entity/Product/product-123
```

**Returns:** Complete history of a specific record in chronological order

---

## 💡 Use Cases

### **1. Compliance & Auditing**
- Track who changed what and when
- Demonstrate data integrity
- Meet regulatory requirements

### **2. Debugging**
- Find when a record was deleted
- See who made problematic changes
- Trace data corruption issues

### **3. Security**
- Identify unauthorized access
- Monitor suspicious activity
- Track IP addresses

### **4. Data Recovery**
- View old values before deletion
- Restore accidentally deleted data
- Rollback bad changes

### **5. User Activity Monitoring**
- See what each user is doing
- Track user productivity
- Identify training needs

---

## 📊 Example Queries

### **Find all deletions today:**
```bash
GET /api/audit/?action=DELETE&start_date=2025-11-25
```

### **Track a specific product's history:**
```bash
GET /api/audit/entity/Product/abc-123
```

### **See what a user did:**
```bash
GET /api/audit/?user_id=user-456&limit=100
```

### **Find all sales order creations:**
```bash
GET /api/audit/?entity_type=SalesOrder&action=CREATE
```

### **Audit trail for last week:**
```bash
GET /api/audit/?start_date=2025-11-18&end_date=2025-11-25
```

---

## 🔐 Data Format

### **Old Values & New Values**
Stored as JSON strings containing:
```json
{
  "id": "record-id",
  "name": "Product Name",
  "sku": "SKU123",
  "selling_price": 99.99,
  "cost_price": 50.00
}
```

**Excluded Fields** (for privacy/security):
- `password_hash`
- `created_at`
- `updated_at`

---

## 🎨 Frontend Integration (Future)

**Planned Features:**
- Audit log viewer page
- Entity-specific history tabs
- Visual diff for changes
- Filter and search UI
- Export to CSV/PDF
- Real-time notifications

---

## ⚙️ Technical Details

### **Automatic Logging**
- Triggered on every CREATE/UPDATE/DELETE
- Runs within same database transaction
- Minimal performance impact
- JSON serialization of model data

### **Storage**
- `audit_logs` table in database
- Indexed by entity_type and created_at
- Unlimited retention (configure as needed)

### **Performance**
- Async operations
- Efficient queries with indexes
- Pagination for large result sets

---

## 🚀 Best Practices

1. **Regular Review**: Check audit logs weekly
2. **Long-term Archival**: Export old logs monthly
3. **Access Control**: Only admins should view audit logs
4. **Compliance**: Use for SOC 2, HIPAA,GDPR compliance
5. **Incident Response**: First place to check during issues

---

## 📝 Future Enhancements

- **Inventory Adjustments**: Track all inventory changes
- **Bulk Operations**: Log import/export actions
- **IP Address Capture**: Enable via middleware
- **Retention Policies**: Auto-archive old logs
- **Frontend Dashboard**: Visual audit trail viewer
- **Alerts**: Notify on suspicious patterns
- **Restoration**: One-click rollback feature

---

Your complete audit trail is now active! Every operation is being tracked. 🔍
