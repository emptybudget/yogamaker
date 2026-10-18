import { describe, expect, it } from 'vitest';
import { flatten } from './flatten';
import { newSequence } from './templates';
import type { Step } from '../types';

const step = (label: string, p: Partial<Step> = {}): Step => ({
  type: 'pose',
  id: label,
  label,
  timing: { kind: 'breaths', value: 2 },
  sides: 'none',
  ...p,
});

describe('flatten', () => {
  it('좌우 동작은 오른쪽 → 왼쪽 두 화면', () => {
    const seq = newSequence();
    seq.transitionSec = 0;
    seq.sections[0].items = [step('측굴', { sides: 'RL' })];
    const f = flatten(seq);
    expect(f.map((x) => x.side)).toEqual(['R', 'L']);
    expect(f[0].seconds).toBe(10);
  });
  it('반대쪽 동일 세트는 한쪽 전부 → 반대쪽 전부', () => {
    const seq = newSequence();
    seq.sections[2].items = [
      { type: 'block', id: 'b', label: '#1', repeat: 2, sides: 'RL', items: [step('워리어1'), step('워리어2')] },
    ];
    const f = flatten(seq);
    expect(f.map((x) => `${x.label}${x.side}`)).toEqual([
      '워리어1R', '워리어2R', '워리어1L', '워리어2L',
      '워리어1R', '워리어2R', '워리어1L', '워리어2L',
    ]);
    expect(f[4].round).toEqual({ n: 2, of: 2 });
  });
  it('생략 가능 동작 건너뛰기', () => {
    const seq = newSequence();
    seq.sections[0].items = [step('a'), step('b', { optional: true })];
    expect(flatten(seq, { skipOptional: true })).toHaveLength(1);
  });
});
