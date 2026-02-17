import React, { useState, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ZoomableImageViewer = ({ src, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const posStart = useRef({ x: 0, y: 0 });
    const lastTouchDist = useRef(null);

    const clampScale = (s) => Math.min(Math.max(s, 1), 5);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        setScale(prev => clampScale(prev + (e.deltaY > 0 ? -0.3 : 0.3)));
    }, []);

    // Mouse drag
    const handleMouseDown = (e) => {
        if (scale <= 1) return;
        e.stopPropagation();
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        posStart.current = { ...position };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: posStart.current.x + (e.clientX - dragStart.current.x),
            y: posStart.current.y + (e.clientY - dragStart.current.y),
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Touch: drag + pinch
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist.current = Math.hypot(dx, dy);
        } else if (e.touches.length === 1 && scale > 1) {
            dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            posStart.current = { ...position };
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastTouchDist.current !== null) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const delta = (dist - lastTouchDist.current) * 0.01;
            setScale(prev => clampScale(prev + delta));
            lastTouchDist.current = dist;
        } else if (e.touches.length === 1 && isDragging) {
            setPosition({
                x: posStart.current.x + (e.touches[0].clientX - dragStart.current.x),
                y: posStart.current.y + (e.touches[0].clientY - dragStart.current.y),
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        lastTouchDist.current = null;
    };

    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && scale <= 1) onClose();
    };

    // Double-tap to toggle zoom
    const lastTap = useRef(0);
    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            if (scale > 1) resetZoom();
            else setScale(2.5);
        }
        lastTap.current = now;
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={handleBackdropClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Top controls */}
            <div className="absolute top-4 left-0 w-full flex justify-between items-center px-5 z-10">
                <div className="flex items-center gap-2">
                    <button onClick={() => setScale(prev => clampScale(prev - 0.5))} className="w-9 h-9 bg-[#1a2332] border border-[#2a3a4a] rounded-full flex items-center justify-center text-slate-300 hover:text-teal-400 transition">
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-400 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(prev => clampScale(prev + 0.5))} className="w-9 h-9 bg-[#1a2332] border border-[#2a3a4a] rounded-full flex items-center justify-center text-slate-300 hover:text-teal-400 transition">
                        <ZoomIn size={16} />
                    </button>
                    {scale > 1 && (
                        <button onClick={resetZoom} className="w-9 h-9 bg-[#1a2332] border border-[#2a3a4a] rounded-full flex items-center justify-center text-slate-300 hover:text-teal-400 transition">
                            <RotateCcw size={14} />
                        </button>
                    )}
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-[#1a2332] border border-[#2a3a4a] rounded-full flex items-center justify-center text-slate-300 hover:text-white transition">
                    <X size={18} />
                </button>
            </div>

            {/* Image */}
            <img
                src={src}
                alt="Full View"
                className="max-w-full max-h-[85vh] rounded-lg object-contain select-none"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                draggable={false}
                onClick={handleDoubleTap}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onWheel={handleWheel}
            />
        </div>
    );
};

export default ZoomableImageViewer;
