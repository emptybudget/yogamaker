import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { Pose, Sequence } from './types';

export function usePoses(): Pose[] {
  return useLiveQuery(() => db.poses.toArray(), [], [] as Pose[]);
}

/** undefined = 로딩 중, null = 없음 */
export function useSequence(id: string | undefined): Sequence | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.sequences.get(id)) ?? null) : null), [id]);
}
