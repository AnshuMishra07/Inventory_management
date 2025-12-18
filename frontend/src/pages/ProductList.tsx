import React, { useState, useEffect } from 'react';
import { productsAPI } from '../lib/api';
import ProductForm from '../components/ProductForm';

interface Product {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  cost_price_inc_tax: number;
  selling_price_inc_tax: number;
  reorder_point: number;
  created_at: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    cost_price: 0,
    selling_price: 0,
    tax_rate: 18,
    reorder_point: 0,
    cost_price_inc_tax: 0,
    selling_price_inc_tax: 0
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ search: searchQuery });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };


  // Add auto-calculation calculation effect for edit form
  useEffect(() => {
    if (showEditModal) {
      const taxMultiplier = 1 + (editFormData.tax_rate / 100);
      setEditFormData(prev => ({
        ...prev,
        cost_price_inc_tax: parseFloat((prev.cost_price * taxMultiplier).toFixed(2)),
        selling_price_inc_tax: parseFloat((prev.selling_price * taxMultiplier).toFixed(2))
      }));
    }
  }, [editFormData.cost_price, editFormData.selling_price, editFormData.tax_rate, showEditModal]);
  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      alert(error.response?.data?.detail || 'Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      tax_rate: (product as any).tax_rate || 18,
      reorder_point: product.reorder_point,
      cost_price_inc_tax: product.cost_price_inc_tax,
      selling_price_inc_tax: product.selling_price_inc_tax
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setEditLoading(true);
      await productsAPI.update(editingProduct.id, editFormData);
      setShowEditModal(false);
      fetchProducts();
      alert('Product updated successfully!');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      alert(error.response?.data?.detail || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            className="input"
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchQuery('');
                fetchProducts();
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Products Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem' }}>Loading products...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Barcode</th>
                <th>Cost Price</th>
                <th>Cost (Inc. GST)</th>
                <th>Selling Price</th>
                <th>Selling (Inc. GST)</th>
                <th>Reorder Point</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchQuery
                      ? 'No products found matching your search.'
                      : 'No products found. Create your first product to get started.'
                    }
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td>{product.barcode || '-'}</td>
                    <td>₹{product.cost_price.toFixed(2)}</td>
                    <td>₹{product.cost_price_inc_tax?.toFixed(2) || (product.cost_price * (1 + ((product as any).tax_rate || 18) / 100)).toFixed(2)}</td>
                    <td>₹{product.selling_price.toFixed(2)}</td>
                    <td>₹{product.selling_price_inc_tax?.toFixed(2) || (product.selling_price * (1 + ((product as any).tax_rate || 18) / 100)).toFixed(2)}</td>
                    <td>
                      <span className="badge badge-info">{product.reorder_point}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleEdit(product)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleDelete(product.id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <ProductForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchProducts();
            alert('Product created successfully!');
          }}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
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
            style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
                style={{ padding: '0.5rem 1rem' }}
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label">Name *</label>
                <input
                  type="text"
                  className="input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">SKU *</label>
                  <input
                    type="text"
                    className="input"
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Barcode</label>
                  <input
                    type="text"
                    className="input"
                    value={editFormData.barcode}
                    onChange={(e) => setEditFormData({ ...editFormData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Cost Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editFormData.cost_price}
                    onChange={(e) => setEditFormData({ ...editFormData, cost_price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editFormData.selling_price}
                    onChange={(e) => setEditFormData({ ...editFormData, selling_price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* New GST Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="label">Cost (Inc. GST)</label>
                  <input
                    type="number"
                    className="input bg-gray-100"
                    value={editFormData.cost_price_inc_tax}
                    readOnly
                  />
                </div>
                <div>
                  <label className="label">Selling (Inc. GST)</label>
                  <input
                    type="number"
                    className="input bg-gray-100"
                    value={editFormData.selling_price_inc_tax}
                    readOnly
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={editFormData.tax_rate}
                    onChange={(e) => setEditFormData({ ...editFormData, tax_rate: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="label">Reorder Point</label>
                  <input
                    type="number"
                    className="input"
                    value={editFormData.reorder_point}
                    onChange={(e) => setEditFormData({ ...editFormData, reorder_point: parseInt(e.target.value) })}
                  />
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
                  {editLoading ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
