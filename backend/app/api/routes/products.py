from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.audit import create_audit_log, serialize_model
from app.models.models import Product, User, Category, Inventory
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all products with optional filtering."""
    query = db.query(Product)
    
    if search:
        query = query.filter(
            (Product.name.contains(search)) |
            (Product.sku.contains(search)) |
            (Product.barcode.contains(search))
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/low-stock", response_model=List[dict])
async def get_low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get products below reorder point."""
    products = db.query(Product).join(Inventory).filter(
        Inventory.quantity_on_hand <= Product.reorder_point
    ).all()
    
    result = []
    for product in products:
        inventories = db.query(Inventory).filter(Inventory.product_id == product.id).all()
        total_qty = sum(inv.quantity_on_hand for inv in inventories)
        result.append({
            "product": product,
            "total_quantity": total_qty,
            "reorder_point": product.reorder_point
        })
    
    return result


@router.get("/search", response_model=List[ProductResponse])
async def search_products(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search products by name, SKU, or barcode."""
    products = db.query(Product).filter(
        (Product.name.contains(q)) |
        (Product.sku.contains(q)) |
        (Product.barcode == q)
    ).limit(20).all()
    
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new product."""
    # Check if SKU already exists
    existing_product = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this SKU already exists"
        )
    
    # Check if barcode already exists (if provided)
    if product_data.barcode:
        existing_barcode = db.query(Product).filter(Product.barcode == product_data.barcode).first()
        if existing_barcode:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this barcode already exists"
            )
    
    # Convert product_data to dict and handle empty strings for foreign keys
    product_dict = product_data.dict()
    
    # Convert empty strings to None for optional foreign key fields
    if product_dict.get('category_id') == '':
        product_dict['category_id'] = None
    if product_dict.get('supplier_id') == '':
        product_dict['supplier_id'] = None
    if product_dict.get('barcode') == '':
        product_dict['barcode'] = None
    
    # Create product
    db_product = Product(**product_dict, created_by=current_user.id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Product",
        entity_id=db_product.id,
        new_values=serialize_model(db_product)
    )
    db.commit()
    
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check barcode uniqueness if updating
    if product_data.barcode and product_data.barcode != product.barcode:
        existing_barcode = db.query(Product).filter(
            Product.barcode == product_data.barcode,
            Product.id != product_id
        ).first()
        if existing_barcode:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this barcode already exists"
            )
    
    # Store old values for audit
    old_values = serialize_model(product)
    
    # Update fields
    update_data = product_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Product",
        entity_id=product.id,
        old_values=old_values,
        new_values=serialize_model(product)
    )
    db.commit()
    
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Store old values for audit
    old_values = serialize_model(product)
    
    try:
        db.delete(product)
        
        # Audit log
        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="DELETE",
            entity_type="Product",
            entity_id=product_id,
            old_values=old_values
        )
        
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product because it particular referenced in inventory, sales, or purchase orders."
        )
    
    return None
