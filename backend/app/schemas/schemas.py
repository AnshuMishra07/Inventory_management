from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    STAFF = "staff"


class TransactionTypeEnum(str, Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    RETURN = "return"


class OrderStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatusEnum(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class AlertTypeEnum(str, Enum):
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"


class AlertStatusEnum(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRoleEnum = UserRoleEnum.STAFF


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[UserRoleEnum] = None
    is_active: Optional[bool] = None


# User Profile Schemas (defined BEFORE UserResponse)
class UserProfileBase(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"
    company_name: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# UserResponse now uses UserProfileResponse (defined above)
class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    profile: Optional[UserProfileResponse] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# Public Registration Schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    username: Optional[str] = None
    phone: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"


# Product Schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    unit_of_measure: Optional[str] = None
    reorder_point: int = 0
    reorder_quantity: int = 0
    cost_price: float = 0.0
    selling_price: float = 0.0
    tax_rate: float = 18.0  # GST percentage
    is_tax_inclusive: bool = False  # Tax-inclusive pricing
    supplier_id: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[str] = None
    unit_of_measure: Optional[str] = None
    reorder_point: Optional[int] = None
    reorder_quantity: Optional[int] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    tax_rate: Optional[float] = None
    is_tax_inclusive: Optional[bool] = None
    supplier_id: Optional[str] = None


class ProductResponse(ProductBase):
    id: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Inventory Schemas
class InventoryBase(BaseModel):
    product_id: str
    warehouse_id: str
    quantity_on_hand: int = 0
    quantity_reserved: int = 0


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    quantity_on_hand: Optional[int] = None
    quantity_reserved: Optional[int] = None


class InventoryResponse(InventoryBase):
    id: str
    product_name: str
    product_sku: str
    warehouse_name: str
    last_counted_at: Optional[datetime] = None
    last_updated_at: datetime

    class Config:
        from_attributes = True


class InventoryAdjustment(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: int
    notes: Optional[str] = None


# Category Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_category_id: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: float = 0.0


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_limit: Optional[float] = None


class CustomerResponse(CustomerBase):
    id: str
    customer_number: str
    outstanding_balance: float
    created_at: datetime

    class Config:
        from_attributes = True


# Sales Order Schemas
class SalesOrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    discount: float = 0.0
    tax_rate: float = 18.0  # GST percentage
    tax_amount: float = 0.0  # Calculated tax


class SalesOrderItemResponse(SalesOrderItemCreate):
    id: str
    sales_order_id: str
    line_total: float

    class Config:
        from_attributes = True


# Billing and Seller Address Schemas
class BillingAddress(BaseModel):
    """Customer billing address"""
    billing_name: str
    billing_email: Optional[EmailStr] = None
    billing_phone: Optional[str] = None
    billing_street_address: str
    billing_city: str
    billing_state: str
    billing_postal_code: str
    billing_country: str = "India"


class SellerAddress(BaseModel):
    """Seller/Company address for invoice"""
    seller_company_name: str
    seller_street_address: str
    seller_city: str
    seller_state: str
    seller_postal_code: str
    seller_country: str = "India"
    seller_phone: Optional[str] = None
    seller_email: Optional[EmailStr] = None
    seller_gstin: Optional[str] = None  # GST Identification Number


class SalesOrderCreate(BaseModel):
    customer_id: str
    warehouse_id: str
    items: List[SalesOrderItemCreate]
    billing_address: Optional[BillingAddress] = None  # NEW
    seller_address: Optional[SellerAddress] = None  # NEW
    payment_method: Optional[str] = None  # NEW
    due_date: Optional[datetime] = None  # NEW
    notes: Optional[str] = None
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    shipping_cost: float = 0.0
    payment_status: Optional[PaymentStatusEnum] = PaymentStatusEnum.UNPAID


class SalesOrderUpdate(BaseModel):
    status: Optional[OrderStatusEnum] = None
    payment_status: Optional[PaymentStatusEnum] = None
    notes: Optional[str] = None


class SalesOrderResponse(BaseModel):
    id: str
    order_number: str
    customer_id: str
    customer_name: Optional[str] = None
    warehouse_id: str
    order_date: datetime
    status: OrderStatusEnum
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_status: PaymentStatusEnum
    items: List[SalesOrderItemResponse] = []

    class Config:
        from_attributes = True


# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_terms: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    product_id: str
    warehouse_id: str
    alert_type: AlertTypeEnum
    current_quantity: int
    threshold_quantity: int
    message: str
    status: AlertStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# Report Schemas
class InventoryValueReport(BaseModel):
    warehouse_id: str
    warehouse_name: str
    total_products: int
    total_quantity: int
    total_value: float


class SalesSummaryReport(BaseModel):
    total_orders: int
    total_revenue: float
    total_items_sold: int
    average_order_value: float


class ProductPerformance(BaseModel):
    product_id: str
    product_name: str
    total_sold: int
    total_revenue: float


# Invoice Schema
class InvoiceResponse(BaseModel):
    """Complete invoice data for PDF generation and display"""
    # Order details
    id: str
    order_number: str  # This IS the invoice number
    order_date: datetime
    invoice_date: Optional[datetime]
    due_date: Optional[datetime]
    status: OrderStatusEnum
    payment_status: PaymentStatusEnum
    payment_method: Optional[str]
    
    # Customer billing address
    customer_name: str
    billing_name: Optional[str]
    billing_street_address: Optional[str]
    billing_city: Optional[str]
    billing_state: Optional[str]
    billing_postal_code: Optional[str]
    billing_country: Optional[str]
    billing_phone: Optional[str]
    billing_email: Optional[str]
    
    # Seller address
    seller_company_name: Optional[str]
    seller_full_name: Optional[str]
    seller_street_address: Optional[str]
    seller_city: Optional[str]
    seller_state: Optional[str]
    seller_postal_code: Optional[str]
    seller_country: Optional[str]
    seller_phone: Optional[str]
    seller_email: Optional[str]
    seller_gstin: Optional[str]
    
    # Order items
    items: List[SalesOrderItemResponse]
    
    # Totals
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    
    # Terms
    terms_and_conditions: Optional[str]
    notes: Optional[str]
    
    class Config:
        from_attributes = True
