# AGENTS.md — 코딩 에이전트(Codex 등) 작업 규칙

## 프로젝트
요가 강사용 시퀀스 작성 PWA. 전체 기획과 단계는 `docs/PLAN.md`를 먼저 읽을 것.
사용자는 한국어 사용자이며 UI 문구는 모두 한국어.

## 스택
Vite + React + TypeScript(strict) + Tailwind CSS, dexie(IndexedDB), @dnd-kit, vite-plugin-pwa, vitest.
서버/백엔드 추가 금지 (2차 단계에서 명시적으로 요청할 때만).

## 규칙
- 한 번에 `docs/PLAN.md`의 **한 단계만** 작업한다. 범위 밖 리팩터링 금지.
- **모바일 우선**: 기본 레이아웃은 폭 375px 기준, 터치 타겟 최소 44px. 수업 모드만 아이패드 가로 기준.
- 시간 계산(`src/lib/duration.ts`)과 빠른 입력 파서(`src/lib/parser.ts`)는 순수 함수로 두고 반드시 단위 테스트 작성.
- 데이터 타입은 `src/types.ts` 한 곳에서만 정의. 저장 형식을 바꾸면 dexie 버전 마이그레이션을 추가.
- 포즈 시드 데이터는 `src/data/poses.json`. 포즈명은 강사가 실제 쓰는 구어체 한글(다운독, 하이런지, 소고양이)을 대표 이름으로, 산스크리트/영어는 aliases에.
- 새 라이브러리 추가는 꼭 필요할 때만, 이유를 PR 설명에 적는다.

## 작업 완료 전 확인
```
npm run lint
npm run typecheck
npm test
npm run build
```
모두 통과해야 완료. PR 설명에 무엇을 바꿨는지, 폰에서 어떻게 확인하는지 한국어로 적는다.
