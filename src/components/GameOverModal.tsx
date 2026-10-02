import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GameStats } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  if (!stats.isGameOver) return null;

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
    >
      <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 text-center text-slate-100">
        <h2 className="text-2xl font-black text-white mb-5">{'\u30c1\u30e3\u30ec\u30f3\u30b8\u7d42\u4e86\u30fb120\u79d2\u9593\u306e\u7a4d\u307f\u8fbc\u307f\u7d50\u679c'}</h2>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/40 mb-5">
          <div className="text-6xl font-black text-emerald-400 leading-none">
            {stats.ballsLoaded} <span className="text-2xl font-medium">{'\u500b'}</span>
          </div>
          <div className="mt-4 text-5xl font-black text-amber-400 leading-none">
            {stats.criticalCount} <span className="text-xl font-bold">{'\u30af\u30ea\u30c6\u30a3\u30ab\u30eb'}</span>
          </div>          <p className="text-sm text-slate-300 mt-3">
            ボールをダンプバスケットへ<br />積み込みました！
          </p>
        </div>

        <button
          id="restart-challenge-btn"
          onClick={onRestart}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg active:scale-98 transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          もう一度挑戦する
        </button>
      </div>
    </div>
  );
};