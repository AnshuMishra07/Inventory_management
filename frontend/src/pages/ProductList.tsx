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
  reorder_point: number;
  created_at: string;
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
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
                <th>Selling Price</th>
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
                    <td>₹{product.selling_price.toFixed(2)}</td>
                    <td>
                      <span className="badge badge-info">{product.reorder_point}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => alert('Edit functionality - coming soon!')}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
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
    </div>
  );
};

export default ProductList;
