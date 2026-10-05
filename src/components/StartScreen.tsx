import React from 'react';
import { ArrowLeft, Play, ShieldCheck } from 'lucide-react';
import excavatorStartIcon from '../assets/ui/start-excavator-icon.png';

type StartScreenView = 'start' | 'notice';

interface StartScreenProps {
  view: StartScreenView | 'game';
  onStart: () => void;
  onOpenNotice: () => void;
  onBack: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ view, onStart, onOpenNotice, onBack }) => {
  if (view === 'game') return null;

  return (
    <div
      id="game-start-screen"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
    >
      {view === 'start' ? (
        <main className="w-full max-w-md rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl">
          <img src={excavatorStartIcon} alt="パワーショベル" className="mx-auto mb-4 h-24 w-24 object-contain" />
          <h1 className="text-3xl font-black tracking-wide text-amber-400">パワーショベルに乗ろう！</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            左右のレバーを使ってボールをすくい、ダンプバスケットへ運ぼう！
          </p>
          <button
            id="game-start-button"
            onClick={onStart}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-base font-black text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            ゲームスタート
          </button>
          <button
            id="open-usage-notice-button"
            onClick={onOpenNotice}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3 text-sm font-bold text-slate-100 transition hover:border-amber-400 hover:text-amber-300 active:scale-[0.98]"
          >
            <ShieldCheck className="h-4 w-4" />
            ご利用にあたって
          </button>
        </main>
      ) : (
        <section className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-amber-500/60 bg-slate-900 text-slate-100 shadow-2xl">
          <header className="flex shrink-0 items-center gap-3 border-b border-slate-700 px-5 py-4">
            <ShieldCheck className="h-6 w-6 shrink-0 text-amber-400" />
            <h1 className="text-base font-black leading-snug text-amber-400 sm:text-xl">「パワーショベルに乗ろう！」ご利用にあたって Ver.1</h1>
          </header>
          <article className="overflow-y-auto px-5 py-5 text-left text-sm leading-relaxed text-slate-200">
            <div className="space-y-3">
              <p>このゲームを見つけていただき、ありがとうございます！</p>
              <p>「パワーショベルを自分で操作したら面白そう」</p>
              <p>そんなところから作り始めた、ブラウザで遊べる無料のWebゲームです。</p>
              <p>まだまだ改良中ですが、ブームを動かして、バケットでボールをすくって、バスケットまで運んでみてください。</p>
            </div>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ 無料で遊べます</h2>
              <p className="mt-2">ゲーム自体の利用料金はかかりません。</p>
              <p className="mt-2">ただし、ゲームの読み込みやプレイにはインターネット通信を使用します。スマートフォンなどでモバイル通信を利用する場合、<strong className="text-white">通信料はご利用になる方の負担</strong>となります。</p>
              <p className="mt-2">ギガまでこちらですくうことはできませんので、通信量が気になる方はWi-Fi環境でどうぞ。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ うまく動かないこともあります</h2>
              <p className="mt-2">このゲームはWebブラウザ上で3Dを動かしています。</p>
              <p className="mt-2">そのため、スマートフォン・タブレット・パソコンの性能や、OS、ブラウザ、通信環境などによっては、</p>
              <p className="mt-2 whitespace-pre-line">「ちょっと重い」{`\n`}「動きがカクカクする」{`\n`}「思ったように動かない」</p>
              <p className="mt-2">といったことがあるかもしれません。</p>
              <p className="mt-2">できるだけ多くの環境で遊べるよう調整していきますが、すべての端末での動作を保証するものではありません。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ 本物のパワーショベルとは違います</h2>
              <p className="mt-2">このゲームは、実際の小型パワーショベルを参考にしながら制作していますが、<strong className="text-white">実機を完全に再現したシミュレーターではありません。</strong></p>
              <p className="mt-2">ゲームとして遊びやすくするため、サイズ、動き、操作感、バケットの容量、機械の性能など、実物とは異なる部分があります。</p>
              <p className="mt-2">ですので、</p>
              <p className="mt-2 font-bold text-white">「このゲームでクリティカルを10回出したから、明日から本物も乗れる！」</p>
              <p className="mt-2">とはなりません。</p>
              <p className="mt-2">実際の建設機械を操作するときは、必要な資格・教育・安全上のルールなどを確認し、適切な管理・指導のもとで操作してください。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ ゲームの内容は変わることがあります</h2>
              <p className="mt-2">現在も少しずつ改良しています。</p>
              <p className="mt-2 whitespace-pre-line">「ここを直したい」{`\n`}「こんな機能を入れたい」{`\n`}「これはちょっとやりすぎた」</p>
              <p className="mt-2">など、作っている本人にもいろいろ出てきます。</p>
              <p className="mt-2">そのため、ゲームの内容、ルール、画面、難易度、キャラクターなどは、予告なく変更することがあります。</p>
              <p className="mt-2">また、メンテナンスやその他の事情により、一時的に遊べなくなったり、公開を終了したりする場合があります。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ スコアについて</h2>
              <p className="mt-2">スコアやクリティカル回数は、ゲームを楽しむためのものです。</p>
              <p className="mt-2">高得点を出したからといって、建設会社からスカウトが来る機能は、今のところ実装されていません。</p>
              <p className="mt-2">ぜひ記録更新を狙ってください。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ 遊ぶ場所にも少しご注意ください</h2>
              <p className="mt-2">スマートフォンで遊ぶ場合は、歩きながらのプレイなどは避けて、安全な場所で遊んでください。</p>
              <p className="mt-2">バケットのボールはこぼしても大丈夫ですが、歩きスマホで自分が転ぶのは困ります。</p>
              <p className="mt-2">周囲を確認して、落ち着いて遊べる場所でお楽しみください。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ 不具合について</h2>
              <p className="mt-2">個人制作のWebゲームなので、思わぬ不具合が残っている可能性があります。</p>
              <p className="mt-2">突然ボールが変な動きをしたり、表示がおかしくなったりした場合は、</p>
              <p className="mt-2 font-bold text-white">「あ、何かやらかしたな」</p>
              <p className="mt-2">くらいの温かい目で見ていただけるとうれしいです。</p>
              <p className="mt-2">もちろん、見つかった不具合は可能な範囲で改善していきます。</p>
            </section>

            <section className="mt-7">
              <h2 className="text-base font-black text-amber-300">■ 最後に</h2>
              <p className="mt-2">このゲームは、「パワーショベルって面白いな」「ちょっと操作してみたいな」と思ってもらえることを目指して作っています。</p>
              <p className="mt-3">まずは難しく考えず、</p>
              <p className="mt-3 text-base font-black text-white whitespace-pre-line">すくう。{`\n`}運ぶ。{`\n`}入れる。</p>
              <p className="mt-3">そして50個きれいに運べたら――</p>
              <p className="mt-3 text-xl font-black tracking-wide text-amber-400">CRITICAL！</p>
              <p className="mt-3">ぜひ楽しんでください。</p>
              <p className="mt-6 text-right text-xs leading-6 text-slate-400">
                制定：2026年10月05日<br />
                最終更新：2026年10月05日
              </p>
            </section>
          </article>
          <footer className="shrink-0 border-t border-slate-700 p-4">
            <button
              id="back-to-start-button"
              onClick={onBack}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-700 active:scale-[0.98]"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </button>
          </footer>
        </section>
      )}
    </div>
  );
};