import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { SlideOver } from '../components/SlideOver';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface DashboardData {
    quarters: {
        [quarter: string]: Array<{
            reportee: {
                id: string;
                name: string;
                email: string;
                role: string;
            };
            status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
            reviewId?: string;
        }>
    };
}

export const ManagerDashboardPage: React.FC = () => {
    const { user } = useApp();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [openQuarters, setOpenQuarters] = useState<Record<string, boolean>>({});

    // SlideOver State
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [selectedReportee, setSelectedReportee] = useState<any | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchDashboard();
        }
    }, [user?.id]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/dashboard/manager/${user?.id}`);
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
                // Open the first quarter by default
                const firstQuarter = Object.keys(dashboardData.quarters)[0];
                if (firstQuarter) toggleQuarter(firstQuarter, true);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleQuarter = (quarter: string, forceOpen?: boolean) => {
        setOpenQuarters(prev => ({
            ...prev,
            [quarter]: forceOpen ?? !prev[quarter]
        }));
    };

    const handleReporteeClick = (reportee: any) => {
        setSelectedReportee(reportee);
        setIsSlideOverOpen(true);
        // Pre-fetch users for search when opening panel
        if (users.length === 0) fetchAllUsers();
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/users?customerId=${user?.orgId}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestReview = async (targetId: string, reviewerId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetId,
                    reviewerId,
                    requesterId: user?.id
                })
            });
            if (res.ok) {
                alert('Review requested successfully!'); // Replace with toast later
                setIsSlideOverOpen(false);
            } else {
                alert('Failed to request review.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'var(--success-color, #10b981)';
            case 'IN_PROGRESS': return 'var(--warning-color, #f59e0b)';
            default: return 'var(--text-secondary, #9ca3af)';
        }
    };

    const filteredUsers = users.filter(u =>
        u.id !== selectedReportee?.id && // Don't show reportee themselves (unless self review logic requires it differently)
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="page-title">Manager Dashboard</h1>
                    <button className="btn btn-secondary">My Self Review</button>
                </div>

                {!data?.quarters || Object.keys(data.quarters).length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No review cycles found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {Object.entries(data.quarters).map(([quarter, reportees]) => (
                            <div key={quarter} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                                {/* Accordion Header */}
                                <div
                                    onClick={() => toggleQuarter(quarter)}
                                    style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        borderBottom: openQuarters[quarter] ? '1px solid var(--border-color)' : 'none'
                                    }}
                                >
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{quarter}</h3>
                                    <span style={{ transform: openQuarters[quarter] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                        ▼
                                    </span>
                                </div>

                                {/* Accordion Body */}
                                {openQuarters[quarter] && (
                                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                        {reportees.length === 0 ? (
                                            <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No reportees found.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                                {reportees.map((item) => (
                                                    <div key={item.reportee.id} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '1rem',
                                                        backgroundColor: 'white',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--border-color)',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px',
                                                                borderRadius: '50%',
                                                                backgroundColor: 'var(--bg-secondary)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: 600, color: 'var(--primary-color)'
                                                            }}>
                                                                {item.reportee.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{item.reportee.name}</div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.reportee.role}</div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                                            {/* Status Pill */}
                                                            <div style={{
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '99px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                backgroundColor: `${getStatusColor(item.status)}20`, // 20% opacity
                                                                color: getStatusColor(item.status),
                                                                border: `1px solid ${getStatusColor(item.status)}`
                                                            }}>
                                                                {item.status.replace('_', ' ')}
                                                            </div>

                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
                                                                onClick={() => handleReporteeClick(item.reportee)}
                                                            >
                                                                Manage Reviews
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SlideOver
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title={`Manage Reviews for ${selectedReportee?.name}`}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Request Peer Review</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Search for a colleague to review {selectedReportee?.name}.
                    </p>

                    <input
                        type="text"
                        placeholder="Search users..."
                        className="input-field"
                        style={{ marginBottom: '1rem' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '0.5rem' }}>
                        {filteredUsers.map(u => (
                            <div key={u.id} style={{
                                padding: '0.75rem',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.role}</div>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                    onClick={() => handleRequestReview(selectedReportee.id, u.id)}
                                >
                                    Request
                                </button>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                                No users found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </SlideOver>
        </div>
    );
};
