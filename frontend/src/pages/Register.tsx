import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        username: '',
        phone: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/public/register`, registerData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            padding: '2rem 1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Create Account
                </h2>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1rem' }}>
                        Account Information
                    </h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Email *</label>
                        <input
                            type="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="your@email.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Full Name *</label>
                        <input
                            type="text"
                            name="full_name"
                            className="input"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Username (optional)</label>
                        <input
                            type="text"
                            name="username"
                            className="input"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Password *</label>
                            <input
                                type="password"
                                name="password"
                                className="input"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="Min 8 characters"
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="label">Confirm Password *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="input"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="Re-enter password"
                            />
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
                        Contact Information
                    </h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            className="input"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 1234567890"
                        />
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
                        Address (Optional)
                    </h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Street Address</label>
                        <textarea
                            name="street_address"
                            className="input"
                            value={formData.street_address}
                            onChange={handleChange}
                            placeholder="123 Main St, Apartment 4"
                            rows={2}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">City</label>
                            <input
                                type="text"
                                name="city"
                                className="input"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Mumbai"
                            />
                        </div>
                        <div>
                            <label className="label">State/Province</label>
                            <input
                                type="text"
                                name="state"
                                className="input"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="Maharashtra"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label">Postal Code</label>
                            <input
                                type="text"
                                name="postal_code"
                                className="input"
                                value={formData.postal_code}
                                onChange={handleChange}
                                placeholder="400001"
                            />
                        </div>
                        <div>
                            <label className="label">Country</label>
                            <select
                                name="country"
                                className="input"
                                value={formData.country}
                                onChange={handleChange}
                            >
                                <option value="India">India</option>
                                <option value="USA">USA</option>
                                <option value="UK">UK</option>
                                <option value="Canada">Canada</option>
                                <option value="Australia">Australia</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
                    Already have an account? <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
