import React, { useState, useEffect } from 'react';
import { inventoryAPI, productsAPI, warehousesAPI } from '../lib/api';

interface InventoryAdjustmentFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

const InventoryAdjustmentForm: React.FC<InventoryAdjustmentFormProps> = ({ onClose, onSuccess }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        product_id: '',
        warehouse_id: '',
        quantity: 0,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, warehousesRes] = await Promise.all([
                productsAPI.getAll(),
                warehousesAPI.getAll()
            ]);
            setProducts(productsRes.data);
            setWarehouses(warehousesRes.data);
            
            // Set first warehouse as default if available
            if (warehousesRes.data.length > 0) {
                setFormData(prev => ({ ...prev, warehouse_id: warehousesRes.data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load warehouses');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await inventoryAPI.adjust(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to adjust inventory');
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
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="text-xl font-bold">Adjust Inventory</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Product *</label>
                        <select
                            className="input"
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            required
                        >
                            <option value="">Select a product</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Warehouse *</label>
                        <select
                            className="input"
                            value={formData.warehouse_id}
                            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                            required
                        >
                            <option value="">Select a warehouse</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        {warehouses.length === 0 && !error && (
                            <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                Loading warehouses...
                            </small>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Quantity Adjustment *</label>
                        <input
                            type="number"
                            className="input"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                            required
                            placeholder="Enter quantity (positive to add, negative to remove)"
                        />
                        <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            Positive number adds stock, negative removes stock
                        </small>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Notes</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Optional notes about this adjustment"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adjusting...' : 'Adjust Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InventoryAdjustmentForm;
