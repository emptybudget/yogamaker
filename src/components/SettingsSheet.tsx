import { useState } from 'react';
import { newId } from '../lib/id';
import type { Sequence } from '../types';
import { Icon } from './icons';
import { Btn, Field, Sheet, Stepper, inputCls } from './ui';

const CLASS_TYPES = ['힐링', '빈야사', '하타', '하타플로우', '스트레칭', '오픈클래스'];

export function SettingsSheet({ seq, onClose, onSave }: { seq: Sequence; onClose: () => void; onSave: (s: Sequence) => void }) {
  const [d, setD] = useState<Sequence>(() => structuredClone(seq));
  const close = () => { onSave(d); onClose(); };
  const set = (patch: Partial<Sequence>) => setD({ ...d, ...patch });

  const moveSection = (i: number, dir: -1 | 1) => {
    const sections = [...d.sections];
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    set({ sections });
  };

  return (
    <Sheet open onClose={close} title="수업 정보 · 설정" footer={<Btn variant="primary" className="w-full" onClick={close}>완료</Btn>}>
      <div className="space-y-5">
        <Field label="제목">
          <input className={inputCls} value={d.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="수업 유형">
          <div className="flex flex-wrap gap-1.5">
            {CLASS_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => set({ classType: d.classType === t ? undefined : t })} className={`rounded-full px-3 py-1.5 text-sm ${d.classType === t ? 'bg-sage-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                {t}
              </button>
            ))}
            <input className="min-w-24 flex-1 rounded-full bg-stone-100 px-3 py-1.5 text-sm outline-none" placeholder="직접 입력" value={d.classType && !CLASS_TYPES.includes(d.classType) ? d.classType : ''} onChange={(e) => set({ classType: e.target.value || undefined })} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜"><input type="date" className={inputCls} value={d.date ?? ''} onChange={(e) => set({ date: e.target.value || undefined })} /></Field>
          <Field label="장소"><input className={inputCls} placeholder="예: 방이" value={d.location ?? ''} onChange={(e) => set({ location: e.target.value || undefined })} /></Field>
        </div>
        <Field label="수업 주제">
          <input className={inputCls} placeholder="예: 앞면, 옆면 열어내는" value={d.theme ?? ''} onChange={(e) => set({ theme: e.target.value || undefined })} />
        </Field>
        <Field label="메모">
          <textarea className={`${inputCls} min-h-20`} value={d.memo ?? ''} onChange={(e) => set({ memo: e.target.value || undefined })} />
        </Field>

        <div className="rounded-2xl bg-stone-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">시간 계산</h3>
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[15px]">호흡 1회</span>
            <Stepper value={d.secPerBreath} min={2} max={15} suffix="초" onChange={(v) => set({ secPerBreath: v })} />
          </div>
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[15px]">동작 사이 전환</span>
            <Stepper value={d.transitionSec} min={0} max={30} suffix="초" onChange={(v) => set({ transitionSec: v })} />
          </div>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <h3 className="mb-1 text-sm font-semibold">목표 시간</h3>
          <p className="mb-3 text-xs text-stone-500">최소–최대 (분). 같게 두면 딱 그 시간이 목표</p>
          {d.targets.map((t, i) => (
            <div key={t.id} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between">
                <input className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none" value={t.label} onChange={(e) => { const targets = [...d.targets]; targets[i] = { ...t, label: e.target.value }; set({ targets }); }} />
                <button type="button" className="text-xs text-stone-400" onClick={() => set({ targets: d.targets.filter((x) => x.id !== t.id) })}>삭제</button>
              </div>
              <div className="mb-1 flex flex-wrap gap-1">
                {d.sections.map((s) => {
                  const on = t.sectionIds.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => { const targets = [...d.targets]; targets[i] = { ...t, sectionIds: on ? t.sectionIds.filter((x) => x !== s.id) : [...t.sectionIds, s.id] }; set({ targets }); }} className={`rounded-md px-2 py-0.5 text-xs ${on ? 'bg-sage-200 text-sage-900' : 'bg-white text-stone-400'}`}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1">
                <Stepper value={t.minMin} min={0} max={120} suffix="분" onChange={(v) => { const targets = [...d.targets]; targets[i] = { ...t, minMin: v, maxMin: Math.max(v, t.maxMin) }; set({ targets }); }} />
                <span className="text-stone-400">–</span>
                <Stepper value={t.maxMin} min={0} max={120} suffix="분" onChange={(v) => { const targets = [...d.targets]; targets[i] = { ...t, maxMin: v, minMin: Math.min(v, t.minMin) }; set({ targets }); }} />
              </div>
            </div>
          ))}
          <Btn variant="ghost" className="w-full" onClick={() => set({ targets: [...d.targets, { id: newId(), label: '새 목표', sectionIds: [], minMin: 10, maxMin: 10 }] })}>
            <Icon name="plus" className="size-4" /> 목표 추가
          </Btn>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">섹션</h3>
          {d.sections.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 py-1">
              <input className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-[15px] outline-none" value={s.name} onChange={(e) => { const sections = [...d.sections]; sections[i] = { ...s, name: e.target.value }; set({ sections }); }} />
              <button type="button" className="grid size-9 place-items-center text-stone-400" onClick={() => moveSection(i, -1)} aria-label="위로"><Icon name="up" className="size-4" /></button>
              <button type="button" className="grid size-9 place-items-center text-stone-400" onClick={() => moveSection(i, 1)} aria-label="아래로"><Icon name="down" className="size-4" /></button>
              <button
                type="button"
                className="grid size-9 place-items-center text-rose-400"
                aria-label="섹션 삭제"
                onClick={() => {
                  if (s.items.length && !confirm(`"${s.name}" 섹션과 안의 동작을 삭제할까요?`)) return;
                  set({ sections: d.sections.filter((x) => x.id !== s.id), targets: d.targets.map((t) => ({ ...t, sectionIds: t.sectionIds.filter((x) => x !== s.id) })) });
                }}
              >
                <Icon name="trash" className="size-4" />
              </button>
            </div>
          ))}
          <Btn variant="ghost" className="mt-1 w-full" onClick={() => set({ sections: [...d.sections, { id: newId(), name: '새 섹션', kind: 'custom', items: [] }] })}>
            <Icon name="plus" className="size-4" /> 섹션 추가
          </Btn>
        </div>
      </div>
    </Sheet>
  );
}
