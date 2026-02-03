import React, { useState, useEffect, useCallback, useRef } from 'react';

interface SideContextLayoutProps {
    mainContent: React.ReactNode;
    contextContent: React.ReactNode;
    isContextOpen: boolean;
    onCloseContext?: () => void;
}

export const SideContextLayout: React.FC<SideContextLayoutProps> = ({
    mainContent,
    contextContent,
    isContextOpen,
    onCloseContext
}) => {
    // Default to 50% split (based on window width, or just 50vw roughly)
    // We'll track width in pixels for smoother dragging
    const [sidebarWidth, setSidebarWidth] = useState(600); // Start with a reasonable fixed width, or we can use % calculation on mount
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Initialize width to 50% of screen on mount
    useEffect(() => {
        setSidebarWidth(window.innerWidth * 0.5);
    }, []);

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                // Calculate new width: Total Window Width - Mouse X
                // We are resizing from the right, so the width is the distance from right edge
                const newWidth = window.innerWidth - mouseMoveEvent.clientX;

                // Add constraints (min 300px, max 80% of screen)
                if (newWidth > 300 && newWidth < window.innerWidth * 0.8) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    return (
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', overflow: 'hidden', position: 'relative' }}>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                // When context is open, we subtract sidebar width. When closed, it's 100%.
                // However, with Flexbox, if we set the right div to fixed width, this one just takes 'flex: 1'
                overflowY: 'auto',
                minWidth: 0,
                backgroundColor: 'var(--bg-primary)'
            }}>
                <div style={{ height: '100%', overflowY: 'auto', padding: '1rem' }}>
                    {mainContent}
                </div>
            </div>

            {/* Resize Handle */}
            {isContextOpen && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        width: '8px',
                        cursor: 'col-resize',
                        backgroundColor: isResizing ? 'var(--primary-color)' : 'var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        transition: 'background-color 0.2s',
                        userSelect: 'none'
                    }}
                >
                    {/* Visual Grip Handle */}
                    <div style={{
                        width: '4px',
                        height: '24px',
                        borderLeft: '1px solid #aaa',
                        borderRight: '1px solid #aaa'
                    }} />
                </div>
            )}

            {/* Right Context Pane */}
            <div
                ref={sidebarRef}
                style={{
                    width: isContextOpen ? sidebarWidth : 0,
                    minWidth: isContextOpen ? '300px' : 0,
                    transition: isResizing ? 'none' : 'width 0.3s ease', // Disable transition while dragging for performance
                    backgroundColor: 'var(--bg-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap' // Prevent content shift during quick animation
                }}
            >
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    minHeight: '60px'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Review Context</h3>
                    {onCloseContext && (
                        <button
                            onClick={onCloseContext}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-secondary)' }}
                        >
                            &times;
                        </button>
                    )}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', whiteSpace: 'normal' }}>
                    {contextContent}
                </div>
            </div>

            {/* Overlay to prevent iframe dragging issues if any (optional, keeping simple for now) */}
            {isResizing && <div style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />}
        </div>
    );
};
