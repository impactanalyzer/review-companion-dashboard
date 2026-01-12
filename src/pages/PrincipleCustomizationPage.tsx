import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LeadershipPrinciple } from '../types';

export const PrincipleCustomizationPage: React.FC = () => {
    const { user, updateProfile } = useApp();
    const navigate = useNavigate();
    const [principles, setPrinciples] = useState<LeadershipPrinciple[]>([]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (!user.selectedTemplateId) {
            navigate('/setup/template');
            return;
        }
        setPrinciples(user.customizedPrinciples);
    }, [user, navigate]);

    const handleChange = (id: string, field: 'title' | 'description', value: string) => {
        setPrinciples(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSave = () => {
        updateProfile({ customizedPrinciples: principles });
        // In a real app, this might redirect to a dashboard or show a success message.
        // For now, we'll redirect to the "Review Mode" view (which we'll build next).
        navigate('/review/dashboard');
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Customize Principles</h1>
                <button onClick={handleSave} className="btn btn-primary">
                    Save & Finish Setup
                </button>
            </div>

            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Edit the principles below to better fit your specific team or role.
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {principles.map(principle => (
                    <div key={principle.id} className="card">
                        <div className="input-group">
                            <label className="input-label">Principle Title</label>
                            <input
                                type="text"
                                className="input-field"
                                value={principle.title}
                                onChange={(e) => handleChange(principle.id, 'title', e.target.value)}
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="input-label">Description</label>
                            <textarea
                                className="input-field"
                                rows={3}
                                value={principle.description}
                                onChange={(e) => handleChange(principle.id, 'description', e.target.value)}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
