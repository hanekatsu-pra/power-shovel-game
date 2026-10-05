import React from 'react';
import { X, CheckCircle2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Award } from 'lucide-react';

interface LeverGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeverGuideModal: React.FC<LeverGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="lever-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm pointer-events-auto"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100">
        {/* Close button */}
        <button
          id="close-guide-modal-btn"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-3 border-b border-slate-700/80 pb-3">
          <div>
            <h2 className="text-lg font-bold text-amber-400">
              パワーショベルに乗ろう！遊び方
            </h2>
            <p className="text-xs text-slate-400">
              YouTube「PLCおじさんの自由研究」企画
            </p>
          </div>
        </div>

        {/* Game modes */}
        <section className="mb-4 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3.5">
          <h3 className="text-sm font-bold text-amber-300">■ ゲームモード</h3>
          <dl className="mt-2 space-y-1.5 text-xs text-slate-200">
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-white">180s チャレンジ：</dt>
              <dd>制限時間内にすくったボールの数を競います</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 font-bold text-white">自由練習：</dt>
              <dd>パワーショベルの操作を練習することができます</dd>
            </div>
          </dl>
        </section>

        <section className="mb-4 rounded-xl border border-slate-700/70 bg-slate-800/60 p-3.5">
          <h3 className="text-sm font-bold text-amber-300">■ 音声</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-200">
            音声ミュートを解除すると、より臨場感を楽しめます。
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            携帯の音声OFFハードスイッチには連動しません。
          </p>
        </section>

        {/* Two Levers Explanation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          {/* Left Lever */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h3 className="font-bold text-sm text-amber-300">左レバー（アーム＆旋回）</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">上：アーム OUT</span>
                <span className="text-slate-400">（前方へ伸ばす）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">下：アーム IN</span>
                <span className="text-slate-400">（手前へ引き寄せる）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-bold text-white">左：左旋回</span>
                <span className="text-slate-400">（上部旋回体を左へ回す）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="font-bold text-white">右：右旋回</span>
                <span className="text-slate-400">（上部旋回体を右へ回す）</span>
              </li>
            </ul>
          </div>

          {/* Right Lever */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-700">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <h3 className="font-bold text-sm text-amber-300">右レバー（ブーム＆バケット）</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">上：ブーム DOWN</span>
                <span className="text-slate-400">（ブームを下げる）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-white">下：ブーム UP</span>
                <span className="text-slate-400">（ブームを上げる）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">左：バケット掘削</span>
                <span className="text-slate-400">（内側へ巻き込みすくう）</span>
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">右：バケットダンプ</span>
                <span className="text-slate-400">（外側へ開き落とす）</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Loading Mission Steps */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 mb-4">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            ダンプ積み込みミッションの流れ
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">① アプローチ</div>
              <p className="text-[11px] text-slate-300">
                ブームを下げてバケットをボールの前に合わせる
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">② すくう</div>
              <p className="text-[11px] text-slate-300">
                右レバー左（掘削）でボールをバケット内に巻き込む
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">③ 旋回＆上昇</div>
              <p className="text-[11px] text-slate-300">
                ブームを上げ、左レバー右（右旋回）でダンプへ向く
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">④ 投入</div>
              <p className="text-[11px] text-slate-300">
                ダンプ荷台の上で右レバー右（ダンプ）を開いて落とす！
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 mb-4">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>操作のコツ＆安全装置：</strong>
            アームがプール内やバスケット内に下降している間は、壁突き破りを防ぐ安全リミッター（旋回ガード）が働きます。旋回する時はブームを少し持ち上げましょう。
            バスケットに投入されたボールは、奥のコンベアで自動的にリフトアップされ、スロープを伝ってプールへ戻る自動循環機構です！
          </div>
        </div>

        {/* Start button */}
        <button
          id="confirm-and-start-btn"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg active:scale-98 transition"
        >
          操作仕様を理解してゲーム開始！
        </button>
      </div>
    </div>
  );
};
