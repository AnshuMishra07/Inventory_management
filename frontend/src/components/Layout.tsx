import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '250px',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '1.5rem'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                    Inventory MS
                </h1>
                <nav>
                    <ul style={{ listStyle: 'none' }}>
                        <NavItem to="/" label="Dashboard" />
                        <NavItem to="/pos" label="🛒 POS" />
                        <NavItem to="/products" label="Products" />
                        <NavItem to="/inventory" label="Inventory" />
                        <NavItem to="/sales" label="Sales Orders" />
                        <NavItem to="/customers" label="Customers" />
                        <NavItem to="/alerts" label="Alerts" />
                        <NavItem to="/reports" label="Reports" />
                        <NavItem to="/quick-scan" label="Quick Scan" />
                    </ul>
                </nav>
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: '2rem',
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                <Outlet />
            </main>
        </div>
    );
};

const NavItem: React.FC<{ to: string; label: string }> = ({ to, label }) => (
    <li style={{ marginBottom: '0.5rem' }}>
        <Link
            to={to}
            style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {label}
        </Link>
    </li>
);

export default Layout;
