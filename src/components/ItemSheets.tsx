import { useState } from 'react';
import { formatKorean, itemSpan } from '../lib/duration';
import type { Container } from '../lib/edit';
import { findExact } from '../lib/search';
import type { Block, Pose, Sequence, Step } from '../types';
import { Icon } from './icons';
import { TimingEditor } from './TimingEditor';
import { Btn, Field, Segmented, Sheet, Stepper, Toggle, inputCls } from './ui';

export type MoveTarget = { label: string; container: Container };

export function moveTargets(seq: Sequence): MoveTarget[] {
  return seq.sections.flatMap((s) => [
    { label: s.name, container: { sectionId: s.id } },
    ...s.items
      .filter((i): i is Block => i.type === 'block')
      .map((b) => ({ label: `${s.name} › ${b.label}`, container: { sectionId: s.id, blockId: b.id } })),
  ]);
}

export function StepSheet({
  step,
  seq,
  poses,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onMove,
}: {
  step: Step;
  seq: Sequence;
  poses: Pose[];
  onClose: () => void;
  onSave: (s: Step) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (c: Container) => void;
}) {
  const [d, setD] = useState<Step>(step);
  const pose = poses.find((p) => p.id === d.poseId);
  const save = () => {
    const linked = findExact(poses, d.label);
    onSave({ ...d, label: d.label.trim() || step.label, poseId: linked?.id ?? (d.label === step.label ? d.poseId : undefined) });
  };
  const targets = moveTargets(seq);
  const opts = { secPerBreath: seq.secPerBreath, transitionSec: seq.transitionSec };

  return (
    <Sheet
      open
      onClose={() => { save(); onClose(); }}
      title="동작 편집"
      footer={
        <div className="flex gap-2">
          <Btn variant="danger" onClick={onDelete} className="px-3" ><Icon name="trash" className="size-4" /></Btn>
          <Btn onClick={() => { save(); onDuplicate(); }} className="px-3"><Icon name="copy" className="size-4" /></Btn>
          <Btn variant="primary" className="flex-1" onClick={() => { save(); onClose(); }}>
            완료 · {formatKorean(itemSpan(d, opts).required + itemSpan(d, opts).optional)}
          </Btn>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="동작 이름">
          <input className={inputCls} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
          {pose && pose.name !== d.label && <span className="mt-1 block text-xs text-stone-500">포즈: {pose.name}{pose.sanskrit && ` · ${pose.sanskrit}`}</span>}
          {pose && pose.name === d.label && pose.sanskrit && <span className="mt-1 block text-xs text-stone-500">{pose.sanskrit}</span>}
        </Field>
        <Field label="시간">
          <TimingEditor value={d.timing} onChange={(timing) => setD({ ...d, timing })} secPerBreath={seq.secPerBreath} />
        </Field>
        <div className="divide-y divide-stone-100">
          <Toggle label="좌우 (R/L)" hint="오른쪽·왼쪽 각각 → 시간 2배" checked={d.sides === 'RL'} onChange={(v) => setD({ ...d, sides: v ? 'RL' : 'none' })} />
          <Toggle label="시간 없으면 생략" hint="합계에서 따로 표시" checked={!!d.optional} onChange={(v) => setD({ ...d, optional: v || undefined })} />
        </div>
        <Field label="큐잉 멘트">
          <textarea
            className={`${inputCls} min-h-28 leading-relaxed`}
            placeholder="수업 중 화면에 보여줄 멘트"
            value={d.cue ?? ''}
            onChange={(e) => setD({ ...d, cue: e.target.value || undefined })}
          />
          {!d.cue && pose?.defaultCue && (
            <button type="button" className="mt-1 text-xs text-sage-700 underline" onClick={() => setD({ ...d, cue: pose.defaultCue })}>
              저장된 기본 멘트 불러오기
            </button>
          )}
        </Field>
        <Field label="메모">
          <input className={inputCls} placeholder="예: 블록 사용, 초보자는 무릎 내려서" value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value || undefined })} />
        </Field>
        <Field label="다른 곳으로 옮기기">
          <select
            className={inputCls}
            value=""
            onChange={(e) => {
              const t = targets[Number(e.target.value)];
              if (t) { save(); onMove(t.container); }
            }}
          >
            <option value="">선택…</option>
            {targets.map((t, i) => (
              <option key={i} value={i}>{t.label}</option>
            ))}
          </select>
        </Field>
      </div>
    </Sheet>
  );
}

export function BlockSheet({
  block,
  onClose,
  onSave,
  onDelete,
  onUngroup,
  onDuplicate,
}: {
  block: Block;
  onClose: () => void;
  onSave: (b: Block) => void;
  onDelete: () => void;
  onUngroup: () => void;
  onDuplicate: () => void;
}) {
  const [d, setD] = useState<Block>(block);
  const save = () => onSave({ ...d, label: d.label.trim() || block.label });
  return (
    <Sheet
      open
      onClose={() => { save(); onClose(); }}
      title="세트 편집"
      footer={<Btn variant="primary" className="w-full" onClick={() => { save(); onClose(); }}>완료</Btn>}
    >
      <div className="space-y-5">
        <Field label="세트 이름">
          <input className={inputCls} value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} />
        </Field>
        <Field label="반복">
          <div className="flex justify-center"><Stepper value={d.repeat} min={1} max={20} suffix="번" onChange={(repeat) => setD({ ...d, repeat })} /></div>
        </Field>
        <Field label="방향">
          <Segmented
            value={d.sides}
            onChange={(sides) => setD({ ...d, sides })}
            options={[
              { value: 'RL', label: '반대쪽 동일 (R→L)' },
              { value: 'none', label: '한 번만' },
            ]}
          />
        </Field>
        <Field label="메모">
          <input className={inputCls} placeholder="예: 2번 해서 방향전환" value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value || undefined })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={() => { save(); onDuplicate(); onClose(); }}><Icon name="copy" className="size-4" /> 세트 복제</Btn>
          <Btn onClick={() => { onUngroup(); onClose(); }}><Icon name="layers" className="size-4" /> 세트 풀기</Btn>
          <Btn variant="danger" className="col-span-2" onClick={() => { if (confirm('세트와 안의 동작을 모두 삭제할까요?')) { onDelete(); onClose(); } }}>
            <Icon name="trash" className="size-4" /> 세트 삭제
          </Btn>
        </div>
      </div>
    </Sheet>
  );
}
