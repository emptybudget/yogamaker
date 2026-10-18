import { describe, expect, it } from 'vitest';
import { formatClock, formatKorean, itemSpan, stepSpan, targetStatus } from './duration';
import type { Block, Step } from '../types';

const o = { secPerBreath: 5, transitionSec: 0 };
const step = (p: Partial<Step>): Step => ({
  type: 'pose',
  id: 'x',
  label: '다운독',
  timing: { kind: 'breaths', value: 5 },
  sides: 'none',
  ...p,
});

describe('duration', () => {
  it('호흡 수 × 호흡 1회 시간', () => {
    expect(stepSpan(step({}), o).required).toBe(25);
  });
  it('초 단위 그대로', () => {
    expect(stepSpan(step({ timing: { kind: 'seconds', value: 90 } }), o).required).toBe(90);
  });
  it('반복 횟수: 기본은 호흡 1회, secPerRep 우선', () => {
    expect(stepSpan(step({ timing: { kind: 'reps', value: 5 } }), o).required).toBe(25);
    expect(stepSpan(step({ timing: { kind: 'reps', value: 2, secPerRep: 60 } }), o).required).toBe(120);
  });
  it('좌우는 2배, 전환 시간도 쪽마다 더함', () => {
    expect(stepSpan(step({ sides: 'RL' }), { secPerBreath: 5, transitionSec: 5 }).required).toBe(60);
  });
  it('생략 가능 동작은 optional 로 분리', () => {
    const s = stepSpan(step({ optional: true }), o);
    expect(s).toEqual({ required: 0, optional: 25 });
  });
  it('세트: 반복 × 반대쪽 동일', () => {
    const b: Block = {
      type: 'block',
      id: 'b',
      label: 'Set A',
      repeat: 2,
      sides: 'RL',
      items: [step({}), step({ timing: { kind: 'seconds', value: 15 } })],
    };
    expect(itemSpan(b, o).required).toBe((25 + 15) * 2 * 2);
  });
  it('목표 판정 (±30초 여유)', () => {
    expect(targetStatus(0, { minMin: 10, maxMin: 10 })).toBe('empty');
    expect(targetStatus(560, { minMin: 10, maxMin: 10 })).toBe('under');
    expect(targetStatus(580, { minMin: 10, maxMin: 10 })).toBe('ok');
    expect(targetStatus(1250, { minMin: 15, maxMin: 20 })).toBe('over');
  });
  it('시간 표시', () => {
    expect(formatClock(125)).toBe('2:05');
    expect(formatKorean(600)).toBe('10분');
    expect(formatKorean(125)).toBe('2분 5초');
  });
});
