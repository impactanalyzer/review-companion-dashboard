import React, { useState, useMemo } from 'react';
import type { LeadershipPrinciple } from '../types';

interface ReviewSection {
    id: string; // internal id for list management
    principleId: string;
    content: string;
}

interface ReviewWriterProps {
    reviewerName: string;
    principles: LeadershipPrinciple[];
    onSubmit: (sections: ReviewSection[]) => void;
    onCancel: () => void;
    onToggleContext?: () => void; // New prop
}

export const ReviewWriter: React.FC<ReviewWriterProps> = ({ reviewerName, principles, onSubmit, onCancel, onToggleContext }) => {
    const [sections, setSections] = useState<ReviewSection[]>([
        { id: crypto.randomUUID(), principleId: '', content: '' }
    ]);
    const [isReviewing, setIsReviewing] = useState(false);

    // Filter available principles for dropdown (exclude already selected ones, except for the current row)
    const getAvailablePrinciples = (currentPrincipleId: string) => {
        const selectedIds = new Set(sections.map(s => s.principleId).filter(id => id !== currentPrincipleId));
        return principles.filter(p => !selectedIds.has(p.id));
    };

    const handleAddSection = () => {
        setSections([...sections, { id: crypto.randomUUID(), principleId: '', content: '' }]);
    };

    const handleRemoveSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const updateSection = (id: string, field: 'principleId' | 'content', value: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const isValid = useMemo(() => {
        const filledSections = sections.filter(s => s.principleId && s.content.trim().length > 0);
        // Requirement: Choose a minimum of 3 LPs
        // Also ensure no duplicates (handled by dropdown logic generally, but good to check)
        const uniquePrinciples = new Set(filledSections.map(s => s.principleId));
        return uniquePrinciples.size >= 3;
    }, [sections]);

    if (isReviewing) {
        return (
            <div className="card">
                <h2 className="section-title">Review Your Submission</h2>
                <div style={{ marginBottom: '2rem' }}>
                    <p><strong>Reviewer:</strong> {reviewerName}</p>
                    <p><strong>Principles Covered:</strong> {sections.length}</p>
                </div>

                <div style={{ display: 'grid', gap: '2rem', marginBottom: '2rem' }}>
                    {sections.map((section, idx) => {
                        const principle = principles.find(p => p.id === section.principleId);
                        return (
                            <div key={section.id} className="review-summary-item" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                                    {idx + 1}. {principle?.title || 'Unknown Principle'}
                                </h3>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{section.content}</p>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="btn btn-secondary" onClick={() => setIsReviewing(false)}>Back to Edit</button>
                    <button className="btn btn-primary" onClick={() => onSubmit(sections)}>Submit Final Review</button>
                </div>
            </div>
        );
    }

    return (
        <div className="review-writer">
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Write Review</h2>
                    {onToggleContext && (
                        <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                            onClick={onToggleContext}
                        >
                            Show Interactions
                        </button>
                    )}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Please select at least 3 Leadership Principles to provide feedback on.
                </p>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {sections.map((section, index) => (
                        <div key={section.id} className="review-section" style={{
                            padding: '1.5rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 'bold' }}>Principle {index + 1}</span>
                                {sections.length > 1 && (
                                    <button
                                        className="text-btn"
                                        onClick={() => handleRemoveSection(section.id)}
                                        style={{ color: 'var(--error-color)', cursor: 'pointer', border: 'none', background: 'none' }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Leadership Principle</label>
                                <select
                                    className="input-field"
                                    value={section.principleId}
                                    onChange={(e) => updateSection(section.id, 'principleId', e.target.value)}
                                >
                                    <option value="">Select a Principle...</option>
                                    {getAvailablePrinciples(section.principleId).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>
                                {section.principleId && (
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        {principles.find(p => p.id === section.principleId)?.description}
                                    </p>
                                )}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Feedback / Examples</label>
                                <textarea
                                    className="input-field"
                                    rows={5}
                                    value={section.content}
                                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                                    placeholder="Provide specific examples..."
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={handleAddSection}>
                        + Add
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button
                    className="btn btn-primary"
                    disabled={!isValid}
                    onClick={() => setIsReviewing(true)}
                    style={{ opacity: isValid ? 1 : 0.5 }}
                >
                    Review & Submit
                </button>
            </div>
            {!isValid && (
                <p style={{ textAlign: 'right', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    (Minimum 3 principles required)
                </p>
            )}
        </div>
    );
};
