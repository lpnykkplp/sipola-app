import React from 'react';
import { ChevronRight } from 'lucide-react';

const MenuCard = ({ icon: Icon, title, desc, color, onClick, variant = "row" }) => {
    if (variant === "col") {
        return (
            <button
                onClick={onClick}
                className="w-full relative group bg-[#1a2332] border border-[#2a3a4a] rounded-3xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform active:scale-[0.98] hover:border-teal-500/30 hover:shadow-lg hover:shadow-teal-500/5 h-full"
            >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 ${color} bg-[#0f1729]`}>
                    <Icon size={28} strokeWidth={2} />
                </div>
                <h3 className="font-bold text-slate-200 text-sm tracking-tight leading-tight group-hover:text-teal-400 transition-colors">{title}</h3>
                <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-2">{desc}</p>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className="w-full relative group bg-[#1a2332] border border-[#2a3a4a] rounded-3xl p-5 flex items-center transition-all duration-300 transform active:scale-[0.98] hover:border-teal-500/30 hover:shadow-md hover:shadow-teal-500/5"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-5 transition-all duration-300 group-hover:scale-110 ${color} bg-[#0f1729]`}>
                <Icon size={28} strokeWidth={2} />
            </div>
            <div className="text-left flex-1">
                <h3 className="font-bold text-slate-200 text-lg tracking-tight group-hover:text-teal-400 transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">{desc}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 group-hover:text-teal-400 transition-all bg-[#0f1729]">
                <ChevronRight size={18} />
            </div>
        </button>
    );
};

export default MenuCard;
