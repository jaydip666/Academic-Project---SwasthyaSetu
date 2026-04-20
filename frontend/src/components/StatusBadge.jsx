import React from 'react';

const StatusBadge = ({ status }) => {
    const map = {
        pending: { color: 'hsl(45, 93%, 47%)', bg: 'hsl(45, 93%, 96%)' },
        pending_payment: { color: 'hsl(25, 95%, 50%)', bg: 'hsl(25, 95%, 96%)' },
        accepted: { color: 'hsl(221, 83%, 53%)', bg: 'hsl(221, 83%, 96%)' },
        confirmed: { color: 'hsl(221, 83%, 53%)', bg: 'hsl(221, 83%, 96%)' },
        completed: { color: 'hsl(142, 71%, 45%)', bg: 'hsl(142, 71%, 96%)' },
        rejected: { color: 'hsl(346, 77%, 49%)', bg: 'hsl(346, 77%, 96%)' },
        cancelled: { color: 'hsl(0, 0%, 40%)', bg: 'hsl(0, 0%, 96%)' },
        reschedule_proposed: { color: 'hsl(280, 70%, 50%)', bg: 'hsl(280, 70%, 96%)' }
    };
    const s = map[status?.toLowerCase()] || map.pending;

    return (
        <span style={{
            fontSize: '0.75rem',
            fontWeight: '800',
            color: s.color,
            background: s.bg,
            padding: '0.35rem 0.75rem',
            borderRadius: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            display: 'inline-block',
            border: `1px solid ${s.color}20`
        }}>
            {status}
        </span>
    );
};

export default StatusBadge;
