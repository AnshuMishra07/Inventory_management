from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import (
    InventoryAlert, Product, Warehouse, Inventory, User, AlertStatus
)
from app.schemas.schemas import AlertResponse

router = APIRouter()


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    status_filter: str = None,
    warehouse_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all inventory alerts with optional filtering."""
    query = db.query(InventoryAlert)
    
    if status_filter:
        query = query.filter(InventoryAlert.status == status_filter)
    
    if warehouse_id:
        query = query.filter(InventoryAlert.warehouse_id == warehouse_id)
    
    alerts = query.order_by(InventoryAlert.created_at.desc()).all()
    return alerts


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Acknowledge an alert."""
    alert = db.query(InventoryAlert).filter(InventoryAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.status = AlertStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(alert)
    
    return alert


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resolve an alert."""
    alert = db.query(InventoryAlert).filter(InventoryAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.utcnow()
    alert.resolved_by = current_user.id
    db.commit()
    db.refresh(alert)
    
    return alert


@router.post("/check", status_code=status.HTTP_200_OK)
async def check_inventory_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger inventory alert check (normally runs as scheduled job)."""
    from app.models.models import AlertType
    
    alerts_created = 0
    
    # Get all inventory records
    inventories = db.query(Inventory).join(Product).all()
    
    for inventory in inventories:
        product = inventory.product
        
        # Check for low stock
        if inventory.quantity_on_hand <= product.reorder_point and inventory.quantity_on_hand > 0:
            # Check if active alert already exists
            existing_alert = db.query(InventoryAlert).filter(
                InventoryAlert.product_id == product.id,
                InventoryAlert.warehouse_id == inventory.warehouse_id,
                InventoryAlert.alert_type == AlertType.LOW_STOCK,
                InventoryAlert.status == AlertStatus.ACTIVE
            ).first()
            
            if not existing_alert:
                alert = InventoryAlert(
                    product_id=product.id,
                    warehouse_id=inventory.warehouse_id,
                    alert_type=AlertType.LOW_STOCK,
                    current_quantity=inventory.quantity_on_hand,
                    threshold_quantity=product.reorder_point,
                    message=f"Low stock alert: {product.name} has {inventory.quantity_on_hand} units (reorder point: {product.reorder_point})"
                )
                db.add(alert)
                alerts_created += 1
        
        # Check for out of stock
        elif inventory.quantity_on_hand == 0:
            existing_alert = db.query(InventoryAlert).filter(
                InventoryAlert.product_id == product.id,
                InventoryAlert.warehouse_id == inventory.warehouse_id,
                InventoryAlert.alert_type == AlertType.OUT_OF_STOCK,
                InventoryAlert.status == AlertStatus.ACTIVE
            ).first()
            
            if not existing_alert:
                alert = InventoryAlert(
                    product_id=product.id,
                    warehouse_id=inventory.warehouse_id,
                    alert_type=AlertType.OUT_OF_STOCK,
                    current_quantity=0,
                    threshold_quantity=product.reorder_point,
                    message=f"Out of stock alert: {product.name} is out of stock"
                )
                db.add(alert)
                alerts_created += 1
    
    db.commit()
    
    return {
        "message": f"Alert check completed. {alerts_created} new alerts created.",
        "alerts_created": alerts_created
    }
