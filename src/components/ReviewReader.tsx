import React, { useMemo } from 'react';
import type { LeadershipPrinciple } from '../types';

interface ReviewReaderProps {
    request: any; // Using any for now to match flexible backend response, ideally strictly typed
    principles: LeadershipPrinciple[];
    onClose: () => void;
}

export const ReviewReader: React.FC<ReviewReaderProps> = ({ request, principles, onClose }) => {

    const feedback = request.feedbacks?.[0]; // Assuming one feedback per request for now

    const parsedContent = useMemo(() => {
        if (!feedback?.content) return [];
        try {
            return JSON.parse(feedback.content);
        } catch (e) {
            console.error("Failed to parse feedback content", e);
            return [];
        }
    }, [feedback]);

    const managerContentPreview = useMemo(() => {
        if (!feedback?.managerContent) return null;
        try {
            // It might be a simple string or JSON. The backend said "JSON string".
            // If it's just a string comment:
            if (feedback.managerContent.startsWith('{') || feedback.managerContent.startsWith('[')) {
                return JSON.parse(feedback.managerContent);
            }
            return feedback.managerContent;
        } catch (e) {
            return feedback.managerContent;
        }
    }, [feedback]);

    if (!feedback) {
        return (
            <div className="card">
                <p>No feedback details available.</p>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 className="section-title" style={{ margin: 0 }}>Review Details</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {new Date(request.createdAt).toLocaleDateString()} • {request.status}
                    </p>
                </div>
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>

            {/* Employee's Self Reflection */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Your Reflection</h3>

                <div style={{ display: 'grid', gap: '2rem', marginTop: '1.5rem' }}>
                    {parsedContent.map((section: any, idx: number) => {
                        const principle = principles.find(p => p.id === section.principleId);
                        return (
                            <div key={idx} className="review-item">
                                <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                                    {principle?.title || 'Unknown Principle'}
                                </h4>
                                <div style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                    {section.content}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Manager's Feedback */}
            {managerContentPreview && (
                <div style={{
                    border: '1px solid var(--primary-color)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)' // Light blue tint
                }}>
                    <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Manager Feedback</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        {typeof managerContentPreview === 'string' ? (
                            <p style={{ whiteSpace: 'pre-wrap' }}>{managerContentPreview}</p>
                        ) : (
                            // If manager content is structured (e.g. per principle), render accordingly.
                            // For now assuming it might be global text based on `ReviewService` logic 
                            // which just says "content" update. 
                            // If it was JSON, we'd iterate. Let's assume text for MVP unless specified.
                            <pre>{JSON.stringify(managerContentPreview, null, 2)}</pre>
                        )}
                    </div>
                    {feedback.managerScore && (
                        <div>
                            <strong>Overall Score:</strong> {feedback.managerScore}
                        </div>
                    )}
                </div>
            )}

            {!managerContentPreview && request.status === 'COMPLETED' && (
                <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    No specific text feedback provided by manager.
                </p>
            )}
        </div>
    );
};
