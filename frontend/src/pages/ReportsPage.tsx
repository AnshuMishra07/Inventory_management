import React, { useState } from 'react';
import { reportsAPI } from '../lib/api';

const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'inventory' | 'sales' | 'performance' | 'lowstock' | 'gst'>('inventory');
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [performanceReport, setPerformanceReport] = useState<any[]>([]);
  const [lowStockReport, setLowStockReport] = useState<any[]>([]);
  const [gstReport, setGstReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [warehouseProducts, setWarehouseProducts] = useState<any[]>([]);

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.inventoryValue();
      // Backend returns array of warehouse reports, aggregate them
      const warehouses = response.data || [];
      const aggregated = {
        total_value: warehouses.reduce((sum: number, wh: any) => sum + (wh.total_value || 0), 0),
        total_products: warehouses.reduce((sum: number, wh: any) => sum + (wh.total_products || 0), 0),
        total_quantity: warehouses.reduce((sum: number, wh: any) => sum + (wh.total_quantity || 0), 0),
        warehouses: warehouses
      };
      setInventoryReport(aggregated);
    } catch (error) {
      console.error('Failed to fetch inventory report:', error);
      alert('Failed to load inventory report');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.salesSummary(dateRange.startDate, dateRange.endDate);
      setSalesReport(response.data);
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      alert('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.productPerformance(dateRange.startDate, dateRange.endDate);
      setPerformanceReport(response.data);
    } catch (error) {
      console.error('Failed to fetch performance report:', error);
      alert('Failed to load performance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.lowStock();
      // Backend returns { total_low_stock_products, products: [] }
      setLowStockReport(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch low stock report:', error);
      alert('Failed to load low stock report');
    } finally {
      setLoading(false);
    }
  };

  const fetchGSTReport = async () => {
    setLoading(true);
    try {
      const response = await reportsAPI.getGSTSummary(dateRange.startDate, dateRange.endDate);
      setGstReport(response.data);
    } catch (error) {
      console.error('Failed to fetch GST report:', error);
      alert('Failed to load GST report');
    } finally {
      setLoading(false);
    }
  };

  const downloadGSTCSV = async () => {
    try {
      const response = await reportsAPI.downloadGSTCSV(dateRange.startDate, dateRange.endDate);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gst_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert('Failed to download CSV');
    }
  };

  const downloadGSTExcel = async () => {
    try {
      const response = await reportsAPI.downloadGSTExcel(dateRange.startDate, dateRange.endDate);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gst_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('Failed to download Excel');
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const endDate = new Date().toISOString().split('T')[0];
    let startDate;

    switch (period) {
      case '7':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'ytd':
        startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = endDate;
    }

    setDateRange({ startDate, endDate });
  };

  const fetchWarehouseProducts = async (warehouseId: string, warehouseName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventory?warehouse_id=${warehouseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setWarehouseProducts(data);
      setSelectedWarehouse({ id: warehouseId, name: warehouseName });
    } catch (error) {
      console.error('Failed to fetch warehouse products:', error);
      alert('Failed to load warehouse products');
    }
  };

  const handleGenerateReport = () => {
    switch (activeReport) {
      case 'inventory':
        fetchInventoryReport();
        break;
      case 'sales':
        fetchSalesReport();
        break;
      case 'performance':
        fetchPerformanceReport();
        break;
      case 'lowstock':
        fetchLowStockReport();
        break;
      case 'gst':
        fetchGSTReport();
        break;
    }
  };

  React.useEffect(() => {
    handleGenerateReport();
  }, [activeReport]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports & Analytics</h1>

      {/* Report Type Tabs */}
      <div className="card mb-4" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
          {[
            { key: 'inventory', label: '📊 Inventory' },
            { key: 'sales', label: '💰 Sales' },
            { key: 'performance', label: '⭐ Performance' },
            { key: 'lowstock', label: '⚠️ Low Stock' },
            { key: 'gst', label: '🧾 GST Tax Report' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveReport(tab.key as any)}
              style={{
                padding: '1rem',
                border: 'none',
                background: activeReport === tab.key ? '#f9fafb' : 'white',
                borderBottom: activeReport === tab.key ? '3px solid #4f46e5' : 'none',
                fontWeight: activeReport === tab.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter (for sales, performance, and GST) */}
      {(activeReport === 'sales' || activeReport === 'performance' || activeReport === 'gst') && (
        <div className="card mb-4">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            {activeReport === 'gst' && (
              <div style={{ flex: 1 }}>
                <label className="label">Period</label>
                <select
                  className="input"
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="ytd">Year to Date</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            )}
            {(selectedPeriod === 'custom' || activeReport !== 'gst') && (
              <>
                <div style={{ flex: 1 }}>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </>
            )}
            <button className="btn btn-primary" onClick={handleGenerateReport}>
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Reports Content */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem' }}>Loading report...</p>
        </div>
      ) : (
        <>
          {/* Inventory Valuation Report */}
          {activeReport === 'inventory' && inventoryReport && (
            <div>
              <div className="card mb-4" style={{ backgroundColor: '#f0f9ff' }}>
                <div className="grid grid-cols-3 gap-4">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0ea5e9' }}>
                      ₹{inventoryReport.total_value?.toFixed(2) || '0.00'}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Total Inventory Value</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                      {inventoryReport.total_products || 0}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Total Products</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>
                      {inventoryReport.total_quantity || 0}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: '0.5rem' }}>Total Units</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-4">Warehouse Breakdown</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Products</th>
                      <th>Total Units</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryReport.warehouses?.map((wh: any, idx: number) => (
                      <tr key={idx}>
                        <td
                          style={{
                            fontWeight: 600,
                            color: '#4f46e5',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                          onClick={() => fetchWarehouseProducts(wh.warehouse_id, wh.warehouse_name)}
                        >
                          {wh.warehouse_name || wh.warehouse_id}
                        </td>
                        <td>{wh.total_products}</td>
                        <td>{wh.total_quantity}</td>
                        <td><strong>₹{wh.total_value?.toFixed(2)}</strong></td>
                      </tr>
                    )) || (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center' }}>No warehouse data available</td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Summary Report */}
          {activeReport === 'sales' && salesReport && (
            <div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="card" style={{ backgroundColor: '#f0fdf4' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                    ₹{salesReport.total_revenue?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Total Revenue</div>
                </div>
                <div className="card" style={{ backgroundColor: '#eff6ff' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                    {salesReport.total_orders || 0}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Total Orders</div>
                </div>
                <div className="card" style={{ backgroundColor: '#fef3c7' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                    {salesReport.total_items_sold || 0}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Items Sold</div>
                </div>
                <div className="card" style={{ backgroundColor: '#f3e8ff' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>
                    ₹{salesReport.average_order_value?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Avg Order Value</div>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-2">Sales Period</h3>
                <p style={{ color: '#6b7280' }}>
                  {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Product Performance Report */}
          {activeReport === 'performance' && (
            <div className="card">
              <h3 className="font-semibold mb-4">Top Performing Products</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceReport.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                        No sales data for selected period
                      </td>
                    </tr>
                  ) : (
                    performanceReport.map((product, idx) => (
                      <tr key={product.product_id}>
                        <td>
                          <strong style={{ fontSize: '1.125rem', color: idx === 0 ? '#f59e0b' : '#6b7280' }}>
                            #{idx + 1}
                          </strong>
                        </td>
                        <td style={{ fontWeight: 600 }}>{product.product_name}</td>
                        <td>{product.total_sold}</td>
                        <td><strong>₹{product.total_revenue?.toFixed(2)}</strong></td>
                        <td>
                          <div style={{
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, (product.total_revenue / (performanceReport[0]?.total_revenue || 1)) * 100)}%`,
                              height: '100%',
                              backgroundColor: '#10b981',
                              transition: 'width 0.3s'
                            }}></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* GST Tax Report */}
          {activeReport === 'gst' && gstReport && (
            <div>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="card" style={{ backgroundColor: '#dcfce7' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>
                    ₹{gstReport.totals?.tax_collected?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Total GST Collected</div>
                </div>
                <div className="card" style={{ backgroundColor: '#e0f2fe' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0284c7' }}>
                    ₹{gstReport.totals?.taxable_amount?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Taxable Amount</div>
                </div>
                <div className="card" style={{ backgroundColor: '#fef3c7' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ca8a04' }}>
                    {gstReport.totals?.order_count || 0}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Orders</div>
                </div>
                <div className="card" style={{ backgroundColor: '#f3e8ff' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#9333ea' }}>
                    {gstReport.totals?.items_sold || 0}
                  </div>
                  <div style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Items Sold</div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="card mb-4" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 className="font-semibold">Export Report</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Period: {gstReport.period?.start_date} to {gstReport.period?.end_date}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" onClick={downloadGSTCSV} style={{ padding: '0.5rem 1rem' }}>
                      📄 Download CSV
                    </button>
                    <button className="btn btn-primary" onClick={downloadGSTExcel} style={{ padding: '0.5rem 1rem' }}>
                      📊 Download Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* GST Breakdown Table */}
              <div className="card">
                <h3 className="font-semibold mb-4">GST Breakdown by Rate</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>GST Rate</th>
                      <th>Taxable Amount</th>
                      <th>Tax Collected</th>
                      <th>Orders</th>
                      <th>Items Sold</th>
                      <th>% of Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstReport.summary?.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                          No tax data for selected period
                        </td>
                      </tr>
                    ) : (
                      gstReport.summary?.map((item: any) => (
                        <tr key={item.tax_rate}>
                          <td>
                            <strong style={{ fontSize: '1.125rem', color: '#4f46e5' }}>
                              {item.tax_rate}%
                            </strong>
                          </td>
                          <td>₹{item.taxable_amount?.toFixed(2)}</td>
                          <td>
                            <strong style={{ color: '#16a34a' }}>
                              ₹{item.tax_collected?.toFixed(2)}
                            </strong>
                          </td>
                          <td>{item.order_count}</td>
                          <td>{item.items_sold}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                flex: 1,
                                height: '8px',
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${Math.min(100, (item.tax_collected / (gstReport.totals?.tax_collected || 1)) * 100)}%`,
                                  height: '100%',
                                  backgroundColor: '#16a34a'
                                }}></div>
                              </div>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', minWidth: '45px' }}>
                                {((item.tax_collected / (gstReport.totals?.tax_collected || 1)) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total Row */}
                    {gstReport.summary?.length > 0 && (
                      <tr style={{ backgroundColor: '#f9fafb', fontWeight: 600 }}>
                        <td><strong>Total</strong></td>
                        <td>₹{gstReport.totals?.taxable_amount?.toFixed(2)}</td>
                        <td>
                          <strong style={{ color: '#16a34a' }}>
                            ₹{gstReport.totals?.tax_collected?.toFixed(2)}
                          </strong>
                        </td>
                        <td>{gstReport.totals?.order_count}</td>
                        <td>{gstReport.totals?.items_sold}</td>
                        <td>100%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Stock Report */}
          {activeReport === 'lowstock' && (
            <div className="card">
              <h3 className="font-semibold mb-4">Products Below Reorder Point</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Warehouse</th>
                    <th>Available</th>
                    <th>Reorder Point</th>
                    <th>Status</th>
                    <th>Action Needed</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockReport.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                        ✅ All products are adequately stocked!
                      </td>
                    </tr>
                  ) : (
                    lowStockReport.map((item: any) => {
                      const available = item.current_quantity || 0;
                      const isCritical = available === 0;

                      return (
                        <tr key={`${item.product_id}-${item.warehouse_id}`}>
                          <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                          <td>{item.warehouse_id}</td>
                          <td>
                            <strong className={isCritical ? 'text-red-600' : 'text-orange-600'}>
                              {available}
                            </strong>
                          </td>
                          <td>{item.reorder_point}</td>
                          <td>
                            {isCritical ? (
                              <span className="badge badge-danger">Out of Stock</span>
                            ) : (
                              <span className="badge badge-warning">Low Stock</span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              Order {item.reorder_quantity || item.reorder_point} units
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Warehouse Products Modal */}
      {selectedWarehouse && (
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
          onClick={() => setSelectedWarehouse(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '900px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              margin: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="text-xl font-bold">
                Products in {selectedWarehouse.name}
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedWarehouse(null)}
                style={{ padding: '0.5rem 1rem' }}
              >
                ✕ Close
              </button>
            </div>

            {warehouseProducts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No products found in this warehouse
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Available</th>
                    <th>Reserved</th>
                    <th>Unit Value</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouseProducts.map((item: any) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.product_name || 'N/A'}</td>
                      <td>{item.product_sku || 'N/A'}</td>
                      <td>{item.quantity_on_hand || 0}</td>
                      <td>{item.quantity_reserved || 0}</td>
                      <td>₹{item.product_cost_price?.toFixed(2) || '0.00'}</td>
                      <td>
                        <strong>
                          ₹{((item.quantity_on_hand || 0) * (item.product_cost_price || 0)).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
