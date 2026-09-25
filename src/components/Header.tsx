import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        navigate('/');
        setTimeout(() => logout(), 0);
    };

    const getButtonStyle = (path: string) => {
        const active = isActive(path);
        if (active) {
            return {
                padding: '0.4rem 0.8rem',
                fontSize: '0.9rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--primary-color)',
                border: '1px solid black',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'default'
            };
        }
        return {
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.9rem',
            padding: '0.4rem 0.8rem'
        };
    };

    return (
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
            <div
                style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary-color)', cursor: 'pointer' }}
                onClick={() => {
                    if (user?.role === 'admin' || user?.role === 'ADMIN') navigate('/admin/dashboard');
                    else if (user?.role === 'manager' || user?.role === 'MANAGER') navigate('/manager/dashboard');
                    else navigate('/review/dashboard');
                }}
            >
                Review Companion
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(user?.role === 'admin' || user?.role === 'ADMIN') && (
                    <>
                        <button
                            onClick={() => navigate('/setup/template')}
                            style={getButtonStyle('/setup/template')}
                        >
                            ⚙️ Principles
                        </button>
                        <button
                            onClick={() => navigate('/setup/invite')}
                            style={getButtonStyle('/setup/invite')}
                        >
                            👥 Team
                        </button>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            style={getButtonStyle('/admin/dashboard')}
                        >
                            📊 Dashboard
                        </button>
                    </>
                )}
                {(user?.role === 'manager' || user?.role === 'MANAGER') && (
                    <>
                        <button
                            onClick={() => navigate('/manager/dashboard')}
                            style={getButtonStyle('/manager/dashboard')}
                        >
                            📊 Review Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/manager/cockpit')}
                            style={getButtonStyle('/manager/cockpit')}
                        >
                            🎯 Cockpit
                        </button>
                        <button
                            onClick={() => navigate('/setup/invite')}
                            style={getButtonStyle('/setup/invite')}
                        >
                            👥 Team
                        </button>
                    </>
                )}
                <button onClick={handleLogout} className="btn" style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>
        </div>
    );
};
