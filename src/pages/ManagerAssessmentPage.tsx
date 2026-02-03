import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SideContextLayout } from '../layouts/SideContextLayout';
import { Header } from '../components/Header';
import type { LeadershipPrinciple } from '../types';
import { API_BASE_URL } from '../config';

export const ManagerAssessmentPage: React.FC = () => {
    const { requestId } = useParams();
    const { user } = useApp();
    const navigate = useNavigate();

    const [request, setRequest] = useState<any | null>(null);
    const [principles, setPrinciples] = useState<LeadershipPrinciple[]>([]);
    const [feedbackAnswers, setFeedbackAnswers] = useState<any[]>([]);

    // Evaluation Form State
    const [managerContent, setManagerContent] = useState('');
    // const [managerRating, setManagerRating] = useState<number>(0); // Reserved for future
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contextMode, setContextMode] = useState<'AI' | 'FEEDBACK' | null>(null);

    const [employeeRequest, setEmployeeRequest] = useState<any | null>(null);
    const [peerFeedbacks, setPeerFeedbacks] = useState<any[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Resizing Logic for Vertical Split
    const [topSectionHeight, setTopSectionHeight] = useState(50); // Percentage
    const [isResizingVertical, setIsResizingVertical] = useState(false);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    const startVerticalResize = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingVertical(true);
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingVertical || !contentContainerRef.current) return;

            const containerRect = contentContainerRef.current.getBoundingClientRect();
            // Calculate percentage based on Y position relative to container
            const relativeY = e.clientY - containerRect.top;
            const newPercentage = (relativeY / containerRect.height) * 100;

            // Constraints: Min 20%, Max 80%
            if (newPercentage >= 20 && newPercentage <= 80) {
                setTopSectionHeight(newPercentage);
            }
        };

        const handleMouseUp = () => {
            setIsResizingVertical(false);
        };

        if (isResizingVertical) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingVertical]);

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        if (!requestId) return;

        // Fetch Request
        fetch(`${API_BASE_URL}/api/reviews/requests/${requestId}`)
            .then(res => res.json())
            .then(data => {
                setRequest(data);

                // Parse Manager's existing content if any
                if (data.feedbacks && data.feedbacks.length > 0) {
                    const fb = data.feedbacks[0];
                    if (fb.managerContent) {
                        try {
                            setManagerContent(fb.managerContent);
                        } catch (e) { }
                    }
                }

                // [NEW] Fetch Employee's Self Review and Peer Reviews
                if (data.targetId) {
                    fetch(`${API_BASE_URL}/api/reviews/requests?targetId=${data.targetId}`)
                        .then(r => r.json())
                        .then(requests => {
                            // 1. Self Review
                            const selfReview = requests.find((r: any) => r.reviewerId === r.targetId);
                            if (selfReview) {
                                setEmployeeRequest(selfReview);
                                if (selfReview.feedbacks && selfReview.feedbacks.length > 0) {
                                    try {
                                        const answers = JSON.parse(selfReview.feedbacks[0].content);
                                        setFeedbackAnswers(answers);
                                    } catch (e) {
                                        console.error('Failed to parse employee feedback', e);
                                    }
                                }
                            }

                            // 2. Peer Reviews (Reviewer != Target, and Status COMPLETED or SUBMITTED)
                            const peers = requests.filter((r: any) =>
                                r.reviewerId !== r.targetId &&
                                (r.status === 'COMPLETED' || r.status === 'SUBMITTED')
                            );
                            setPeerFeedbacks(peers);
                        })
                        .catch(e => console.error('Failed to fetch employee requests', e));
                }
            })
            .catch(err => console.error(err));

        if (user.orgId) {
            fetch(`${API_BASE_URL}/api/org/${user.orgId}/principles`)
                .then(res => res.json())
                .then(data => {
                    setPrinciples(data);
                    // Prefill manager content if empty
                    setManagerContent(prevContent => {
                        if (!prevContent) {
                            const template = data.map((p: any) => `**${p.title}**\n${p.description}\n\n[Enter your assessment here]\n\n`).join('---\n\n');
                            return template;
                        }
                        return prevContent;
                    });
                })
                .catch(err => console.error(err));
        }

    }, [requestId, user]);

    const handleAction = async (action: 'SAVE_DRAFT' | 'SUBMIT' | 'RETURN') => {
        if (!request) return;
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${requestId}/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    content: managerContent,
                    managerId: user?.id
                })
            });

            if (res.ok) {
                setNotification({ message: 'Evaluation saved successfully!', type: 'success' });
                // Navigate back after delay
                setTimeout(() => navigate('/manager/dashboard'), 1000);
            } else {
                setNotification({ message: 'Action failed', type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setNotification({ message: 'Error performing action', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!request) return <div>Loading...</div>;

    // Mock Interactions Content
    const interactionsContent = (
        <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                AI Metrics for {request?.target?.name || 'Employee'}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <strong>Project Alpha Launch</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Collaborated on the backend API design. Proactive communication.
                    </p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>Sep 12, 2025</div>
                </div>
                <div className="card" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    <strong>Q3 Planning</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Led the planning session effectively. Good detailed notes.
                    </p>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>Aug 15, 2025</div>
                </div>
            </div>
        </div>
    );

    // Peer Feedback Content
    const peerFeedbackContent = (
        <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Peer Feedback for {request?.target?.name || 'Employee'}
            </h3>
            {peerFeedbacks.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No peer feedback received yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {peerFeedbacks.map(pf => {
                        // Parse Content
                        let answers: any[] = [];
                        if (pf.feedbacks && pf.feedbacks.length > 0) {
                            try {
                                answers = JSON.parse(pf.feedbacks[0].content);
                            } catch (e) { }
                        }

                        return (
                            <div key={pf.id} className="card" style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>{pf.reviewer.name}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(pf.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {answers.map((ans: any, idx: number) => {
                                        const title = principles.find(p => p.id === ans.principleId)?.title || 'Question';
                                        return (
                                            <div key={idx} style={{ marginBottom: '0.75rem' }}>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-color)' }}>{title}</div>
                                                <p style={{ margin: '0.25rem 0 0 0', whiteSpace: 'pre-wrap' }}>{ans.content}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Render Employee Feedback (Read Only) - Bottom Section
    const employeeFeedbackView = (
        <div style={{ padding: '2rem' }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                Employee Self-Review
                <span className="status-badge" style={{ fontSize: '0.8rem' }}>
                    {employeeRequest?.status || 'PENDING'}
                </span>
            </h2>
            <div style={{ marginTop: '1.5rem' }}>
                {feedbackAnswers.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No feedback submitted yet.</p>
                ) : (
                    feedbackAnswers.map((ans, idx) => {
                        const p = principles.find(lp => lp.id === ans.principleId);
                        return (
                            <div key={idx} style={{ marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                                    {p?.title || 'Unknown Principle'}
                                </h3>
                                <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', lineHeight: 1.6, backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                    {ans.content}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // Render Manager Evaluation Form - Top Section
    const managerEvaluationView = (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0, marginRight: '0.5rem' }}>Your Evaluation</h2>
                    <button
                        className={`btn ${contextMode === 'AI' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                        onClick={() => setContextMode(contextMode === 'AI' ? null : 'AI')}
                    >
                        {contextMode === 'AI' ? 'Hide AI Metrics' : 'Show AI Metrics'}
                    </button>
                    <button
                        className={`btn ${contextMode === 'FEEDBACK' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}
                        onClick={() => setContextMode(contextMode === 'FEEDBACK' ? null : 'FEEDBACK')}
                    >
                        {contextMode === 'FEEDBACK' ? 'Hide Feedback' : 'Show Feedback'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleAction('SAVE_DRAFT')}
                        disabled={isSubmitting}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        Save Draft
                    </button>
                    {request?.status === 'SUBMITTED' || request?.status === 'EVALUATION_IN_PROGRESS' ? (
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleAction('RETURN')}
                            disabled={isSubmitting}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                        >
                            Return
                        </button>
                    ) : null}
                    <button
                        className="btn btn-primary"
                        onClick={() => handleAction('SUBMIT')}
                        disabled={isSubmitting}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        Submit
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="input-group">
                    <label className="input-label">Overall Assessment & Feedback</label>
                    <textarea
                        className="input-field"
                        rows={10}
                        value={managerContent}
                        onChange={(e) => setManagerContent(e.target.value)}
                        placeholder="Provide your synthesis, coaching tips, and final evaluation here..."
                        style={{
                            color: managerContent.includes('[Enter your assessment here]') ? 'var(--text-secondary)' : 'var(--text-primary)',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>
            </div>
        </div>
    );

    if (!request) return <div>Loading...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Header />
            {/* Main Content using SideContextLayout */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <SideContextLayout
                    isContextOpen={!!contextMode}
                    onCloseContext={() => setContextMode(null)}
                    contextContent={contextMode === 'AI' ? interactionsContent : peerFeedbackContent}
                    mainContent={
                        <div ref={contentContainerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                            {/* Top: Manager Write */}
                            <div style={{
                                height: `${topSectionHeight}%`,
                                overflowY: 'auto',
                                borderBottom: '1px solid var(--border-color)',
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {managerEvaluationView}
                            </div>

                            {/* Resize Handle */}
                            <div
                                onMouseDown={startVerticalResize}
                                style={{
                                    height: '12px', // Slightly larger target
                                    marginTop: '-6px', // Center it over the border
                                    marginBottom: '-6px',
                                    zIndex: 10,
                                    cursor: 'row-resize',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    backgroundColor: isResizingVertical ? 'rgba(0,0,0,0.05)' : 'transparent',
                                    transition: 'background-color 0.2s',
                                    userSelect: 'none'
                                }}
                            >
                                {/* Visual Handle Line */}
                                <div style={{
                                    width: '40px',
                                    height: '4px',
                                    borderRadius: '2px',
                                    backgroundColor: isResizingVertical ? 'var(--primary-color)' : 'var(--border-color)'
                                }} />
                            </div>

                            {/* Bottom: Employee Read */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                backgroundColor: 'var(--bg-secondary)',
                                minHeight: 0 // Crucial for flex scrolling
                            }}>
                                {employeeFeedbackView}
                            </div>

                            {/* Resize Overlay */}
                            {isResizingVertical && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 9999,
                                    cursor: 'row-resize'
                                }} />
                            )}
                        </div>
                    }
                />
            </div>

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
