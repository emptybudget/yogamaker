import type { Block, Item, Sequence, Step } from '../types';
import { newId } from './id';

/** 아이템이 들어갈 수 있는 곳: 섹션 최상위 또는 섹션 안의 세트 */
export type Container = { sectionId: string; blockId?: string };

export function listOf(seq: Sequence, c: Container): Item[] | null {
  const section = seq.sections.find((s) => s.id === c.sectionId);
  if (!section) return null;
  if (!c.blockId) return section.items;
  const block = section.items.find((i): i is Block => i.type === 'block' && i.id === c.blockId);
  return block ? block.items : null;
}

export function locate(seq: Sequence, itemId: string): { container: Container; index: number } | null {
  for (const s of seq.sections) {
    const i = s.items.findIndex((x) => x.id === itemId);
    if (i >= 0) return { container: { sectionId: s.id }, index: i };
    for (const b of s.items) {
      if (b.type !== 'block') continue;
      const j = b.items.findIndex((x) => x.id === itemId);
      if (j >= 0) return { container: { sectionId: s.id, blockId: b.id }, index: j };
    }
  }
  return null;
}

export function removeItem(seq: Sequence, itemId: string): Item | null {
  const loc = locate(seq, itemId);
  if (!loc) return null;
  return listOf(seq, loc.container)!.splice(loc.index, 1)[0];
}

export function insertItems(seq: Sequence, c: Container, items: Item[], index?: number): void {
  const list = listOf(seq, c);
  if (!list) return;
  // 세트 안에는 세트를 넣지 않음
  const ok = c.blockId ? items.filter((i): i is Step => i.type === 'pose') : items;
  list.splice(index ?? list.length, 0, ...ok);
}

export function replaceItem(seq: Sequence, item: Item): void {
  const loc = locate(seq, item.id);
  if (loc) listOf(seq, loc.container)![loc.index] = item;
}

export function moveWithin(seq: Sequence, c: Container, from: number, to: number): void {
  const list = listOf(seq, c);
  if (!list || from === to) return;
  const [x] = list.splice(from, 1);
  list.splice(to, 0, x);
}

export function moveTo(seq: Sequence, itemId: string, c: Container): void {
  const item = removeItem(seq, itemId);
  if (item) insertItems(seq, c, [item]);
}

export function duplicate(seq: Sequence, itemId: string): void {
  const loc = locate(seq, itemId);
  if (!loc) return;
  const list = listOf(seq, loc.container)!;
  const copy = structuredClone(list[loc.index]);
  copy.id = newId();
  if (copy.type === 'block') copy.items.forEach((s) => (s.id = newId()));
  list.splice(loc.index + 1, 0, copy);
}

/** 세트 해제: 세트 안 동작을 세트 자리에 풀어놓음 */
export function ungroup(seq: Sequence, blockId: string): void {
  const loc = locate(seq, blockId);
  if (!loc) return;
  const list = listOf(seq, loc.container)!;
  const block = list[loc.index];
  if (block.type !== 'block') return;
  list.splice(loc.index, 1, ...block.items);
}

export function newBlock(label: string): Block {
  return { type: 'block', id: newId(), label, repeat: 1, sides: 'RL', items: [] };
}
