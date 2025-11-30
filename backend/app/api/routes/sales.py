from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.audit import create_audit_log, serialize_model
from app.models.models import (
    SalesOrder, SalesOrderItem, Customer, Product, Inventory,
    User, InventoryTransaction, TransactionType, OrderStatus
)
from app.schemas.schemas import (
    SalesOrderCreate,
    SalesOrderResponse,
    SalesOrderUpdate
)

router = APIRouter()


def generate_order_number(db: Session) -> str:
    """Generate unique order number."""
    from datetime import datetime
    prefix = "SO"
    timestamp = datetime.now().strftime("%Y%m%d")
    count = db.query(SalesOrder).filter(
        SalesOrder.order_number.like(f"{prefix}{timestamp}%")
    ).count()
    return f"{prefix}{timestamp}{count + 1:04d}"


@router.get("/", response_model=List[SalesOrderResponse])
async def get_sales_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    customer_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all sales orders with optional filtering."""
    from sqlalchemy.orm import joinedload
    
    query = db.query(SalesOrder).options(joinedload(SalesOrder.customer))
    
    if status_filter:
        query = query.filter(SalesOrder.status == status_filter)
    
    if customer_id:
        query = query.filter(SalesOrder.customer_id == customer_id)
    
    orders = query.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add customer_name to each order
    result = []
    for order in orders:
        order_dict = {
            **{c.name: getattr(order, c.name) for c in order.__table__.columns},
            'customer_name': order.customer.name if order.customer else 'Unknown',
            'items': order.items
        }
        result.append(order_dict)
    
    return result


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific sales order by ID."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )
    return order


@router.post("/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    order_data: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new sales order."""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Verify    # Calculate subtotal and create order items
    order_items = []
    subtotal = 0
    total_tax = 0  # Track total tax from all items
    
    for item_data in order_data.items:
        # Fetch product to get tax rate
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found"
            )
        
        # Check inventory availability
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item_data.product_id,
            Inventory.warehouse_id == order_data.warehouse_id
        ).first()
        
        available_qty = (inventory.quantity_on_hand - inventory.quantity_reserved) if inventory else 0
        if available_qty < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product {product.name}"
            )

        # Use product's tax rate if not provided in item
        tax_rate = item_data.tax_rate if hasattr(item_data, 'tax_rate') and item_data.tax_rate is not None else product.tax_rate
        
        # Calculate item subtotal (after discount)
        item_subtotal = (item_data.quantity * item_data.unit_price) - item_data.discount
        
        # Calculate tax for this item
        tax_amount = item_subtotal * (tax_rate / 100)
        
        # Line total includes tax
        line_total = item_subtotal + tax_amount
        
        order_item = SalesOrderItem(
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount=item_data.discount,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            line_total=line_total
        )
        order_items.append(order_item)
        
        subtotal += item_subtotal
        total_tax += tax_amount
    
    # Calculate total (subtotal + order-level tax + order-level discount)
    # Note: total_tax from items is separate from order_data.tax_amount
    # order_data.tax_amount can be used for manual adjustment if needed
    total = subtotal + total_tax + order_data.tax_amount - order_data.discount_amount
    
    # Generate order number
    order_number = f"SO-{datetime.now().strftime('%Y%m%d')}-{db.query(SalesOrder).count() + 1:05d}"
    
    # Process billing address (from order_data or fallback to customer)
    billing_data = {}
    if order_data.billing_address:
        billing_data = {
            'billing_name': order_data.billing_address.billing_name,
            'billing_email': order_data.billing_address.billing_email,
            'billing_phone': order_data.billing_address.billing_phone,
            'billing_street_address': order_data.billing_address.billing_street_address,
            'billing_city': order_data.billing_address.billing_city,
            'billing_state': order_data.billing_address.billing_state,
            'billing_postal_code': order_data.billing_address.billing_postal_code,
            'billing_country': order_data.billing_address.billing_country
        }
    else:
        # Fallback to customer details if no billing address provided
        billing_data = {
            'billing_name': customer.name,
            'billing_email': customer.email,
            'billing_phone': customer.phone,
            'billing_street_address': customer.address,
            'billing_city': None,
            'billing_state': None,
            'billing_postal_code': None,
            'billing_country': 'India'
        }
    
    # Process seller address
    seller_data = {}
    if order_data.seller_address:
        seller_data = {
            'seller_company_name': order_data.seller_address.seller_company_name,
            'seller_street_address': order_data.seller_address.seller_street_address,
            'seller_city': order_data.seller_address.seller_city,
            'seller_state': order_data.seller_address.seller_state,
            'seller_postal_code': order_data.seller_address.seller_postal_code,
            'seller_country': order_data.seller_address.seller_country,
            'seller_phone': order_data.seller_address.seller_phone,
            'seller_email': order_data.seller_address.seller_email,
            'seller_gstin': order_data.seller_address.seller_gstin
        }
    
    # Create sales order with all data
    sales_order = SalesOrder(
        order_number=order_number,
        customer_id=order_data.customer_id,
        warehouse_id=order_data.warehouse_id,
        subtotal=subtotal,
        tax_amount=total_tax + order_data.tax_amount,  # Item taxes + manual adjustment
        discount_amount=order_data.discount_amount,
        total_amount=total,
        notes=order_data.notes,
        created_by=current_user.id,
        payment_status=order_data.payment_status,
        # Billing address
        **billing_data,
        # Seller address
        **seller_data,
        # Invoice fields
        invoice_date=datetime.now(),
        due_date=order_data.due_date,
        payment_method=order_data.payment_method
    )    
    db.add(sales_order)
    db.flush()  # Get the order ID
    
    # Add order items (already created above) and reserve inventory
    for order_item in order_items:
        order_item.sales_order_id = sales_order.id
        db.add(order_item)
        
        # Reserve inventory
        inventory = db.query(Inventory).filter(
            Inventory.product_id == order_item.product_id,
            Inventory.warehouse_id == order_data.warehouse_id
        ).first()
        
        if inventory:
            inventory.quantity_reserved += order_item.quantity
    
    db.commit()
    db.refresh(sales_order)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="SalesOrder",
        entity_id=sales_order.id,
        new_values=serialize_model(sales_order)
    )
    db.commit()
    
    return sales_order


@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(
    order_id: str,
    order_data: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a sales order status."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )
    
    # Update fields
    update_data = order_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)
    
    return order


@router.post("/{order_id}/fulfill", status_code=status.HTTP_200_OK)
async def fulfill_sales_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fulfill a sales order (deduct inventory and mark as delivered)."""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )
    
    if order.status == OrderStatus.DELIVERED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already fulfilled"
        )
    
    # Process each item
    for item in order.items:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id,
            Inventory.warehouse_id == order.warehouse_id
        ).first()
        
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Inventory record not found for product {item.product_id}"
            )
        
        # Deduct from inventory
        inventory.quantity_reserved -= item.quantity
        inventory.quantity_on_hand -= item.quantity
        inventory.updated_by = current_user.id
        
        # Create transaction
        transaction = InventoryTransaction(
            product_id=item.product_id,
            warehouse_id=order.warehouse_id,
            transaction_type=TransactionType.SALE,
            quantity=-item.quantity,
            reference_id=order.id,
            notes=f"Sales order {order.order_number}",
            created_by=current_user.id
        )
        db.add(transaction)
    
    # Update order status
    order.status = OrderStatus.DELIVERED
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="FULFILL",
        entity_type="SalesOrder",
        entity_id=order.id,
        new_values={"status": "delivered", "fulfilled_by": current_user.id}
    )
    
    db.commit()
    
    return {"message": "Sales order fulfilled successfully", "order": order}
