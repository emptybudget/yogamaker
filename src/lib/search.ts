import type { Pose } from '../types';

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

/** "다운독" → "ㄷㅇㄷ" */
export function choseong(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) out += CHO[Math.floor((c - 0xac00) / 588)];
    else out += ch;
  }
  return out;
}

export const normalize = (s: string): string => s.toLowerCase().replace(/[\s\-_·]/g, '');

const isAllChoseong = (s: string) => s.length > 0 && [...s].every((c) => CHO.includes(c));

function names(p: Pose): string[] {
  return [p.name, ...p.aliases, ...(p.sanskrit ? [p.sanskrit] : [])];
}

/** 이름이 정확히 같은 포즈 (빠른 입력에서 자동 연결용) */
export function findExact(poses: Pose[], label: string): Pose | undefined {
  const q = normalize(label);
  if (!q) return undefined;
  return poses.find((p) => names(p).some((n) => normalize(n) === q));
}

/** 자동완성 검색. 정확 > 앞부분 일치 > 포함 > 초성 순 */
export function searchPoses(poses: Pose[], query: string, limit = 8): Pose[] {
  const q = normalize(query);
  if (!q) return [];
  const cho = isAllChoseong(q);
  const scored: { p: Pose; score: number }[] = [];
  for (const p of poses) {
    let best = 0;
    for (const n of names(p)) {
      const nn = normalize(n);
      let s = 0;
      if (nn === q) s = 100;
      else if (nn.startsWith(q)) s = 80;
      else if (nn.includes(q)) s = 60;
      else if (cho && choseong(nn).includes(q)) s = choseong(nn).startsWith(q) ? 50 : 40;
      if (n !== p.name) s -= 5; // 대표 이름 우선
      best = Math.max(best, s);
    }
    if (best > 0) scored.push({ p, score: best });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.p.name.length - b.p.name.length)
    .slice(0, limit)
    .map((x) => x.p);
}
