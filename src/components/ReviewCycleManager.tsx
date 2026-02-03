import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { ReviewReader } from './ReviewReader';

interface ReviewRequest {
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'DECLINED';
    target: { name: string; email: string };
    reviewer: { name: string; email: string };
    createdAt: string;
    cycleId?: string;
}

interface ReviewCycleManagerProps {
    onStartReview?: (request: ReviewRequest) => void;
}

export const ReviewCycleManager: React.FC<ReviewCycleManagerProps> = ({ onStartReview }) => {
    // --- State ---
    const { user } = useApp();
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [requests, setRequests] = useState<ReviewRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // For Reading Completed Reviews
    const [viewingRequest, setViewingRequest] = useState<ReviewRequest | null>(null);
    const [principles, setPrinciples] = useState<any[]>([]); // Need principles for Reader

    useEffect(() => {
        if (user) {
            console.log('ReviewCycleManager: User context:', user);
            fetchRequests();
            // Fetch principles if not passed
            if (user.orgId) {
                fetch(`${API_BASE_URL}/api/org/${user.orgId}/principles`)
                    .then(res => res.json())
                    .then(data => setPrinciples(data))
                    .catch(err => console.error('Failed to fetch principles', err));
            }
        }
    }, [user]); // Removed activeTab dependency

    const fetchRequests = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            // Fetch ALL statuses effectively
            const statusQuery = 'PENDING,IN_PROGRESS,RE_REVIEW,SUBMITTED,COMPLETED,EVALUATION_IN_PROGRESS';

            const res = await fetch(`${API_BASE_URL}/api/reviews/requests?targetId=${user.id}&status=${statusQuery}`);
            if (res.ok) {
                const data = await res.json();
                console.log('ReviewCycleManager: Raw requests data:', data);
                setRequests(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter requests based on Active Tab logic
    const filteredRequests = React.useMemo(() => {
        return requests.filter(req => {
            const isSelf = req.reviewer.email === user?.email || req.reviewerId === user?.id;
            const isPendingStatus = ['PENDING', 'IN_PROGRESS', 'RE_REVIEW'].includes(req.status);

            if (activeTab === 'PENDING') {
                // Pending Tab: Only Actionable Self Reviews
                return isSelf && isPendingStatus;
            } else {
                // Completed Tab: 
                // 1. Peer Reviews (requested by me, waiting for them or done) -> Always here
                // 2. Self Reviews that are finished
                return (!isSelf) || (isSelf && !isPendingStatus);
            }
        });
    }, [requests, activeTab, user]);

    // Helper to group by Quarter
    const getQuarter = (dateString: string) => {
        const d = new Date(dateString);
        const q = Math.floor((d.getMonth() + 3) / 3);
        return `Q${q} ${d.getFullYear()}`;
    };

    const groupedRequests = React.useMemo(() => {
        const groups: Record<string, ReviewRequest[]> = {};
        filteredRequests.forEach(req => {
            const q = req.cycleId ? req.cycleId : getQuarter(req.createdAt);
            if (!groups[q]) groups[q] = [];
            groups[q].push(req);
        });
        return groups;
    }, [filteredRequests]);

    const sortedQuarters = Object.keys(groupedRequests).sort((a, b) => b.localeCompare(a)); // Newest first

    if (viewingRequest) {
        return (
            <ReviewReader
                request={viewingRequest}
                principles={principles}
                onClose={() => setViewingRequest(null)}
            />
        );
    }

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
                    Completed
                </button>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : filteredRequests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)' }}>
                    No {activeTab.toLowerCase()} reviews found.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {sortedQuarters.map(quarter => (
                        <div key={quarter}>
                            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', borderBottom: '1px dashed #eee', paddingBottom: '0.5rem' }}>{quarter}</h3>
                            <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                                {groupedRequests[quarter].map(req => {
                                    const isSelfReview = req.reviewer.email === user?.email; // Safest check or by ID

                                    // Logic:
                                    // If PENDING tab: Likely shouldn't see Peer Reviews here unless we want to see WHO we asked?
                                    // User requirement: "N1 requested feedback from N2... these should pop up in 'Your Reviews', 'Completed' subsection"

                                    // Logic for Title:
                                    const title = isSelfReview ? 'Self Review' : `Feedback from ${req.reviewer.name}`;

                                    return (
                                        <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{title}</h4>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                    {isSelfReview ? 'Assigned' : 'Requested'}: {new Date(req.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {activeTab === 'PENDING' ? (
                                                /* Only show Start Review if it's a Self Review */
                                                isSelfReview ? (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                                        onClick={() => onStartReview?.(req)}
                                                    >
                                                        Start Review
                                                    </button>
                                                ) : (
                                                    <span className="badge" style={{ background: '#F59E0B', color: 'white', fontSize: '0.75rem' }}>Requested</span>
                                                )
                                            ) : (
                                                /* COMPLETED TAB */
                                                isSelfReview ? (
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => setViewingRequest(req)} // Open Reader
                                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                                                    >
                                                        View Feedback
                                                    </button>
                                                ) : (
                                                    /* Peer Reviews are private to Manager */
                                                    <span className="badge" style={{ background: '#6B7280', color: 'white', fontSize: '0.75rem' }}>Submitted to Manager</span>
                                                )
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
