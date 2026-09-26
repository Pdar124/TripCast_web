# TripCast Frontend

TripCast의 관광지·관광코스 날씨 및 관광기후지수 웹 서비스 프론트엔드입니다.

## 관련 저장소

- 프론트엔드: [TripCast-web](https://github.com/Pdar124/TripCast-web)
- 백엔드: [TripCast-was](https://github.com/Pdar124/TripCast-was)

## 문서

- 페이지별 기능 명세서(3D 히어로 섹션 상세 포함): [docs/frontend-spec.md](docs/frontend-spec.md)

## 시작하기

### 요구 환경

- Node.js 20.19 이상
- npm 10 이상

### 설치 및 실행

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell에서는 `cp .env.example .env` 대신 `Copy-Item .env.example .env`을 사용할 수 있습니다.

### 환경 변수

| 변수                     | 설명                      | 기본값                  |
| ------------------------ | ------------------------- | ----------------------- |
| `VITE_API_BASE_URL`      | TripCast 백엔드 API 주소  | `http://localhost:8080` |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오맵 JavaScript 앱 키 | 없음                    |

### 주요 명령어

| 명령어                 | 설명                                               |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Vite 개발 서버 실행                                |
| `npm run build`        | TypeScript 검사 후 프로덕션 빌드                   |
| `npm run typecheck`    | TypeScript 타입 검사                               |
| `npm run lint`         | ESLint 검사                                        |
| `npm run format`       | Prettier 포맷 적용                                 |
| `npm run format:check` | Prettier 포맷 검사                                 |
| `npm run test`         | Vitest 단위·컴포넌트 테스트 실행                   |
| `npm run test:e2e`     | Playwright E2E 테스트 실행                         |
| `npm run generate:api` | 로컬 백엔드 OpenAPI 명세로 `src/types/api.ts` 생성 |

Playwright를 처음 실행하기 전에는 `npx playwright install chromium`으로 테스트 브라우저를 설치합니다.

## 1. 기술 스택

| 영역            | 선택 기술                             | 선택 이유                                             |
| --------------- | ------------------------------------- | ----------------------------------------------------- |
| 코어            | React 18 + TypeScript + Vite          | 빠른 개발 서버, 타입 안정성                           |
| 라우팅          | React Router v6                       | 표준 라우팅 구성                                      |
| 서버 상태       | TanStack Query                        | API 캐싱, 재검증, 로딩·에러 상태의 선언적 처리        |
| 클라이언트 상태 | Zustand                               | 토큰, UI 토글 등 서버 상태와 역할 분리                |
| HTTP            | Axios                                 | Interceptor를 통한 JWT 자동 첨부 및 401 자동 로그아웃 |
| 폼              | React Hook Form + Zod                 | 스키마 기반 검증                                      |
| 스타일          | Tailwind CSS                          | 디자인 토큰 관리                                      |
| UI 컴포넌트     | shadcn/ui (Radix 기반)                | 접근성이 보장된 primitive와 커스터마이징              |
| 지도            | 카카오맵 JavaScript SDK               | 관광지 위·경도 표시 및 국내 서비스 지원               |
| 차트            | Recharts                              | 관광기후지수 추이 그래프                              |
| 날짜            | date-fns                              | 날짜 포맷팅 및 기간 계산                              |
| 알림            | sonner                                | 토스트 알림                                           |
| 테스트          | Vitest + Testing Library + Playwright | 유닛·컴포넌트·E2E 테스트                              |
| 품질            | ESLint + Prettier + Husky             | pre-commit 검사                                       |
| 타입 동기화     | openapi-typescript                    | `/v3/api-docs`에서 API 응답 타입 자동 생성            |

## 2. 사이트맵

| 경로               | 화면                                            |
| ------------------ | ----------------------------------------------- |
| `/`                | 홈 — 서비스 소개 및 오늘의 추천 코스 하이라이트 |
| `/spots`           | 관광지 검색 — 리스트·지도 토글                  |
| `/spots/:id`       | 관광지 상세 및 날씨                             |
| `/courses/:id`     | 관광코스 상세 및 통합 날씨                      |
| `/recommendations` | 오늘 가기 좋은 코스 추천                        |
| `/climate?region=` | 지역별 관광기후지수 — 최신 지수 및 기간 차트    |
| `/admin/login`     | 관리자 로그인                                   |
| `/admin`           | 관리자 대시보드 — 수동 동기화                   |

## 3. 기능 명세

| 화면            | API                                           | 상태 관리                              | 핵심 기능                                                                  |
| --------------- | --------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| 관광지 검색     | `GET /api/tour-spots`                         | `useQuery(['spots', keyword, page])`   | 이름 검색, 리스트·지도 토글, 페이지네이션                                  |
| 관광지 상세     | `GET /api/tour-spots/{id}/weather`            | `useQuery(['spot', id])`               | 동네예보, 지도 핀                                                          |
| 코스 상세       | `GET /api/tour-courses/{id}/weather`          | `useQuery(['course', id])`             | 정류지 타임라인, 정류지별 날씨·지수, 날씨가 없는 정류지의 `정보 없음` 배지 |
| 추천 코스       | `GET /api/tour-courses/recommendations`       | `useQuery(['recommendations', limit])` | 지수가 높은 순서의 카드, 등급별 색상 배지                                  |
| 관광기후지수    | `GET /api/regions/{id}/climate-index[/range]` | `useQuery(['climate', region, range])` | 지역 선택, 최신 지수, 기간 꺾은선 그래프                                   |
| 관리자 로그인   | `POST /api/auth/login`                        | Zustand persist                        | React Hook Form + Zod 검증, 성공 시 토큰 저장 후 `/admin` 이동             |
| 관리자 대시보드 | `POST /api/admin/climate-index/sync`          | 토큰 기반 라우트 가드                  | 수동 동기화, 결과 카드, 401 응답 시 자동 로그아웃                          |

## 4. 폴더 구조

```text
src/
├── app/               # 라우터, Provider(QueryClient, Zustand)
├── features/
│   ├── spots/
│   ├── courses/
│   ├── recommendations/
│   ├── climate/
│   └── admin/         # 로그인, 대시보드, 라우트 가드
├── shared/
│   ├── components/    # shadcn/ui 래핑
│   ├── hooks/
│   ├── api/           # Axios 인스턴스 + interceptor
│   └── lib/           # 날짜, 등급→색상 매핑
└── types/              # openapi-typescript 생성 타입
```

## 5. 구현 로드맵

| Phase | 상태 | 범위                                                                     |
| ----- | ---- | ------------------------------------------------------------------------ |
| 0     | 완료 | Vite, Tailwind CSS, shadcn/ui, ESLint, Prettier, openapi-typescript 셋업 |
| 1     | 예정 | 관광지 검색·상세 및 날씨                                                 |
| 2     | 예정 | 코스 상세, 추천, 관광기후지수 차트                                       |
| 3     | 예정 | 관리자 로그인 및 대시보드                                                |
| 4     | 예정 | 지도, E2E 테스트, 반응형 UI 다듬기                                       |

## 구현 원칙

- TanStack Query는 API에서 가져오는 서버 상태만 관리합니다.
- Zustand는 인증 토큰과 화면 토글 등 클라이언트 상태만 관리합니다.
- Axios interceptor가 JWT를 자동 첨부하고, 401 응답 시 인증 상태를 초기화합니다.
- API 타입은 백엔드의 `/v3/api-docs`를 기준으로 생성합니다.
- 각 Phase가 끝날 때 관련 유닛·컴포넌트 테스트를 추가하고, 핵심 사용자 흐름은 Playwright E2E 테스트로 검증합니다.

## 6. 컨벤션

### 커밋 컨벤션

커밋 메시지는 `type: 한글 설명` 형식을 사용합니다.

| type       | 설명                                                |
| ---------- | --------------------------------------------------- |
| `feat`     | 새로운 기능 추가                                    |
| `fix`      | 버그 수정                                           |
| `docs`     | 문서 수정 (README 등)                               |
| `style`    | 코드 포맷팅, 세미콜론 누락 등 로직 변경이 없는 수정 |
| `refactor` | 기능 변경이 없는 코드 개선 및 리팩토링              |
| `test`     | 테스트 코드 추가·수정                               |
| `chore`    | 빌드 설정, 패키지 매니저 등 기타 변경               |
| `merge`    | 브랜치 또는 PR 병합                                 |

예시: `feat: 날씨 조회 API 추가`

### 브랜치 컨벤션

작업 브랜치는 `type/작업내용` 형식을 사용하며, 작업 내용은 영문 소문자와 하이픈으로 작성합니다.

| 브랜치       | 설명                                  |
| ------------ | ------------------------------------- |
| `main`       | 배포 가능한 안정 버전                 |
| `feature/*`  | 기능 개발 브랜치                      |
| `refactor/*` | 코드 리팩토링 브랜치                  |
| `test/*`     | 테스트 코드 추가·보강 브랜치          |
| `chore/*`    | 빌드 설정, 의존성 등 기타 변경 브랜치 |
| `ci/*`       | CI/CD 설정 변경 브랜치                |

예시: `feature/admin-auth`, `chore/add-dockerfile`, `refactor/remove-spot-weather-index`
