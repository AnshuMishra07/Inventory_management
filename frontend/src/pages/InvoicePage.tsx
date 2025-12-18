import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface InvoiceData {
    id: string;
    order_number: string;
    order_date: string;
    invoice_date: string;
    due_date?: string;
    status: string;
    payment_status: string;
    payment_method?: string;

    customer_name: string;
    billing_name: string;
    billing_street_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    billing_phone?: string;
    billing_email?: string;

    seller_company_name?: string;
    seller_full_name?: string;
    seller_street_address?: string;
    seller_city?: string;
    seller_state?: string;
    seller_postal_code?: string;
    seller_country?: string;
    seller_phone?: string;
    seller_email?: string;
    seller_gstin?: string;

    items: Array<{
        id: string;
        product_id: string;
        product_name?: string;
        product_hsn_sac?: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
        line_total: number;
    }>;

    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    notes?: string;
    terms_and_conditions?: string;
}

const InvoicePage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInvoice();
    }, [orderId]);

    const fetchInvoice = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/invoices/${orderId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setInvoice(response.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load invoice');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/invoices/${orderId}/pdf`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoice?.order_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download PDF');
        }
    };

    if (loading) return <div className="loading">Loading invoice...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!invoice) return <div>Invoice not found</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            {/* Action Buttons - Hide on print */}
            <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => navigate('/sales')} className="btn btn-secondary">
                    ← Back to Sales
                </button>
                <button onClick={handlePrint} className="btn btn-primary">
                    🖨️ Print
                </button>
                <button onClick={handleDownloadPDF} className="btn btn-success">
                    📄 Download PDF
                </button>
            </div>

            {/* Invoice Content */}
            <div className="invoice-container" style={{
                backgroundColor: 'white',
                padding: '3rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #3b82f6', paddingBottom: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>INVOICE</h1>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>#{invoice.order_number}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p><strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleDateString()}</p>
                        {invoice.due_date && (
                            <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
                        )}
                        <p><strong>Status:</strong> <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: invoice.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                            color: invoice.payment_status === 'paid' ? '#166534' : '#92400e',
                            fontSize: '0.875rem'
                        }}>{invoice.payment_status.toUpperCase()}</span></p>
                    </div>
                </div>

                {/* Addresses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Seller/From */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>From:</h3>
                        {invoice.seller_full_name && <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{invoice.seller_full_name}</p>}
                        {invoice.seller_company_name && <p style={{ margin: '0.125rem 0' }}>{invoice.seller_company_name}</p>}
                        {invoice.seller_street_address && <p style={{ margin: '0.125rem 0' }}>{invoice.seller_street_address}</p>}
                        {(invoice.seller_city || invoice.seller_state) && (
                            <p style={{ margin: '0.125rem 0' }}>
                                {invoice.seller_city}, {invoice.seller_state} {invoice.seller_postal_code}
                            </p>
                        )}
                        {invoice.seller_phone && <p style={{ margin: '0.125rem 0' }}>Phone: {invoice.seller_phone}</p>}
                        {invoice.seller_email && <p style={{ margin: '0.125rem 0' }}>Email: {invoice.seller_email}</p>}
                    </div>

                    {/* Bill To */}
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>Bill To:</h3>
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{invoice.billing_name || invoice.customer_name}</p>
                        {invoice.billing_street_address && <p style={{ margin: '0.125rem 0' }}>{invoice.billing_street_address}</p>}
                        {invoice.billing_phone && <p style={{ margin: '0.125rem 0' }}>Phone: {invoice.billing_phone}</p>}
                        {invoice.billing_email && <p style={{ margin: '0.125rem 0' }}>Email: {invoice.billing_email}</p>}
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Product</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Tax</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontWeight: '600' }}>{item.product_name || 'Unknown Product'}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>HSN: {item.product_hsn_sac || '0'}</div>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.tax_rate ?? 18}%</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{item.line_total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                    <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                            <span>Subtotal:</span>
                            <span>₹{invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.discount_amount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                                <span>Discount:</span>
                                <span>-₹{invoice.discount_amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                            <span>CGST:</span>
                            <span>₹{(invoice.tax_amount / 2).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e5e7eb' }}>
                            <span>SGST:</span>
                            <span>₹{(invoice.tax_amount / 2).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontSize: '1.25rem', fontWeight: 'bold', borderTop: '2px solid #374151', marginTop: '0.5rem' }}>
                            <span>Total:</span>
                            <span>₹{invoice.total_amount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                {invoice.payment_method && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                        <p><strong>Payment Method:</strong> {invoice.payment_method}</p>
                    </div>
                )}

                {/* Terms */}
                {invoice.terms_and_conditions && (
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Terms & Conditions:</h4>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', whiteSpace: 'pre-wrap' }}>{invoice.terms_and_conditions}</p>
                    </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                    <p>Thank you for your business!</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .invoice-container {
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvoicePage;
