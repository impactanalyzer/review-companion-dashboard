import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface Invite {
    email: string;
    role: 'MANAGER' | 'EMPLOYEE' | 'ADMIN';
}

export const InviteUsersPage: React.FC = () => {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const [invites, setInvites] = useState<Invite[]>([{ email: '', role: 'EMPLOYEE' }]);
    const [savedInvites, setSavedInvites] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'MANAGER' | 'EMPLOYEE' | 'ADMIN'>('ALL');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        if (user?.orgId) {
            fetchInvites();
            fetchUsers();
        }
    }, [user?.orgId]);

    const fetchInvites = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/invitations?customerId=${user?.orgId}`);
            if (res.ok) {
                const data = await res.json();
                setSavedInvites(data);
            }
        } catch (err) {
            console.error('Failed to fetch invites', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/users?customerId=${user?.orgId}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this invitation?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/invitations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSavedInvites(prev => prev.filter(i => i.id !== id));
                setMessage({ type: 'success', text: 'Invitation revoked.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to revoke.' });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddRow = () => {
        setInvites([...invites, { email: '', role: 'EMPLOYEE' }]);
    };

    const handleRemoveRow = (index: number) => {
        const newInvites = [...invites];
        newInvites.splice(index, 1);
        setInvites(newInvites);
    };

    const handleChange = (index: number, field: keyof Invite, value: string) => {
        const newInvites = [...invites];
        newInvites[index] = { ...newInvites[index], [field]: value };
        setInvites(newInvites);
    };

    const handleSendInvites = async () => {
        const validInvites = invites.filter(i => i.email.trim() !== '');
        if (validInvites.length === 0) {
            setMessage({ type: 'error', text: 'Please enter at least one email address.' });
            return;
        }

        setSending(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invites: validInvites,
                    customerId: user?.orgId,
                    senderId: user?.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invites');
            }

            setMessage({ type: 'success', text: `Successfully sent ${validInvites.length} invites!` });
            setInvites([{ email: '', role: 'EMPLOYEE' }]); // Reset form
            fetchInvites();
            // Don't fetch users immediately as they need to accept first

        } catch (error: any) {
            console.error('Invite error', error);
            setMessage({ type: 'error', text: error.message || 'Failed to send invites.' });
        } finally {
            setSending(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Top Toolbar / Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-color)' }}>
                    Review Companion
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {(user?.role === 'admin') && (
                        <>
                            <button
                                onClick={() => navigate('/setup/template')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
                            >
                                ⚙️ Principles
                            </button>
                            <button
                                onClick={() => navigate('/review/dashboard')}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                            >
                                📊 Dashboard
                            </button>
                        </>
                    )}
                    <button onClick={handleLogout} className="btn" style={{ color: 'var(--text-secondary)' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

                <h1 className="page-title">Team Management</h1>
                <p className="page-subtitle">
                    Invite new members and manage your team's access.
                </p>

                {/* Invite Section */}
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        Invite New Users
                    </h2>

                    {message && (
                        <div style={{
                            padding: '1rem',
                            marginBottom: '1rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem', fontWeight: 600, display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: '1rem' }}>
                        <span>Email Address</span>
                        <span>Role</span>
                        <span></span>
                    </div>

                    {invites.map((invite, index) => (
                        <div key={index} style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '2fr 1fr 40px', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="email"
                                placeholder="colleague@company.com"
                                className="input-field"
                                value={invite.email}
                                onChange={(e) => handleChange(index, 'email', e.target.value)}
                            />
                            <select
                                className="input-field"
                                value={invite.role}
                                onChange={(e) => handleChange(index, 'role', e.target.value as any)}
                            >
                                <option value="EMPLOYEE">Individual Contributor</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            {invites.length > 1 && (
                                <button
                                    onClick={() => handleRemoveRow(index)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={handleAddRow}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                    >
                        + Add another user
                    </button>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleSendInvites}
                            disabled={sending}
                            style={{ width: '100%' }}
                        >
                            {sending ? 'Sending Invites...' : 'Send Invites'}
                        </button>
                    </div>
                </div>

                {/* Stacked Layout: Pending Invites then User List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>

                    {/* Pending Invites */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Pending Invitations</h3>
                        {savedInvites.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No pending invitations.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {savedInvites.map(inv => (
                                    <div key={inv.id} style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'white',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={inv.email}>{inv.email}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {inv.role}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(inv.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Team Members List */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Team Members</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem 0.5rem', borderRadius: '1rem' }}>
                                {filteredUsers.length} Active
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="input-field"
                                style={{ flex: 2, fontSize: '0.9rem', padding: '0.5rem' }}
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                            <select
                                className="input-field"
                                style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="MANAGER">Managers</option>
                                <option value="EMPLOYEE">Employees</option>
                                <option value="ADMIN">Admins</option>
                            </select>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>None found.</p>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                {filteredUsers.map((u: any) => (
                                    <div key={u.id} style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'white',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.name || 'Unnamed'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--bg-secondary)',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {u.role.toLowerCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
