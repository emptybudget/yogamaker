// 앱 전체 데이터 타입. 저장 형식이 바뀌면 db.ts 버전도 올릴 것.

export type Timing =
  | { kind: 'seconds'; value: number }
  | { kind: 'breaths'; value: number }
  // secPerRep 이 없으면 시퀀스의 호흡 1회 시간으로 계산
  | { kind: 'reps'; value: number; secPerRep?: number };

export type Sides = 'none' | 'RL';

export type PoseCategory = 'warmup' | 'quadruped' | 'standing' | 'peak' | 'cooldown' | 'flow';

export type Pose = {
  id: string;
  name: string; // 강사가 실제 부르는 이름 (예: 다운독)
  aliases: string[]; // 산스크리트, 영어, 다른 표기
  sanskrit?: string;
  category: PoseCategory;
  defaultTiming: Timing;
  defaultCue?: string;
  custom?: boolean; // 사용자가 추가한 포즈
};

export type Step = {
  type: 'pose';
  id: string;
  poseId?: string;
  label: string;
  timing: Timing;
  sides: Sides;
  optional?: boolean; // 시간 없으면 생략
  cue?: string; // 큐잉 멘트
  note?: string;
};

export type Block = {
  type: 'block';
  id: string;
  label: string; // Set A, #1 ...
  repeat: number;
  sides: Sides; // RL = 반대쪽 동일
  items: Step[];
  note?: string;
};

export type Item = Step | Block;

export type SectionKind = 'warmup' | 'quadruped' | 'standing' | 'peak' | 'cooldown' | 'custom';

export type Section = {
  id: string;
  name: string;
  kind: SectionKind;
  items: Item[];
};

export type Target = {
  id: string;
  label: string;
  sectionIds: string[];
  minMin: number;
  maxMin: number;
};

export type Sequence = {
  id: string;
  title: string;
  classType?: string;
  date?: string; // YYYY-MM-DD
  location?: string;
  theme?: string;
  memo?: string;
  secPerBreath: number;
  transitionSec: number; // 포즈 사이 전환 시간
  sections: Section[];
  targets: Target[];
  createdAt: string;
  updatedAt: string;
};
