# 요가메이커 🧘

요가 강사가 **폰에서 시퀀스를 빠르게 짜고**, **아이패드로 수업 중에 띄워 보는** 웹앱.
설치 없이 브라우저에서 열고, 홈 화면에 추가하면 앱처럼 쓸 수 있어요 (오프라인 동작).

## 주요 기능

- **기본 구성**: 웜업 10분 / 네발토대 10분 / 두발토대+피크 15–20분 / 쿨다운 5–10분 — 목표 대비 시간이 실시간으로 표시 (부족=노랑, 초과=빨강)
- **빠른 입력**: 노트에 쓰듯 한 줄로 입력
  | 입력 | 결과 |
  |---|---|
  | `다운독 숨5` | 다운독, 5호흡 |
  | `버드독 접었다폈다 5회 R/L` | 5회, 좌우 |
  | `다운독 – 워킹다운독 x5` | 두 동작 연속 |
  | `수리야 A2 B2 R1` | 수리야 A×2, B×2, R×1 |
  | `사바아사나 5분`, `플랭크 30초` | 시간 |
  | `나바사나 5카운트 홀딩` | 5호흡 |
  | `우타나 (생략)` | 시간 없으면 생략 |
  - 초성 자동완성: `ㄷㅇㄷ` → 다운독
- **세트**: `#1`, `Set A` 처럼 묶고 반복 횟수 / 반대쪽 동일 설정
- **수업 모드**: 큰 글씨, 오른쪽/왼쪽 표시, 남은 시간·호흡, 큐잉 멘트, 다음 동작. 탭/스와이프로 넘기기, 자동 넘김, 화면 꺼짐 방지
- **포즈 라이브러리**: 기본 98개 + 직접 추가, 자주 쓰는 큐잉 멘트 저장
- **공유**: QR 코드/링크로 폰 → 아이패드 전송, JSON 파일 백업
- **인쇄**: 섹션 / 동작 / 큐잉 3단 표 (PDF 저장 가능)

데이터는 각 기기 브라우저에 저장돼요 (서버 없음). 기기 간 이동은 공유 링크나 파일로 하고, 가끔 목록 화면의 ⬇ 버튼으로 백업해두세요.

## 개발

```bash
npm install
npm run dev        # http://localhost:5173 (같은 와이파이의 폰에서도 접속 가능)
npm test           # 단위 테스트
npm run build      # 배포용 빌드 → dist/
```

스택: Vite + React + TypeScript + Tailwind CSS, IndexedDB(dexie), @dnd-kit, vite-plugin-pwa

```
src/
  types.ts            데이터 타입 (Sequence, Section, Block, Step, Pose)
  db.ts               IndexedDB 저장소 + 첫 실행 시드
  data/poses.json     기본 포즈 목록
  lib/duration.ts     시간 계산 (호흡/초/횟수, 좌우, 세트)
  lib/parser.ts       빠른 입력 해석
  lib/search.ts       포즈 검색 (초성)
  lib/flatten.ts      수업 모드용 순서 펼치기
  lib/edit.ts         편집 조작 (이동, 복제, 세트)
  pages/              목록 · 편집기 · 수업 모드 · 포즈 · 인쇄 · 가져오기
  components/         공용 UI
```

## 배포 (GitHub Pages, 무료)

1. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 변경
2. `main` 브랜치에 올리면 자동 배포 → `https://<계정>.github.io/yogamaker/`

Vercel / Netlify 에 연결해도 설정 없이 동작해요 (빌드 명령 `npm run build`, 출력 폴더 `dist`).

## Codex 로 이어서 개발하기

- 작업 규칙은 [`AGENTS.md`](AGENTS.md), 전체 계획과 다음 할 일은 [`docs/PLAN.md`](docs/PLAN.md)
- 예: "PLAN.md 의 다음 할 일 중 '포즈 스케치' 진행해줘"
