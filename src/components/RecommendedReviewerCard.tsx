import React from 'react';
import type { ReviewerRecommendation } from '../types';
import { domainColor } from './domainColors';

interface RecommendedReviewerCardProps {
    recommendation: ReviewerRecommendation;
    isSelected: boolean;
    onToggle: (reviewerId: string) => void;
}

const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const RecommendedReviewerCard: React.FC<RecommendedReviewerCardProps> = ({ recommendation, isSelected, onToggle }) => {
    const { reviewer, reason, narrative, domains, lastCollaboratedAt, collaborationSummary, artifactReferences } = recommendation;

    return (
        <div
            onClick={() => onToggle(reviewer.id)}
            style={{
                padding: '1rem',
                border: `1px solid ${isSelected ? 'var(--primary-color)' : '#d8dce3'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'white',
                boxShadow: isSelected
                    ? '0 0 0 2px rgba(75, 85, 99, 0.15), 0 4px 12px rgba(15, 23, 42, 0.08)'
                    : '0 1px 3px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.04)',
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{
                    width: '20px', height: '20px', minWidth: '20px',
                    borderRadius: '50%',
                    border: '1px solid #ccc',
                    marginRight: '1rem',
                    marginTop: '2px',
                    backgroundColor: isSelected ? 'var(--primary-color)' : 'white',
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{reviewer.name}</span>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {domains.map(domain => {
                                const color = domainColor(domain);
                                return (
                                    <span
                                        key={domain}
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '999px',
                                            backgroundColor: color.bg,
                                            color: color.ink,
                                            border: `1px solid ${color.border}`
                                        }}
                                    >
                                        {domain}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: 'var(--primary-color)' }}>
                        {reason}
                    </p>

                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {narrative}
                    </p>

                    <div style={{
                        display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
                        marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)'
                    }}>
                        <span>{collaborationSummary.prsOfYoursTheyReviewed} PRs of yours reviewed</span>
                        <span>&middot;</span>
                        <span>{collaborationSummary.prsOfTheirsYouReviewed} PRs you reviewed</span>
                        <span>&middot;</span>
                        <span>{collaborationSummary.reviewDiscussions} review discussions</span>
                    </div>

                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: '#999' }}>
                        Last collaborated {formatDate(lastCollaboratedAt)}
                    </div>

                    {artifactReferences.length > 0 && (
                        <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {artifactReferences.map((artifact, idx) => (
                                <a
                                    key={idx}
                                    href={artifact.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ fontSize: '0.78rem', color: 'var(--primary-color)', textDecoration: 'none' }}
                                >
                                    {artifact.type}: {artifact.title} — {artifact.whyShort}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
