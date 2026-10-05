import React, { useState, useEffect } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

export const OrientationWarning: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [forceDismiss, setForceDismiss] = useState(false);

  useEffect(() => {
    const delayedChecks = new Set<number>();
    const orientationMedia = window.matchMedia('(orientation: portrait)');
    const screenOrientation = window.screen.orientation;

    const checkOrientation = () => {
      const viewport = window.visualViewport;
      const width = Math.round(viewport?.width ?? window.innerWidth);
      const height = Math.round(viewport?.height ?? window.innerHeight);
      const orientationType = screenOrientation?.type;
      const hasDistinctDimensions = Math.abs(height - width) > 1;
      const portrait = hasDistinctDimensions
        ? height > width
        : orientationType?.startsWith('portrait') ?? orientationMedia.matches;
      // Preserve desktop behaviour while handling all common phone viewport sizes.
      setIsPortrait(portrait && Math.min(width, height) < 800);
    };

    const scheduleOrientationCheck = () => {
      checkOrientation();
      delayedChecks.forEach((timer) => window.clearTimeout(timer));
      delayedChecks.clear();
      // Some Android browsers report the new viewport after the first rotation event.
      [80, 220, 500].forEach((delay) => {
        const timer = window.setTimeout(() => {
          delayedChecks.delete(timer);
          checkOrientation();
        }, delay);
        delayedChecks.add(timer);
      });
    };

    scheduleOrientationCheck();
    window.addEventListener('resize', scheduleOrientationCheck);
    window.addEventListener('orientationchange', scheduleOrientationCheck);
    window.visualViewport?.addEventListener('resize', scheduleOrientationCheck);
    window.visualViewport?.addEventListener('scroll', scheduleOrientationCheck);
    screenOrientation?.addEventListener('change', scheduleOrientationCheck);
    if (orientationMedia.addEventListener) {
      orientationMedia.addEventListener('change', scheduleOrientationCheck);
    } else {
      orientationMedia.addListener(scheduleOrientationCheck);
    }

    return () => {
      delayedChecks.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', scheduleOrientationCheck);
      window.removeEventListener('orientationchange', scheduleOrientationCheck);
      window.visualViewport?.removeEventListener('resize', scheduleOrientationCheck);
      window.visualViewport?.removeEventListener('scroll', scheduleOrientationCheck);
      screenOrientation?.removeEventListener('change', scheduleOrientationCheck);
      if (orientationMedia.removeEventListener) {
        orientationMedia.removeEventListener('change', scheduleOrientationCheck);
      } else {
        orientationMedia.removeListener(scheduleOrientationCheck);
      }
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
