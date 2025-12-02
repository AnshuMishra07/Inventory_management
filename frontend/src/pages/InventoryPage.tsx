import React, { useState, useEffect } from 'react';
import { inventoryAPI, productsAPI } from '../lib/api';
import InventoryAdjustmentForm from '../components/InventoryAdjustmentForm';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  last_updated_at: string;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    quantity_on_hand: 0,
    quantity_reserved: 0
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invResponse, prodResponse, transResponse] = await Promise.all([
        inventoryAPI.getAll(),
        productsAPI.getAll(),
        inventoryAPI.getTransactions({ limit: 50 })
      ]);

      setInventory(invResponse.data);
      setProducts(prodResponse.data);
      setTransactions(transResponse.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name} (${product.sku})` : productId;
  };

  const getAvailableQuantity = (item: InventoryItem) => {
    return item.quantity_on_hand - item.quantity_reserved;
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingInventory(item);
    setEditFormData({
      quantity_on_hand: item.quantity_on_hand,
      quantity_reserved: item.quantity_reserved
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInventory) return;

    try {
      setEditLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory/${editingInventory.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editFormData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update inventory');
      }

      setShowEditModal(false);
      fetchData();
      alert('Inventory updated successfully!');
    } catch (error: any) {
      console.error('Failed to update inventory:', error);
      alert(error.message || 'Failed to update inventory');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => alert('Transfer feature - coming soon!')}>
            Transfer Stock
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdjustForm(true)}>
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-4" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('stock')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: activeTab === 'stock' ? '#f9fafb' : 'white',
              borderBottom: activeTab === 'stock' ? '2px solid #4f46e5' : 'none',
              fontWeight: activeTab === 'stock' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              flex: 1,
              padding: '1rem',
              border: 'none',
              background: activeTab === 'transactions' ? '#f9fafb' : 'white',
              borderBottom: activeTab === 'transactions' ? '2px solid #4f46e5' : 'none',
              fontWeight: activeTab === 'transactions' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Transaction History
          </button>
        </div>
      </div>

      {/* Stock Levels Tab */}
      {activeTab === 'stock' && (
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '1rem' }}>Loading inventory...</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                      No inventory records found. Add stock to get started.
                    </td>
                  </tr>
                ) : (
                  inventory.map(item => {
                    const available = getAvailableQuantity(item);
                    const isLow = available < 10;

                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.product_name} ({item.product_sku})</td>
                        <td>{item.warehouse_name}</td>
                        <td><strong>{item.quantity_on_hand}</strong></td>
                        <td>{item.quantity_reserved}</td>
                        <td><strong className={isLow ? 'text-red-600' : 'text-green-600'}>{available}</strong></td>
                        <td>
                          {available === 0 ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : isLow ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </td>
                        <td>{new Date(item.last_updated_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            onClick={() => handleEdit(item)}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '1rem' }}>Loading transactions...</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map(trans => (
                    <tr key={trans.id}>
                      <td>{new Date(trans.created_at).toLocaleString()}</td>
                      <td>{getProductName(trans.product_id)}</td>
                      <td>{trans.warehouse_id}</td>
                      <td>
                        <span className={`badge ₹{trans.transaction_type === 'sale' ? 'badge-danger' :
                            trans.transaction_type === 'purchase' ? 'badge-success' :
                              'badge-info'
                          }`}>
                          {trans.transaction_type}
                        </span>
                      </td>
                      <td style={{
                        color: trans.quantity > 0 ? '#10b981' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {trans.quantity > 0 ? '+' : ''}{trans.quantity}
                      </td>
                      <td>{trans.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustForm && (
        <InventoryAdjustmentForm
          onClose={() => setShowAdjustForm(false)}
          onSuccess={() => {
            fetchData();
            alert('Stock adjusted successfully!');
          }}
        />
      )}

      {/* Edit Inventory Modal */}
      {showEditModal && editingInventory && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="card"
            style={{ maxWidth: '500px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-xl font-bold">Edit Inventory</h2>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
                style={{ padding: '0.5rem 1rem' }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Product</div>
              <div>{editingInventory.product_name} ({editingInventory.product_sku})</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Warehouse: {editingInventory.warehouse_name}</div>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Quantity On Hand *</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  value={editFormData.quantity_on_hand}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity_on_hand: parseInt(e.target.value) || 0 })}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Current: {editingInventory.quantity_on_hand}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Quantity Reserved *</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  value={editFormData.quantity_reserved}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity_reserved: parseInt(e.target.value) || 0 })}
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Current: {editingInventory.quantity_reserved}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
                  Available: {editFormData.quantity_on_hand - editFormData.quantity_reserved} units
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Updating...' : 'Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
