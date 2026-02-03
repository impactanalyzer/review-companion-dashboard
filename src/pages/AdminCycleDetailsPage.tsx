import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    managerId: string | null;
}

interface Request {
    id: string;
    status: string;
    targetId: string;
    reviewerId: string;
    reviewCycleId?: string;
    cycleId?: string; // Legacy
}

interface ManagerStat {
    manager: User;
    total: number;
    completed: number;
    pending: number;
}

export const AdminCycleDetailsPage: React.FC = () => {
    const { cycleId } = useParams();
    const { user } = useApp();
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [cycleName, setCycleName] = useState('Review Cycle');

    useEffect(() => {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'admin')) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Users to build hierarchy
                const customerId = user.customer?.id;
                if (!customerId) return;

                const userRes = await fetch(`${API_BASE_URL}/api/auth/users?customerId=${customerId}`);
                if (userRes.ok) {
                    setUsers(await userRes.json());
                }

                // 2. Fetch Cycle Details to get Name (for legacy string matching)
                let targetCycleName: string | undefined;
                const cycleRes = await fetch(`${API_BASE_URL}/api/reviews/cycles?customerId=${customerId}`);
                if (cycleRes.ok) {
                    const cycles: any[] = await cycleRes.json();
                    const foundCycle = cycles.find(c => c.id === cycleId);
                    if (foundCycle) {
                        targetCycleName = foundCycle.name;
                        setCycleName(foundCycle.name);
                    }
                }

                // 3. Fetch Requests for the cycle
                const reqRes = await fetch(`${API_BASE_URL}/api/reviews/requests?userId=${user.id}`);
                if (reqRes.ok) {
                    const allRequests: Request[] = await reqRes.json();

                    console.log('DEBUG: CycleId Param:', cycleId);
                    console.log('DEBUG: Target Cycle Name:', targetCycleName);

                    // Filter by cycle (checking both new relation and legacy string)
                    const filtered = allRequests.filter(r =>
                        r.reviewCycleId === cycleId ||
                        (targetCycleName && r.cycleId === targetCycleName) ||
                        r.cycleId === cycleId // Fallback if cycleId param passed was name (unlikely via routing)
                    );
                    console.log('DEBUG: Filtered Requests Count:', filtered.length);

                    setRequests(filtered);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, cycleId, navigate]);

    // Recursive Logic
    const stats = useMemo(() => {
        if (users.length === 0) return [];

        // Build Tree Helpers
        const directReportsMap: Record<string, string[]> = {};
        users.forEach(u => {
            if (u.managerId) {
                if (!directReportsMap[u.managerId]) directReportsMap[u.managerId] = [];
                directReportsMap[u.managerId].push(u.id);
            }
        });

        // Helper to check if a user is "Completed"
        // Definition: Manager has completed the evaluation for them.
        // We look for a request where targetId = user.id AND reviewerId = user.managerId AND status = COMPLETED
        const isUserCompleted = (userId: string, managerId: string | null) => {
            if (!managerId) return false; // No manager to review them
            const req = requests.find(r => r.targetId === userId && r.reviewerId === managerId);
            return req?.status === 'COMPLETED';
        };

        // Recursive Stat Calculator
        const getStatsForManager = (managerId: string): { completed: number, total: number } => {
            const reports = directReportsMap[managerId] || [];
            let completed = 0;
            let total = 0;

            reports.forEach(reportId => {
                // count reportee themselves
                total++;
                if (isUserCompleted(reportId, managerId)) {
                    completed++;
                }

                // recurse
                const subStats = getStatsForManager(reportId);
                total += subStats.total;
                completed += subStats.completed;
            });

            return { completed, total };
        };

        // Identify Top Level Managers
        // Those who do not have a manager in the users list
        const userIds = new Set(users.map(u => u.id));
        const topLevelManagers = users.filter(u => !u.managerId || !userIds.has(u.managerId));

        const result: ManagerStat[] = topLevelManagers.map(mgr => {
            const { completed, total } = getStatsForManager(mgr.id);
            return {
                manager: mgr,
                total,
                completed,
                pending: total - completed
            };
        });

        return result;

    }, [users, requests]);

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                        ← Back
                    </button>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '0' }}>Cycle Details</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Progress status for <strong>{cycleName}</strong></p>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 0 }}>Organizational Progress</h3>
                    </div>
                    <div>
                        {stats.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>No data found.</div>
                        ) : (
                            stats.map(stat => (
                                <div key={stat.manager.id} style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            fontWeight: 600
                                        }}>
                                            {stat.manager.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem' }}>{stat.manager.name}</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {stat.manager.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                                {stat.completed} / {stat.total}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                                                Completed
                                            </div>
                                        </div>

                                        <div style={{ width: '100px', height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}%`,
                                                height: '100%',
                                                backgroundColor: stat.completed === stat.total && stat.total > 0 ? 'var(--success-color)' : 'var(--primary-color)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>

                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--error-color)' }}>
                                                {stat.pending}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
                                                Pending
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
