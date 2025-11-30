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
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
    </div>
  );
};

export default InventoryPage;
