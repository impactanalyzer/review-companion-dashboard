import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface ReviewRequest {
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'DECLINED';
    target: { name: string; email: string };
    createdAt: string;
}

export const ReviewCycleManager: React.FC = () => {
    const { user } = useApp();
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [requests, setRequests] = useState<ReviewRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user, activeTab]);

    const fetchRequests = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/requests?userId=${user.id}&status=${activeTab}`);
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Your Reviews</h2>
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <button
                    onClick={() => setActiveTab('PENDING')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: activeTab === 'PENDING' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'PENDING' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        background: 'none', cursor: 'pointer', fontWeight: 600
                    }}
                >
                    Pending
                </button>
                <button
                    onClick={() => setActiveTab('COMPLETED')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderTop: 'none',
                        borderLeft: 'none',
                        borderRight: 'none',
                        borderBottom: activeTab === 'COMPLETED' ? '2px solid var(--primary-color)' : 'none',
                        color: activeTab === 'COMPLETED' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        background: 'none', cursor: 'pointer', fontWeight: 600
                    }}
                >
                    Confirmed
                </button>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : requests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }}>
                    No {activeTab.toLowerCase()} reviews found.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {requests.map(req => (
                        <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: 0 }}>Review for {req.target.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Assigned: {new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                            {activeTab === 'PENDING' ? (
                                <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>Write Feedback</button>
                            ) : (
                                <span className="badge" style={{ background: '#10B981', color: 'white' }}>Completed</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
