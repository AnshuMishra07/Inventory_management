# GST Debugging Checklist

## Issue
User cannot see GST calculation on POS checkout page

## Possible Causes
1. Products don't have tax_rate field populated
2. Products API not returning tax_rate
3. POS not fetching products with tax_rate
4. Display logic issue

## Steps to Debug
1. ✓ Check if migration added tax_rate to products
2. Check if existing products have tax_rate value
3. Check API response includes tax_rate
4. Verify POS displays tax_rate

## Quick Fix
- Ensure all products have default 18% tax_rate
- Verify product API returns tax_rate field
- Check console for data
