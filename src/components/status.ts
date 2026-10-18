import type { TargetStatus } from '../lib/duration';

export const statusColor: Record<TargetStatus, { bar: string; text: string; chip: string }> = {
  empty: { bar: 'bg-stone-200', text: 'text-stone-400', chip: 'bg-stone-100 text-stone-500' },
  under: { bar: 'bg-amber-400', text: 'text-amber-700', chip: 'bg-amber-50 text-amber-800' },
  ok: { bar: 'bg-sage-500', text: 'text-sage-700', chip: 'bg-sage-100 text-sage-800' },
  over: { bar: 'bg-rose-500', text: 'text-rose-700', chip: 'bg-rose-50 text-rose-700' },
};

export const statusLabel: Record<TargetStatus, string> = { empty: '', under: '부족', ok: '', over: '초과' };
