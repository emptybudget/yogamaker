import { useLiveQuery } from 'dexie-react-hooks';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/icons';
import { Btn, Sheet, inputCls } from '../components/ui';
import { db } from '../db';
import { formatKorean, sequenceSpan } from '../lib/duration';
import { asCopy, downloadJson, readJsonFile } from '../lib/share';
import { newSequence } from '../lib/templates';
import type { Sequence } from '../types';

export default function ListPage() {
  const nav = useNavigate();
  const seqs = useLiveQuery(() => db.sequences.orderBy('updatedAt').reverse().toArray(), [], [] as Sequence[]);
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState<Sequence | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const types = [...new Set(seqs.map((s) => s.classType).filter(Boolean))] as string[];
  const [type, setType] = useState<string>('');
  const shown = seqs.filter(
    (s) =>
      (!type || s.classType === type) &&
      (!q || [s.title, s.location, s.theme, s.classType].some((x) => x?.includes(q))),
  );

  const create = async () => {
    const s = newSequence();
    await db.sequences.add(s);
    nav(`/s/${s.id}`);
  };

  const importFile = async (f: File) => {
    try {
      const list = await readJsonFile(f);
      if (!list.length) throw new Error();
      await db.sequences.bulkAdd(list.map((s) => asCopy(s)));
      alert(`${list.length}개 시퀀스를 가져왔어요`);
    } catch {
      alert('시퀀스 파일을 읽지 못했어요');
    }
  };

  return (
    <div className="px-4">
      <header className="pt-safe flex items-end justify-between pb-3 pt-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">요가메이커</h1>
          <p className="text-sm text-stone-500">시퀀스 {seqs.length}개</p>
        </div>
        <div className="flex gap-1">
          <button className="grid size-11 place-items-center rounded-xl text-stone-500 active:bg-stone-200" onClick={() => fileRef.current?.click()} aria-label="파일에서 가져오기">
            <Icon name="upload" />
          </button>
          <button className="grid size-11 place-items-center rounded-xl text-stone-500 active:bg-stone-200" onClick={() => downloadJson(seqs, `yogamaker-backup-${new Date().toISOString().slice(0, 10)}.json`)} aria-label="전체 백업">
            <Icon name="download" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
      </header>

      <div className="relative mb-3">
        <Icon name="search" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
        <input className={`${inputCls} pl-9`} placeholder="제목, 장소, 주제 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {types.length > 0 && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {['', ...types].map((t) => (
            <button key={t || 'all'} onClick={() => setType(t)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm ${type === t ? 'bg-sage-600 text-white' : 'bg-white text-stone-600'}`}>
              {t || '전체'}
            </button>
          ))}
        </div>
      )}

      <ul className="space-y-2.5">
        {shown.map((s) => {
          const span = sequenceSpan(s);
          return (
            <li key={s.id} className="flex items-stretch rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
              <button className="min-w-0 flex-1 px-4 py-3.5 text-left" onClick={() => nav(`/s/${s.id}`)}>
                <div className="flex items-center gap-2">
                  {s.classType && <span className="shrink-0 rounded-md bg-sage-50 px-1.5 py-0.5 text-xs text-sage-700">{s.classType}</span>}
                  <span className="truncate font-semibold">{s.title}</span>
                </div>
                <div className="mt-1 flex gap-2 text-sm text-stone-500">
                  <span className="tabular-nums">{formatKorean(span.required)}</span>
                  {s.date && <span>· {s.date.slice(5).replace('-', '/')}</span>}
                  {s.location && <span className="truncate">· {s.location}</span>}
                </div>
              </button>
              <button className="grid w-12 place-items-center text-stone-400" onClick={() => setMenu(s)} aria-label="더보기">
                <Icon name="more" />
              </button>
            </li>
          );
        })}
      </ul>
      {shown.length === 0 && <p className="py-16 text-center text-stone-400">{seqs.length ? '검색 결과가 없어요' : '아직 시퀀스가 없어요'}</p>}

      <button onClick={create} className="no-print fixed bottom-24 right-5 z-20 flex h-14 items-center gap-2 rounded-full bg-sage-600 px-5 font-semibold text-white shadow-lg active:bg-sage-700">
        <Icon name="plus" /> 새 시퀀스
      </button>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title}>
        {menu && (
          <div className="grid gap-2">
            <Btn onClick={() => { nav(`/s/${menu.id}/class`); }}><Icon name="play" className="size-4" /> 수업 모드</Btn>
            <Btn onClick={async () => { const c = asCopy(menu, ' (복사본)'); await db.sequences.add(c); setMenu(null); }}><Icon name="copy" className="size-4" /> 복제</Btn>
            <Btn onClick={() => downloadJson([menu], `${menu.title}.json`)}><Icon name="download" className="size-4" /> 파일로 내보내기</Btn>
            <Btn variant="danger" onClick={async () => { if (confirm(`"${menu.title}" 을(를) 삭제할까요?`)) { await db.sequences.delete(menu.id); setMenu(null); } }}>
              <Icon name="trash" className="size-4" /> 삭제
            </Btn>
          </div>
        )}
      </Sheet>
    </div>
  );
}
