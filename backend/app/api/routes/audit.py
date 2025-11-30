"""Audit log API endpoints for viewing audit trail."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import AuditLog, User

router = APIRouter()


@router.get("/")
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit logs with optional filtering.
    
    Filters:
    - entity_type: Type of entity (Product, SalesOrder, Customer, etc.)
    - entity_id: Specific entity ID
    - action: Action type (CREATE, UPDATE, DELETE)
    - user_id: User who performed the action
    - start_date: Filter logs from this date
    - end_date: Filter logs until this date
    """
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query = query.filter(AuditLog.created_at >= start_dt)
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query = query.filter(AuditLog.created_at <= end_dt)
    
    # Order by most recent first
    query = query.order_by(AuditLog.created_at.desc())
    
    logs = query.offset(skip).limit(limit).all()
    
    # Convert to dict for JSON response
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    return result


@router.get("/{log_id}")
async def get_audit_log(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific audit log entry."""
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )
    
    return {
        "id": log.id,
        "user_id": log.user_id,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "old_values": log.old_values,
        "new_values": log.new_values,
        "ip_address": log.ip_address,
        "created_at": log.created_at.isoformat() if log.created_at else None
    }


@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_audit_trail(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete audit trail for a specific entity."""
    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.created_at.asc()).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
    
    return result
