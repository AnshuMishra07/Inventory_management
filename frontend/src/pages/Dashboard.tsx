import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, salesAPI, reportsAPI, alertsAPI } from '../lib/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    inventoryValue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    lowStockCount: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [
        productsRes,
        inventoryRes,
        ordersRes,
        salesRes,
        lowStockRes,
        performanceRes
      ] = await Promise.all([
        productsAPI.getAll(),
        reportsAPI.inventoryValue(),
        salesAPI.getAll({ limit: 5 }),
        reportsAPI.salesSummary(getTodayDate(), getTodayDate()),
        reportsAPI.lowStock(),
        reportsAPI.productPerformance(getLastMonthDate(), getTodayDate())
      ]);

      // Calculate inventory value
      const warehouses = inventoryRes.data || [];
      const totalValue = warehouses.reduce((sum: number, wh: any) => sum + (wh.total_value || 0), 0);

      // Count pending orders
      const pending = ordersRes.data.filter((o: any) => o.order_status === 'confirmed' || o.order_status === 'pending').length;

      setStats({
        totalProducts: productsRes.data.length,
        inventoryValue: totalValue,
        todayOrders: salesRes.data.total_orders || 0,
        todayRevenue: salesRes.data.total_revenue || 0,
        lowStockCount: lowStockRes.data.products?.length || 0,
        pendingOrders: pending
      });

      setRecentOrders(ordersRes.data.slice(0, 5));
      setLowStockProducts((lowStockRes.data.products || []).slice(0, 5));
      setTopProducts(performanceRes.data.slice(0, 5));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLastMonthDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return <span className={`badge ₹{colors[status] || 'badge-info'}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '1rem' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Welcome back! Here's what's happening today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pos')}>
          🛒 Open POS
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/products')}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Products</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.totalProducts}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>→ Manage Products</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/reports')}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Inventory Value</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{stats.inventoryValue.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>→ View Reports</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/sales')}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Today's Revenue</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{stats.todayRevenue.toFixed(2)}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>{stats.todayOrders} orders today</div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/sales')}>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Pending Orders</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.pendingOrders}</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>→ View Orders</div>
        </div>
      </div>

      {/* Alert Banner */}
      {stats.lowStockCount > 0 && (
        <div className="card" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/reports')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#92400e' }}>Low Stock Alert!</strong>
              <p style={{ color: '#78350f', marginTop: '0.25rem' }}>
                {stats.lowStockCount} product{stats.lowStockCount !== 1 ? 's' : ''} below reorder point. Click to view details.
              </p>
            </div>
            <button className="btn btn-warning">View Low Stock →</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="font-semibold">Recent Orders</h3>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => navigate('/sales')}>
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No orders yet</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/pos')}>
                Create First Order
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/sales')}>
                    <td style={{ fontWeight: 600 }}>{order.order_number}</td>
                    <td>{order.customer_id.substring(0, 8)}...</td>
                    <td><strong>₹{order.total_amount.toFixed(2)}</strong></td>
                    <td>{getStatusBadge(order.order_status || order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="font-semibold">Top Selling Products (30 days)</h3>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => navigate('/reports')}>
              View All
            </button>
          </div>

          {topProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>No sales data available</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product</th>
                  <th>Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={product.product_id}>
                    <td>
                      <strong style={{ color: idx === 0 ? '#f59e0b' : '#6b7280' }}>
                        #{idx + 1}
                      </strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{product.product_name}</td>
                    <td>{product.total_sold}</td>
                    <td><strong>₹{product.total_revenue.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="font-semibold">Low Stock Items</h3>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }} onClick={() => navigate('/reports')}>
              View All
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#10b981' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: 600 }}>All Products In Stock</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>No low stock alerts</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Reorder At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => {
                  const isCritical = product.current_quantity === 0;
                  return (
                    <tr key={`₹{product.product_id}-₹{product.warehouse_id}`}>
                      <td style={{ fontWeight: 600 }}>{product.product_name}</td>
                      <td>
                        <strong className={isCritical ? 'text-red-600' : 'text-orange-600'}>
                          {product.current_quantity}
                        </strong>
                      </td>
                      <td>{product.reorder_point}</td>
                      <td>
                        {isCritical ? (
                          <span className="badge badge-danger">Out</span>
                        ) : (
                          <span className="badge badge-warning">Low</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => navigate('/pos')} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>🛒</span>
              Open Point of Sale
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/products')} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>📦</span>
              Add New Product
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/inventory')} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>📊</span>
              Adjust Inventory
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/customers')} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>👥</span>
              Add New Customer
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/reports')} style={{ justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>📈</span>
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
