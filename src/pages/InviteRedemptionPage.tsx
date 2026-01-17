import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const InviteRedemptionPage: React.FC = () => {
    const [searchParams] = useSearchParams();


    // State
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState(''); // Added name state
    const [step, setStep] = useState<'TOKEN_ENTRY' | 'SET_PASSWORD'>('TOKEN_ENTRY');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initial check for token in URL
    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            if (urlToken.length > 5) {
                setStep('SET_PASSWORD');
            }
        }
    }, [searchParams]);

    const handleVerifyToken = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!token.trim()) {
            setError('Please enter a valid invitation token.');
            return;
        }
        // Mock Verification or fetch from API if we wanted to pre-validate
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep('SET_PASSWORD');
        }, 500);
    };

    // State for success message
    const [successMessage, setSuccessMessage] = useState('');

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!name.trim()) {
            setError('Please enter your name.');
            return;
        }

        setIsLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
            const res = await fetch(`${API_BASE}/api/auth/invite/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, name })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to redeem invitation');
            }

            console.log('Invite accepted:', data);

            if (data.token && data.user) {
                // Auto Login
                localStorage.setItem('AUTH_TOKEN', data.token);
                localStorage.setItem('USER_DATA', JSON.stringify(data.user));

                setSuccessMessage('Account created successfully! Redirecting you to dashboard...');

                // Delay redirect
                setTimeout(() => {
                    window.location.href = '/review/dashboard';
                }, 1500);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to set password. Link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface-color)', padding: '2rem' }}>
                <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    {step === 'TOKEN_ENTRY' ? 'Redeem Invitation' : 'Setup Account'}
                </h1>

                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
                {successMessage && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>{successMessage}</div>}

                {step === 'TOKEN_ENTRY' ? (
                    <form onSubmit={handleVerifyToken}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter the invitation code received in your email.
                        </p>
                        <div className="input-group">
                            <label className="input-label" htmlFor="token">Invitation Token</label>
                            <input
                                id="token"
                                type="text"
                                className="input-field"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="e.g. INV-123456"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSetPassword}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Welcome! Please confirm your name and set a secure password to access your account.
                        </p>

                        {/* Hidden token field for accessibility/form context if needed */}
                        <input type="hidden" name="token" value={token} />

                        {/* Name Field (New) */}
                        <div className="input-group">
                            <label className="input-label" htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="password">New Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Setting Password...' : 'Set Password & Login'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
