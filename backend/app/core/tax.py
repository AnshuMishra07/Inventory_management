"""Tax calculation utilities for sales orders."""


def calculate_item_tax(quantity: int, unit_price: float, discount: float, tax_rate: float) -> tuple[float, float, float]:
    """
    Calculate tax for a sales order item.
    
    Args:
        quantity: Number of items
        unit_price: Price per item
        discount: Discount amount for the item
        tax_rate: GST percentage (e.g., 18.0 for 18%)
    
    Returns:
        Tuple of (item_subtotal, tax_amount, line_total)
    """
    item_subtotal = (quantity * unit_price) - discount
    tax_amount = item_subtotal * (tax_rate / 100)
    line_total = item_subtotal + tax_amount
    
    return item_subtotal, tax_amount, line_total


def calculate_gst_breakdown(items: list) -> dict:
    """
    Calculate GST breakdown by tax rate.
    
    Args:
        items: List of sales order items with tax_rate and tax_amount
    
    Returns:
        Dict with tax rate as key and total tax for that rate
    """
    breakdown = {}
    for item in items:
        tax_rate = item.tax_rate
        if tax_rate not in breakdown:
            breakdown[tax_rate] = {
                'rate': tax_rate,
                'subtotal': 0,
                'tax_amount': 0
            }
        
        item_subtotal = (item.quantity * item.unit_price) - item.discount
        breakdown[tax_rate]['subtotal'] += item_subtotal
        breakdown[tax_rate]['tax_amount'] += item.tax_amount
    
    return breakdown
