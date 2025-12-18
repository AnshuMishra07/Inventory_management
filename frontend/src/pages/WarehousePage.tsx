import React, { useState, useEffect } from 'react';
import { warehousesAPI } from '../lib/api';

interface Warehouse {
    id: string;
    name: string;
    location: string;
    address: string;
    manager_id: string | null;
    is_active: boolean;
    created_at: string;
}

const WarehousePage: React.FC = () => {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        address: '',
        is_active: true
    });

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const response = await warehousesAPI.getAll();
            setWarehouses(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching warehouses:', err);
            setError('Failed to fetch warehouses');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (warehouse?: Warehouse) => {
        if (warehouse) {
            setEditingWarehouse(warehouse);
            setFormData({
                name: warehouse.name,
                location: warehouse.location || '',
                address: warehouse.address || '',
                is_active: warehouse.is_active
            });
        } else {
            setEditingWarehouse(null);
            setFormData({
                name: '',
                location: '',
                address: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingWarehouse(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingWarehouse) {
                await warehousesAPI.update(editingWarehouse.id, formData);
            } else {
                await warehousesAPI.create(formData);
            }
            fetchWarehouses();
            handleCloseModal();
        } catch (err) {
            console.error('Error saving warehouse:', err);
            alert('Failed to save warehouse');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
        try {
            await warehousesAPI.delete(id);
            fetchWarehouses();
        } catch (err) {
            console.error('Error deleting warehouse:', err);
            alert('Failed to delete warehouse');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Warehouse Management</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                >
                    + Add Warehouse
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem' }}>Loading warehouses...</p>
                </div>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {warehouses.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                                        No warehouses found. Add your first warehouse to get started.
                                    </td>
                                </tr>
                            ) : (
                                warehouses.map((warehouse) => (
                                    <tr key={warehouse.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{warehouse.name}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{warehouse.address}</div>
                                        </td>
                                        <td>{warehouse.location}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.625rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                backgroundColor: warehouse.is_active ? '#def7ec' : '#fde8e8',
                                                color: warehouse.is_active ? '#03543f' : '#9b1c1c'
                                            }}>
                                                {warehouse.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleOpenModal(warehouse)}
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', marginRight: '0.5rem' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(warehouse.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
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
                            <h2 className="text-xl font-bold">
                                {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                            </h2>
                            <button onClick={handleCloseModal} style={{ fontSize: '1.5rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Warehouse Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="input"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Address</label>
                                <textarea
                                    name="address"
                                    className="input"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange as any}
                                    id="is_active_check"
                                    style={{ marginRight: '0.5rem' }}
                                />
                                <label htmlFor="is_active_check" className="label" style={{ marginBottom: 0 }}>Active</label>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehousePage;
