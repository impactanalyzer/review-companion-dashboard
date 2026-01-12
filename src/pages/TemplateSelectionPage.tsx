import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
// API_BASE_URL removed as it is currently unused in this component (saving logic is simulated/logged for now)

// Extended type for selection state
export interface SelectedPrinciple {
    id: string; // generated UUID for new ones, or original ID for standard
    title: string;
    description: string;
    source: 'custom' | 'standard';
    originalId?: string; // Reference to the standard principle ID if copied
}

export const TemplateSelectionPage: React.FC = () => {
    const { templates, user } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize from received state if available (e.g. Back from Summary)
    const existingSelection = (location.state as any)?.existingSelection as SelectedPrinciple[] | undefined;
    const existingTags = (location.state as any)?.existingTags as string[] | undefined;

    console.log('TemplateSelectionPage Mount State:', location.state);
    console.log('Restoring Tags:', existingTags);

    // Changing from Set of IDs to Array of Objects
    const [selectedPrinciples, setSelectedPrinciples] = useState<SelectedPrinciple[]>(existingSelection || []);

    // Domain Tags for the Custom Template
    const [customTemplateTags, setCustomTemplateTags] = useState<Set<string>>(new Set(existingTags || []));

    // UI State for Editing/Adding
    const [isEditing, setIsEditing] = useState<string | null>(null); // ID of principle being edited
    const [editData, setEditData] = useState({ title: '', description: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/');
        }
    }, [user, navigate]);

    // --- Actions ---

    const handleSelectStandard = (principle: { id: string, title: string, description: string }) => {
        // Check if already selected (by original ID)
        const exists = selectedPrinciples.find(p => p.originalId === principle.id);
        if (exists) {
            // Deselect
            setSelectedPrinciples(prev => prev.filter(p => p.originalId !== principle.id));
        } else {
            // Select (Copy/Fork)
            const newPrinciple: SelectedPrinciple = {
                id: crypto.randomUUID(), // New unique ID for the copy
                title: principle.title,
                description: principle.description,
                source: 'standard',
                originalId: principle.id
            };
            setSelectedPrinciples(prev => [...prev, newPrinciple]);
        }
    };

    const handleRemoveSelected = (id: string) => {
        setSelectedPrinciples(prev => prev.filter(p => p.id !== id));
    };

    const startAddingNew = () => {
        setEditData({ title: '', description: '' });
        setIsAddingNew(true);
        setIsEditing(null);
    };

    const saveNewPrinciple = () => {
        if (!editData.title.trim()) return;
        const newPrinciple: SelectedPrinciple = {
            id: crypto.randomUUID(),
            title: editData.title,
            description: editData.description,
            source: 'custom'
        };
        setSelectedPrinciples(prev => [...prev, newPrinciple]);
        setIsAddingNew(false);
    };

    const startEditing = (principle: SelectedPrinciple) => {
        setEditData({ title: principle.title, description: principle.description });
        setIsEditing(principle.id);
        setIsAddingNew(false);
    };

    const saveEdit = () => {
        if (!isEditing) return;
        setSelectedPrinciples(prev => prev.map(p => {
            if (p.id === isEditing) {
                return { ...p, title: editData.title, description: editData.description };
            }
            return p;
        }));
        setIsEditing(null);
    };



    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

    // Extract all unique tags
    const allTags = Array.from(new Set(templates.flatMap(t => t.tags || []))).sort();

    const [searchQuery, setSearchQuery] = useState('');

    const toggleTag = (tag: string) => {
        const newTags = new Set(selectedTags);
        if (newTags.has(tag)) {
            newTags.delete(tag);
        } else {
            newTags.add(tag);
        }
        setSelectedTags(newTags);
    };

    const filteredTemplates = templates.filter(template => {
        const matchesTag = selectedTags.size === 0 || template.tags?.some(tag => selectedTags.has(tag));
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <h1 className="page-title">Select Leadership Principles</h1>
            <p style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
                Select the principles that define your organization's culture. You can mix and match from different templates.
            </p>

            {/* 1. Create Your Own Section (Top) - NOW "Selected/Draft Area" */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '4rem', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Create Your Own</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Review, edit, or add new principles. These will be your final selection.
                        </p>
                    </div>
                    <button
                        onClick={startAddingNew}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1.5rem' }}
                    >
                        + Add Principle
                    </button>
                </div>

                {isAddingNew && (
                    <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                        <input
                            autoFocus
                            placeholder="Principle Title"
                            value={editData.title}
                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem', fontWeight: 'bold' }}
                        />
                        <textarea
                            placeholder="Description"
                            value={editData.description}
                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.5rem', minHeight: '60px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={saveNewPrinciple} className="btn btn-primary">Save</button>
                            <button onClick={() => setIsAddingNew(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                )}

                {selectedPrinciples.length === 0 && !isAddingNew ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        No principles selected yet. Add one or select from below.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {selectedPrinciples.map(p => (
                            <div key={p.id} className="card" style={{ position: 'relative', borderLeft: '4px solid var(--primary-color)' }}>
                                {isEditing === p.id ? (
                                    <>
                                        <input
                                            value={editData.title}
                                            onChange={e => setEditData({ ...editData, title: e.target.value })}
                                            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem', fontWeight: 'bold' }}
                                        />
                                        <textarea
                                            value={editData.description}
                                            onChange={e => setEditData({ ...editData, description: e.target.value })}
                                            style={{ display: 'block', width: '100%', marginBottom: '0.5rem', padding: '0.25rem', minHeight: '60px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={saveEdit} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Save</button>
                                            <button onClick={() => setIsEditing(null)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>Cancel</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => startEditing(p)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleRemoveSelected(p.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, paddingRight: '3rem' }}>{p.title}</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.description}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Applicable Domain for your Org */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '4rem', backgroundColor: 'rgba(255,255,255,0.8)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Applicable Domain for your Org</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Select domains that describe your organization to help categorize your culture.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {allTags.map(tag => {
                        const isSelected = customTemplateTags.has(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => {
                                    const newTags = new Set(customTemplateTags);
                                    if (newTags.has(tag)) newTags.delete(tag);
                                    else newTags.add(tag);
                                    setCustomTemplateTags(newTags);
                                }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-color)',
                                    color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                {tag} {isSelected && '✓'}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Modify from Existing Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Modify from Existing</h2>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search company (e.g. Amazon, Google)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        maxWidth: '400px',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        marginBottom: '1.5rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                />

                {/* Tag Filter */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                border: 'none',
                                backgroundColor: selectedTags.has(tag) ? 'var(--primary-color)' : 'var(--surface-color)',
                                color: selectedTags.has(tag) ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Template List */}
            <div style={{ display: 'grid', gap: '2rem' }}>
                {filteredTemplates.map(template => (
                    <div key={template.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h2 className="section-title" style={{ margin: 0 }}>{template.name}</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {template.tags?.map(tag => (
                                    <span key={tag} style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: 'var(--background-color)',
                                        borderRadius: '4px',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>{template.description}</p>

                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {template.principles.map(principle => {
                                const isSelected = selectedPrinciples.some(p => p.originalId === principle.id);
                                return (
                                    <div
                                        key={principle.id}
                                        className="card"
                                        style={{
                                            cursor: 'pointer',
                                            border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface-color)',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => handleSelectStandard(principle)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{principle.title}</h3>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }} // Handled by onClick
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{principle.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: '2rem' }}>
                <button
                    onClick={() => navigate('/setup/summary', {
                        state: {
                            principles: selectedPrinciples,
                            tags: Array.from(customTemplateTags),
                            templateName: `My ${user?.orgName || 'Team'} Principles`
                        }
                    })}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1rem', boxShadow: 'var(--shadow-lg)' }}
                    disabled={selectedPrinciples.length === 0}
                >
                    Review and Confirm ({selectedPrinciples.length})
                </button>
            </div>
        </div>
    );
};
