from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.audit import create_audit_log, serialize_model
from app.models.models import Customer, User
from app.schemas.schemas import CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()


def generate_customer_number(db: Session) -> str:
    """Generate unique customer number."""
    from datetime import datetime
    prefix = "CUS"
    timestamp = datetime.now().strftime("%Y%m")
    count = db.query(Customer).filter(
        Customer.customer_number.like(f"{prefix}{timestamp}%")
    ).count()
    return f"{prefix}{timestamp}{count + 1:05d}"


@router.get("/", response_model=List[CustomerResponse])
async def get_customers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all customers."""
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new customer."""
    # Generate customer number
    customer_number = generate_customer_number(db)
    
    # Create customer
    db_customer = Customer(
        **customer_data.dict(),
        customer_number=customer_number
    )
    
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Customer",
        entity_id=db_customer.id,
        new_values=serialize_model(db_customer)
    )
    db.commit()
    
    return db_customer


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Store old values for audit
    old_values = serialize_model(customer)
    
    # Update fields
    update_data = customer_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    db.commit()
    db.refresh(customer)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="Customer",
        entity_id=customer.id,
        old_values=old_values,
        new_values=serialize_model(customer)
    )
    db.commit()
    
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Store old values for audit
    old_values = serialize_model(customer)
    
    db.delete(customer)
    
    # Audit log
    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="Customer",
        entity_id=customer_id,
        old_values=old_values
    )
    
    db.commit()
    
    return None
