import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/icons';
import { BlockSheet, StepSheet } from '../components/ItemSheets';
import { QuickAdd } from '../components/QuickAdd';
import { SettingsSheet } from '../components/SettingsSheet';
import { ShareSheet } from '../components/ShareSheet';
import { SortableList, type DragHandle } from '../components/SortableList';
import { statusColor, statusLabel } from '../components/status';
import { mutateSequence } from '../db';
import { usePoses, useSequence } from '../hooks';
import {
  formatClock,
  formatRange,
  formatTiming,
  itemSpan,
  optionsOf,
  sectionSpan,
  sequenceSpan,
  targetSeconds,
  targetStatus,
  type DurationOptions,
} from '../lib/duration';
import { duplicate, insertItems, locate, moveTo, moveWithin, newBlock, removeItem, replaceItem, ungroup, type Container } from '../lib/edit';
import type { Block, Item, Pose, Section, Sequence, Step } from '../types';

type Editing = { kind: 'step' | 'block'; id: string } | null;

export default function EditorPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const seq = useSequence(id);
  const poses = usePoses();
  const [editing, setEditing] = useState<Editing>(null);
  const [sheet, setSheet] = useState<'settings' | 'share' | null>(null);

  if (seq === undefined) return null;
  if (seq === null)
    return (
      <div className="p-8 text-center text-stone-500">
        시퀀스를 찾을 수 없어요. <Link to="/" className="text-sage-700 underline">목록으로</Link>
      </div>
    );

  const m = (fn: (s: Sequence) => void) => mutateSequence(seq.id, fn);
  const editingItem = editing ? findItem(seq, editing.id) : null;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <header className="pt-safe sticky top-0 z-20 border-b border-stone-200/70 bg-paper/95 backdrop-blur">
        <div className="flex items-center gap-1 px-2 py-1.5">
          <button className="grid size-11 place-items-center rounded-xl active:bg-stone-200" onClick={() => nav('/')} aria-label="뒤로">
            <Icon name="back" />
          </button>
          <button className="min-w-0 flex-1 text-left" onClick={() => setSheet('settings')}>
            <div className="truncate text-[17px] font-semibold">{seq.title}</div>
            <div className="truncate text-xs text-stone-500">
              {[seq.classType, seq.date?.slice(5).replace('-', '/'), seq.location, seq.theme].filter(Boolean).join(' · ') || '탭해서 수업 정보 입력'}
            </div>
          </button>
          <button className="grid size-11 place-items-center rounded-xl text-stone-600 active:bg-stone-200" onClick={() => setSheet('settings')} aria-label="설정">
            <Icon name="settings" />
          </button>
        </div>
        <TimeSummary seq={seq} />
      </header>

      <main className="space-y-4 px-3 pt-4">
        {seq.sections.map((section) => (
          <SectionCard key={section.id} section={section} seq={seq} poses={poses} m={m} onEdit={setEditing} />
        ))}
      </main>

      <div className="no-print pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-2 px-3 pt-2">
          <Link to={`/s/${seq.id}/class`} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sage-600 font-semibold text-white active:bg-sage-700">
            <Icon name="play" className="size-4" /> 수업 모드
          </Link>
          <button className="grid min-h-12 w-14 place-items-center rounded-xl bg-sage-100 text-sage-800" onClick={() => setSheet('share')} aria-label="공유">
            <Icon name="share" />
          </button>
          <Link to={`/s/${seq.id}/print`} className="grid min-h-12 w-14 place-items-center rounded-xl bg-sage-100 text-sage-800" aria-label="인쇄">
            <Icon name="print" />
          </Link>
        </div>
      </div>

      {editingItem?.type === 'pose' && (
        <StepSheet
          key={editingItem.id}
          step={editingItem}
          seq={seq}
          poses={poses}
          onClose={() => setEditing(null)}
          onSave={(s) => m((x) => replaceItem(x, s))}
          onDelete={() => { m((x) => { removeItem(x, editingItem.id); }); setEditing(null); }}
          onDuplicate={() => { m((x) => duplicate(x, editingItem.id)); setEditing(null); }}
          onMove={(c) => { m((x) => moveTo(x, editingItem.id, c)); setEditing(null); }}
        />
      )}
      {editingItem?.type === 'block' && (
        <BlockSheet
          key={editingItem.id}
          block={editingItem}
          onClose={() => setEditing(null)}
          onSave={(b) => m((x) => replaceItem(x, { ...b, items: (findItem(x, b.id) as Block | null)?.items ?? b.items }))}
          onDelete={() => m((x) => { removeItem(x, editingItem.id); })}
          onUngroup={() => m((x) => ungroup(x, editingItem.id))}
          onDuplicate={() => m((x) => duplicate(x, editingItem.id))}
        />
      )}
      {sheet === 'settings' && <SettingsSheet seq={seq} onClose={() => setSheet(null)} onSave={(d) => m((x) => Object.assign(x, d, { id: x.id }))} />}
      {sheet === 'share' && <ShareSheet seq={seq} onClose={() => setSheet(null)} />}
    </div>
  );
}

function findItem(seq: Sequence, id: string): Item | null {
  const loc = locate(seq, id);
  if (!loc) return null;
  const section = seq.sections.find((s) => s.id === loc.container.sectionId)!;
  if (!loc.container.blockId) return section.items[loc.index];
  const block = section.items.find((i) => i.id === loc.container.blockId) as Block;
  return block.items[loc.index];
}

function TimeSummary({ seq }: { seq: Sequence }) {
  const span = sequenceSpan(seq);
  const min = seq.targets.reduce((a, t) => a + t.minMin, 0);
  const max = seq.targets.reduce((a, t) => a + t.maxMin, 0);
  const total = targetStatus(span.required, { minMin: min, maxMin: max });
  return (
    <div className="px-4 pb-2.5">
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold tabular-nums ${statusColor[total].text}`}>{formatClock(span.required)}</span>
        {seq.targets.length > 0 && <span className="text-sm text-stone-500">/ {formatRange({ minMin: min, maxMin: max })}</span>}
        {span.optional > 0 && <span className="text-xs text-stone-400">+{formatClock(span.optional)} 생략가능</span>}
      </div>
      <div className="-mx-4 mt-1.5 flex gap-1.5 overflow-x-auto px-4">
        {seq.targets.map((t) => {
          const sec = targetSeconds(seq, t);
          const st = targetStatus(sec, t);
          return (
            <button
              key={t.id}
              onClick={() => document.getElementById(`sec-${t.sectionIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`shrink-0 rounded-lg px-2 py-1 text-xs tabular-nums ${statusColor[st].chip}`}
            >
              {t.label} {formatClock(sec)}/{formatRange(t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  seq,
  poses,
  m,
  onEdit,
}: {
  section: Section;
  seq: Sequence;
  poses: Pose[];
  m: (fn: (s: Sequence) => void) => void;
  onEdit: (e: Editing) => void;
}) {
  const o = optionsOf(seq);
  const span = sectionSpan(section, o);
  const target = seq.targets.find((t) => t.sectionIds.includes(section.id));
  const tSec = target ? targetSeconds(seq, target) : 0;
  const st = target ? targetStatus(tSec, target) : 'empty';
  const c: Container = { sectionId: section.id };
  const blocks = section.items.filter((i) => i.type === 'block').length;

  return (
    <section id={`sec-${section.id}`} className="scroll-mt-36 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-100">
      <div className="mb-2 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-bold">{section.name}</h2>
          <span className="text-sm tabular-nums text-stone-600">
            {formatClock(span.required)}
            {span.optional > 0 && <span className="text-stone-400"> (+{formatClock(span.optional)})</span>}
          </span>
        </div>
        {target && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div className={`h-full rounded-full transition-all ${statusColor[st].bar}`} style={{ width: `${Math.min(100, (tSec / (target.maxMin * 60 || 1)) * 100)}%` }} />
            </div>
            <span className={`shrink-0 text-xs tabular-nums ${statusColor[st].text}`}>
              {target.sectionIds.length > 1 && `${target.label} `}
              {target.sectionIds.length > 1 && `${formatClock(tSec)} / `}목표 {formatRange(target)} {statusLabel[st]}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <SortableList
          items={section.items}
          onMove={(from, to) => m((s) => moveWithin(s, c, from, to))}
          render={(item, handle) =>
            item.type === 'pose' ? (
              <StepRow step={item} o={o} handle={handle} onClick={() => onEdit({ kind: 'step', id: item.id })} />
            ) : (
              <BlockCard block={item} sectionId={section.id} o={o} poses={poses} handle={handle} m={m} onEdit={onEdit} />
            )
          }
        />
      </div>

      <div className="mt-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <QuickAdd poses={poses} onAdd={(steps) => m((s) => insertItems(s, c, steps))} />
        </div>
        <button
          className="flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm text-stone-500 active:bg-stone-100"
          onClick={() => m((s) => insertItems(s, c, [newBlock(`#${blocks + 1}`)]))}
          aria-label="세트 추가"
        >
          <Icon name="layers" className="size-4" /> 세트
        </button>
      </div>
    </section>
  );
}

function StepRow({ step, o, handle, onClick, compact }: { step: Step; o: DurationOptions; handle: DragHandle; onClick: () => void; compact?: boolean }) {
  const sec = itemSpan(step, o);
  return (
    <div className={`flex items-stretch rounded-xl ${compact ? 'bg-white' : 'bg-stone-50'} ${step.optional ? 'opacity-60' : ''}`}>
      {handle}
      <button className="flex min-h-12 min-w-0 flex-1 items-center gap-2 py-2 pr-3 text-left" onClick={onClick}>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] leading-snug">{step.label}</div>
          {(step.note || step.cue) && (
            <div className="mt-0.5 truncate text-xs text-stone-400">
              {step.cue && <span className="mr-1 rounded bg-sage-50 px-1 text-sage-700">멘트</span>}
              {step.note}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs">
          {step.optional && <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-stone-600">생략가능</span>}
          {step.sides === 'RL' && <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-700">R/L</span>}
          <span className="rounded-md bg-white px-1.5 py-0.5 tabular-nums text-stone-600 ring-1 ring-stone-200">{formatTiming(step.timing)}</span>
          <span className="w-10 text-right tabular-nums text-stone-400">{formatClock(sec.required + sec.optional)}</span>
        </div>
      </button>
    </div>
  );
}

function BlockCard({
  block,
  sectionId,
  o,
  poses,
  handle,
  m,
  onEdit,
}: {
  block: Block;
  sectionId: string;
  o: DurationOptions;
  poses: Pose[];
  handle: DragHandle;
  m: (fn: (s: Sequence) => void) => void;
  onEdit: (e: Editing) => void;
}) {
  const c: Container = { sectionId, blockId: block.id };
  const span = itemSpan(block, o);
  return (
    <div className="rounded-xl border border-sage-200 bg-sage-50/60">
      <div className="flex items-stretch">
        {handle}
        <button className="flex min-h-12 min-w-0 flex-1 items-center gap-2 py-2 pr-3 text-left" onClick={() => onEdit({ kind: 'block', id: block.id })}>
          <Icon name="layers" className="size-4 shrink-0 text-sage-600" />
          <span className="min-w-0 flex-1 truncate font-semibold text-sage-900">{block.label}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs">
            {block.repeat > 1 && <span className="rounded-md bg-white px-1.5 py-0.5 text-sage-800">×{block.repeat}</span>}
            {block.sides === 'RL' && <span className="rounded-md bg-white px-1.5 py-0.5 text-sky-700">반대쪽 동일</span>}
            <span className="w-10 text-right tabular-nums text-sage-700">{formatClock(span.required)}</span>
          </span>
        </button>
      </div>
      <div className="space-y-1 px-2 pb-2">
        <SortableList
          items={block.items}
          onMove={(from, to) => m((s) => moveWithin(s, c, from, to))}
          render={(step, h) => <StepRow compact step={step} o={o} handle={h} onClick={() => onEdit({ kind: 'step', id: step.id })} />}
        />
        <QuickAdd poses={poses} placeholder={`${block.label}에 동작 추가`} onAdd={(steps) => m((s) => insertItems(s, c, steps))} />
      </div>
    </div>
  );
}
