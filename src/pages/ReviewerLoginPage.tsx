import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const ReviewerLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [orgName, setOrgName] = useState('');
    const { loginReviewer } = useApp();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && orgName) {
            await loginReviewer(email, orgName);
            navigate('/review/dashboard');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>Reviewer Login</h1>
                <form onSubmit={handleSubmit}>
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
                        <label className="input-label" htmlFor="email">Your Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. john@example.com"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Enter Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};
