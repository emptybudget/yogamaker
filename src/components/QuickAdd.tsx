import { useMemo, useRef, useState } from 'react';
import { formatTiming } from '../lib/duration';
import { parseLine } from '../lib/parser';
import { searchPoses } from '../lib/search';
import type { Pose, Step } from '../types';
import { Icon } from './icons';

const SEP = /(\s*(?:→|->|–|—|>)\s*|\s+-\s+)/;
const MOD = /\s*(?:R\s*\/\s*L|좌우|양쪽|숨\s*\d*|호흡\s*\d*|\d+\s*(?:회|번|초|분|숨|호흡|카운트)|[x×]\s*\d*|홀딩\s*\d*|\(?생략\)?)\s*$/i;

/** 노트에 쓰듯 한 줄 입력 → 동작 추가. 입력 중 포즈 자동완성 */
export function QuickAdd({
  poses,
  onAdd,
  placeholder = '동작 입력 (예: 다운독 숨5 R/L)',
  autoFocus,
}: {
  poses: Pose[];
  onAdd: (steps: Step[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const parts = text.split(SEP);
  const last = parts[parts.length - 1] ?? '';
  const query = last.replace(MOD, '').trim();
  const suggestions = useMemo(() => (query.length >= 1 ? searchPoses(poses, query, 6) : []), [poses, query]);
  const preview = useMemo(() => parseLine(text, poses), [text, poses]);

  const pick = (p: Pose) => {
    parts[parts.length - 1] = p.name + ' ';
    setText(parts.join(''));
    ref.current?.focus();
  };

  const submit = () => {
    if (!preview.length) return;
    onAdd(preview);
    setText('');
    ref.current?.focus();
  };

  const showSuggest = focused && suggestions.length > 0 && !suggestions.some((s) => s.name === query);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white/60 pl-3 focus-within:border-solid focus-within:border-sage-400 focus-within:bg-white"
      >
        <Icon name="plus" className="size-4 shrink-0 text-stone-400" />
        <input
          ref={ref}
          autoFocus={autoFocus}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          enterKeyHint="enter"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-stone-400"
        />
        {text && (
          <button type="submit" className="mr-1 min-h-9 shrink-0 rounded-lg bg-sage-600 px-3 text-sm font-medium text-white">
            추가
          </button>
        )}
      </form>
      {showSuggest && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions.map((p) => (
            <button key={p.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(p)} className="rounded-full bg-sage-50 px-3 py-1.5 text-sm text-sage-800 ring-1 ring-sage-100 active:bg-sage-100">
              {p.name}
            </button>
          ))}
        </div>
      )}
      {text && preview.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-stone-500">
          {preview.map((s, i) => (
            <span key={s.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-stone-300">→</span>}
              <span className={`rounded-md px-1.5 py-0.5 ${s.poseId ? 'bg-sage-50 text-sage-800' : 'bg-stone-100'}`}>
                {s.label} · {formatTiming(s.timing)}
                {s.sides === 'RL' && ' · 좌우'}
                {s.optional && ' · 생략가능'}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
