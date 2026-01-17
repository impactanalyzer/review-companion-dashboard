import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

interface Invite {
    email: string;
    role: 'MANAGER' | 'EMPLOYEE' | 'ADMIN';
}

export const InviteUsersPage: React.FC = () => {
    const { user } = useApp();
    const [invites, setInvites] = useState<Invite[]>([{ email: '', role: 'EMPLOYEE' }]);
    const [savedInvites, setSavedInvites] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'MANAGER' | 'EMPLOYEE' | 'ADMIN'>('ALL');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal State
    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        type: 'DELETE_USER' | 'REVOKE_INVITE' | null;
        data: any | null;
    }>({ isOpen: false, type: null, data: null });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (user?.orgId) {
            fetchInvites();
            fetchUsers();
        }
    }, [user?.orgId]);

    const fetchInvites = async () => {
        try {
            let url = `${API_BASE_URL}/api/auth/invitations?customerId=${user?.orgId}`;
            // If manager (and not admin), only show their own invites
            if (user?.role === 'manager' || user?.role === 'MANAGER') {
                url += `&senderId=${user?.id}`;
            }

            const res = await fetch(url);
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

    const openRevokeModal = (invite: any) => {
        setConfirmationModal({ isOpen: true, type: 'REVOKE_INVITE', data: invite });
    };

    const openDeleteModal = (user: any) => {
        setConfirmationModal({ isOpen: true, type: 'DELETE_USER', data: user });
    };

    const closeModal = () => {
        setConfirmationModal({ isOpen: false, type: null, data: null });
    };

    const handleConfirmAction = async () => {
        const { type, data } = confirmationModal;
        if (!type || !data) return;

        setIsProcessing(true);
        setMessage(null);

        try {
            if (type === 'DELETE_USER') {
                const res = await fetch(`${API_BASE_URL}/api/auth/users/${data.id}`, { method: 'DELETE' });
                if (res.ok) {
                    setUsers(prev => prev.filter(u => u.id !== data.id));
                    setMessage({ type: 'success', text: 'User removed successfully.' });
                    closeModal();
                } else {
                    const result = await res.json();
                    setMessage({ type: 'error', text: result.error || 'Failed to remove user.' });
                }
            } else if (type === 'REVOKE_INVITE') {
                const res = await fetch(`${API_BASE_URL}/api/auth/invitations/${data.id}`, { method: 'DELETE' });
                if (res.ok) {
                    setSavedInvites(prev => prev.filter(i => i.id !== data.id));
                    setMessage({ type: 'success', text: 'Invitation revoked.' });
                    closeModal();
                } else {
                    setMessage({ type: 'error', text: 'Failed to revoke invitation.' });
                }
            }
        } catch (err: any) {
            console.error('Action failed', err);
            setMessage({ type: 'error', text: err.message || 'An error occurred.' });
        } finally {
            setIsProcessing(false);
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

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <Header />

            <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                <h1 className="page-title">Team Management</h1>
                <p className="page-subtitle">
                    {user?.role === 'admin' || user?.role === 'manager' || user?.role === 'MANAGER'
                        ? "Invite new members and manage your team's access."
                        : "View your team members."}
                </p>

                {/* Invite Section (Hidden for Employees) */}
                {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'MANAGER') && (
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
                )}

                {/* Stacked Layout: Pending Invites then User List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>

                    {/* Pending Invites (Hidden for Employees) */}
                    {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'MANAGER') && (
                        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
                                Pending Invitations
                                {user?.role !== 'admin' && <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>(Sent by you)</span>}
                            </h3>
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
                                                    {inv.role} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span
                                                        style={{ fontFamily: 'monospace', background: 'var(--bg-secondary)', padding: '0.1rem 0.3rem', borderRadius: '4px', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/invite?token=${inv.token}`;
                                                            navigator.clipboard.writeText(url);
                                                        }}
                                                        title="Click to copy link"
                                                    >
                                                        Copy Link 📋
                                                    </span>
                                                    <a href={`/invite?token=${inv.token}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                                                        Open ↗
                                                    </a>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => openRevokeModal(inv)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                                            {user?.role === 'admin' && u.id !== user?.id && (
                                                <button
                                                    onClick={() => openDeleteModal(u)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        fontSize: '1.2rem',
                                                        cursor: 'pointer',
                                                        lineHeight: 1,
                                                        padding: '0 0.5rem'
                                                    }}
                                                    title="Remove User"
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={confirmationModal.isOpen}
                onClose={closeModal}
                title={confirmationModal.type === 'DELETE_USER'
                    ? `Confirm ${confirmationModal.data?.name || 'User'} Deletion`
                    : 'Confirm Revoke Invitation'}
                footer={
                    <>
                        <button
                            className="btn"
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            onClick={closeModal}
                            disabled={isProcessing}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn"
                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                            onClick={handleConfirmAction}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : (confirmationModal.type === 'DELETE_USER' ? 'Confirm Remove' : 'Confirm Revoke')}
                        </button>
                    </>
                }
            >
                {confirmationModal.type === 'DELETE_USER' ? (
                    <>
                        <p>
                            Are you sure you want to remove <strong>{confirmationModal.data?.name} ({confirmationModal.data?.email})</strong> from the organization?
                        </p>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            This action cannot be undone. They will no longer be able to access the dashboard or submit reviews.
                        </p>
                    </>
                ) : (
                    <p>
                        Are you sure you want to revoke the invitation for <strong>{confirmationModal.data?.email}</strong>? The link will no longer work.
                    </p>
                )}
            </Modal>
        </div>
    );
};
