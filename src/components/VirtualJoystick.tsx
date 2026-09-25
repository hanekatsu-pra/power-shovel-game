import React, { useRef, useState, useCallback, useEffect } from 'react';
import { LeverInput } from '../types';
import { soundManager } from '../audio/soundManager';

interface VirtualJoystickProps {
  id: string;
  side: 'left' | 'right';
  title: string;
  labels: {
    up: string;
    down: string;
    left: string;
    right: string;
  };
  onChange: (input: LeverInput) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  id,
  side,
  title,
  labels,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const RADIUS = 58; // Movement track radius in pixels
  const DEADZONE = 0.12; // 12% deadzone to prevent accidental drift

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.init();

    activePointerIdRef.current = e.pointerId;
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
    setIsActive(true);
    updateKnob(e.clientX, e.clientY);
  };

  /**
   * STRICT 4-WAY CARDINAL GATING:
   * Compares |dx| vs |dy| to lock movement strictly into ONE dominant axis (X or Y).
   * Prevents simultaneous cross-actions (e.g. swing + arm, or boom + bucket).
   */
  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let rawDx = clientX - centerX;
      let rawDy = clientY - centerY;

      const rawDistance = Math.hypot(rawDx, rawDy);

      // Deadzone check
      if (rawDistance < DEADZONE * RADIUS) {
        setKnobPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0, active: false });
        return;
      }

      // 4-way dominant axis snap
      let gatedDx = 0;
      let gatedDy = 0;
      let normX = 0;
      let normY = 0;

      if (Math.abs(rawDx) > Math.abs(rawDy)) {
        // Strict Horizontal (Left or Right only, Y is locked to 0)
        const sign = rawDx > 0 ? 1 : -1;
        const clampedDist = Math.min(Math.abs(rawDx), RADIUS);
        gatedDx = sign * clampedDist;
        gatedDy = 0;

        const fraction = clampedDist / RADIUS;
        normX = sign * Math.min(1, fraction);
        normY = 0;
      } else {
        // Strict Vertical (Up or Down only, X is locked to 0)
        const sign = rawDy > 0 ? 1 : -1;
        const clampedDist = Math.min(Math.abs(rawDy), RADIUS);
        gatedDx = 0;
        gatedDy = sign * clampedDist;

        const fraction = clampedDist / RADIUS;
        normX = 0;
        normY = -sign * Math.min(1, fraction); // Screen Y is inverted (up is positive)
      }

      setKnobPos({ x: gatedDx, y: gatedDy });

      onChange({
        x: normX,
        y: normY,
        active: true,
      });
    },
    [onChange]
  );

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId && isActive) {
      e.preventDefault();
      updateKnob(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      if (containerRef.current) {
        try {
          containerRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
      activePointerIdRef.current = null;
      setIsActive(false);
      setKnobPos({ x: 0, y: 0 });
      onChange({ x: 0, y: 0, active: false });
    }
  };

  // Keyboard support with strict 4-way gating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let kx = 0;
      let ky = 0;
      let used = false;

      if (side === 'left') {
        if (e.key === 'w' || e.key === 'W') { ky = 1; used = true; }
        else if (e.key === 's' || e.key === 'S') { ky = -1; used = true; }
        else if (e.key === 'a' || e.key === 'A') { kx = -1; used = true; }
        else if (e.key === 'd' || e.key === 'D') { kx = 1; used = true; }
      } else {
        if (e.key === 'ArrowUp' || e.key === 'i' || e.key === 'I') { ky = 1; used = true; }
        else if (e.key === 'ArrowDown' || e.key === 'k' || e.key === 'K') { ky = -1; used = true; }
        else if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') { kx = -1; used = true; }
        else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') { kx = 1; used = true; }
      }

      if (used) {
        setKnobPos({ x: kx * RADIUS, y: -ky * RADIUS });
        onChange({ x: kx, y: ky, active: true });
        setIsActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let released = false;
      if (side === 'left') {
        if (['w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) released = true;
      } else {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'i', 'I', 'k', 'K', 'j', 'J', 'l', 'L'].includes(e.key)) released = true;
      }

      if (released) {
        setKnobPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0, active: false });
        setIsActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [side, onChange]);

  // Which direction is currently active
  const isUpActive = knobPos.y < -15;
  const isDownActive = knobPos.y > 15;
  const isLeftActive = knobPos.x < -15;
  const isRightActive = knobPos.x > 15;

  return (
    <div
      id={id}
      className="relative flex flex-col items-center select-none touch-none pointer-events-auto"
      style={{ width: '165px', height: '180px' }}
    >
      {/* Gated Lever Header Badge */}
      <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/85 border border-amber-400/40 backdrop-blur-md shadow-md">
        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
        <span className="text-xs font-black text-amber-300 tracking-wide">{title}</span>
        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">4方向</span>
      </div>

      {/* Cross-Gated Joystick Track */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex items-center justify-center w-[136px] h-[136px] rounded-full bg-slate-950/90 border-2 border-slate-700/85 shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing"
      >
        {/* Physical 4-Way Cross Slotted Guide (十字ガイド溝) */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-7 rounded-full bg-slate-900 border border-slate-800 pointer-events-none" />
        <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-7 rounded-full bg-slate-900 border border-slate-800 pointer-events-none" />

        {/* Center pivot hole */}
        <div className="absolute w-8 h-8 rounded-full bg-slate-950 border border-slate-700 pointer-events-none" />

        {/* UP Label */}
        <div
          className={`absolute top-1.5 inset-x-0 text-center text-[10px] font-extrabold transition-all pointer-events-none ${
            isUpActive
              ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,1)]'
              : 'text-slate-400'
          }`}
        >
          ▲ {labels.up}
        </div>

        {/* DOWN Label */}
        <div
          className={`absolute bottom-1.5 inset-x-0 text-center text-[10px] font-extrabold transition-all pointer-events-none ${
            isDownActive
              ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,1)]'
              : 'text-slate-400'
          }`}
        >
          ▼ {labels.down}
        </div>

        {/* LEFT Label */}
        <div
          className={`absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-extrabold leading-tight transition-all pointer-events-none max-w-[46px] text-left ${
            isLeftActive
              ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,1)]'
              : 'text-slate-400'
          }`}
        >
          ◀ {labels.left}
        </div>

        {/* RIGHT Label */}
        <div
          className={`absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-extrabold leading-tight transition-all pointer-events-none max-w-[46px] text-right ${
            isRightActive
              ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,1)]'
              : 'text-slate-400'
          }`}
        >
          {labels.right} ▶
        </div>

        {/* Movable Lever Stick & Knob (Slides strictly along cross axes) */}
        <div
          className="absolute w-13 h-13 rounded-full shadow-2xl flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            background: isActive
              ? 'radial-gradient(circle at 35% 35%, #fde047 0%, #f59e0b 55%, #78350f 100%)'
              : 'radial-gradient(circle at 35% 35%, #94a3b8 0%, #475569 55%, #0f172a 100%)',
            border: isActive ? '3px solid #fef08a' : '2px solid #cbd5e1',
            boxShadow: isActive ? '0 0 20px rgba(245,158,11,0.9)' : '0 4px 10px rgba(0,0,0,0.6)',
          }}
        >
          {/* Lever top grip indent */}
          <div className="w-5 h-5 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-300 animate-ping' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
