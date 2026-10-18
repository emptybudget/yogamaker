import type { Pose, Section, SectionKind, Sequence, Step } from '../types';
import { newId } from './id';
import { parseLine } from './parser';

export const SECTION_KINDS: { kind: SectionKind; name: string }[] = [
  { kind: 'warmup', name: '웜업' },
  { kind: 'quadruped', name: '네발토대' },
  { kind: 'standing', name: '두발토대' },
  { kind: 'peak', name: '피크포즈' },
  { kind: 'cooldown', name: '쿨다운' },
];

/** 기본 구성: 웜업 10 / 네발 10 / 두발+피크 15–20 / 쿨다운 5–10 */
export function newSequence(title = '새 시퀀스'): Sequence {
  const sections: Section[] = SECTION_KINDS.map(({ kind, name }) => ({ id: newId(), kind, name, items: [] }));
  const id = (k: SectionKind) => sections.find((s) => s.kind === k)!.id;
  const now = new Date().toISOString();
  return {
    id: newId(),
    title,
    date: now.slice(0, 10),
    secPerBreath: 5,
    transitionSec: 3,
    sections,
    targets: [
      { id: newId(), label: '웜업', sectionIds: [id('warmup')], minMin: 10, maxMin: 10 },
      { id: newId(), label: '네발토대', sectionIds: [id('quadruped')], minMin: 10, maxMin: 10 },
      { id: newId(), label: '두발+피크', sectionIds: [id('standing'), id('peak')], minMin: 15, maxMin: 20 },
      { id: newId(), label: '쿨다운', sectionIds: [id('cooldown')], minMin: 5, maxMin: 10 },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

const lines = (poses: Pose[], ls: string[]): Step[] => ls.flatMap((l) => parseLine(l, poses));

/** 첫 실행 때 보여줄 예시 (강사 노트 "0902 방이" 기반) */
export function demoSequence(poses: Pose[]): Sequence {
  const seq = newSequence('힐링요가 – 하체 열기 (예시)');
  seq.classType = '힐링';
  seq.location = '방이';
  seq.theme = '고관절과 앞허벅지를 부드럽게 열어내기';
  const [warm, quad, stand, peak, cool] = seq.sections;
  warm.items = lines(poses, ['센터링 2분', '갈비뼈 껴안기 호흡 숨5', '앉은 측굴 R/L', '등뒤깍지 가슴열기', '목 반원 3회', 'ㄱ자 힙서클 5회']);
  warm.items[0] = {
    ...(warm.items[0] as Step),
    cue: '양팔로 나를 감싸안아주듯이 손바닥으로 갈비뼈 감싸안고, 눈을 감아서 호흡명상으로 수련 시작하겠습니다.',
  };
  quad.items = [
    ...lines(poses, ['테이블', '소고양이 5회', '버드독 접었다폈다 5회 R/L', '버드독 팔뻗고 유지 숨5 R/L']),
    ...lines(poses, ['다운독 – 워킹다운독 x5']),
  ];
  stand.items = [
    ...lines(poses, ['수리야 A2 B2']),
    {
      type: 'block',
      id: newId(),
      label: '본동작',
      repeat: 1,
      sides: 'RL',
      items: lines(poses, [
        '하이런지',
        '비틀린 하이런지',
        '업다운 5회',
        '로우런지',
        '발등당기기 숨5',
        '하프스플릿',
        '아쉬와산찰라나 머리위합장',
        '리버스 워리어',
        '빈야사',
      ]),
    },
  ];
  peak.items = lines(poses, ['나무자세 변형 R/L', '말라사나']);
  cool.items = lines(poses, ['역테이블', '브릿지', '물고기', '누워서 비틀기 R/L', '사바아사나 5분']);
  return seq;
}
