import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

export const OrientationWarning: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [forceDismiss, setForceDismiss] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if height > width AND screen width < 900px (phone/tablet portrait)
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || forceDismiss) return null;

  return (
    <div
      id="orientation-warning-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center backdrop-blur-md"
    >
      <div className="relative mb-6 flex items-center justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 animate-pulse">
          <Smartphone className="w-12 h-12 text-amber-400 rotate-90 transform transition-transform duration-700" />
          <RotateCw className="absolute -top-2 -right-2 w-7 h-7 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mb-2 tracking-wide">
        スマホを横向きにしてください
      </h2>

      <p className="text-sm text-slate-300 max-w-xs mb-6 leading-relaxed">
        「パワーショベルに乗ろう！」は、左右の親指で2本レバーを操作する横画面専用ゲームです。
      </p>

      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-700 text-xs text-amber-200/90 mb-6 max-w-xs">
        ※画面の回転ロックがONになっている場合は解除して端末を横に傾けてください。
      </div>

      <button
        id="dismiss-orientation-btn"
        onClick={() => setForceDismiss(true)}
        className="px-5 py-2 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-600 active:scale-95 transition-all"
      >
        このまま画面を維持してプレイ
      </button>
    </div>
  );
};
