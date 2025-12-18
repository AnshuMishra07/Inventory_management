import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import CustomersPage from './pages/CustomersPage';
import AlertsPage from './pages/AlertsPage';
import ReportsPage from './pages/ReportsPage';
import QuickScan from './pages/QuickScan';
import POSPage from './pages/POSPage';
import InvoicePage from './pages/InvoicePage';
import WarehousePage from './pages/WarehousePage';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="warehouses" element={<WarehousePage />} />
                    <Route path="sales" element={<SalesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="alerts" element={<AlertsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="quick-scan" element={<QuickScan />} />
                    <Route path="pos" element={<POSPage />} />
                    <Route path="invoice/:orderId" element={<InvoicePage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
