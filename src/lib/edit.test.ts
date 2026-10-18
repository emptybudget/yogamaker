import { describe, expect, it } from 'vitest';
import { duplicate, insertItems, locate, moveTo, moveWithin, newBlock, ungroup } from './edit';
import { newSequence } from './templates';
import type { Step } from '../types';

const step = (id: string): Step => ({ type: 'pose', id, label: id, timing: { kind: 'breaths', value: 5 }, sides: 'none' });

describe('edit', () => {
  it('섹션 안 순서 바꾸기', () => {
    const seq = newSequence();
    const sid = seq.sections[0].id;
    insertItems(seq, { sectionId: sid }, [step('a'), step('b'), step('c')]);
    moveWithin(seq, { sectionId: sid }, 0, 2);
    expect(seq.sections[0].items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });
  it('세트로 옮기고 해제', () => {
    const seq = newSequence();
    const sid = seq.sections[2].id;
    const b = newBlock('#1');
    insertItems(seq, { sectionId: sid }, [step('a'), b]);
    moveTo(seq, 'a', { sectionId: sid, blockId: b.id });
    expect(locate(seq, 'a')?.container.blockId).toBe(b.id);
    ungroup(seq, b.id);
    expect(seq.sections[2].items.map((i) => i.id)).toEqual(['a']);
  });
  it('세트 안에 세트는 못 넣음', () => {
    const seq = newSequence();
    const sid = seq.sections[2].id;
    const b = newBlock('#1');
    insertItems(seq, { sectionId: sid }, [b]);
    insertItems(seq, { sectionId: sid, blockId: b.id }, [newBlock('#2'), step('x')]);
    expect(b.items.map((i) => i.id)).toEqual(['x']);
  });
  it('복제는 새 id', () => {
    const seq = newSequence();
    const sid = seq.sections[0].id;
    insertItems(seq, { sectionId: sid }, [step('a')]);
    duplicate(seq, 'a');
    const ids = seq.sections[0].items.map((i) => i.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });
});
