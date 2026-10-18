import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/icons';
import { useSequence } from '../hooks';
import { formatClock, formatTiming } from '../lib/duration';
import { flatten, type Frame } from '../lib/flatten';
import { chime, useWakeLock } from '../lib/wakeLock';

const SIDE = { R: '오른쪽', L: '왼쪽' } as const;

export default function ClassPage() {
  const { id } = useParams();
  const seq = useSequence(id);
  const [skipOptional, setSkipOptional] = useState(false);
  const frames = useMemo(() => (seq ? flatten(seq, { skipOptional }) : []), [seq, skipOptional]);

  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(true);
  const [frameElapsed, setFrameElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const last = useRef<number | null>(null);

  useWakeLock(true);

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(frames.length - 1, to));
      setIdx(n);
      setFrameElapsed(0);
    },
    [frames.length],
  );

  // 타이머 (250ms 간격, 실제 경과 시간 기준)
  useEffect(() => {
    if (!running) {
      last.current = null;
      return;
    }
    const t = setInterval(() => {
      const now = Date.now();
      const dt = last.current ? (now - last.current) / 1000 : 0;
      last.current = now;
      setFrameElapsed((e) => e + dt);
      setTotalElapsed((e) => e + dt);
    }, 250);
    return () => clearInterval(t);
  }, [running]);

  const frame: Frame | undefined = frames[idx];

  // 자동 넘김
  useEffect(() => {
    if (!auto || !running || !frame) return;
    if (frameElapsed >= frame.seconds) {
      if (idx < frames.length - 1) {
        if (sound) chime();
        go(idx + 1);
      } else setRunning(false);
    }
  }, [auto, running, frame, frameElapsed, idx, frames.length, go, sound]);

  // 키보드 (아이패드 키보드 / 블루투스 리모컨)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(idx + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(idx - 1);
      else if (e.key === ' ') {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, go]);

  // 스와이프
  const touch = useRef<number | null>(null);

  if (seq === undefined) return <div className="min-h-dvh bg-stone-950" />;
  if (!seq || !frames.length || !frame)
    return (
      <div className="grid min-h-dvh place-items-center bg-stone-950 p-8 text-center text-stone-300">
        <div>
          <p className="mb-4">{seq ? '아직 동작이 없어요' : '시퀀스를 찾을 수 없어요'}</p>
          <Link to={seq ? `/s/${seq.id}` : '/'} className="text-sage-300 underline">돌아가기</Link>
        </div>
      </div>
    );

  const totalPlanned = frames.reduce((a, f) => a + f.seconds, 0);
  const elapsedPlanned = frames.slice(0, idx).reduce((a, f) => a + f.seconds, 0) + Math.min(frameElapsed, frame.seconds);
  const remain = frame.seconds - frameElapsed;
  const breathsLeft = frame.timing.kind === 'breaths' ? Math.max(0, Math.ceil((remain - seq.transitionSec) / seq.secPerBreath)) : null;
  const upcoming = frames.slice(idx + 1, idx + 5);
  const sectionStarts = frames.map((f, i) => (i === 0 || frames[i - 1].sectionIndex !== f.sectionIndex ? i : -1)).filter((i) => i >= 0);

  return (
    <div
      className="flex h-dvh select-none flex-col overflow-hidden bg-stone-950 text-stone-100"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      {/* 상단: 진행 바 */}
      <div className="pt-safe px-4">
        <div className="flex items-center gap-3 py-2">
          <Link to={`/s/${seq.id}`} className="grid size-11 place-items-center rounded-xl text-stone-400 active:bg-white/10" aria-label="나가기">
            <Icon name="x" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-stone-400">{seq.title}</div>
            <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 rounded-full bg-sage-400" style={{ width: `${(elapsedPlanned / totalPlanned) * 100}%` }} />
              {sectionStarts.slice(1).map((i) => (
                <div key={i} className="absolute inset-y-0 w-0.5 bg-stone-950" style={{ left: `${(frames.slice(0, i).reduce((a, f) => a + f.seconds, 0) / totalPlanned) * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="text-right text-sm tabular-nums text-stone-400">
            <div>{formatClock(totalElapsed)}</div>
            <div className="text-xs">남은 {formatClock(totalPlanned - elapsedPlanned)}</div>
          </div>
          <button className="grid size-11 place-items-center rounded-xl text-stone-400 active:bg-white/10" onClick={() => setShowMenu((v) => !v)} aria-label="옵션">
            <Icon name="settings" />
          </button>
        </div>
        {showMenu && (
          <div className="mb-2 flex flex-wrap gap-2 rounded-2xl bg-white/5 p-2 text-sm">
            <Chip on={auto} onClick={() => setAuto((v) => !v)}>자동 넘김</Chip>
            <Chip on={sound} onClick={() => setSound((v) => !v)}>알림음</Chip>
            <Chip on={skipOptional} onClick={() => { setSkipOptional((v) => !v); go(0); }}>생략가능 동작 건너뛰기</Chip>
          </div>
        )}
      </div>

      {/* 본문: 가로 화면(아이패드)에서는 좌우 2단 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-2 landscape:flex-row md:landscape:gap-6 md:landscape:px-8">
        <button className="flex min-h-0 flex-[2] flex-col overflow-hidden rounded-3xl bg-white/5 p-5 text-left md:p-8 [@media(max-height:500px)]:p-3" onClick={() => go(idx + 1)}>
          <div className="flex items-center gap-2 text-sm text-sage-300 md:text-base">
            <span>{frame.sectionName}</span>
            {frame.blockLabel && <span className="text-stone-500">› {frame.blockLabel}{frame.round && ` (${frame.round.n}/${frame.round.of})`}</span>}
            <span className="ml-auto tabular-nums text-stone-500">{idx + 1} / {frames.length}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 [@media(max-height:500px)]:mt-1">
            <h1 className="font-bold leading-tight" style={{ fontSize: 'clamp(1.5rem, min(7vw, 9vh), 4.5rem)' }}>{frame.label}</h1>
            {frame.side && (
              <span className={`rounded-xl px-3 py-1 text-xl font-semibold md:text-3xl ${frame.side === 'R' ? 'bg-sky-400/20 text-sky-300' : 'bg-amber-400/20 text-amber-300'}`}>
                {SIDE[frame.side]}
              </span>
            )}
          </div>
          <div className="mt-2 text-lg text-stone-400 md:text-2xl">
            {formatTiming(frame.timing)}
            {frame.note && <span className="ml-3 text-stone-500">· {frame.note}</span>}
          </div>
          <div className={`mt-2 font-light leading-none tabular-nums ${remain < 0 ? 'text-amber-300' : ''}`} style={{ fontSize: 'clamp(2rem, min(14vw, 18vh), 9rem)' }}>
            {remain < 0 ? '+' : ''}
            {formatClock(Math.abs(remain))}
          </div>
          {breathsLeft !== null && <div className="mt-1 text-lg text-stone-400 md:text-2xl">남은 호흡 약 {breathsLeft}</div>}
          {frame.cue && <p className="mt-4 min-h-0 overflow-y-auto whitespace-pre-wrap text-lg leading-relaxed text-stone-300 md:text-2xl">{frame.cue}</p>}
        </button>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden portrait:max-h-56">
          <div className="text-sm text-stone-500">다음</div>
          {upcoming.map((f, i) => (
            <button key={f.key} onClick={() => go(idx + 1 + i)} className={`rounded-2xl bg-white/5 px-4 py-3 text-left ${i === 0 ? 'text-stone-100' : 'text-stone-400'}`}>
              <div className="flex items-center gap-2">
                <span className={`truncate ${i === 0 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>{f.label}</span>
                {f.side && <span className="shrink-0 text-sm text-stone-500">{SIDE[f.side]}</span>}
                <span className="ml-auto shrink-0 text-sm tabular-nums text-stone-500">{formatTiming(f.timing)}</span>
              </div>
              {f.sectionIndex !== frame.sectionIndex && <div className="text-xs text-sage-400">{f.sectionName}</div>}
            </button>
          ))}
          {upcoming.length === 0 && <div className="rounded-2xl bg-white/5 px-4 py-3 text-stone-500">마지막 동작이에요</div>}
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="pb-safe flex items-center justify-center gap-4 px-4 pt-2 [@media(max-height:500px)]:pb-1 [@media(max-height:500px)]:pt-0 [@media(max-height:500px)]:[&>button]:scale-75">
        <button className="grid size-16 place-items-center rounded-full bg-white/10 active:bg-white/20" onClick={() => go(idx - 1)} aria-label="이전">
          <Icon name="prev" className="size-6" />
        </button>
        <button className="grid size-20 place-items-center rounded-full bg-sage-500 text-white active:bg-sage-600" onClick={() => setRunning((r) => !r)} aria-label={running ? '일시정지' : '시작'}>
          <Icon name={running ? 'pause' : 'play'} className="size-8" />
        </button>
        <button className="grid size-16 place-items-center rounded-full bg-white/10 active:bg-white/20" onClick={() => go(idx + 1)} aria-label="다음">
          <Icon name="next" className="size-6" />
        </button>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-3 py-1.5 ${on ? 'bg-sage-500 text-white' : 'bg-white/10 text-stone-300'}`}>
      {on && '✓ '}
      {children}
    </button>
  );
}
