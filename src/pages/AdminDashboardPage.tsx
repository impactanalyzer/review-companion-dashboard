import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface Cycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
    createdAt: string;
}

export const AdminDashboardPage: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [recentCycles, setRecentCycles] = useState<Cycle[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cycleName, setCycleName] = useState('Q1 2026'); // Default suggestion
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // +14 days default

    // Notification
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
            navigate('/');
            return;
        }

        const fetchCycles = async () => {
            try {
                if (user.customer?.id) {
                    const res = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${user.customer.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setRecentCycles(data);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch cycles', e);
            }
        };

        fetchCycles();
    }, [user, navigate]);

    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    // Warning Modal State
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);

    const handleStartCheck = () => {
        const active = recentCycles.find(c => c.status === 'ACTIVE');
        if (active) {
            setActiveCycle(active);
            setShowWarningModal(true);
        } else {
            setIsModalOpen(true);
        }
    };

    const handleCloseCycle = async () => {
        if (!activeCycle) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/cycles/${activeCycle.id}/close`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setNotification({ message: 'Previous cycle closed successfully.', type: 'success' });
                setShowWarningModal(false);
                setActiveCycle(null);

                // Refresh list
                if (user?.customer?.id) {
                    const cycleRes = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${user.customer.id}`);
                    if (cycleRes.ok) setRecentCycles(await cycleRes.json());
                }

                // Open Create Modal
                setIsModalOpen(true);
            } else {
                setNotification({ message: 'Failed to close cycle.', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setNotification({ message: 'Error closing cycle.', type: 'error' });
        }
    };

    // Edit/Delete State
    const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
    const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

    const handleEditClick = (cycle: Cycle) => {
        setEditingCycle(cycle);
        // Pre-fill dates
        setStartDate(new Date(cycle.startDate).toISOString().split('T')[0]);
        setEndDate(new Date(cycle.endDate).toISOString().split('T')[0]);
    };

    const handleUpdateCycle = async () => {
        if (!editingCycle) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/cycles/${editingCycle.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate })
            });

            if (res.ok) {
                setNotification({ message: 'Cycle updated successfully', type: 'success' });
                setEditingCycle(null);
                // Refresh
                if (user?.customer?.id) {
                    const cycleRes = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${user.customer.id}`);
                    if (cycleRes.ok) setRecentCycles(await cycleRes.json());
                }
            } else {
                setNotification({ message: 'Failed to update cycle', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setNotification({ message: 'Error updating cycle', type: 'error' });
        }
    };

    const handleDeleteClick = (cycle: Cycle) => {
        setCycleToDelete(cycle);
    };

    const confirmDelete = async () => {
        if (!cycleToDelete) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/cycles/${cycleToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setNotification({ message: 'Cycle deleted successfully', type: 'success' });
                setCycleToDelete(null);
                // Refresh
                if (user?.customer?.id) {
                    const cycleRes = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${user.customer.id}`);
                    if (cycleRes.ok) setRecentCycles(await cycleRes.json());
                }
            } else {
                setNotification({ message: 'Failed to delete cycle', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setNotification({ message: 'Error deleting cycle', type: 'error' });
        }
    };

    const handleCreateCycle = async () => {
        if (!cycleName || !startDate || !endDate) {
            setNotification({ message: 'Please fill all fields', type: 'error' });
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/auto-assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scope: 'ORG', // Admin starts for everyone
                    managerId: user?.id, // Just for logging/audit
                    requesterId: user?.id,
                    name: cycleName,
                    startDate,
                    endDate
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNotification({ message: `Cycle "${cycleName}" started! Created reviews.`, type: 'success' });
                setIsModalOpen(false);
                // Refresh cycles
                if (user?.customer?.id) {
                    const cycleRes = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${user.customer.id}`);
                    if (cycleRes.ok) setRecentCycles(await cycleRes.json());
                }
            } else {
                setNotification({ message: 'Failed to start cycle', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setNotification({ message: 'Error connecting to server', type: 'error' });
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ maxWidth: '600px' }}>
                        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage organization-wide review cycles</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/review/dashboard')}
                            className="btn btn-secondary"
                        >
                            My Self Review
                        </button>
                        <button
                            onClick={handleStartCheck}
                            className="btn btn-primary"
                            style={{ display: 'flex', gap: '0.5rem' }}
                        >
                            <span>+</span>
                            Start New Cycle
                        </button>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Recent & Active Cycles</h3>
                    </div>
                    <div>
                        {recentCycles.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No review cycles found. Start a new one above.
                            </div>
                        ) : (
                            recentCycles.map((cycle) => (
                                <div key={cycle.id} style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'background 0.2s',
                                    backgroundColor: 'rgba(255,255,255,0.3)'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                                            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cycle.name}</h4>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: cycle.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                                                color: cycle.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-secondary)'
                                            }}>
                                                {cycle.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem' }}>
                                            <span>
                                                📅 {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                onClick={() => handleEditClick(cycle)}
                                                title="Edit Dates"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                                                onClick={() => handleDeleteClick(cycle)}
                                                title="Delete Cycle"
                                            >
                                                🗑️
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                                                onClick={() => navigate(`/admin/cycle/${cycle.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Warning Modal for Active Cycle */}
                {showWarningModal && activeCycle && (
                    <div style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '450px', margin: '1rem', border: '1px solid var(--error-color)' }}>
                            <h2 className="section-title" style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>Active Cycle Detected</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                The review cycle <strong>{activeCycle.name}</strong> is currently <strong>ACTIVE</strong>.
                            </p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                You must close the current cycle before starting a new one. Closing it will prevent any further review submissions.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowWarningModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCloseCycle}
                                    style={{ backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                                >
                                    Close & Proceed
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Cycle Modal */}
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
                            <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Start Organization Review Cycle</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                This will generate review tasks for <strong>all employees</strong> in the organization.
                            </p>

                            <div className="input-group">
                                <label className="input-label">Cycle Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Q1 2026 Performance Review"
                                    value={cycleName}
                                    onChange={e => setCycleName(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label className="input-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">End Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateCycle}
                                >
                                    Start Cycle
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Cycle Modal */}
                {editingCycle && (
                    <div style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
                            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Edit Cycle Dates</h2>
                            <div className="input-group">
                                <label className="input-label">Start Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">End Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setEditingCycle(null);
                                        // Reset dates to defaults just in case
                                        setStartDate(new Date().toISOString().split('T')[0]);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpdateCycle}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {cycleToDelete && (
                    <div style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '450px', margin: '1rem', border: '1px solid var(--error-color)' }}>
                            <h2 className="section-title" style={{ marginBottom: '1rem', color: 'var(--error-color)' }}>Delete Review Cycle?</h2>
                            <p style={{ marginBottom: '1rem' }}>
                                Are you sure you want to delete <strong>{cycleToDelete.name}</strong>?
                            </p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem', backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '4px', border: '1px solid #fee2e2' }}>
                                <strong>WARNING:</strong> This will permanently delete <strong>ALL data</strong> associated with this cycle, including all review requests, feedback submissions, and manager evaluations. This action cannot be undone.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setCycleToDelete(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmDelete}
                                    style={{ backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                                >
                                    Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Toast */}
                {notification && (
                    <div style={{
                        position: 'fixed', bottom: '2rem', right: '2rem',
                        padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
                        backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444',
                        color: 'white', fontWeight: 500,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 2000,
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        {notification.message}
                    </div>
                )}
            </div>
        </div>
    );
};
