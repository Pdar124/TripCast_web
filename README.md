# TripCast Frontend

TripCast의 관광지·관광코스 날씨 및 관광기후지수 웹 서비스 프론트엔드입니다.

## 관련 저장소

- 프론트엔드: [TripCast-web](https://github.com/Pdar124/TripCast-web)
- 백엔드: [TripCast-was](https://github.com/Pdar124/TripCast-was)

## 문서

- 페이지별 기능 명세서(3D 히어로 섹션 상세 포함): [docs/frontend-spec.md](docs/frontend-spec.md)
- 개발환경 구성·검증·의존성 도입 기준: [docs/development-environment.md](docs/development-environment.md)
- Docker/GHCR 및 EC2 배포: [docs/deployment.md](docs/deployment.md)

## 시작하기

### 요구 환경

- Node.js 24.18 이상, 24.x 범위 (`engines: ^24.18.0`, `.nvmrc` 기준 버전: 24.18.0)
- npm 10 이상

### 설치 및 실행

```bash
npm ci
cp .env.example .env
npm run dev
```

Windows PowerShell에서는 `cp .env.example .env` 대신 `Copy-Item .env.example .env`을 사용할 수 있습니다.

`npm ci`는 잠금 파일 기준으로 의존성을 설치하고 `prepare` 단계에서 Husky를 설정합니다. `git config --get core.hooksPath`의 결과가 `.husky/_`인지 확인합니다. 설정이 빠졌다면 `npm run prepare`를 실행한 뒤 다시 확인합니다.

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

Playwright 설정과 홈 스모크 테스트는 준비되어 있습니다. 처음 실행할 때는 `npx playwright install chromium`으로 브라우저를 설치한 뒤 `npm run test:e2e`를 실행합니다.

`npm run generate:api`는 로컬 백엔드가 실행 중일 때 사용합니다. 현재 `src/types/api.ts`는 운영 백엔드 OpenAPI 명세와 동기화되어 있습니다.

## 구현 로드맵

상세 기술 스택·사이트맵·페이지별 기능 명세·폴더 구조는 [docs/frontend-spec.md](docs/frontend-spec.md)를 참고합니다.

| Phase | 상태 | 범위                                                                     |
| ----- | ---- | ------------------------------------------------------------------------ |
| 0     | 완료 | Vite, Tailwind CSS, shadcn/ui, ESLint, Prettier, openapi-typescript 셋업 |
| 1     | 완료 | 관광지 검색·상세 및 날씨                                                 |
| 2     | 진행 | 코스 목록·상세·추천 완료, 관광기후지수 차트 예정                         |
| 3     | 완료 | 관리자 로그인·라우트 보호·수동 동기화 대시보드                           |
| 4     | 예정 | 홈 3D 히어로 섹션                                                        |
| 5     | 예정 | 지도, E2E 테스트, 반응형 UI 다듬기                                       |

## 핵심 원칙

- TanStack Query는 API에서 가져오는 서버 상태만 관리합니다.
- Zustand는 인증 등 공유 클라이언트 상태가 실제로 필요할 때 도입합니다. 화면 내부 상태는 우선 React의 로컬 상태로 관리합니다.
- 관리자 인증 구현 시 Axios interceptor로 JWT를 자동 첨부하고, 401 응답 시 인증 상태를 초기화합니다.
- API 타입은 백엔드의 `/v3/api-docs`를 기준으로 생성합니다.
- 각 Phase가 끝날 때 관련 유닛·컴포넌트 테스트를 추가하고, 핵심 사용자 흐름은 Playwright E2E 테스트로 검증합니다.

## 컨벤션

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
