"""Audit logging utility for tracking database operations."""
from sqlalchemy.orm import Session
from app.models.models import AuditLog, User
from typing import Optional, Dict, Any
import json


def create_audit_log(
    db: Session,
    user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
):
    """
    Create an audit log entry.
    
    Args:
        db: Database session
        user_id: ID of the user performing the action
        action: Type of action (CREATE, UPDATE, DELETE)
        entity_type: Type of entity being modified (Product, SalesOrder, etc.)
        entity_id: ID of the entity
        old_values: Dictionary of old values (for UPDATE/DELETE)
        new_values: Dictionary of new values (for CREATE/UPDATE)
        ip_address: IP address of the request
    """
    audit_entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_values=json.dumps(old_values) if old_values else None,
        new_values=json.dumps(new_values) if new_values else None,
        ip_address=ip_address
    )
    db.add(audit_entry)
    # Note: Don't commit here - let the calling function handle it


def serialize_model(obj: Any, exclude_fields: list = None) -> Dict[str, Any]:
    """
    Convert SQLAlchemy model to dictionary for audit logging.
    
    Args:
        obj: SQLAlchemy model instance
        exclude_fields: Fields to exclude from serialization
    
    Returns:
        Dictionary representation of the model
    """
    if exclude_fields is None:
        exclude_fields = ['password_hash', 'created_at', 'updated_at']
    
    result = {}
    for column in obj.__table__.columns:
        if column.name not in exclude_fields:
            value = getattr(obj, column.name)
            # Convert datetime to string for JSON serialization
            if hasattr(value, 'isoformat'):
                value = value.isoformat()
            # Convert enums to string
            elif hasattr(value, 'value'):
                value = value.value
            result[column.name] = value
    return result
