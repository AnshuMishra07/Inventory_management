import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, customersAPI, salesAPI, default as api } from '../lib/api';

interface CartItem {
    product_id: string;
    product_name: string;
    sku: string;
    barcode: string;
    unit_price: number;
    quantity: number;
    discount: number;
    tax_rate?: number;  // GST percentage for this item
}

const POSPage: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [barcode, setBarcode] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [discount, setDiscount] = useState(0);
    const [autoFulfill, setAutoFulfill] = useState(true); // Default to auto-fulfill
    const [markAsPaid, setMarkAsPaid] = useState(true); // Default to mark as paid
    const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCustomers();
        fetchWarehouses();
        // Auto-focus barcode input
        barcodeInputRef.current?.focus();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await customersAPI.getAll();
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

    const fetchWarehouses = async () => {
        try {
            // Import warehousesAPI dynamically if not in imports, or assumes it's available
            const response = await api.get('/warehouses');
            setWarehouses(response.data);
            if (response.data.length > 0) {
                setWarehouseId(response.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch warehouses:', error);
        }
    };

    const handleBarcodeScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        setMessage('Searching...');

        try {
            // Search product by barcode
            const response = await productsAPI.search(barcode);

            if (response.data && response.data.length > 0) {
                const product = response.data[0];
                addToCart(product);
                setMessage(`✓ Added: ₹{product.name}`);
            } else {
                setMessage('❌ Product not found');
            }
        } catch (error) {
            console.error('Error searching product:', error);
            setMessage('❌ Error searching product');
        } finally {
            setBarcode('');
            setTimeout(() => setMessage(''), 3000);
            barcodeInputRef.current?.focus();
        }
    };

    const addToCart = (product: any) => {
        const existingItem = cart.find(item => item.product_id === product.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            const taxRate = product.tax_rate !== undefined && product.tax_rate !== null ? product.tax_rate : 18.0;

            setCart([...cart, {
                product_id: product.id,
                product_name: product.name,
                sku: product.sku,
                barcode: product.barcode || '',
                quantity: 1,
                unit_price: product.selling_price,
                discount: 0,
                tax_rate: taxRate  // Use product's GST rate
            }]);
        }
    };

    const updateQuantity = (index: number, quantity: number) => {
        if (quantity < 1) return;
        const newCart = [...cart];
        newCart[index].quantity = quantity;
        setCart(newCart);
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        // Subtotal is before tax
        return cart.reduce((sum, item) => {
            const itemSubtotal = (item.quantity * item.unit_price) - item.discount;
            return sum + itemSubtotal;
        }, 0);
    };

    const calculateTax = () => {
        // Calculate total GST from all items
        return cart.reduce((sum, item) => {
            const itemSubtotal = (item.quantity * item.unit_price) - item.discount;
            const itemTax = itemSubtotal * ((item.tax_rate || 18) / 100);
            return sum + itemTax;
        }, 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax() - discount;
    };

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            alert('Please select a customer');
            return;
        }

        if (cart.length === 0) {
            alert('Cart is empty');
            return;
        }

        setLoading(true);
        try {
            // Prepare order items with tax calculations
            const items = cart.map(item => {
                const itemSubtotal = (item.quantity * item.unit_price) - item.discount;
                const tax_amount = itemSubtotal * ((item.tax_rate || 18) / 100);

                return {
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    discount: item.discount,
                    tax_rate: item.tax_rate || 18.0,
                    tax_amount: tax_amount
                };
            });

            const orderData = {
                customer_id: selectedCustomer,
                warehouse_id: warehouseId,
                items: items,
                tax_amount: 0,  // Individual item taxes are already calculated
                discount_amount: discount,
                shipping_cost: 0,
                payment_status: markAsPaid ? 'paid' : 'unpaid',
                notes: 'POS Order'
            };

            // Create the order
            const orderResponse = await salesAPI.create(orderData);
            const orderId = orderResponse.data.id;

            // Auto-fulfill if enabled
            if (autoFulfill) {
                try {
                    await salesAPI.fulfill(orderId);
                    setMessage('✓ Sale completed and fulfilled! Inventory deducted.');
                } catch (fulfillError: any) {
                    console.error('Failed to fulfill order:', fulfillError);
                    setMessage('✓ Order created but fulfillment failed. Complete it from Sales page.');
                }
            } else {
                setMessage('✓ Order created! Fulfill it from Sales page to deduct inventory.');
            }

            // Store completed order ID for invoice
            setCompletedOrderId(orderId);

            // Reset state
            setCart([]);
            setDiscount(0);
            setSelectedCustomer('');
            setTimeout(() => setMessage(''), 5000);
            barcodeInputRef.current?.focus();

            alert(autoFulfill
                ? 'Sale completed and inventory deducted!'
                : 'Order created! Go to Sales page to fulfill and deduct inventory.'
            );
        } catch (error: any) {
            console.error('Failed to create order:', error);
            alert(error.response?.data?.detail || 'Failed to create order');
            setMessage('');
        } finally {
            setLoading(false);
        }
    };

    const clearCart = () => {
        if (confirm('Clear all items from cart?')) {
            setCart([]);
            setDiscount(0);
            barcodeInputRef.current?.focus();
        }
    };

    return (
        <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 8rem)' }}>
            {/* Left Side - Cart */}
            <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>

                {/* Barcode Scanner */}
                <div className="card mb-4">
                    <form onSubmit={handleBarcodeScan}>
                        <label className="label">Scan Barcode</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                className="input"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                placeholder="Scan or enter barcode..."
                                autoFocus
                                style={{ flex: 1, fontSize: '1.125rem', padding: '0.75rem' }}
                            />
                            <button type="submit" className="btn btn-primary">Search</button>
                        </div>
                        {message && (
                            <div style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem',
                                backgroundColor: message.includes('✓') ? '#d1fae5' : '#fee2e2',
                                color: message.includes('✓') ? '#065f46' : '#991b1b',
                                borderRadius: '0.375rem',
                                fontWeight: 500
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{message}</span>
                                    {completedOrderId && message.includes('✓') && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => navigate(`/invoice/${completedOrderId}`)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                            >
                                                📄 View Invoice
                                            </button>
                                            <button
                                                onClick={() => { setCompletedOrderId(null); setMessage(''); }}
                                                className="btn btn-outline"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Cart Items */}
                <div className="card" style={{ flex: 1, overflow: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="font-semibold">Cart Items ({cart.length})</h3>
                        {cart.length > 0 && (
                            <button onClick={clearCart} className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                                Clear Cart
                            </button>
                        )}
                    </div>

                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Cart is empty</p>
                            <p>Scan a product to add it to the cart</p>
                        </div>
                    ) : (
                        <div>
                            {cart.map((item, index) => (
                                <div key={index} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', backgroundColor: '#f9fafb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.product_name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>SKU: {item.sku}</div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            style={{ color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.25rem' }}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Qty</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                                min="1"
                                                style={{ padding: '0.5rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Price</label>
                                            <div style={{ padding: '0.5rem', fontWeight: 600 }}>₹{item.unit_price.toFixed(2)}</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Disc (₹)</label>
                                            <input
                                                type="number"
                                                className="input"
                                                value={item.discount}
                                                onChange={(e) => {
                                                    const newCart = cart.map(cartItem =>
                                                        cartItem.product_id === item.product_id
                                                            ? { ...cartItem, discount: parseFloat(e.target.value) || 0 }
                                                            : cartItem
                                                    );
                                                    setCart(newCart);
                                                }}
                                                min="0"
                                                step="0.01"
                                                style={{ padding: '0.5rem' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#6b7280' }}>
                                        GST: {item.tax_rate || 18}% | Tax: ₹{(((item.quantity * item.unit_price) - item.discount) * ((item.tax_rate || 18) / 100)).toFixed(2)}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', textAlign: 'right', fontSize: '1.125rem', fontWeight: 700 }}>
                                        Total: ₹{(((item.quantity * item.unit_price) - item.discount) * (1 + (item.tax_rate || 18) / 100)).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Checkout */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h2 className="text-xl font-bold mb-4">Checkout</h2>

                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Customer Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Customer *</label>
                        <select
                            className="input"
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.customer_number})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Auto-Fulfill Toggle */}
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: autoFulfill ? '#d1fae5' : '#fef3c7',
                        borderRadius: '0.375rem',
                        border: `2px solid ₹{autoFulfill ? '#10b981' : '#f59e0b'}`
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={autoFulfill}
                                onChange={(e) => setAutoFulfill(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <div>
                                <strong style={{ display: 'block' }}>
                                    {autoFulfill ? '✓ Auto-Fulfill (Recommended)' : '⚠️ Manual Fulfillment'}
                                </strong>
                                <small style={{ fontSize: '0.75rem', color: '#374151' }}>
                                    {autoFulfill
                                        ? 'Inventory will deduct immediately when sale completes'
                                        : 'Order will be created but inventory reserved. Fulfill manually from Sales page.'
                                    }
                                </small>
                            </div>
                        </label>
                    </div>

                    {/* Mark as Paid Toggle */}
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: markAsPaid ? '#d1fae5' : '#fee2e2',
                        borderRadius: '0.375rem',
                        border: `2px solid ₹{markAsPaid ? '#10b981' : '#ef4444'}`
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={markAsPaid}
                                onChange={(e) => setMarkAsPaid(e.target.checked)}
                                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                            />
                            <div>
                                <strong style={{ display: 'block' }}>
                                    {markAsPaid ? '💰 Customer Paid (Recommended)' : '⚠️ Payment Pending'}
                                </strong>
                                <small style={{ fontSize: '0.75rem', color: '#374151' }}>
                                    {markAsPaid
                                        ? 'Order will be marked as PAID in the system'
                                        : 'Order will be marked as UNPAID. You\'ll need to record payment later.'
                                    }
                                </small>
                            </div>
                        </label>
                    </div>



                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Order Discount (₹)</label>
                        <input
                            type="number"
                            className="input"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                        />
                    </div>

                    {/* Checkout Summary */}
                    <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f9fafb' }}>
                        <h3 className="font-semibold mb-3">Order Summary</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal (Before Tax):</span>
                            <strong>₹{calculateSubtotal().toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#059669' }}>
                            <span>GST (Auto-calculated):</span>
                            <span>₹{calculateTax().toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#dc2626' }}>
                            <span>Order Discount:</span>
                            <span>-₹{discount.toFixed(2)}</span>
                        </div>
                        <hr style={{ margin: '0.75rem 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span>Total:</span>
                            <span style={{ color: '#0ea5e9' }}>
                                ₹{calculateTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={handleCheckout}
                        className="btn btn-primary"
                        disabled={loading || cart.length === 0 || !selectedCustomer}
                        style={{
                            padding: '1rem',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            marginTop: '1rem'
                        }}
                    >
                        {loading ? 'Processing...' : 'Complete Sale'}
                    </button>

                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                        <strong>💡 Tip:</strong> Keep the barcode field focused. Scan products and they'll be added automatically!
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSPage;
