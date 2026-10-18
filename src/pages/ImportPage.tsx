import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Btn } from '../components/ui';
import { db } from '../db';
import { formatKorean, sequenceSpan } from '../lib/duration';
import { asCopy, decodeSequence } from '../lib/share';

export default function ImportPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const seq = useMemo(() => decodeSequence(params.get('d') ?? ''), [params]);

  if (!seq)
    return (
      <div className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <p className="mb-4 text-stone-500">링크가 올바르지 않아요</p>
          <Btn onClick={() => nav('/')}>목록으로</Btn>
        </div>
      </div>
    );

  const save = async (thenClass: boolean) => {
    const copy = asCopy(seq);
    await db.sequences.add(copy);
    nav(thenClass ? `/s/${copy.id}/class` : `/s/${copy.id}`, { replace: true });
  };

  const count = seq.sections.reduce((a, s) => a + s.items.length, 0);
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center p-6">
      <div className="w-full rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-500">받은 시퀀스</p>
        <h1 className="mt-1 text-xl font-bold">{seq.title}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {formatKorean(sequenceSpan(seq).required)} · 동작 {count}개{seq.location && ` · ${seq.location}`}
        </p>
        <div className="mt-6 grid gap-2">
          <Btn variant="primary" onClick={() => save(true)}>저장하고 수업 모드로</Btn>
          <Btn onClick={() => save(false)}>저장하고 편집</Btn>
        </div>
      </div>
    </div>
  );
}
