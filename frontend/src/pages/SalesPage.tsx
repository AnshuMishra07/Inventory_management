import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI } from '../lib/api';
import SalesOrderForm from '../components/SalesOrderForm';

interface SalesOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  payment_status: string;
  order_date: string;
}

const SalesPage: React.FC = () => {
    const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const response = await salesAPI.getById(orderId);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      alert('Failed to load order details');
    }
  };

  const handleFulfillOrder = async (orderId: string) => {
    if (!confirm('Fulfill this order? This will deduct inventory.')) return;

    try {
      await salesAPI.fulfill(orderId);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      alert('Order fulfilled successfully!');
    } catch (error: any) {
      console.error('Failed to fulfill order:', error);
      alert(error.response?.data?.detail || 'Failed to fulfill order');
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    if (!confirm('Mark this order as paid?')) return;

    try {
      await salesAPI.update(orderId, { payment_status: 'paid' });
      fetchOrders();
      // Refresh the selected order if it's currently open
      if (selectedOrder?.id === orderId) {
        const response = await salesAPI.getById(orderId);
        setSelectedOrder(response.data);
      }
      alert('Order marked as paid!');
    } catch (error: any) {
      console.error('Failed to mark as paid:', error);
      alert(error.response?.data?.detail || 'Failed to update payment status');
    }
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const badgeColors = {
      order: {
        pending: 'badge-warning',
        confirmed: 'badge-info',
        shipped: 'badge-info',
        delivered: 'badge-success',
        cancelled: 'badge-danger'
      },
      payment: {
        unpaid: 'badge-danger',
        partial: 'badge-warning',
        paid: 'badge-success'
      }
    };

    const colors = type === 'order' ? badgeColors.order : badgeColors.payment;
    const colorClass = colors[status as keyof typeof colors] || 'badge-info';

    return <span className={`badge ₹{colorClass}`}>{status}</span>;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Create Order
        </button>
      </div>

      {/* Orders List */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem' }}>Loading orders...</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer Name</th>
                <th>Total Amount</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    No orders found. Create your first order to get started.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                    <td>{order.customer_name}</td>
                    <td><strong>₹{order.total_amount.toFixed(2)}</strong></td>
                    <td>{getStatusBadge(order.status, 'order')}</td>
                    <td>{getStatusBadge(order.payment_status, 'payment')}</td>
                    <td>{formatDate(order.order_date)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => handleViewDetails(order.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          onClick={() => navigate(`/invoice/${order.id}`)}
                        >
                          📄 Invoice
                        </button>
                        {order.status === 'confirmed' && (
                          <button
                            className="btn btn-success"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            onClick={() => handleFulfillOrder(order.id)}
                          >
                            Fulfill
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
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
          <div className="card" style={{ width: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-xl font-bold">Order Details - {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ fontSize: '1.5rem', cursor: 'pointer', border: 'none', background: 'none' }}>×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <strong>Customer:</strong> {selectedOrder.customer_name || 'Unknown'}
              </div>
              <div>
                <strong>Warehouse ID:</strong> {selectedOrder.warehouse_id}
              </div>
              <div>
                <strong>Order Status:</strong> {getStatusBadge(selectedOrder.order_status || selectedOrder.status, 'order')}
              </div>
              <div>
                <strong>Payment Status:</strong> {getStatusBadge(selectedOrder.payment_status, 'payment')}
              </div>
              <div>
                <strong>Order Date:</strong> {formatDate(selectedOrder.order_date || selectedOrder.created_at)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 className="font-semibold mb-2">Order Items:</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>{item.product_id.substring(0, 8)}...</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unit_price.toFixed(2)}</td>
                      <td>₹{item.discount.toFixed(2)}</td>
                      <td><strong>₹{((item.quantity * item.unit_price) - item.discount).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: '1rem', backgroundColor: '#f0f9ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal:</span>
                <span>₹{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Tax:</span>
                <span>₹{selectedOrder.tax_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Discount:</span>
                <span>-₹{selectedOrder.discount_amount?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Shipping:</span>
                <span>₹{selectedOrder.shipping_cost?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '2px solid #0ea5e9' }}>
                <strong style={{ fontSize: '1.125rem' }}>Total:</strong>
                <strong style={{ fontSize: '1.125rem', color: '#0ea5e9' }}>₹{selectedOrder.total_amount.toFixed(2)}</strong>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Notes:</strong>
                <p style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {selectedOrder.payment_status === 'unpaid' && (
                <button className="btn btn-success" onClick={() => handleMarkAsPaid(selectedOrder.id)}>
                  💰 Mark as Paid
                </button>
              )}
              {(selectedOrder.status || selectedOrder.order_status) === 'confirmed' && (
                <button className="btn btn-success" onClick={() => handleFulfillOrder(selectedOrder.id)}>
                  Fulfill Order
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showForm && (
        <SalesOrderForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchOrders();
            alert('Sales order created successfully!');
          }}
        />
      )}
    </div>
  );
};

export default SalesPage;
