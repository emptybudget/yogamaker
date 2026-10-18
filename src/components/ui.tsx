import { useEffect, type ReactNode } from 'react';
import { Icon } from './icons';

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-3">
          <div className="min-w-0 flex-1 truncate text-base font-semibold">{title}</div>
          <button className="-mr-2 grid size-10 place-items-center rounded-full text-stone-500 active:bg-stone-100" onClick={onClose} aria-label="닫기">
            <Icon name="x" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="pb-safe border-t border-stone-100 px-5 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = 'soft',
  className = '',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const v = {
    primary: 'bg-sage-600 text-white active:bg-sage-700',
    soft: 'bg-sage-100 text-sage-800 active:bg-sage-200',
    ghost: 'text-stone-600 active:bg-stone-100',
    danger: 'bg-rose-50 text-rose-700 active:bg-rose-100',
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-medium transition disabled:opacity-40 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-stone-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-9 flex-1 rounded-lg text-sm font-medium transition ${
            value === o.value ? 'bg-white text-ink shadow-sm' : 'text-stone-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex items-center gap-2">
      <button type="button" className="grid size-11 place-items-center rounded-xl bg-stone-100 text-xl active:bg-stone-200" onClick={() => onChange(clamp(value - step))} aria-label="줄이기">
        −
      </button>
      <label className="flex min-w-20 items-baseline justify-center gap-1">
        <input
          inputMode="numeric"
          className="w-14 bg-transparent text-center text-xl font-semibold tabular-nums outline-none"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
        />
        {suffix && <span className="text-sm text-stone-500">{suffix}</span>}
      </label>
      <button type="button" className="grid size-11 place-items-center rounded-xl bg-stone-100 text-xl active:bg-stone-200" onClick={() => onChange(clamp(value + step))} aria-label="늘리기">
        +
      </button>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex min-h-11 w-full items-center gap-3 text-left">
      <span className="flex-1">
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-xs text-stone-500">{hint}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-sage-500' : 'bg-stone-300'}`}>
        <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-sage-400 focus:ring-2 focus:ring-sage-100';
