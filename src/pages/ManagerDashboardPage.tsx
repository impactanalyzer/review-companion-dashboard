import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
            status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED';
            reviewId?: string;
        }>
    };
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    managerId?: string | null;
}

export const ManagerDashboardPage: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [openQuarters, setOpenQuarters] = useState<Record<string, boolean>>({});

    // SlideOver State
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [selectedReportee, setSelectedReportee] = useState<any | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Request State
    const [requestedReviewers, setRequestedReviewers] = useState<Set<string>>(new Set());
    const [existingRequests, setExistingRequests] = useState<Set<string>>(new Set());
    const [sending, setSending] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);



    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (user?.id) {
            fetchDashboard();
        }
    }, [user, navigate]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const fetchDashboard = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/dashboard/manager/${user?.id}`);
            if (res.ok) {
                const dashboardData = await res.json();
                setData(dashboardData);
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

    const handleReporteeClick = async (reportee: any) => {
        setSelectedReportee(reportee);
        setIsSlideOverOpen(true);
        setRequestedReviewers(new Set());
        setExistingRequests(new Set());

        if (users.length === 0) fetchAllUsers();

        await fetchTargetRequests(reportee.id);
    };

    const fetchTargetRequests = async (targetId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/requests?targetId=${targetId}`);
            if (res.ok) {
                const requests = await res.json();
                const existing = new Set<string>();
                requests.forEach((r: any) => {
                    if (r.reviewerId) existing.add(r.reviewerId);
                });
                setExistingRequests(existing);
            }
        } catch (err) {
            console.error('Failed to fetch existing requests', err);
        }
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

    const handleToggleRequest = (reviewerId: string) => {
        if (existingRequests.has(reviewerId)) return;

        setRequestedReviewers(prev => {
            const next = new Set(prev);
            if (next.has(reviewerId)) {
                next.delete(reviewerId);
            } else {
                next.add(reviewerId);
            }
            return next;
        });
    };

    const handleSendRequests = async () => {
        if (requestedReviewers.size === 0 || !selectedReportee) return;
        setSending(true);

        try {
            const requests = Array.from(requestedReviewers).map(reviewerId => ({
                targetId: selectedReportee.id,
                reviewerId: reviewerId
            }));

            const res = await fetch(`${API_BASE_URL}/api/reviews/requests/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests,
                    requesterId: user?.id
                })
            });

            if (res.ok) {
                setNotification({ message: 'Requests sent successfully!', type: 'success' });
                setExistingRequests(prev => {
                    const next = new Set(prev);
                    requestedReviewers.forEach(id => next.add(id));
                    return next;
                });
                setRequestedReviewers(new Set());
                fetchDashboard();
            } else {
                const err = await res.json();
                setNotification({ message: `Failed: ${err.error}`, type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Failed to send requests', type: 'error' });
        } finally {
            setSending(false);
        }
    };

    const getStatusStyle = (status: string) => {
        const baseStyle = {
            padding: '0.25rem 0.75rem',
            borderRadius: '99px',
            fontSize: '0.8rem',
            fontWeight: 600,
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
        };

        if (status === 'IN_PROGRESS') {
            return {
                ...baseStyle,
                color: 'var(--primary-color)',
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            };
        }

        if (status === 'SUBMITTED') {
            return {
                ...baseStyle,
                color: 'var(--success-color, #10b981)',
                borderColor: 'var(--success-color, #10b981)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            };
        }

        if (status === 'COMPLETED') {
            return {
                ...baseStyle,
                backgroundColor: 'var(--success-color, #10b981)',
                color: 'white',
                borderColor: 'var(--success-color, #10b981)'
            };
        }
        return baseStyle;
    };

    const getStatusLabel = (status: string) => {
        if (status === 'IN_PROGRESS') return 'Review Started';
        if (status === 'SUBMITTED') return 'Review Submitted';
        if (status === 'COMPLETED') return 'Assessment Complete';
        return 'Not Started';
    };

    const sortedUsers = useMemo(() => {
        if (!selectedReportee) return [];
        let list = users.filter(u =>
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return list.sort((a, b) => {
            if (a.id === selectedReportee.id) return -1;
            if (b.id === selectedReportee.id) return 1;
            const aIsDirect = a.managerId === selectedReportee.id;
            const bIsDirect = b.managerId === selectedReportee.id;
            if (aIsDirect && !bIsDirect) return -1;
            if (!aIsDirect && bIsDirect) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [users, selectedReportee, searchQuery]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="page-title">Manager Dashboard</h1>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/review/dashboard')}
                        >
                            My Self Review
                        </button>
                    </div>
                </div>

                {!data?.quarters || Object.keys(data.quarters).length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No review cycles found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {Object.entries(data.quarters).map(([quarter, reportees]) => (
                            <div key={quarter} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
                                {openQuarters[quarter] && (
                                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                        {reportees.length === 0 ? (
                                            <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No reportees found.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                                {reportees.map((item) => (
                                                    <div key={item.reportee.id} style={{
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        padding: '1rem', backgroundColor: 'white', borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '50%',
                                                                backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                                            <div style={getStatusStyle(item.status)}>
                                                                {getStatusLabel(item.status)}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button
                                                                    className="btn btn-secondary"
                                                                    style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
                                                                    onClick={() => handleReporteeClick(item.reportee)}
                                                                >
                                                                    Manage Reviews
                                                                </button>
                                                                {(item.status === 'SUBMITTED' || item.status === 'COMPLETED') && item.reviewId && (
                                                                    <button
                                                                        className="btn btn-primary"
                                                                        style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
                                                                        onClick={() => navigate(`/manager/assessment/${item.reviewId}`)}
                                                                    >
                                                                        Evaluate
                                                                    </button>
                                                                )}
                                                            </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Request Peer Review</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Search for a colleague to review {selectedReportee?.name}.
                            </p>
                            <input type="text" placeholder="Search users..." className="input-field" style={{ marginBottom: '1rem' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {sortedUsers.map(u => {
                                    const isNewlyRequested = requestedReviewers.has(u.id);
                                    const isExisting = existingRequests.has(u.id);
                                    const isRequested = isNewlyRequested || isExisting;

                                    const isSelf = u.id === selectedReportee?.id;
                                    const isDirect = u.managerId === selectedReportee?.id;

                                    return (
                                        <div key={u.id} style={{
                                            padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            backgroundColor: isSelf ? 'var(--bg-secondary)' : 'white'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                                                    {u.name} {isSelf && '(Self)'} {isDirect && '(Direct Report)'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.role}</div>
                                            </div>
                                            <button
                                                className={isRequested ? "" : "btn btn-secondary"}
                                                style={isRequested ? {
                                                    fontSize: '0.75rem', padding: '0.25rem 0.6rem',
                                                    backgroundColor: 'var(--success-color, #10b981)', color: 'white',
                                                    border: 'none', borderRadius: 'var(--radius-md)',
                                                    cursor: isExisting ? 'default' : 'pointer'
                                                } : { fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                                onClick={() => handleToggleRequest(u.id)}
                                                disabled={isExisting}
                                            >
                                                {isRequested ? 'Requested' : 'Request'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1rem 0', borderTop: '1px solid var(--border-color)', marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => setIsSlideOverOpen(false)} disabled={sending}>Cancel</button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSendRequests}
                            disabled={sending || requestedReviewers.size === 0}
                            style={{ opacity: requestedReviewers.size === 0 ? 0.5 : 1 }}
                        >
                            {sending ? 'Sending...' : `Send ${requestedReviewers.size} Request${requestedReviewers.size !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </SlideOver>

            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                    backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white', fontWeight: 500,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};
