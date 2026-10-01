import React from 'react';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Clock,
  Target,
  Sparkles,

  Eye,
} from 'lucide-react';
import { GameStats } from '../types';
import { IgnitionKey } from './IgnitionKey';

interface GameHUDProps {
  stats: GameStats;
  currentActionText: string;
  guardWarningText?: string;
  isMuted: boolean;
  comboEnabled: boolean;
  cameraMode: 'leftRear' | 'centerRear' | 'cab';
  engineState: 'off' | 'starting' | 'running';
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onResetGame: () => void;
  onToggleMode: () => void;
  onCycleCamera: () => void;
  onStartEngine: () => void;
  onStopEngine?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  currentActionText,
  guardWarningText,
  isMuted,
  comboEnabled,
  cameraMode,
  engineState,
  onToggleMute,
  onOpenGuide,
  onResetGame,
  onToggleMode,
  onCycleCamera,
  onStartEngine,
  onStopEngine,
}) => {
  const panelBg =
    'bg-slate-900/92 border-amber-500/30 text-slate-100 shadow-xl border backdrop-blur-md';
  const subTextCol = 'text-slate-400';
  const btnBg =
    'bg-slate-800/90 text-slate-200 hover:bg-slate-700/90 border border-slate-700/80 transition-all active:scale-95';

  return (
    <div className="game-hud-shell absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-20">
      {/* Top Header Bar: All windows placed at the exact same vertical level */}
      <div className="game-hud-topbar flex items-start justify-between gap-2 flex-nowrap">
        {/* Window 1: Title & Channel & Style badge */}
        <div
          className={`game-hud-title-panel flex flex-col shrink-0 rounded-xl px-3 py-1.5 pointer-events-auto transition-all ${panelBg}`}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-sm sm:text-base font-black tracking-wide text-amber-400"
              style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}
            >
              パワーショベルに乗ろう！
            </span>
            <span className="hidden">
              <Sparkles className="w-2.5 h-2.5" /> 手書きイラスト風
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium ${subTextCol}`}>
              YouTube「PLCおじさんの自由研究」企画
            </span>
          </div>
        </div>

        {/* Window 2: Center Stats: Score, Loaded, Golden Balls, Combos, Timer */}
        <div
          className={`game-hud-stats-panel flex shrink-0 items-center gap-2 sm:gap-3 rounded-xl px-3 py-1.5 pointer-events-auto transition-all ${panelBg}`}
        >
          {/* Cumulative loaded count */}
          <div className="game-hud-control-row flex items-center gap-1.5 flex-nowrap">
            <Target className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className={`text-[9px] font-semibold leading-none ${subTextCol}`}>
                ダンプ積込累積
              </span>
              <span className="text-xs sm:text-sm font-extrabold leading-tight text-emerald-400">
                {stats.ballsLoaded} <span className="text-[10px] text-slate-400 font-normal">個</span>
              </span>
            </div>
          </div>

          {/* Combo Multiplier indicator */}
          {comboEnabled && stats.combo > 1 && (
            <>
              <div className="w-[1px] h-6 bg-slate-700" />
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[11px] animate-bounce shadow">
                <span>🔥</span>
                <span>COMBO x{stats.combo}</span>
              </div>
            </>
          )}

          {/* Timer if challenge mode */}
          {stats.mode === 'challenge' && (
            <>
              <div className="w-[1px] h-6 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                <div className="flex flex-col">
                  <span className={`text-[9px] font-semibold leading-none ${subTextCol}`}>
                    残り時間
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-extrabold leading-tight ${
                      stats.timeRemaining <= 15 ? 'text-red-400 animate-pulse' : 'text-sky-300'
                    }`}
                  >
                    {Math.ceil(stats.timeRemaining)}s
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Window 3: Camera View Selector & Action Controls (All at the exact same height!) */}
        <div className="game-hud-control-panel flex flex-col items-end shrink-0 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            {/* Camera View Window (Same height and row as other windows) */}
            <div className={`flex items-center rounded-xl p-1 ${panelBg}`}>
              <button
                id="toggle-camera-view-btn"
                onClick={onCycleCamera}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 ${btnBg}`}
                title="視点切り替え"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300">視点:</span>
                <span className="text-amber-400 font-extrabold">
                  {cameraMode === 'leftRear'
                    ? '左斜め後方'
                    : cameraMode === 'centerRear'
                    ? '後方中央'
                    : '運転席寄り'}
                </span>
              </button>
            </div>

            {/* Action Controls Window */}
            <div className={`game-hud-action-controls flex items-center gap-1 sm:gap-1.5 rounded-xl p-1 ${panelBg}`}>
              {/* Mode switch */}
              <button
                id="toggle-game-mode-btn"
                onClick={onToggleMode}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                  stats.mode === 'challenge'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : btnBg
                }`}
                title="モード切替"
              >
                {stats.mode === 'free' ? '自由練習' : '60s チャレンジ'}
              </button>

              {/* Audio toggle */}
              <button
                id="toggle-audio-btn"
                onClick={onToggleMute}
                className={`p-1.5 rounded-lg ${btnBg}`}
                title={isMuted ? '音声をONにする' : '音声をミュート'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>

              {/* Guide button */}
              <button
                id="open-guide-btn"
                onClick={onOpenGuide}
                className={`p-1.5 rounded-lg ${btnBg}`}
                title="操作説明書"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
              </button>

              {/* Reset button */}
              <button
                id="reset-game-btn"
                onClick={onResetGame}
                className={`p-1.5 rounded-lg ${btnBg}`}
                title="位置とボールをリセット"
              >
                <RotateCcw className="w-4 h-4 text-slate-400 hover:text-slate-100" />
              </button>
            </div>
          </div>

          {/* Ignition Key Switch: Positioned right beneath the mode selection */}
          <div className="w-full max-w-[280px]">
            <IgnitionKey
              engineState={engineState}
              onStartEngine={onStartEngine}
              onStopEngine={onStopEngine}
              isChallengeMode={stats.mode === 'challenge'}
              timeRemaining={stats.timeRemaining}
            />
          </div>
        </div>
      </div>

      {/* Middle Active Action / Wall Collision Guard Banner / Bucket Indicator */}
      <div className="flex flex-col justify-center items-center gap-1.5">
        {guardWarningText && (
          <div
            id="guard-warning-banner"
            className="absolute left-[72%] top-[53%] -translate-x-1/2 max-w-[18rem] text-center px-4 py-1 rounded-full border text-[11px] font-black tracking-wide bg-red-950/90 border-red-500 text-red-200 backdrop-blur-md shadow-lg animate-bounce"
          >
            ⚠️ {guardWarningText}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Realtime Bucket Scoop Gauge */}

          {currentActionText && (
            <div
              id="active-action-banner"
              className="absolute left-[72%] top-[47%] -translate-x-1/2 max-w-[18rem] text-center leading-snug px-4 py-1.5 rounded-full border text-xs sm:text-sm font-extrabold tracking-wide backdrop-blur-md shadow-xl bg-slate-900/90 border-amber-400/70 text-amber-300 animate-pulse transition-all"
              style={{ fontFamily: '"Zen Maru Gothic", sans-serif' }}
            >
              {currentActionText}
            </div>
          )}

          {!guardWarningText && (
            <div
              className={'game-hud-instruction absolute left-[33%] bottom-[10rem] top-auto -translate-x-1/2 max-w-[11rem] text-center leading-snug text-[11px] font-semibold px-3 py-1 rounded-full border backdrop-blur-md bg-slate-950/70 border-slate-800 text-slate-400'}
            >
              左右レバーでボールをすくってダンプバスケットへ投入しよう！
            </div>
          )}
        </div>
      </div>

      {/* Bottom spacer for dual joysticks */}
      <div className="h-2" />
    </div>
  );
};
