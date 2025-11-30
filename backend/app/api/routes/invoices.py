from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import SalesOrder, SalesOrderItem, User
from app.schemas.schemas import InvoiceResponse

router = APIRouter()


@router.get("/{order_id}", response_model=InvoiceResponse)
async def get_invoice(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice details for a sales order"""
    from sqlalchemy.orm import joinedload
    from app.models.models import UserProfile
    
    order = db.query(SalesOrder).options(
        joinedload(SalesOrder.customer),
        joinedload(SalesOrder.items).joinedload(SalesOrderItem.product),
        joinedload(SalesOrder.creator).joinedload(User.profile)
    ).filter(SalesOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get the user who created the order (seller/from)
    creator = order.creator or current_user
    creator_profile = creator.profile if creator else None
    
    # Build invoice response
    invoice_data = {
        "id": order.id,
        "order_number": order.order_number,  # Invoice number = order number
        "order_date": order.order_date,
        "invoice_date": order.invoice_date or order.order_date,
        "due_date": order.due_date,
        "status": order.status,
        "payment_status": order.payment_status,
        "payment_method": order.payment_method,
        
        # Customer billing address (Bill To)
        "customer_name": order.customer.name,
        "billing_name": order.customer.name,
        "billing_street_address": order.customer.address,
        "billing_city": None,  # Customer model doesn't have separate city field
        "billing_state": None,
        "billing_postal_code": None,
        "billing_country": None,
        "billing_phone": order.customer.phone,
        "billing_email": order.customer.email,
        
        # Seller address (From - using logged-in user's info)
        "seller_company_name": creator_profile.company_name if creator_profile else None,
        "seller_full_name": creator.full_name if creator else None,
        "seller_street_address": creator_profile.street_address if creator_profile else None,
        "seller_city": creator_profile.city if creator_profile else None,
        "seller_state": creator_profile.state if creator_profile else None,
        "seller_postal_code": creator_profile.postal_code if creator_profile else None,
        "seller_country": creator_profile.country if creator_profile else None,
        "seller_phone": creator_profile.phone if creator_profile else None,
        "seller_email": creator.email if creator else None,
        "seller_gstin": None,  # Not in user profile
        
        # Order items
        "items": order.items,
        
        # Totals
        "subtotal": order.subtotal,
        "tax_amount": order.tax_amount,
        "discount_amount": order.discount_amount,
        "total_amount": order.total_amount,
        
        # Terms
        "terms_and_conditions": order.terms_and_conditions,
        "notes": order.notes
    }
    
    return invoice_data


@router.get("/{order_id}/pdf")
async def download_invoice_pdf(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate and download PDF invoice using reportlab"""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    from io import BytesIO
    from sqlalchemy.orm import joinedload
    from app.models.models import UserProfile
    
    order = db.query(SalesOrder).options(
        joinedload(SalesOrder.customer),
        joinedload(SalesOrder.items).joinedload(SalesOrderItem.product),
        joinedload(SalesOrder.creator).joinedload(User.profile)
    ).filter(SalesOrder.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get the user who created the order (seller/from)
    creator = order.creator or current_user
    creator_profile = creator.profile if creator else None
    
    # Create PDF buffer
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header - Invoice Title
    p.setFont("Helvetica-Bold", 24)
    p.drawString(50, height - 50, "INVOICE")
    
    # From section - User who created the order (Left side)
    y = height - 90
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "From:")
    y -= 15
    
    if creator:
        p.setFont("Helvetica-Bold", 11)
        p.drawString(50, y, creator.full_name)
        y -= 15
    
    p.setFont("Helvetica", 10)
    if creator_profile and creator_profile.company_name:
        p.drawString(50, y, creator_profile.company_name)
        y -= 12
    
    if creator_profile and creator_profile.street_address:
        p.drawString(50, y, creator_profile.street_address)
        y -= 12
    if creator_profile and creator_profile.city and creator_profile.state:
        p.drawString(50, y, f"{creator_profile.city}, {creator_profile.state} {creator_profile.postal_code or ''}")
        y -= 12
    if creator_profile and creator_profile.phone:
        p.drawString(50, y, f"Phone: {creator_profile.phone}")
        y -= 12
    if creator:
        p.drawString(50, y, f"Email: {creator.email}")
    
    # Invoice details (Right side)
    y = height - 90
    p.setFont("Helvetica-Bold", 10)
    p.drawRightString(width - 50, y, f"Invoice #: {order.order_number}")
    y -= 15
    p.setFont("Helvetica", 10)
    p.drawRightString(width - 50, y, f"Date: {order.order_date.strftime('%Y-%m-%d')}")
    y -= 12
    if order.due_date:
        p.drawRightString(width - 50, y, f"Due Date: {order.due_date.strftime('%Y-%m-%d')}")
        y -= 12
    p.drawRightString(width - 50, y, f"Status: {order.status.value.upper()}")
    
    # Bill To section
    y = height - 220
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Bill To:")
    y -= 15
    p.setFont("Helvetica", 10)
    
    # Customer information
    p.drawString(50, y, order.customer.name)
    y -= 12
    if order.customer.address:
        p.drawString(50, y, order.customer.address)
        y -= 12
    if order.customer.phone:
        p.drawString(50, y, f"Phone: {order.customer.phone}")
        y -= 12
    if order.customer.email:
        p.drawString(50, y, f"Email: {order.customer.email}")
    
    # Items table
    y = height - 320
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, y, "Item")
    p.drawString(280, y, "Qty")
    p.drawString(340, y, "Price")
    p.drawString(400, y, "Tax")
    p.drawString(460, y, "Total")
    
    # Draw line under headers
    y -= 5
    p.line(50, y, width - 50, y)
    y -= 15
    
    # Items
    p.setFont("Helvetica", 9)
    for item in order.items:
        product_name = item.product.name[:40] if item.product else "Unknown"
        p.drawString(50, y, product_name)
        p.drawString(280, y, str(item.quantity))
        p.drawRightString(390, y, f"₹{item.unit_price:.2f}")
        p.drawString(400, y, f"{item.tax_rate}%")
        p.drawRightString(540, y, f"₹{item.line_total:.2f}")
        y -= 12
        
        if y < 150:  # Start new page if running out of space
            p.showPage()
            y = height - 50
    
    # Totals section
    y -= 20
    p.setFont("Helvetica", 10)
    p.drawString(380, y, "Subtotal:")
    p.drawRightString(540, y, f"₹{order.subtotal:.2f}")
    y -= 12
    
    if order.discount_amount > 0:
        p.drawString(380, y, "Discount:")
        p.drawRightString(540, y, f"-₹{order.discount_amount:.2f}")
        y -= 12
    
    p.drawString(380, y, "Tax:")
    p.drawRightString(540, y, f"₹{order.tax_amount:.2f}")
    y -= 15
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(380, y, "Total:")
    p.drawRightString(540, y, f"₹{order.total_amount:.2f}")
    
    # Payment info
    if order.payment_method:
        y -= 25
        p.setFont("Helvetica", 9)
        p.drawString(50, y, f"Payment Method: {order.payment_method}")
    
    # Terms and conditions
    if order.terms_and_conditions:
        y -= 40
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "Terms & Conditions:")
        y -= 12
        p.setFont("Helvetica", 8)
        # Wrap text if needed
        terms_lines = order.terms_and_conditions.split('\n')
        for line in terms_lines[:5]:  # Limit to 5 lines
            p.drawString(50, y, line[:100])
            y -= 10
    
    # Footer
    p.setFont("Helvetica-Oblique", 8)
    p.drawCentredString(width / 2, 30, "Thank you for your business!")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{order.order_number}.pdf"}
    )
