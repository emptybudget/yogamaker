import type { Sequence, Step, Timing } from '../types';
import { timingSeconds } from './duration';

/** 수업 모드에서 한 화면 = 한 프레임 */
export type Frame = {
  key: string;
  sectionIndex: number;
  sectionName: string;
  label: string;
  side?: 'R' | 'L';
  timing: Timing;
  seconds: number;
  cue?: string;
  note?: string;
  optional?: boolean;
  blockLabel?: string;
  round?: { n: number; of: number };
};

export function flatten(seq: Sequence, opts: { skipOptional?: boolean } = {}): Frame[] {
  const frames: Frame[] = [];
  const push = (step: Step, base: Omit<Frame, 'key' | 'label' | 'timing' | 'seconds'>, outerSide?: 'R' | 'L') => {
    if (opts.skipOptional && step.optional) return;
    const sides: (('R' | 'L') | undefined)[] = step.sides === 'RL' ? ['R', 'L'] : [outerSide];
    for (const side of sides) {
      frames.push({
        ...base,
        key: `${step.id}-${frames.length}`,
        label: step.label,
        side,
        timing: step.timing,
        seconds: timingSeconds(step.timing, seq.secPerBreath) + seq.transitionSec,
        cue: step.cue,
        note: step.note,
        optional: step.optional,
      });
    }
  };
  seq.sections.forEach((section, sectionIndex) => {
    const base = { sectionIndex, sectionName: section.name };
    for (const item of section.items) {
      if (item.type === 'pose') {
        push(item, base);
        continue;
      }
      const rounds = Math.max(1, item.repeat);
      for (let r = 0; r < rounds; r++) {
        for (const side of item.sides === 'RL' ? (['R', 'L'] as const) : [undefined]) {
          for (const step of item.items) {
            push(
              step,
              { ...base, blockLabel: item.label, round: rounds > 1 ? { n: r + 1, of: rounds } : undefined },
              side,
            );
          }
        }
      }
    }
  });
  return frames;
}
