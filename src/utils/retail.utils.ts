export const getRfmSegmentInfo = (segment: string) => {
    switch (segment) {
        case 'Champion': return { color: '#10b981', icon: '🏆', bg: '#d1fae5' };
        case 'Loyal Customer': return { color: '#3b82f6', icon: '💎', bg: '#dbeafe' };
        case 'Potential Loyalist': return { color: '#8b5cf6', icon: '↗️', bg: '#ede9fe' };
        case 'At Risk': return { color: '#ef4444', icon: '⚠️', bg: '#fee2e2' };
        case 'Hibernating': return { color: '#6b7280', icon: '💤', bg: '#f3f4f6' };
        default: return { color: '#6b7280', icon: '👤', bg: '#f3f4f6' };
    }
};

export const getTierColor = (tier: string) => {
    switch (tier) {
        case 'Bronze': return '#cd7f32';
        case 'Silver': return '#a8a9ad';
        case 'Gold': return '#ffd700';
        case 'Platinum': return '#e5e4e2';
        default: return '#6b7280';
    }
};
