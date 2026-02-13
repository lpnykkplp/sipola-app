import React from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Header = ({ title, subtitle, onBack }) => (
    <div className="flex items-center justify-between mb-8 pt-4 px-1">
        <div className="flex items-center">
            {onBack && (
                <button onClick={onBack} className="mr-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all active:scale-90 border border-slate-200">
                    <ChevronLeft size={22} />
                </button>
            )}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{title}</h1>
                {subtitle && <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{subtitle}</p>}
            </div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white transform rotate-3 shadow-lg shadow-blue-200">
            <ShieldCheck size={24} />
        </div>
    </div>
);

export default Header;
