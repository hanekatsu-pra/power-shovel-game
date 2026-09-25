import React from 'react';

interface HandDrawnIllustrationOverlayProps {
  actionText?: string;
  comboText?: string;
}

export const HandDrawnIllustrationOverlay: React.FC<HandDrawnIllustrationOverlayProps> = ({
  actionText,
  comboText,
}) => {
  return (
    <div
      id="hand-drawn-illustration-overlay"
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
    >
      {/* Delicate watercolor paper grain texture (SVG filter for organic artistic tooth) */}
      <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none">
        <filter id="illustration-paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.95   0 0 0 0 0.92   0 0 0 0 0.88  0 0 0 0.25 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#illustration-paper-grain)" />
      </svg>

      {/* Gentle artist vignette framing */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          boxShadow: 'inset 0 0 60px rgba(71, 85, 105, 0.35)',
        }}
      />

      {/* Hand-Drawn Technical Pen Sketch Marks (四隅の手描き風トンボ線・スケッチマーク) */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500/40 rounded-tl-sm pointer-events-none" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500/40 rounded-tr-sm pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500/40 rounded-bl-sm pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500/40 rounded-br-sm pointer-events-none" />

      {/* Combo / Exciting Action Comic Onomatopoeia Banner */}
      {comboText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none animate-bounce z-40">
          <div
            className="px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-slate-950 font-black text-lg sm:text-xl shadow-2xl border-2 border-amber-200 tracking-wider flex items-center gap-2 transform -rotate-2"
            style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}
          >
            <span>🔥</span>
            <span>{comboText}</span>
            <span>✨</span>
          </div>
        </div>
      )}
    </div>
  );
};
