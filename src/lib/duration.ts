import type { Item, Section, Sequence, Step, Target, Timing } from '../types';

export type DurationOptions = { secPerBreath: number; transitionSec: number };

export const optionsOf = (seq: Pick<Sequence, 'secPerBreath' | 'transitionSec'>): DurationOptions => ({
  secPerBreath: seq.secPerBreath,
  transitionSec: seq.transitionSec,
});

/** 한 번(한쪽) 수행하는 시간, 초 */
export function timingSeconds(t: Timing, secPerBreath: number): number {
  switch (t.kind) {
    case 'seconds':
      return t.value;
    case 'breaths':
      return t.value * secPerBreath;
    case 'reps':
      return t.value * (t.secPerRep ?? secPerBreath);
  }
}

export type Span = { required: number; optional: number };
const add = (a: Span, b: Span): Span => ({ required: a.required + b.required, optional: a.optional + b.optional });
const times = (a: Span, n: number): Span => ({ required: a.required * n, optional: a.optional * n });
const ZERO: Span = { required: 0, optional: 0 };

export function stepSpan(step: Step, o: DurationOptions): Span {
  const sides = step.sides === 'RL' ? 2 : 1;
  const sec = (timingSeconds(step.timing, o.secPerBreath) + o.transitionSec) * sides;
  return step.optional ? { required: 0, optional: sec } : { required: sec, optional: 0 };
}

export function itemSpan(item: Item, o: DurationOptions): Span {
  if (item.type === 'pose') return stepSpan(item, o);
  const one = item.items.reduce((acc, s) => add(acc, stepSpan(s, o)), ZERO);
  return times(one, Math.max(1, item.repeat) * (item.sides === 'RL' ? 2 : 1));
}

export function sectionSpan(section: Section, o: DurationOptions): Span {
  return section.items.reduce((acc, it) => add(acc, itemSpan(it, o)), ZERO);
}

export function sequenceSpan(seq: Sequence): Span {
  const o = optionsOf(seq);
  return seq.sections.reduce((acc, s) => add(acc, sectionSpan(s, o)), ZERO);
}

export type TargetStatus = 'empty' | 'under' | 'ok' | 'over';
const TOLERANCE_SEC = 30;

export function targetStatus(totalSec: number, t: Pick<Target, 'minMin' | 'maxMin'>): TargetStatus {
  if (totalSec === 0) return 'empty';
  if (totalSec < t.minMin * 60 - TOLERANCE_SEC) return 'under';
  if (totalSec > t.maxMin * 60 + TOLERANCE_SEC) return 'over';
  return 'ok';
}

export function targetSeconds(seq: Sequence, t: Target): number {
  const o = optionsOf(seq);
  return seq.sections
    .filter((s) => t.sectionIds.includes(s.id))
    .reduce((acc, s) => acc + sectionSpan(s, o).required, 0);
}

/** 125 → "2:05" */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** 125 → "2분 5초", 600 → "10분" */
export function formatKorean(sec: number): string {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}초`;
  return r === 0 ? `${m}분` : `${m}분 ${r}초`;
}

export function formatTiming(t: Timing): string {
  switch (t.kind) {
    case 'seconds':
      return t.value >= 60 && t.value % 60 === 0 ? `${t.value / 60}분` : `${t.value}초`;
    case 'breaths':
      return `숨${t.value}`;
    case 'reps':
      return `${t.value}회`;
  }
}

export function formatRange(t: Pick<Target, 'minMin' | 'maxMin'>): string {
  return t.minMin === t.maxMin ? `${t.minMin}분` : `${t.minMin}–${t.maxMin}분`;
}
