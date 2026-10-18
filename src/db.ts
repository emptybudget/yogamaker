import Dexie, { type Table } from 'dexie';
import seedPoses from './data/poses.json';
import { demoSequence } from './lib/templates';
import type { Pose, Sequence } from './types';

class YogaDB extends Dexie {
  sequences!: Table<Sequence, string>;
  poses!: Table<Pose, string>;
  constructor() {
    super('yogamaker');
    this.version(1).stores({
      sequences: 'id, updatedAt, date',
      poses: 'id, name, category',
    });
  }
}

export const db = new YogaDB();

/** 기본 포즈 중 아직 없는 것만 추가 (사용자가 고친 포즈는 덮어쓰지 않음) + 첫 실행 예시 */
export async function ensureSeed(): Promise<void> {
  await db.transaction('rw', db.poses, db.sequences, async () => {
    const have = new Set(await db.poses.toCollection().primaryKeys());
    const missing = (seedPoses as Pose[]).filter((p) => !have.has(p.id));
    if (missing.length) await db.poses.bulkAdd(missing);
    if (have.size === 0 && (await db.sequences.count()) === 0) {
      await db.sequences.add(demoSequence(await db.poses.toArray()));
    }
  });
}

export async function mutateSequence(id: string, fn: (s: Sequence) => void): Promise<void> {
  await db.transaction('rw', db.sequences, async () => {
    const s = await db.sequences.get(id);
    if (!s) return;
    fn(s);
    s.updatedAt = new Date().toISOString();
    await db.sequences.put(s);
  });
}
