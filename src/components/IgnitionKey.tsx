import React, { useState } from 'react';
import { KeyRound, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface IgnitionKeyProps {
  engineState: 'off' | 'starting' | 'running';
  onStartEngine: () => void;
  onStopEngine?: () => void;
  isChallengeMode: boolean;
  timeRemaining?: number;
}

export const IgnitionKey: React.FC<IgnitionKeyProps> = ({
  engineState,
  onStartEngine,
  onStopEngine,
  isChallengeMode,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleTurnKey = () => {
    if (!isChallengeMode) return;
    if (engineState === 'off') {
      soundManager.playKeyClick();
      onStartEngine();
    } else if (engineState === 'running' && onStopEngine && !isChallengeMode) {
      soundManager.playKeyClick();
      onStopEngine();
    }
  };

  return (
    <div
      id="ignition-key-panel"
      className={`relative mt-1.5 p-2 rounded-xl border backdrop-blur-md transition-all pointer-events-auto flex flex-row-reverse items-center justify-between gap-3 shadow-xl ${
        engineState === 'running'
          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
          : engineState === 'starting'
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-100'
          : 'bg-slate-900/95 border-amber-500/60 text-slate-100 ring-2 ring-amber-500/30'
      }`}
    >
      {/* Key Cylinder & Lock Graphic */}
      <div className="flex flex-row-reverse items-center gap-2.5">
        <button
          id="ignition-key-tumbler-btn"
          onClick={handleTurnKey}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={engineState === 'starting' || !isChallengeMode}
          title={
            engineState === 'off'
              ? 'キーをひねってエンジンを始動（ゲーム開始）'
              : engineState === 'starting'
              ? 'セルモーター始動中...'
              : 'エンジン稼働中'
          }
          className="relative w-11 h-11 rounded-full bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-amber-400/70 shadow-inner flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:cursor-wait"
        >
          {/* Keyhole slot line */}
          <div className="absolute w-6 h-1 bg-slate-950 rounded-full" />

          {/* Key with tag, rotating when turned */}
          <div
            className={`relative flex items-center justify-center transition-transform duration-500 ease-out ${
              engineState === 'running'
                ? 'rotate-90'
                : engineState === 'starting'
                ? 'rotate-45 animate-pulse'
                : 'rotate-0'
            }`}
          >
            {/* Key Head & Tag */}
            <div className="flex items-center">
              <div className="w-5 h-7 rounded-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border border-amber-700 shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
              {/* PC01 Keychain */}
              <div className="w-2 h-1 bg-slate-400" />
              <div className="px-1 py-0.5 rounded bg-yellow-400 text-slate-950 font-black text-[7px] tracking-tighter border border-amber-600 shadow-sm leading-none whitespace-nowrap">
                PC01
              </div>
            </div>
          </div>
        </button>

        {/* Labels and indicators */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black tracking-wide" style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}>
              イグニッションキー
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[10px]">
            {/* Status light */}
            <span
              className={`flex items-center gap-1 font-bold ${
                engineState === 'running'
                  ? 'text-emerald-400'
                  : engineState === 'starting'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-amber-300 font-extrabold'
              }`}
            >
              {engineState === 'running' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  エンジン始動中 (運転可)
                </>
              ) : engineState === 'starting' ? (
                <>
                  <Zap className="w-3 h-3 text-amber-400 animate-spin" />
                  セルモーター始動中...
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-400 animate-bounce" />
                  キーをひねってエンジン始動！
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Direct Action Trigger Button */}
      {engineState === 'off' && (
        <button
          id="turn-key-action-btn"
          onClick={handleTurnKey}
          className="order-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 animate-pulse flex items-center gap-1"
        >
          <span>🔑 キーをひねる</span>
        </button>
      )}
    </div>
  );
};
