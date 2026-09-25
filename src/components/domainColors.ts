// Stable colour per domain label: the same label gets the same colour everywhere it appears.
const PALETTE: Array<{ bg: string; ink: string; border: string }> = [
    { bg: '#dbeafe', ink: '#1e40af', border: '#bfdbfe' }, // blue
    { bg: '#ede9fe', ink: '#5b21b6', border: '#ddd6fe' }, // violet
    { bg: '#d1fae5', ink: '#065f46', border: '#a7f3d0' }, // green
    { bg: '#fef3c7', ink: '#92400e', border: '#fde68a' }, // amber
    { bg: '#fce7f3', ink: '#9d174d', border: '#fbcfe8' }, // pink
    { bg: '#cffafe', ink: '#155e75', border: '#a5f3fc' }, // cyan
    { bg: '#ffedd5', ink: '#9a3412', border: '#fed7aa' }, // orange
    { bg: '#e0e7ff', ink: '#3730a3', border: '#c7d2fe' }, // indigo
    { bg: '#ecfccb', ink: '#3f6212', border: '#d9f99d' }, // lime
    { bg: '#fee2e2', ink: '#991b1b', border: '#fecaca' }, // red
];

export const domainColor = (label: string) => {
    const key = label.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return PALETTE[hash % PALETTE.length];
};
