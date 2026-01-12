import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [orgName, setOrgName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    // const { login } = useApp(); // Existing login is for signup. We might need a new method or direct fetch.
    const { setUser } = useApp(); // Access context to set user on success
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !orgName || !password) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            // TODO: Replace with dedicated /auth/login endpoint
            // For now, we reuse checkAccess to valid org/email, but verify password logic is missing in backend API for "Login".
            // We will need to implement /api/auth/login.
            // Using a direct fetch here to the (to-be-implemented) login endpoint.

            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, orgName, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const backendUser = data.user;
                // Map backend response to Frontend UserProfile
                const userProfile = {
                    ...backendUser,
                    role: backendUser.role.toLowerCase(), // Normalize ADMIN -> admin
                    orgId: backendUser.customer?.id,
                    orgName: backendUser.customer?.name
                };
                setUser(userProfile);

                // Redirect based on role
                if (userProfile.role === 'admin') {
                    // Default to Invite/Manage page for admins as requested
                    navigate('/setup/invite');
                } else {
                    navigate('/review/dashboard');
                }
            } else {
                setError(data.error || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface-color)', padding: '2rem' }}>
                <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Review Companion</h1>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Sign In</h2>

                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label" htmlFor="orgName">Organization Name</label>
                        <input
                            id="orgName"
                            type="text"
                            className="input-field"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Log In
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
};
