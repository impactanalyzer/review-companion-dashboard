import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { SelectedPrinciple } from './TemplateSelectionPage';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export const PrincipleSummaryPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useApp();

    // Expect selectedPrinciples to be passed via route state
    // If not, we should probably redirect back to selection or handle gracefully
    const principles = (location.state?.principles as SelectedPrinciple[]) || [];
    const templateName = (location.state?.templateName as string) || '';
    const tags = (location.state?.tags as string[]) || [];

    console.log('PrincipleSummaryPage Mount State:', location.state);
    console.log('Received Tags:', tags);

    const [isLoading, setIsLoading] = useState(false);
    const [finalName, setFinalName] = useState(templateName || 'My Team Principles');

    if (principles.length === 0) {
        // ...
    }

    const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
        // ...
        try {
            const payload = {
                name: finalName,
                isDefault: true,
                status: status,
                tags: tags, // Include tags
                principles: principles.map(p => ({
                    title: p.title,
                    description: p.description
                }))
            };
            // ...

            const response = await fetch(`${API_BASE_URL}/api/templates/${user!.orgId}/custom`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to save template');
            }

            // Success
            if (status === 'PUBLISHED') {
                navigate('/setup/invite');
            } else {
                alert('Draft saved successfully!');
                // Maybe stay here or go somewhere else
            }

        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 className="page-title">Review & Confirm</h1>
            <p className="page-subtitle">
                Review the leadership principles you've selected for your team.
                You can save this as a draft or confirm to start using them immediately.
            </p>

            {/* Template Name Input */}
            <div style={{ marginBottom: '2rem' }}>
                <label className="input-label" htmlFor="templateName">Name this set of principles</label>
                <input
                    id="templateName"
                    className="input-field"
                    value={finalName}
                    onChange={(e) => setFinalName(e.target.value)}
                    placeholder="e.g. Engineering Values 2024"
                />
            </div>

            <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {principles.map((p, idx) => (
                    <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h3 className="card-title">{p.title}</h3>
                        <p className="card-description">{p.description}</p>
                        {p.source === 'custom' && (
                            <span className="badge" style={{ alignSelf: 'flex-start', background: 'var(--primary-color)', color: 'white' }}>Custom</span>
                        )}
                        {/* We could signify if it's from a standard template too */}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/setup/template', {
                        state: {
                            existingSelection: principles,
                            existingTags: tags
                        }
                    })}
                    disabled={isLoading}
                >
                    Back to Modify
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={isLoading}
                >
                    Save Draft
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit('PUBLISHED')}
                    disabled={isLoading}
                >
                    {isLoading ? 'Saving...' : 'Confirm and Save'}
                </button>
            </div>
        </div>
    );
};
