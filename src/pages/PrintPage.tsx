import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/icons';
import { useSequence } from '../hooks';
import { formatClock, formatTiming, optionsOf, sectionSpan, sequenceSpan } from '../lib/duration';
import type { Step } from '../types';

/** 강사가 쓰던 3단 표 형식: 섹션 | 동작 | 큐잉 멘트 */
export default function PrintPage() {
  const { id } = useParams();
  const seq = useSequence(id);
  if (!seq) return null;
  const o = optionsOf(seq);

  const stepText = (s: Step) =>
    [s.label, formatTiming(s.timing), s.sides === 'RL' ? 'R/L' : '', s.optional ? '(생략가능)' : ''].filter(Boolean).join(' ');

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 text-[13px] text-black print:p-0">
      <div className="no-print mb-6 flex items-center gap-2">
        <Link to={`/s/${seq.id}`} className="grid size-11 place-items-center rounded-xl active:bg-stone-100" aria-label="뒤로"><Icon name="back" /></Link>
        <div className="flex-1" />
        <button onClick={() => window.print()} className="flex min-h-11 items-center gap-2 rounded-xl bg-sage-600 px-4 font-medium text-white">
          <Icon name="print" className="size-4" /> 인쇄 / PDF 저장
        </button>
      </div>

      <h1 className="text-lg font-bold">
        {seq.date && `${seq.date.slice(5).replace('-', '')} `}
        {seq.title}
        {seq.location && ` · ${seq.location}`}
      </h1>
      <p className="mb-3 text-stone-600">
        {[seq.classType, seq.theme, `총 ${formatClock(sequenceSpan(seq).required)}`].filter(Boolean).join(' – ')}
        {' · '}
        {seq.sections.map((s) => `${s.name} ${Math.round(sectionSpan(s, o).required / 60)}`).join(' – ')}
      </p>

      <table className="w-full border-collapse">
        <tbody>
          {seq.sections.map((s) => {
            const rows = s.items.flatMap((it) =>
              it.type === 'pose'
                ? [{ key: it.id, text: stepText(it), cue: it.cue, note: it.note, block: false }]
                : [
                    { key: it.id, text: `[${it.label}]${it.repeat > 1 ? ` ×${it.repeat}` : ''}${it.sides === 'RL' ? ' 반대쪽 동일' : ''}`, cue: undefined, note: it.note, block: true },
                    ...it.items.map((x) => ({ key: x.id, text: `  ${stepText(x)}`, cue: x.cue, note: x.note, block: false })),
                  ],
            );
            return rows.length === 0 ? null : rows.map((r, i) => (
              <tr key={r.key} className="align-top break-inside-avoid">
                {i === 0 && (
                  <td rowSpan={rows.length} className="w-20 border border-stone-400 px-2 py-1 font-semibold">
                    {s.name}
                    <div className="text-xs font-normal text-stone-500">{formatClock(sectionSpan(s, o).required)}</div>
                  </td>
                )}
                <td className={`w-[38%] whitespace-pre-wrap border border-stone-400 px-2 py-1 ${r.block ? 'font-semibold' : ''}`}>
                  {r.text}
                  {r.note && <div className="text-xs text-stone-500">{r.note}</div>}
                </td>
                <td className="whitespace-pre-wrap border border-stone-400 px-2 py-1 leading-relaxed">{r.cue}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
      {seq.memo && <p className="mt-3 whitespace-pre-wrap text-stone-600">{seq.memo}</p>}
    </div>
  );
}
