import React, { useState, useMemo, useEffect } from 'react';
import type { LeadershipPrinciple } from '../types';

interface ReviewSection {
    id: string; // internal id for list management
    principleId: string;
    content: string;
    evidence: ReviewContextArtifact[]; // UI-only for now; not persisted
}

interface ReviewWriterProps {
    reviewerName: string;
    targetId?: string; // [NEW] Added for relevant-interactions context
    targetName?: string; // [NEW] Added for relevant-interactions context
    requestId?: string; // [NEW] Used to look up review-context
    principles: LeadershipPrinciple[];
    onSubmit: (sections: ReviewSection[]) => void;
    onCancel: () => void;
}

import { API_BASE_URL } from '../config';
import { SideContextLayout } from '../layouts/SideContextLayout';
import type { ReviewContext, ReviewContextArtifact } from '../types';
import { domainColor } from './domainColors';

const newSection = (): ReviewSection => ({ id: crypto.randomUUID(), principleId: '', content: '', evidence: [] });

// Rounded evidence tile shown under a principle once an artifact is attached
const EvidenceTile: React.FC<{ artifact: ReviewContextArtifact; onRemove?: () => void }> = ({ artifact, onRemove }) => {
    const color = domainColor(artifact.domain || artifact.type);
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.55rem 0.75rem',
            borderRadius: '10px',
            border: '1px solid #d8dce3',
            borderLeft: `4px solid ${color.ink}`,
            backgroundColor: 'white',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
            fontSize: '0.85rem'
        }}>
            <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '6px',
                backgroundColor: color.bg, color: color.ink, whiteSpace: 'nowrap'
            }}>
                {artifact.type}
            </span>
            <a
                href={artifact.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={artifact.title}
            >
                {artifact.title}
            </a>
            {artifact.domain && (
                <span style={{ fontSize: '0.72rem', color: color.ink, whiteSpace: 'nowrap' }}>{artifact.domain}</span>
            )}
            {onRemove && (
                <button
                    onClick={onRemove}
                    aria-label={`Remove ${artifact.title}`}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1, padding: '0 0.15rem' }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

export const ReviewWriter: React.FC<ReviewWriterProps> = ({ reviewerName, targetId, targetName, requestId, principles, onSubmit, onCancel }) => {
    const [sections, setSections] = useState<ReviewSection[]>(() => [newSection()]);
    const [isReviewing, setIsReviewing] = useState(false);
    // Principle that "Attach" in the Linked Work panel adds evidence to
    const [activeSectionId, setActiveSectionId] = useState<string>(() => sections[0].id);

    // Relevant Interactions (review-context) State
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [reviewContext, setReviewContext] = useState<ReviewContext | null>(null);
    const [contextLoading, setContextLoading] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);

    // Fetch review context if requestId is provided
    useEffect(() => {
        if (!requestId || !isContextOpen || reviewContext || contextLoading) return; // Only fetch if requested and not already loaded

        setContextLoading(true);
        fetch(`${API_BASE_URL}/api/review-context?requestId=${requestId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load relevant interactions');
                return res.json();
            })
            .then(json => {
                if (json?.data) {
                    setReviewContext(json.data);
                } else {
                    setContextError('Failed to load relevant interactions');
                }
            })
            .catch(err => {
                console.error('Failed to fetch review context', err);
                setContextError('Network error loading relevant interactions');
            })
            .finally(() => setContextLoading(false));
    }, [requestId, isContextOpen, reviewContext, contextLoading]);

    // Filter available principles for dropdown (exclude already selected ones, except for the current row)
    const getAvailablePrinciples = (currentPrincipleId: string) => {
        const selectedIds = new Set(sections.map(s => s.principleId).filter(id => id !== currentPrincipleId));
        return principles.filter(p => !selectedIds.has(p.id));
    };

    const handleAddSection = () => {
        const section = newSection();
        setSections([...sections, section]);
        setActiveSectionId(section.id);
    };

    const handleRemoveSection = (id: string) => {
        const remaining = sections.filter(s => s.id !== id);
        setSections(remaining);
        if (id === activeSectionId) setActiveSectionId(remaining[remaining.length - 1].id);
    };

    const updateSection = (id: string, field: 'principleId' | 'content', value: string) => {
        setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const activeIndex = Math.max(0, sections.findIndex(s => s.id === activeSectionId));
    const activeSection = sections[activeIndex];

    const toggleEvidence = (artifact: ReviewContextArtifact) => {
        setSections(sections.map(s => {
            if (s.id !== activeSection.id) return s;
            const attached = s.evidence.some(e => e.id === artifact.id);
            return { ...s, evidence: attached ? s.evidence.filter(e => e.id !== artifact.id) : [...s.evidence, artifact] };
        }));
    };

    const removeEvidence = (sectionId: string, artifactId: string) => {
        setSections(sections.map(s => s.id === sectionId ? { ...s, evidence: s.evidence.filter(e => e.id !== artifactId) } : s));
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
                                {section.evidence.length > 0 && (
                                    <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.75rem' }}>
                                        {section.evidence.map(a => <EvidenceTile key={a.id} artifact={a} />)}
                                    </div>
                                )}
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

    // Relevant Interactions Panel Content
    const contextContent = (
        <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                Relevant Interactions with {targetName || 'Employee'}
            </h3>

            {!requestId ? (
                <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Relevant interactions unavailable (No request identified)</div>
            ) : contextLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Loading relevant interactions...
                </div>
            ) : contextError ? (
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0 }}>{contextError}</p>
                </div>
            ) : reviewContext ? (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        <p style={{ margin: '0 0 1rem 0', fontWeight: 500 }}>{reviewContext.recommendationNarrative}</p>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-secondary)' }}>PRs of theirs you reviewed</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{reviewContext.collaborationSummary.prsOfTheirsYouReviewed}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-secondary)' }}>PRs of yours they reviewed</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{reviewContext.collaborationSummary.prsOfYoursTheyReviewed}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-secondary)' }}>Review discussions</div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{reviewContext.collaborationSummary.reviewDiscussions}</div>
                            </div>
                        </div>
                    </div>

                    {reviewContext.themes.length > 0 && (
                        <div className="card" style={{ padding: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Themes to Consider</h4>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {reviewContext.themes.map((theme, i) => (
                                    <div key={i}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{theme.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{theme.guidance}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {reviewContext.artifactReferences.length > 0 && (
                        <div className="card" style={{ padding: '1rem' }}>
                            <h4 style={{ fontSize: '1rem', margin: '0 0 0.25rem 0', color: 'var(--primary-color)' }}>Linked Work</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                                Attach work as evidence to <strong>Principle {activeIndex + 1}</strong>. Click a principle on the left to switch.
                            </p>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {reviewContext.artifactReferences.map(artifact => {
                                    const attached = activeSection.evidence.some(e => e.id === artifact.id);
                                    return (
                                        <div key={artifact.id} style={{ fontSize: '0.85rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <a
                                                    href={artifact.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none' }}
                                                >
                                                    {artifact.type}: {artifact.title}
                                                </a>
                                                <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)' }}>{artifact.summary}</p>
                                                <div style={{ marginTop: '0.35rem', color: '#999' }}>{artifact.whyShort}</div>
                                            </div>
                                            <button
                                                onClick={() => toggleEvidence(artifact)}
                                                style={{
                                                    fontSize: '0.8rem', fontWeight: 600,
                                                    padding: '0.35rem 0.8rem',
                                                    borderRadius: '999px',
                                                    border: '1px solid var(--primary-color)',
                                                    backgroundColor: attached ? 'var(--primary-color)' : 'white',
                                                    color: attached ? 'white' : 'var(--primary-color)',
                                                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.1)',
                                                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                                                }}
                                            >
                                                {attached ? '✓ Attached' : '+ Attach'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );

    const mainEditorContent = (
        <div
            className="review-writer"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: isContextOpen ? '100%' : '800px',
                margin: isContextOpen ? '0' : '0 auto'
            }}
        >
            <div className="card" style={{ marginBottom: '2rem', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>Write Review</h2>
                    {targetId && (
                        <button
                            className={`btn ${isContextOpen ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                            onClick={() => setIsContextOpen(!isContextOpen)}
                        >
                            {isContextOpen ? 'Hide Relevant Interactions' : 'Show Relevant Interactions'}
                        </button>
                    )}
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Please select at least 3 Leadership Principles to provide feedback on.
                </p>

                <div style={{ display: 'grid', gap: '2rem' }}>
                    {sections.map((section, index) => {
                        const isActive = isContextOpen && section.id === activeSection.id;
                        return (
                        <div
                            key={section.id}
                            className="review-section"
                            onClick={() => setActiveSectionId(section.id)}
                            onFocus={() => setActiveSectionId(section.id)}
                            style={{
                                padding: '1.5rem',
                                border: `1px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                boxShadow: isActive ? '0 0 0 3px rgba(75, 85, 99, 0.12)' : 'none',
                                transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ fontWeight: 'bold' }}>Principle {index + 1}</span>
                                {sections.length > 1 && (
                                    <button
                                        className="text-btn"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveSection(section.id); }}
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

                            {section.evidence.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Evidence attached ({section.evidence.length})
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {section.evidence.map(a => (
                                            <EvidenceTile key={a.id} artifact={a} onRemove={() => removeEvidence(section.id, a.id)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        );
                    })}
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

    return (
        <SideContextLayout
            isContextOpen={isContextOpen}
            onCloseContext={() => setIsContextOpen(false)}
            contextContent={contextContent}
            mainContent={mainEditorContent}
        />
    );
};
