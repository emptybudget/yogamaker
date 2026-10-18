import type { Pose, Sides, Step, Timing } from '../types';
import { newId } from './id';
import { findExact } from './search';

/**
 * 빠른 입력 한 줄 → Step 목록.
 * 예) "다운독 숨5", "버드독 접었다폈다 5회 R/L", "다운독 – 워킹다운독 x5",
 *     "수리야 A2 B2 R1", "나바사나 5카운트 홀딩", "우타나 (생략)"
 */
export function parseLine(line: string, poses: Pose[]): Step[] {
  const text = line.trim();
  if (!text) return [];

  const surya = parseSurya(text, poses);
  if (surya) return surya;

  return text
    .split(/\s*(?:→|->|–|—|>)\s*|\s+-\s+/)
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => parseSegment(seg, poses));
}

type Mods = { timing?: Timing; sides?: Sides; optional?: boolean };

const RULES: { re: RegExp; apply: (m: RegExpMatchArray, mods: Mods) => void }[] = [
  { re: /\(?\s*(?:시간\s*없으면\s*)?생략(?:\s*가능)?\s*\)?/, apply: (_, x) => (x.optional = true) },
  { re: /\bR\s*\/\s*L\b|\bL\s*\/\s*R\b|좌우|양쪽|양측/i, apply: (_, x) => (x.sides = 'RL') },
  { re: /(?:숨|호흡)\s*(\d+)|(\d+)\s*(?:숨|호흡)/, apply: (m, x) => (x.timing = { kind: 'breaths', value: num(m) }) },
  { re: /(\d+)\s*카운트(?:\s*홀딩)?|홀딩\s*(\d+)/, apply: (m, x) => (x.timing = { kind: 'breaths', value: num(m) }) },
  { re: /(\d+)\s*분/, apply: (m, x) => (x.timing = { kind: 'seconds', value: num(m) * 60 }) },
  { re: /(\d+)\s*초/, apply: (m, x) => (x.timing = { kind: 'seconds', value: num(m) }) },
  { re: /[x×*]\s*(\d+)|(\d+)\s*(?:회|번)/i, apply: (m, x) => (x.timing = { kind: 'reps', value: num(m) }) },
];

const num = (m: RegExpMatchArray) => Number(m[1] ?? m[2]);

function parseSegment(seg: string, poses: Pose[]): Step {
  let rest = seg;
  const mods: Mods = {};
  for (const r of RULES) {
    const m = rest.match(r.re);
    if (m) {
      r.apply(m, mods);
      rest = rest.replace(m[0], ' ');
    }
  }
  const label = rest.replace(/\s+/g, ' ').replace(/[,(]\s*$/, '').trim() || seg.trim();
  const pose = findExact(poses, label);
  let timing: Timing = mods.timing ?? pose?.defaultTiming ?? { kind: 'breaths', value: 5 };
  // 포즈 기본값에 secPerRep(수리야 1회 60초 등)이 있으면 횟수만 바꿔도 유지
  if (timing.kind === 'reps' && pose?.defaultTiming.kind === 'reps' && pose.defaultTiming.secPerRep && !timing.secPerRep) {
    timing = { ...timing, secPerRep: pose.defaultTiming.secPerRep };
  }
  return {
    type: 'pose',
    id: newId(),
    poseId: pose?.id,
    label, // 입력한 표현 그대로 유지 (포즈는 poseId 로 연결)
    timing: { ...timing },
    sides: mods.sides ?? 'none',
    ...(mods.optional ? { optional: true } : {}),
    ...(pose?.defaultCue ? { cue: pose.defaultCue } : {}),
  };
}

/** "수리야 A2 B2 R1", "수리야 ABR" */
function parseSurya(text: string, poses: Pose[]): Step[] | null {
  const m = text.match(/^(?:수리야|surya)\s*((?:[ABR]\s*\d*\s*[,\-–]?\s*)+)(.*)$/i);
  if (!m) return null;
  const parts = [...m[1].matchAll(/([ABR])\s*(\d*)/gi)];
  if (!parts.length) return null;
  const tail = m[2].trim();
  return parts.map(([, kind, n]) => {
    const k = kind.toUpperCase();
    const pose = findExact(poses, `수리야 ${k}`);
    const secPerRep = pose?.defaultTiming.kind === 'reps' ? pose.defaultTiming.secPerRep : undefined;
    return {
      type: 'pose',
      id: newId(),
      poseId: pose?.id,
      label: `수리야 ${k}`,
      timing: { kind: 'reps', value: n ? Number(n) : 1, secPerRep: secPerRep ?? 60 },
      sides: 'none',
      ...(tail ? { note: tail } : {}),
    } satisfies Step;
  });
}
