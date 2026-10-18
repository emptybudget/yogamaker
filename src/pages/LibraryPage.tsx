import { useState } from 'react';
import { Icon } from '../components/icons';
import { TimingEditor } from '../components/TimingEditor';
import { Btn, Field, Sheet, inputCls } from '../components/ui';
import { db } from '../db';
import { usePoses } from '../hooks';
import { formatTiming } from '../lib/duration';
import { newId } from '../lib/id';
import { searchPoses } from '../lib/search';
import type { Pose, PoseCategory } from '../types';

export const CATEGORIES: { value: PoseCategory; label: string }[] = [
  { value: 'warmup', label: '웜업' },
  { value: 'quadruped', label: '네발토대' },
  { value: 'standing', label: '두발토대' },
  { value: 'peak', label: '피크' },
  { value: 'cooldown', label: '쿨다운' },
  { value: 'flow', label: '플로우' },
];

export default function LibraryPage() {
  const poses = usePoses();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<PoseCategory | ''>('');
  const [editing, setEditing] = useState<Pose | null>(null);

  const list = q ? searchPoses(poses, q, 50) : poses.filter((p) => !cat || p.category === cat).sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <div className="px-4">
      <header className="pt-safe flex items-end justify-between pb-3 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">포즈 라이브러리</h1>
          <p className="text-sm text-stone-500">{poses.length}개 · 초성 검색 가능 (ㄷㅇㄷ)</p>
        </div>
      </header>
      <div className="relative mb-3">
        <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input className={`${inputCls} pl-9`} placeholder="이름, 산스크리트, 영어, 초성" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!q && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {[{ value: '' as const, label: '전체' }, ...CATEGORIES].map((c) => (
            <button key={c.value || 'all'} onClick={() => setCat(c.value)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${cat === c.value ? 'bg-sage-600 text-white' : 'bg-white text-stone-600'}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      <ul className="mb-20 divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
        {list.map((p) => (
          <li key={p.id}>
            <button className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-stone-50" onClick={() => setEditing(p)}>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="truncate text-xs text-stone-400">{[p.sanskrit, ...p.aliases.filter((a) => a !== p.sanskrit)].filter(Boolean).slice(0, 3).join(' · ')}</div>
              </div>
              <span className="shrink-0 text-xs text-stone-500">{formatTiming(p.defaultTiming)}</span>
            </button>
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="py-10 text-center text-stone-400">찾는 포즈가 없어요</p>}

      <button
        onClick={() => setEditing({ id: newId(), name: q, aliases: [], category: cat || 'standing', defaultTiming: { kind: 'breaths', value: 5 }, custom: true })}
        className="fixed bottom-24 right-5 z-20 flex h-14 items-center gap-2 rounded-full bg-sage-600 px-5 font-semibold text-white shadow-lg active:bg-sage-700"
      >
        <Icon name="plus" /> 포즈 추가
      </button>

      {editing && <PoseSheet pose={editing} exists={poses.some((p) => p.id === editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}

function PoseSheet({ pose, exists, onClose }: { pose: Pose; exists: boolean; onClose: () => void }) {
  const [d, setD] = useState(pose);
  const [aliases, setAliases] = useState(pose.aliases.join(', '));
  const save = async () => {
    if (!d.name.trim()) return;
    await db.poses.put({ ...d, name: d.name.trim(), aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean) });
    onClose();
  };
  return (
    <Sheet
      open
      onClose={onClose}
      title={exists ? '포즈 편집' : '새 포즈'}
      footer={
        <div className="flex gap-2">
          {exists && (
            <Btn variant="danger" className="px-3" onClick={async () => { if (confirm(`"${pose.name}" 포즈를 삭제할까요? (이미 짠 시퀀스에는 그대로 남아요)`)) { await db.poses.delete(pose.id); onClose(); } }}>
              <Icon name="trash" className="size-4" />
            </Btn>
          )}
          <Btn variant="primary" className="flex-1" onClick={save} disabled={!d.name.trim()}>저장</Btn>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="이름 (수업에서 부르는 이름)">
          <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} autoFocus={!exists} />
        </Field>
        <Field label="다른 이름 (쉼표로 구분)">
          <input className={inputCls} placeholder="예: 아도무카스바나아사나, downward dog" value={aliases} onChange={(e) => setAliases(e.target.value)} />
        </Field>
        <Field label="산스크리트">
          <input className={inputCls} value={d.sanskrit ?? ''} onChange={(e) => setD({ ...d, sanskrit: e.target.value || undefined })} />
        </Field>
        <Field label="분류">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => setD({ ...d, category: c.value })} className={`rounded-full px-3 py-1.5 text-sm ${d.category === c.value ? 'bg-sage-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="기본 시간">
          <TimingEditor value={d.defaultTiming} onChange={(defaultTiming) => setD({ ...d, defaultTiming })} secPerBreath={5} />
        </Field>
        <Field label="기본 큐잉 멘트">
          <textarea className={`${inputCls} min-h-24`} placeholder="자주 쓰는 멘트를 저장해두면 동작 편집에서 불러올 수 있어요" value={d.defaultCue ?? ''} onChange={(e) => setD({ ...d, defaultCue: e.target.value || undefined })} />
        </Field>
      </div>
    </Sheet>
  );
}
