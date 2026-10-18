import type { Timing } from '../types';
import { Segmented, Stepper } from './ui';

export function TimingEditor({ value, onChange, secPerBreath }: { value: Timing; onChange: (t: Timing) => void; secPerBreath: number }) {
  const setKind = (kind: Timing['kind']) => {
    if (kind === value.kind) return;
    // 단위를 바꿔도 대략 같은 시간이 되도록 환산
    const sec = value.kind === 'seconds' ? value.value : value.value * (value.kind === 'reps' ? (value.secPerRep ?? secPerBreath) : secPerBreath);
    if (kind === 'seconds') onChange({ kind, value: Math.max(5, Math.round(sec / 5) * 5) });
    else onChange({ kind, value: Math.max(1, Math.round(sec / secPerBreath)) });
  };
  return (
    <div className="space-y-3">
      <Segmented
        value={value.kind}
        onChange={setKind}
        options={[
          { value: 'breaths', label: '호흡' },
          { value: 'seconds', label: '시간' },
          { value: 'reps', label: '횟수' },
        ]}
      />
      <div className="flex justify-center">
        {value.kind === 'seconds' ? (
          <Stepper value={value.value} step={value.value >= 60 ? 15 : 5} min={5} max={1800} suffix="초" onChange={(v) => onChange({ ...value, value: v })} />
        ) : (
          <Stepper value={value.value} min={1} max={99} suffix={value.kind === 'breaths' ? '호흡' : '회'} onChange={(v) => onChange({ ...value, value: v })} />
        )}
      </div>
      {value.kind === 'reps' && (
        <label className="flex items-center justify-center gap-2 text-sm text-stone-500">
          1회 =
          <input
            inputMode="numeric"
            className="w-14 rounded-lg border border-stone-200 px-2 py-1 text-center"
            placeholder={String(secPerBreath)}
            value={value.secPerRep ?? ''}
            onChange={(e) => {
              const n = Number(e.target.value.replace(/\D/g, ''));
              onChange({ ...value, secPerRep: n > 0 ? n : undefined });
            }}
          />
          초 <span className="text-xs">(비우면 호흡 1회)</span>
        </label>
      )}
    </div>
  );
}
