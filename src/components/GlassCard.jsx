import React from 'react';

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-[#1a2332] border border-[#2a3a4a] rounded-3xl shadow-lg shadow-black/20 ${className}`}>
        {children}
    </div>
);

export default GlassCard;
