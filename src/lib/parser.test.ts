import { describe, expect, it } from 'vitest';
import poses from '../data/poses.json';
import type { Pose } from '../types';
import { parseLine } from './parser';
import { choseong, searchPoses } from './search';

const P = poses as Pose[];

describe('parseLine', () => {
  it('호흡 수', () => {
    const [s] = parseLine('다운독 숨5', P);
    expect(s.label).toBe('다운독');
    expect(s.poseId).toBeDefined();
    expect(s.timing).toEqual({ kind: 'breaths', value: 5 });
  });
  it('별칭으로 포즈 연결', () => {
    const [s] = parseLine('아도무카스바나아사나', P);
    expect(s.label).toBe('아도무카스바나아사나');
    expect(P.find((p) => p.id === s.poseId)?.name).toBe('다운독');
  });
  it('횟수 + 좌우', () => {
    const [s] = parseLine('버드독 접었다폈다 5회 R/L', P);
    expect(s.label).toBe('버드독 접었다폈다');
    expect(s.timing).toEqual({ kind: 'reps', value: 5 });
    expect(s.sides).toBe('RL');
  });
  it('연결 동작은 여러 단계로', () => {
    const steps = parseLine('다운독 – 워킹다운독 x5', P);
    expect(steps.map((s) => s.label)).toEqual(['다운독', '워킹다운독']);
    expect(steps[1].timing).toEqual({ kind: 'reps', value: 5 });
  });
  it('이름 속 하이픈은 쪼개지 않음', () => {
    expect(parseLine('워킹다운독-x5', P)).toHaveLength(1);
  });
  it('초 / 분', () => {
    expect(parseLine('사바아사나 5분', P)[0].timing).toEqual({ kind: 'seconds', value: 300 });
    expect(parseLine('플랭크 30초', P)[0].timing).toEqual({ kind: 'seconds', value: 30 });
  });
  it('카운트 홀딩', () => {
    expect(parseLine('나바사나 5카운트 홀딩', P)[0].timing).toEqual({ kind: 'breaths', value: 5 });
  });
  it('생략 가능', () => {
    const [s] = parseLine('다운독 (시간없으면 생략)', P);
    expect(s.optional).toBe(true);
    expect(s.label).toBe('다운독');
  });
  it('수리야 약식 표기', () => {
    const steps = parseLine('수리야 A2 B2 R1', P);
    expect(steps.map((s) => [s.label, s.timing.value])).toEqual([
      ['수리야 A', 2],
      ['수리야 B', 2],
      ['수리야 R', 1],
    ]);
    expect(steps[1].timing).toMatchObject({ secPerRep: 90 });
  });
  it('모르는 동작도 자유 입력으로 저장', () => {
    const [s] = parseLine('팔꿈치 내려놓고 왼팔 귀옆', P);
    expect(s.poseId).toBeUndefined();
    expect(s.label).toBe('팔꿈치 내려놓고 왼팔 귀옆');
  });
  it('기본 시간은 포즈 기본값', () => {
    expect(parseLine('사바', P)[0].timing).toEqual({ kind: 'seconds', value: 300 });
  });
});

describe('search', () => {
  it('초성 검색', () => {
    expect(choseong('다운독')).toBe('ㄷㅇㄷ');
    expect(searchPoses(P, 'ㄷㅇㄷ')[0].name).toBe('다운독');
  });
  it('부분 검색', () => {
    expect(searchPoses(P, '워리어').map((p) => p.name)).toContain('워리어2');
  });
});
