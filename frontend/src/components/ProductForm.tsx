import React, { useState } from 'react';
import { productsAPI } from '../lib/api';

interface ProductFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        barcode: '',
        category_id: '',
        unit_of_measure: 'pcs',
        reorder_point: 10,
        reorder_quantity: 50,
        cost_price: 0,
        selling_price: 0,
        tax_rate: 18.0,  // Default 18% GST
        supplier_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await productsAPI.create(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
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
            <div className="card" style={{ width: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="text-xl font-bold">Add New Product</h2>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">SKU *</label>
                            <input
                                type="text"
                                name="sku"
                                className="input"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                                placeholder="PROD001"
                            />
                        </div>

                        <div>
                            <label className="label">Barcode</label>
                            <input
                                type="text"
                                name="barcode"
                                className="input"
                                value={formData.barcode}
                                onChange={handleChange}
                                placeholder="123456789"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">Product Name *</label>
                        <input
                            type="text"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter product name"
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">Description</label>
                        <textarea
                            name="description"
                            className="input"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Product description..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ marginTop: '1rem' }}>
                        <div>
                            <label className="label">Unit of Measure</label>
                            <select
                                name="unit_of_measure"
                                className="input"
                                value={formData.unit_of_measure}
                                onChange={handleChange}
                            >
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilograms</option>
                                <option value="lbs">Pounds</option>
                                <option value="box">Box</option>
                                <option value="carton">Carton</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Reorder Point</label>
                            <input
                                type="number"
                                name="reorder_point"
                                className="input"
                                value={formData.reorder_point}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ marginTop: '1rem' }}>
                        <div>
                            <label className="label">Reorder Quantity</label>
                            <input
                                type="number"
                                name="reorder_quantity"
                                className="input"
                                value={formData.reorder_quantity}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4" style={{ marginTop: '1rem' }}>
                        <div>
                            <label className="label">Cost Price *</label>
                            <input
                                type="number"
                                name="cost_price"
                                className="input"
                                value={formData.cost_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="label">Selling Price *</label>
                            <input
                                type="number"
                                name="selling_price"
                                className="input"
                                value={formData.selling_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label className="label">GST Rate (%) *</label>
                        <select
                            name="tax_rate"
                            className="input"
                            value={formData.tax_rate}
                            onChange={handleChange}
                            required
                        >
                            <option value="0">0% - Tax Exempt</option>
                            <option value="5">5% - Essential Goods</option>
                            <option value="12">12% - Standard Goods</option>
                            <option value="18">18% - General Goods (Default)</option>
                            <option value="28">28% - Luxury Goods</option>
                        </select>
                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#6b7280' }}>
                            Select the applicable GST rate for this product
                        </small>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;
