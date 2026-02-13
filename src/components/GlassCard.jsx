import React from 'react';

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-white border border-slate-200 rounded-3xl ${className}`}>
        {children}
    </div>
);

export default GlassCard;
