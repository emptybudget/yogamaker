import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Sequence } from '../types';
import { newId } from './id';

export function encodeSequence(seq: Sequence): string {
  return compressToEncodedURIComponent(JSON.stringify(seq));
}

export function decodeSequence(data: string): Sequence | null {
  try {
    const json = decompressFromEncodedURIComponent(data);
    return json ? validate(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

export function shareUrl(seq: Sequence): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/import?d=${encodeSequence(seq)}`;
}

export function validate(x: unknown): Sequence | null {
  const s = x as Sequence;
  if (!s || typeof s !== 'object' || typeof s.title !== 'string' || !Array.isArray(s.sections)) return null;
  return {
    ...s,
    secPerBreath: s.secPerBreath ?? 5,
    transitionSec: s.transitionSec ?? 0,
    targets: s.targets ?? [],
  };
}

/** 가져온 시퀀스는 새 id 로 저장 (기존 것 덮어쓰기 방지) */
export function asCopy(seq: Sequence, suffix = ''): Sequence {
  const now = new Date().toISOString();
  return { ...structuredClone(seq), id: newId(), title: seq.title + suffix, createdAt: now, updatedAt: now };
}

export function downloadJson(seqs: Sequence[], filename: string): void {
  const blob = new Blob([JSON.stringify(seqs.length === 1 ? seqs[0] : seqs, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function readJsonFile(file: File): Promise<Sequence[]> {
  const parsed = JSON.parse(await file.text());
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.map(validate).filter((s): s is Sequence => !!s);
}
