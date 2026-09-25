import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { SlideOver } from '../components/SlideOver';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';
import { LPChip, DomainPill, ProfilePanel, type ProfileViewModel } from '../components/ProfileWidgets';

interface Reportee { id: string; name: string; role: string; }
interface RosterRow { reportee: Reportee; profile: ProfileViewModel | null; }

const C = { line: '#e5e7eb', muted: '#6b7280', ink: '#1a2233', accentInk: '#8A5E0E', accent: '#C6871A' };

/** Distinct cited artifacts across strengths + growth + badges (A′: dedup by nodeId/commentId). */
function citedCount(p: ProfileViewModel): number {
    const ids = new Set<string>();
    const add = (evs: Array<{ nodeId?: string; commentId?: string }>) => {
        for (const e of evs) { const k = e.nodeId || e.commentId; if (k) ids.add(k); }
    };
    p.strengths.forEach(s => add(s.evidence));
    p.growth.forEach(g => add(g.evidence));
    p.badges.forEach(b => add(b.evidence));
    return ids.size;
}

type Tab = 'team' | 'judgment';

export const ManagerCockpitPage: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [rows, setRows] = useState<RosterRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('team');
    const [selected, setSelected] = useState<RosterRow | null>(null);
    const [hovered, setHovered] = useState<string | null>(null);

    useEffect(() => {
        if (!user) { navigate('/'); return; }
        (async () => {
            try {
                const reportees: Reportee[] = await fetch(`${API_BASE_URL}/api/users/${user.id}/reportees`).then(r => r.json());
                const withProfiles = await Promise.all(
                    (reportees || []).map(async (rep) => {
                        try {
                            const p = await fetch(`${API_BASE_URL}/api/users/${rep.id}/profile`).then(r => r.json());
                            return { reportee: rep, profile: p && !p.error ? (p as ProfileViewModel) : null };
                        } catch {
                            return { reportee: rep, profile: null };
                        }
                    })
                );
                withProfiles.sort((a, b) => (b.profile ? citedCount(b.profile) : -1) - (a.profile ? citedCount(a.profile) : -1));
                setRows(withProfiles);
            } catch (e) {
                console.error('Failed to load cockpit roster', e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const tabBtn = (t: Tab): React.CSSProperties => ({
        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
        background: tab === t ? C.ink : 'transparent', color: tab === t ? '#fff' : C.muted,
    });

    return (
        <div>
            <Header />
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accentInk, marginBottom: 8 }}>
                    My Team · Q1 2026 · Manager Cockpit
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', color: C.ink }}>Team, at a glance</h1>
                <p style={{ color: C.muted, marginTop: 6, maxWidth: '62ch' }}>
                    Each person's alignment to your leadership principles and the domains they own — every claim cited to a real artifact.
                    Evaluative data is visible to leaders only.
                </p>

                {/* inner tabs */}
                <div style={{ display: 'inline-flex', gap: 4, background: '#eef0f4', borderRadius: 10, padding: 4, margin: '20px 0 18px' }}>
                    <button style={tabBtn('team')} onClick={() => setTab('team')}>Team</button>
                    <button style={tabBtn('judgment')} onClick={() => setTab('judgment')}>Judgment Coverage</button>
                </div>

                {tab === 'team' ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontWeight: 700 }}>Q1 Review · Platform Team</span>
                            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accentInk, border: `1px solid ${C.accent}`, borderRadius: 6, padding: '4px 10px' }}>Leaders only</span>
                        </div>

                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: C.muted }}>Loading team profiles…</div>
                        ) : rows.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: C.muted }}>No reports found.</div>
                        ) : rows.map(row => {
                            const { reportee, profile } = row;
                            const isHover = hovered === reportee.id;
                            return (
                                <div key={reportee.id}
                                    onClick={() => setSelected(row)}
                                    onMouseEnter={() => setHovered(reportee.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '1.2fr 2fr auto', gap: 20, alignItems: 'center',
                                        padding: '18px 20px', marginBottom: 12, cursor: 'pointer',
                                        background: '#fff', border: `1px solid ${isHover ? C.accent : C.line}`, borderRadius: 12,
                                        boxShadow: isHover ? '0 4px 14px rgba(0,0,0,.08)' : '0 1px 2px rgba(0,0,0,.03)',
                                        transition: 'box-shadow .15s, border-color .15s',
                                    }}>
                                    <div>
                                        <div style={{ fontWeight: 650, fontSize: 16 }}>{reportee.name}</div>
                                        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>
                                            {profile?.archetype ?? reportee.role}
                                        </div>
                                    </div>

                                    {profile ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div>{profile.leadershipPrinciples.slice(0, 4).map((lp, i) => <LPChip key={i} principle={lp.principle} polarity={lp.polarity} />)}</div>
                                            <div>
                                                {profile.domains.slice(0, 6).map(d => <DomainPill key={d.slug} label={d.label} />)}
                                                {profile.domains.length > 6 && <span style={{ fontSize: 12, color: C.muted }}>+{profile.domains.length - 6}</span>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: C.muted, fontSize: 13 }}>No profile — not enough engineering signal this cycle.</div>
                                    )}

                                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                                        {profile && <>
                                            <div style={{ fontSize: 26, fontWeight: 700, color: C.accentInk }}>{citedCount(profile)}</div>
                                            <div style={{ fontSize: 12, color: C.muted }}>cited artifacts</div>
                                        </>}
                                    </div>
                                </div>
                            );
                        })}
                        <p style={{ marginTop: 8, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
                            Click a person for their full evidence-backed profile. Breadth across domains is the signature of a high-influence engineer.
                            No numeric scores or grades appear on any screen.
                        </p>
                    </>
                ) : (
                    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 12, padding: '2.5rem', textAlign: 'center', color: C.muted }}>
                        <div style={{ fontWeight: 700, color: C.ink, marginBottom: 8 }}>Judgment Coverage — coming next</div>
                        Human judgment vs. AI activity by domain, so you can see where AI is running with little human oversight.
                    </div>
                )}
            </div>

            {/* Full profile in a side panel */}
            <SlideOver
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.reportee.name || 'Profile'}
                maxWidth="560px"
            >
                {selected && (
                    selected.profile
                        ? <ProfilePanel profile={selected.profile} displayName={selected.reportee.name} />
                        : <p style={{ color: C.muted }}>No engine profile available for this person this cycle.</p>
                )}
            </SlideOver>
        </div>
    );
};
