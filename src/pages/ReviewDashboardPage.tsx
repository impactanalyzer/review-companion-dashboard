import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Review, LeadershipPrinciple } from '../types';
import { ReviewCycleManager } from '../components/ReviewCycleManager';

export const ReviewDashboardPage: React.FC = () => {
    const { user, addReview } = useApp();
    const navigate = useNavigate();
    const [reviewerName, setReviewerName] = useState('');
    const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});
    const [submitted, setSubmitted] = useState(false);
    const [principles, setPrinciples] = useState<LeadershipPrinciple[]>([]);

    useEffect(() => {
        if (!user) {
            navigate('/review/login');
            return;
        }

        if (user.orgId) {
            fetch(`http://localhost:3001/api/org/${user.orgId}/principles`)
                .then(res => res.json())
                .then(data => setPrinciples(data))
                .catch(err => console.error('Failed to fetch principles', err));
        }
    }, [user, navigate]);

    const handleRatingChange = (principleId: string, score: number) => {
        setRatings(prev => ({
            ...prev,
            [principleId]: { ...prev[principleId], score }
        }));
    };

    const handleCommentChange = (principleId: string, comment: string) => {
        setRatings(prev => ({
            ...prev,
            [principleId]: { ...prev[principleId], comment }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const review: Review = {
            id: crypto.randomUUID(),
            targetUserId: user.id, // In this flow, we are reviewing the org/culture, but let's keep it simple
            reviewerName,
            ratings,
            submittedAt: new Date().toISOString(),
        };

        addReview(review);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <h1 className="page-title" style={{ color: 'var(--success-color)' }}>Review Submitted!</h1>
                    <p>Thank you for your feedback.</p>
                    <button
                        onClick={() => { setSubmitted(false); setRatings({}); setReviewerName(''); }}
                        className="btn btn-secondary"
                        style={{ marginTop: '2rem' }}
                    >
                        Submit Another Review
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <h1 className="page-title">Performance Review</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Reviewing for Organization: <strong>{user.orgName}</strong>
            </p>

            <ReviewCycleManager />

            {user.role === 'admin' ? (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => navigate('/setup/template')}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.9rem' }}
                    >
                        ⚙️ Manage Principles
                    </button>
                </div>
            ) : null}

            <div style={{ margin: '3rem 0', borderTop: '1px solid var(--border-color)' }}></div>

            <h2 className="section-title">Submit New Review</h2>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="input-group">
                        <label className="input-label">Your Name (Reviewer)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="e.g. John Smith"
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {principles.map(principle => (
                        <div key={principle.id} className="card">
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{principle.title}</h3>
                            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{principle.description}</p>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="input-label">Rating (1-5)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(score => (
                                        <button
                                            key={score}
                                            type="button"
                                            onClick={() => handleRatingChange(principle.id, score)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                border: '1px solid var(--border-color)',
                                                backgroundColor: ratings[principle.id]?.score === score ? 'var(--primary-color)' : 'white',
                                                color: ratings[principle.id]?.score === score ? 'white' : 'var(--text-primary)',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: 0 }}>
                                <label className="input-label">Comments / Examples</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={ratings[principle.id]?.comment || ''}
                                    onChange={(e) => handleCommentChange(principle.id, e.target.value)}
                                    placeholder="Share specific examples..."
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
                        Submit Review
                    </button>
                </div>
            </form>
        </div>
    );
};
