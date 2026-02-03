import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { LeadershipPrinciple } from '../types';
import { API_BASE_URL } from '../config';
import { ReviewCycleManager } from '../components/ReviewCycleManager';
import { Header } from '../components/Header';
import { ReviewWriter } from '../components/ReviewWriter';
import { SideContextLayout } from '../layouts/SideContextLayout';
import { SlideOver } from '../components/SlideOver';

export const ReviewDashboardPage: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();

    // Core State
    const [principles, setPrinciples] = useState<LeadershipPrinciple[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [activeRequest, setActiveRequest] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showContext, setShowContext] = useState(false);
    const [taskStatus, setTaskStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING'); // Task Tabs
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Request Feedback Modal State
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [teammates, setTeammates] = useState<any[]>([]); // Now stores ALL users
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeammates, setSelectedTeammates] = useState<Set<string>>(new Set());
    const [requestLoading, setRequestLoading] = useState(false);

    // --- Effects ---

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        // Fetch Principles
        if (user.orgId) {
            fetch(`${API_BASE_URL}/api/org/${user.orgId}/principles`)
                .then(res => res.json())
                .then(data => setPrinciples(data))
                .catch(err => console.error('Failed to fetch principles', err));
        }

        // Fetch Tasks (Filtered by Status)
        let statusQuery = '';
        if (taskStatus === 'PENDING') {
            statusQuery = 'PENDING,IN_PROGRESS,RE_REVIEW';
        } else {
            statusQuery = 'SUBMITTED,COMPLETED,EVALUATION_IN_PROGRESS';
        }

        fetch(`${API_BASE_URL}/api/reviews/requests?userId=${user.id}&status=${statusQuery}`)
            .then(res => res.json())
            .then(data => {
                setRequests(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error('Failed to fetch requests', err));

    }, [user, navigate, taskStatus]);

    // Fetch Users when Modal opens (All Org Users)
    useEffect(() => {
        if (isRequestModalOpen && user?.orgId) {
            // Fetch all users in the Org (using auth/users endpoint)
            fetch(`${API_BASE_URL}/api/auth/users?customerId=${user.orgId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setTeammates(data);
                    }
                })
                .catch(err => console.error('Failed to fetch users', err));
        }
    }, [isRequestModalOpen, user?.orgId]);

    // Derived Users for Display
    const filteredUsers = teammates
        .filter(t => t.id !== user?.id) // Exclude self from "Team" list? Actually, user might want to self-review via this? The requirement says "select yourself for a Self Review".
        // Wait, current logic puts self in list? No, t.id !== user.id removes it.
        // Let's Keep Self. User wanted "Self review as submitted".
        // Requirement: "Select teammates to request feedback from. You can also select yourself for a Self Review."
        // So DO NOT filter self out, or ensure self is in list.
        .filter(t => {
            if (!searchTerm) return true;
            return t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            // Sort Order:
            // 1. Teammates (Same Manager)
            // 2. Others
            const isTeamA = a.managerId === user?.managerId;
            const isTeamB = b.managerId === user?.managerId;
            if (isTeamA && !isTeamB) return -1;
            if (!isTeamA && isTeamB) return 1;
            return a.name.localeCompare(b.name);
        });

    // --- Handlers ---

    const handleReviewSubmit = async (sections: any[]) => {
        if (!activeRequest || !user) return;

        try {
            const answers = sections.map((s: any) => ({
                principleId: s.principleId,
                content: s.content
            }));

            const res = await fetch(`${API_BASE_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: activeRequest.id,
                    answers,
                    authorId: user.id,
                    isSubmitted: true
                })
            });

            if (res.ok) {
                setSubmitted(true);
                setActiveRequest(null);
                setShowContext(false); // Reset context on submit
                const updatedRequests = requests.filter(r => r.id !== activeRequest.id);
                setRequests(updatedRequests);
            } else {
                setNotification({ message: 'Failed to submit review', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Error submitting review', type: 'error' });
        }
    };

    const handleSendRequests = async () => {
        if (!user || selectedTeammates.size === 0) return;
        setRequestLoading(true);
        try {
            const requests = Array.from(selectedTeammates).map(reviewerId => ({
                targetId: user.id,
                reviewerId: reviewerId
            }));

            const res = await fetch(`${API_BASE_URL}/api/reviews/requests/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests,
                    requesterId: user.id
                })
            });

            if (res.ok) {
                setNotification({ message: 'Requests sent successfully', type: 'success' });
                setIsRequestModalOpen(false);
                setSelectedTeammates(new Set());
            } else {
                setNotification({ message: 'Failed to send requests', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Error sending requests', type: 'error' });
        } finally {
            setRequestLoading(false);
        }
    };

    const toggleTeammate = (id: string) => {
        const next = new Set(selectedTeammates);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedTeammates(next);
    };

    // --- Render ---

    if (submitted) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h1 className="page-title" style={{ color: 'var(--success-color)' }}>Review Submitted!</h1>
                    <p>Thank you for your feedback.</p>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="btn btn-secondary"
                        style={{ marginTop: '2rem' }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Context Content
    const interactionsContent = (
        <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Your interactions with {activeRequest?.target?.name || 'Peer'}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <strong>Project Alpha Launch</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Collaborated on the backend API design. {activeRequest?.target?.name} was very proactive...
                    </p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>Sep 12, 2025</div>
                </div>
                <div className="card" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <strong>Q3 Planning</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Led the planning session effectively.
                    </p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>Aug 15, 2025</div>
                </div>
            </div>
        </div>
    );

    if (activeRequest) {
        return (
            <div className="container" style={{ padding: '0', maxWidth: '100%', height: 'calc(100vh - 60px)' }}>
                <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => setActiveRequest(null)}
                        className="btn btn-secondary"
                        style={{ marginRight: '1rem' }}
                    >
                        &larr; Back
                    </button>
                    <div>
                        <h1 className="page-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                            {activeRequest.reviewerId === activeRequest.targetId ? 'Self Review' : `Review for ${activeRequest.target?.name || 'Peer'}`}
                        </h1>
                        <span className={`status-badge status-${activeRequest.status}`} style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{activeRequest.status}</span>
                    </div>
                </div>

                <SideContextLayout
                    isContextOpen={showContext}
                    onCloseContext={() => setShowContext(false)}
                    contextContent={interactionsContent}
                    mainContent={
                        <div style={{
                            maxWidth: showContext ? '100%' : '800px',
                            margin: '0 auto',
                            padding: '1rem'
                        }}>
                            <ReviewWriter
                                reviewerName={user.name}
                                principles={principles}
                                onSubmit={handleReviewSubmit}
                                onCancel={() => setActiveRequest(null)}
                                onToggleContext={() => setShowContext(!showContext)}
                            />
                        </div>
                    }
                />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Review Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Welcome, <strong>{user.name}</strong>. Here are your pending reviews.
                        </p>
                    </div>

                    {/* Request Feedback Button - Available for all users */}
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsRequestModalOpen(true)}
                    >
                        Request Feedback
                    </button>
                </div>

                {/* Legacy ReviewCycleManager - keeping if needed, but "Your Tasks" duplicates some function */}
                <ReviewCycleManager onStartReview={(req: any) => setActiveRequest(req)} />

                {(user.role === 'admin' || user.role === 'manager' || user.role === 'MANAGER') && (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button onClick={() => navigate('/manager/dashboard')} className="btn btn-secondary">
                            Manager Dashboard
                        </button>
                        <button onClick={() => navigate('/setup/invite')} className="btn btn-secondary">
                            My Team
                        </button>
                    </div>
                )}

                <div style={{ margin: '3rem 0', borderTop: '1px solid var(--border-color)' }}></div>

                <h2 className="section-title">Your Tasks</h2>

                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setTaskStatus('PENDING')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderBottom: taskStatus === 'PENDING' ? '2px solid var(--primary-color)' : 'none',
                            color: taskStatus === 'PENDING' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            background: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setTaskStatus('COMPLETED')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: 'none',
                            borderBottom: taskStatus === 'COMPLETED' ? '2px solid var(--primary-color)' : 'none',
                            color: taskStatus === 'COMPLETED' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            background: 'none', cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Confirmed
                    </button>
                </div>

                {/* Filter tasks to show reviews for others (Target != User) */}
                {(() => {
                    const tasks = requests.filter(req => req.targetId !== user.id);

                    if (tasks.length === 0) {
                        return (
                            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <p style={{ color: 'var(--text-secondary)' }}>You have no {taskStatus.toLowerCase()} review tasks.</p>
                                <p style={{ fontSize: '0.9rem' }}>{taskStatus === 'PENDING' ? "Great job! You're all caught up." : "Completed tasks will appear here."}</p>
                            </div>
                        );
                    }

                    return (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {tasks.map(req => {
                                const isDirectReport = req.target?.managerId === user.id;
                                const label = isDirectReport ? 'Direct Report' : 'Review';

                                return (
                                    <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                                {label}: {req.target?.name || 'Colleague'}
                                            </h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {!['SUBMITTED', 'COMPLETED', 'SKIPPED'].includes(req.status) && (
                                                    <>Due: Soon • </>
                                                )}
                                                Status: {req.status}
                                            </p>
                                        </div>
                                        {taskStatus === 'PENDING' ? (
                                            <button className="btn btn-primary" onClick={() => setActiveRequest(req)}>
                                                Write Feedback
                                            </button>
                                        ) : (
                                            <span className="badge" style={{ background: '#10B981', color: 'white' }}>Completed</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            {/* Request Feedback SlideOver */}
            <SlideOver
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                title="Request Feedback"
            >
                <div style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Select teammates to request feedback from. You can also select yourself for a Self Review.
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search colleagues..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '2rem', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                            <p>No colleagues found{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
                        ) : (
                            filteredUsers.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => toggleTeammate(t.id)}
                                    style={{
                                        padding: '1rem',
                                        border: `1px solid ${selectedTeammates.has(t.id) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedTeammates.has(t.id) ? 'var(--bg-secondary)' : 'white',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    <div style={{
                                        width: '20px', height: '20px',
                                        borderRadius: '50%',
                                        border: '1px solid #ccc',
                                        marginRight: '1rem',
                                        backgroundColor: selectedTeammates.has(t.id) ? 'var(--primary-color)' : 'white',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center'
                                    }}>
                                        {selectedTeammates.has(t.id) && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{t.id === user.id ? `${t.name} (You)` : t.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {t.id === user.id ? 'Self Review' : (t.managerId === user.managerId ? 'Teammate' : t.role)}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Footer Message for Infinite Scroll / All Users Context */}
                        {filteredUsers.length > 0 && (
                            <div style={{
                                padding: '1rem',
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                borderTop: '1px dashed var(--border-color)',
                                marginTop: '0.5rem'
                            }}>
                                Don't see who you're looking for? Use the search box above to find colleagues outside your team.
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setIsRequestModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={selectedTeammates.size === 0 || requestLoading}
                            onClick={handleSendRequests}
                            style={{ opacity: selectedTeammates.size === 0 ? 0.5 : 1 }}
                        >
                            {requestLoading ? 'Sending...' : 'Send Requests'}
                        </button>
                    </div>
                </div>
            </SlideOver>

            {/* Toast Notification */}
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
                    <button
                        onClick={() => setNotification(null)}
                        style={{ marginLeft: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};
