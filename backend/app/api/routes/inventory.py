from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import Inventory, Product, Warehouse, User, InventoryTransaction, TransactionType
from app.schemas.schemas import (
    InventoryResponse,
    InventoryCreate,
    InventoryUpdate,
    InventoryAdjustment
)

router = APIRouter()


@router.get("/", response_model=List[InventoryResponse])
async def get_inventory(
    warehouse_id: str = None,
    product_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory levels with optional filtering."""
    from sqlalchemy.orm import joinedload
    
    query = db.query(Inventory).options(
        joinedload(Inventory.product),
        joinedload(Inventory.warehouse)
    )
    
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    
    if product_id:
        query = query.filter(Inventory.product_id == product_id)
    
    inventory_items = query.all()
    
    # Build response with product and warehouse names
    result = []
    for item in inventory_items:
        item_dict = {
            **{c.name: getattr(item, c.name) for c in item.__table__.columns},
            'product_name': item.product.name if item.product else 'Unknown',
            'product_sku': item.product.sku if item.product else 'N/A',
            'product_cost_price': item.product.cost_price if item.product else 0.0,
            'product_selling_price': item.product.selling_price if item.product else 0.0,
            'warehouse_name': item.warehouse.name if item.warehouse else 'Unknown'
        }
        result.append(item_dict)
    
    return result


@router.get("/product/{product_id}/warehouses", response_model=List[InventoryResponse])
async def get_product_inventory_by_warehouse(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory levels for a specific product across all warehouses."""
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).all()
    return inventory


@router.post("/adjust", status_code=status.HTTP_200_OK)
async def adjust_inventory(
    adjustment: InventoryAdjustment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adjust inventory quantity (add or remove stock)."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == adjustment.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify warehouse exists
    warehouse = db.query(Warehouse).filter(Warehouse.id == adjustment.warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    
    # Get or create inventory record
    inventory = db.query(Inventory).filter(
        Inventory.product_id == adjustment.product_id,
        Inventory.warehouse_id == adjustment.warehouse_id
    ).first()
    
    if not inventory:
        inventory = Inventory(
            product_id=adjustment.product_id,
            warehouse_id=adjustment.warehouse_id,
            quantity_on_hand=0,
            quantity_reserved=0
        )
        db.add(inventory)
    
    # Update quantity
    new_quantity = inventory.quantity_on_hand + adjustment.quantity
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock for this adjustment"
        )
    
    inventory.quantity_on_hand = new_quantity
    inventory.updated_by = current_user.id
    
    # Create transaction record
    transaction = InventoryTransaction(
        product_id=adjustment.product_id,
        warehouse_id=adjustment.warehouse_id,
        transaction_type=TransactionType.ADJUSTMENT,
        quantity=adjustment.quantity,
        notes=adjustment.notes,
        created_by=current_user.id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "message": "Inventory adjusted successfully",
        "inventory": inventory
    }


@router.put("/{inventory_id}", status_code=status.HTTP_200_OK)
async def update_inventory(
    inventory_id: str,
    inventory_data: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update inventory record."""
    from app.core.audit import create_audit_log, serialize_model
    
    #Get inventory record
    inventory = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not inventory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory record not found"
        )
    
    # Store old values for audit
    old_values = serialize_model(inventory)
    
    # Update fields
    update_data = inventory_data.dict(exclude_unset=True)
    
    # Validate quantities
    for field, value in update_data.items():
        if value is not None and value < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field} cannot be negative"
            )
        setattr(inventory, field, value)
    
    inventory.updated_by = current_user.id
    
    db.commit()
    db.refresh(inventory)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Inventory",
        entity_id=inventory.id,
        old_values=old_values,
        new_values=serialize_model(inventory)
    )
    db.commit()
    
    return {
        "message": "Inventory updated successfully",
        "inventory": inventory
    }


@router.post("/transfer", status_code=status.HTTP_200_OK)
async def transfer_inventory(
    product_id: str,
    from_warehouse_id: str,
    to_warehouse_id: str,
    quantity: int,
    notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transfer inventory between warehouses."""
    if from_warehouse_id == to_warehouse_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to the same warehouse"
        )
    
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be positive"
        )
    
    # Get source inventory
    source_inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == from_warehouse_id
    ).first()
    
    if not source_inventory or source_inventory.quantity_on_hand < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock in source warehouse"
        )
    
    # Get or create destination inventory
    dest_inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == to_warehouse_id
    ).first()
    
    if not dest_inventory:
        dest_inventory = Inventory(
            product_id=product_id,
            warehouse_id=to_warehouse_id,
            quantity_on_hand=0,
            quantity_reserved=0
        )
        db.add(dest_inventory)
    
    # Perform transfer
    source_inventory.quantity_on_hand -= quantity
    source_inventory.updated_by = current_user.id
    
    dest_inventory.quantity_on_hand += quantity
    dest_inventory.updated_by = current_user.id
    
    # Create transaction records
    from_transaction = InventoryTransaction(
        product_id=product_id,
        warehouse_id=from_warehouse_id,
        transaction_type=TransactionType.TRANSFER,
        quantity=-quantity,
        notes=f"Transfer to warehouse {to_warehouse_id}. {notes or ''}",
        created_by=current_user.id
    )
    
    to_transaction = InventoryTransaction(
        product_id=product_id,
        warehouse_id=to_warehouse_id,
        transaction_type=TransactionType.TRANSFER,
        quantity=quantity,
        notes=f"Transfer from warehouse {from_warehouse_id}. {notes or ''}",
        created_by=current_user.id
    )
    
    db.add(from_transaction)
    db.add(to_transaction)
    db.commit()
    
    return {"message": "Inventory transferred successfully"}


@router.get("/transactions", response_model=List[dict])
async def get_transactions(
    product_id: str = None,
    warehouse_id: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get inventory transaction history."""
    query = db.query(InventoryTransaction)
    
    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)
    
    if warehouse_id:
        query = query.filter(InventoryTransaction.warehouse_id == warehouse_id)
    
    transactions = query.order_by(InventoryTransaction.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": t.id,
            "product_id": t.product_id,
            "warehouse_id": t.warehouse_id,
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "notes": t.notes,
            "created_at": t.created_at,
            "created_by": t.created_by
        }
        for t in transactions
    ]
