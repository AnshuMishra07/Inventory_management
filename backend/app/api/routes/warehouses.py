from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import Warehouse, User
from app.schemas.schemas import WarehouseCreate, WarehouseResponse

router = APIRouter()


@router.get("/", response_model=List[WarehouseResponse])
async def get_warehouses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all warehouses."""
    warehouses = db.query(Warehouse).offset(skip).limit(limit).all()
    return warehouses


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific warehouse by ID."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    return warehouse


@router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    warehouse_data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new warehouse."""
    # Convert warehouse_data to dict and handle empty manager_id
    warehouse_dict = warehouse_data.dict()
    
    # Convert empty string or invalid manager_id to None
    if warehouse_dict.get('manager_id') == '' or warehouse_dict.get('manager_id') == 'manager-1':
        warehouse_dict['manager_id'] = None
    
    # Create warehouse
    db_warehouse = Warehouse(**warehouse_dict)
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    
    return db_warehouse


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a warehouse."""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Warehouse not found"
        )
    
    db.delete(warehouse)
    db.commit()
    
    return None
