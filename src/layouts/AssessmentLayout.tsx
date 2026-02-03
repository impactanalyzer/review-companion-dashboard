import React from 'react';
// Based on check_panels.ts, the available exports are Group, Panel, Separator.
// We alias them to the standard names used in our code.
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

interface AssessmentLayoutProps {
    topContent: React.ReactNode;
    bottomContent: React.ReactNode;
    aiPaneContent?: React.ReactNode;
}

export const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
    topContent,
    bottomContent,
    aiPaneContent
}) => {
    // We want a layout: Left Pane (AI/Context) | Right Pane (Main Work)
    // Right Pane is split vertically: Top (Employee Feedback) / Bottom (Evaluation)

    return (
        <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
            {/* @ts-ignore */}
            <PanelGroup direction="horizontal" style={{ flex: 1 }}>
                {/* Left Pane: AI Assistant / Context */}
                <Panel defaultSize={25} minSize={15} maxSize={40} style={{ borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ height: '100%', padding: '1rem', overflowY: 'auto' }}>
                        {aiPaneContent || (
                            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '50%' }}>
                                🤖 AI Companion<br />(Coming Soon)
                            </div>
                        )}
                    </div>
                </Panel>

                <PanelResizeHandle style={{ width: '4px', background: 'var(--border-color)', cursor: 'col-resize' }} />

                {/* Right Pane: Work Area */}
                <Panel minSize={50}>
                    {/* @ts-ignore */}
                    <PanelGroup direction="vertical">
                        {/* Top: Reader (Employee Feedback) */}
                        <Panel defaultSize={50} minSize={20} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-primary)' }}>
                                {topContent}
                            </div>
                        </Panel>

                        <PanelResizeHandle style={{ height: '4px', background: 'var(--border-color)', cursor: 'row-resize' }} />

                        {/* Bottom: Writer (Manager Assessment) */}
                        <Panel defaultSize={50} minSize={20}>
                            <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', backgroundColor: '#fdfdfd' }}>
                                {bottomContent}
                            </div>
                        </Panel>
                    </PanelGroup>
                </Panel>
            </PanelGroup>
        </div>
    );
};
