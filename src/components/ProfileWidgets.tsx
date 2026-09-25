import React from 'react';
import { domainColor } from './domainColors';

/**
 * Shared profile widgets — the engine-generated employee profile, rendered for the
 * Manager Assessment (screen 1) and reused by the Cockpit roster/guidance screens.
 * Light theme; no numeric scores/grades (archetype + tags + evidence only).
 */

// ---- View model (matches the gateway's ProfileViewModel) --------------------
export interface EngineEvidence {
    source: string;
    nodeId?: string;
    commentId?: string;
    score?: number;
}
export interface DimensionView {
    dimension: string;
    label: string;
    principle: string | null;
    evidence: EngineEvidence[];
    sampleSize: number;
}
export interface ProfileViewModel {
    user: string;
    header: { prsAuthored: number; prsReviewed: number; domainsActive: number };
    archetype: string | null;
    secondaryArchetype: string | null;
    badges: Array<{ key: string; label: string; evidence: EngineEvidence[] }>;
    strengths: DimensionView[];
    growth: DimensionView[];
    domains: Array<{ slug: string; label: string }>;
    leadershipPrinciples: Array<{ principle: string; polarity: 'STRENGTH' | 'GROWTH' }>;
}

// ---- palette (from manager_view_mock, light) --------------------------------
const C = {
    line: '#e5e7eb',
    muted: '#6b7280',
    ink: '#1a2233',
    chipBg: '#f3f4f6', chipInk: '#374151',
    bandBg: '#dbeafe', band: '#1e40af',
    strengthBg: '#d1fae5', strength: '#065f46',
    improveBg: '#fef3c7', improve: '#92400e',
    lpBg: '#ede9fe', lp: '#5b21b6',
    prLink: '#1d4ed8',
};

// ---- reusable chips ---------------------------------------------------------
const chipBase: React.CSSProperties = {
    display: 'inline-block', padding: '3px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 600, margin: '2px 6px 2px 0', border: '1px solid transparent',
};

export const ArchetypeChip: React.FC<{ label: string; prefix?: string }> = ({ label, prefix }) => (
    <span style={{ ...chipBase, background: C.bandBg, color: C.band }}>{prefix ? `${prefix}: ` : ''}{label}</span>
);

export const BadgeChip: React.FC<{ label: string }> = ({ label }) => (
    <span style={{ ...chipBase, background: C.chipBg, color: C.chipInk, border: `1px solid ${C.line}` }}>🏅 {label}</span>
);

export const LPChip: React.FC<{ principle: string; polarity: 'STRENGTH' | 'GROWTH' }> = ({ principle, polarity }) => (
    <span style={{ ...chipBase, ...(polarity === 'STRENGTH'
        ? { background: C.strengthBg, color: C.strength }
        : { background: C.improveBg, color: C.improve }) }}>
        {polarity === 'GROWTH' ? `Grow: ${principle}` : principle}
    </span>
);

export const DomainPill: React.FC<{ label: string }> = ({ label }) => {
    const color = domainColor(label);
    return <span style={{ ...chipBase, background: color.bg, color: color.ink, border: `1px solid ${color.border}` }}>{label}</span>;
};

const PolarityTag: React.FC<{ polarity: 'STRENGTH' | 'IMPROVEMENT' }> = ({ polarity }) => (
    <span style={{ ...chipBase, margin: 0, ...(polarity === 'STRENGTH'
        ? { background: C.strengthBg, color: C.strength }
        : { background: C.improveBg, color: C.improve }) }}>{polarity === 'STRENGTH' ? 'STRENGTH' : 'GROWTH AREA'}</span>
);

export const EvidenceRefs: React.FC<{ evidence: EngineEvidence[] }> = ({ evidence }) => {
    if (!evidence || evidence.length === 0) return null;
    return (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C.line}`, fontSize: 13 }}>
            <span style={{ color: C.muted }}>Cited evidence: </span>
            {evidence.slice(0, 4).map((_, i) => (
                <span key={i} style={{ color: C.prLink, fontWeight: 600, marginRight: 10 }}>↗ PR</span>
            ))}
            {evidence.length > 4 && <span style={{ color: C.muted }}>+{evidence.length - 4} more</span>}
        </div>
    );
};

// ---- dimension (strength / growth) card -------------------------------------
export const DimensionCard: React.FC<{ dim: DimensionView; polarity: 'STRENGTH' | 'IMPROVEMENT' }> = ({ dim, polarity }) => (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 640 }}>{dim.label}</span>
            <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <PolarityTag polarity={polarity} />
                {dim.principle && <span style={{ ...chipBase, margin: 0, background: C.lpBg, color: C.lp }}>{dim.principle}</span>}
            </span>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>Sample: {dim.sampleSize} artifact{dim.sampleSize === 1 ? '' : 's'}</div>
        <EvidenceRefs evidence={dim.evidence} />
    </div>
);

// ---- the full left-panel profile --------------------------------------------
const cardStyle: React.CSSProperties = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: '20px 22px', marginBottom: 18 };
const cardH2: React.CSSProperties = { fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 14 };

const initials = (name: string) => name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const ProfilePanel: React.FC<{
    profile: ProfileViewModel | null;
    displayName: string;
    loading?: boolean;
    error?: string | null;
}> = ({ profile, displayName, loading, error }) => {
    if (loading) return <div style={{ textAlign: 'center', padding: '2rem', color: C.muted }}>Loading profile…</div>;
    if (error) return (
        <div style={{ ...cardStyle, color: C.muted }}>
            <p style={{ margin: 0 }}>{error}</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>The engine may have no profile for this person/period, or the GitHub identity isn't linked.</p>
        </div>
    );
    if (!profile) return null;

    const { header } = profile;
    return (
        <div>
            {/* Profile header */}
            <div style={cardStyle}>
                <h2 style={cardH2}>Employee profile — generated from this quarter's engineering work</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17 }}>
                        {initials(displayName)}
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 650 }}>{displayName}</div>
                        <div style={{ fontSize: 13, color: C.muted }}>
                            {header.prsAuthored} PRs shipped · {header.prsReviewed} PRs reviewed for teammates · active in {header.domainsActive} product area{header.domainsActive === 1 ? '' : 's'}
                        </div>
                    </div>
                </div>
                <div style={{ marginBottom: 6 }}>
                    {profile.archetype && <ArchetypeChip prefix="Archetype" label={profile.archetype} />}
                    {profile.secondaryArchetype && <ArchetypeChip prefix="Secondary" label={profile.secondaryArchetype} />}
                </div>
                {profile.badges.length > 0 && (
                    <div>{profile.badges.map(b => <BadgeChip key={b.key} label={b.label} />)}</div>
                )}
                {profile.domains.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: C.muted, marginRight: 6 }}>Active in</span>
                        {profile.domains.map(d => <DomainPill key={d.slug} label={d.label} />)}
                    </div>
                )}
            </div>

            {/* Strengths */}
            <div style={cardStyle}>
                <h2 style={cardH2}>Strengths — with cited evidence and leadership guidance</h2>
                {profile.strengths.length === 0
                    ? <div style={{ color: C.muted, fontSize: 14 }}>Not enough data to surface strengths this cycle.</div>
                    : profile.strengths.map(s => <DimensionCard key={s.dimension} dim={s} polarity="STRENGTH" />)}
            </div>

            {/* Growth — manager only */}
            <div style={cardStyle}>
                <h2 style={cardH2}>Growth area — visible to manager only</h2>
                {profile.growth.length === 0
                    ? <div style={{ color: C.muted, fontSize: 14 }}>No growth areas flagged this cycle.</div>
                    : profile.growth.map(g => <DimensionCard key={g.dimension} dim={g} polarity="IMPROVEMENT" />)}
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
                    Shown only to you — never to peers or the employee without your approval.
                </div>
            </div>
        </div>
    );
};
