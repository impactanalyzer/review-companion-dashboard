import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const InviteRedemptionPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // State
    const [token, setToken] = useState('');
    // const [email, setEmail] = useState(''); // Optional, depending on security requirements
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState<'TOKEN_ENTRY' | 'SET_PASSWORD'>('TOKEN_ENTRY');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initial check for token in URL
    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
            // In a real app, we might verify the token immediately here.
            // For now, we auto-advance to "Set Password" or wait for user to confirm.
            // Let's verify it 'visually' by moving to the password step if it looks like a token.
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
        // Mock Verification
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setStep('SET_PASSWORD');
        }, 800);
    };

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

        setIsLoading(true);
        try {
            // TODO: Call API to set password using token
            // await api.setPassword(token, password);
            console.log('Setting password for token:', token, 'Password:', password);

            // Mock Success Delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Password set successfully! Logging you in...');
            navigate('/review/dashboard'); // Or login page
        } catch (err) {
            console.error(err);
            setError('Failed to set password. Link may be expired.');
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
                            Welcome! Please set a secure password to access your account.
                        </p>

                        {/* Hidden token field for accessibility/form context if needed */}
                        <input type="hidden" name="token" value={token} />

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
                                autoFocus
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
