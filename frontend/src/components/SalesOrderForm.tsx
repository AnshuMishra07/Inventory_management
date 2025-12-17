import React, { useState, useEffect } from 'react';
import { customersAPI, productsAPI, salesAPI, warehousesAPI } from '../lib/api';

interface SalesOrderFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

interface OrderItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount: number;
}

const SalesOrderForm: React.FC<SalesOrderFormProps> = ({ onClose, onSuccess }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        warehouse_id: '', // dynamic warehouse
        tax_amount: 0,
        discount_amount: 0,
        shipping_cost: 0,
        notes: ''
    });
    const [items, setItems] = useState<OrderItem[]>([{
        product_id: '',
        quantity: 1,
        unit_price: 0,
        discount: 0
    }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [customersRes, productsRes, warehousesRes] = await Promise.all([
                customersAPI.getAll(),
                productsAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setCustomers(customersRes.data);
            setProducts(productsRes.data);
            setWarehouses(warehousesRes.data);

            // Set default warehouse if available
            if (warehousesRes.data.length > 0) {
                setFormData(prev => ({ ...prev, warehouse_id: warehousesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
    };

    const addItem = () => {
        setItems([...items, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill unit price when product is selected
        if (field === 'product_id') {
            const product = products.find(p => p.id === value);
            if (product) {
                newItems[index].unit_price = product.selling_price;
            }
        }

        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_price - item.discount);
        }, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal + formData.tax_amount + formData.shipping_cost - formData.discount_amount;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const orderData = {
                ...formData,
                items: items.filter(item => item.product_id && item.quantity > 0)
            };

            if (orderData.items.length === 0) {
                setError('Please add at least one item to the order');
                setLoading(false);
                return;
            }

            await salesAPI.create(orderData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create sales order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto'
        }}>
            <div className="card" style={{ width: '800px', maxHeight: '90vh', overflow: 'auto', margin: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="text-xl font-bold">Create Sales Order</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Customer & Warehouse */}
                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Customer *</label>
                            <select
                                className="input"
                                value={formData.customer_id}
                                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                                required
                            >
                                <option value="">Select customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.customer_number})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Warehouse *</label>
                            <select
                                className="input"
                                value={formData.warehouse_id}
                                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                required
                            >
                                <option value="">Select warehouse</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="label" style={{ marginBottom: 0 }}>Order Items *</label>
                            <button type="button" onClick={addItem} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}>
                                + Add Item
                            </button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="card" style={{ padding: '1rem', marginBottom: '0.5rem', backgroundColor: '#f9fafb' }}>
                                <div className="grid grid-cols-4 gap-2">
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className="label">Product</label>
                                        <select
                                            className="input"
                                            value={item.product_id}
                                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                            required
                                        >
                                            <option value="">Select product</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} ({p.sku}) - ₹{p.selling_price}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Quantity</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Unit Price</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="label">Discount ($)</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={item.discount}
                                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    <div style={{ fontWeight: 600, padding: '0.5rem' }}>
                                        Subtotal: ₹{((item.quantity * item.unit_price) - item.discount).toFixed(2)}
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.5rem 0.75rem' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Additional Charges */}
                    <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Tax Amount ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.tax_amount}
                                onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="label">Discount ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.discount_amount}
                                onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="label">Shipping ($)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.shipping_cost}
                                onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Notes</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Order notes..."
                        />
                    </div>

                    {/* Order Summary */}
                    <div className="card" style={{ padding: '1rem', backgroundColor: '#f0f9ff', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal:</span>
                            <strong>₹{calculateSubtotal().toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Tax:</span>
                            <span>₹{formData.tax_amount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Discount:</span>
                            <span>-₹{formData.discount_amount.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Shipping:</span>
                            <span>₹{formData.shipping_cost.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '2px solid #0ea5e9' }}>
                            <strong style={{ fontSize: '1.125rem' }}>Total:</strong>
                            <strong style={{ fontSize: '1.125rem', color: '#0ea5e9' }}>₹{calculateTotal().toFixed(2)}</strong>
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesOrderForm;
