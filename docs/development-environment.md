# 개발환경 가이드

Phase 0의 실행·검증 기반을 유지하면서 아직 쓰지 않는 패키지는 기능 도입 시점까지 미룹니다. 이 문서는 환경 구성과 작업 절차를 설명하며, 테스트 실행 결과를 대신하지 않습니다.

## 유지하는 구성

- React 18, React Router 6, TypeScript 5.9, Vite와 `app/features/shared` 폴더 구조를 유지합니다.
- Tailwind CSS 3.4와 shadcn/ui 기반 공통 UI를 유지합니다. `tailwind-merge`는 Tailwind 3에 맞는 2.6 계열을 사용합니다. 정확한 설치 버전은 `package-lock.json`을 기준으로 확인합니다.
- TanStack Query, Axios, sonner 및 현재 UI에서 사용하는 Radix Slot, CVA, clsx, lucide-react를 유지합니다.
- ESLint, Prettier, Husky, Vitest, Testing Library와 Playwright를 유지합니다. `user-event`는 이후 컴포넌트 상호작용 테스트에 사용합니다.
- 추가 상태 관리 계층, 별도 테스트 실행 도구, 새로운 패키지 매니저는 도입하지 않습니다.

## Node.js와 설치

프로젝트의 Node.js 지원 범위는 `^24.18.0`입니다. `.nvmrc`는 기준 버전 24.18.0을 지정하며, Node 타입도 `@types/node` 24 계열을 사용합니다. 설치된 Vitest와 jsdom의 요구 조건 때문에 이전에 안내한 Node.js 20은 지원 범위에서 제외합니다.

Node.js 버전 관리 도구를 사용한다면 해당 도구로 24.18.0을 선택합니다. `.nvmrc`를 자동으로 읽는지는 도구에 따라 다르므로 실제 버전도 확인합니다.

```bash
node --version
npm --version
npm ci
cp .env.example .env
npm run dev
```

npm은 10 이상을 사용합니다. `npm ci`는 저장된 `package-lock.json`을 기준으로 설치합니다. 기존 `node_modules`가 있다면 잠금 파일에 맞게 다시 설치합니다. 의존성을 추가·변경할 때는 `npm install`을 사용하고 `package.json`과 `package-lock.json`을 함께 관리합니다.

Windows PowerShell의 환경 파일 복사 명령은 `Copy-Item .env.example .env`입니다. 이미 `.env`를 설정했다면 덮어쓰지 말고 필요한 변수만 확인합니다. `VITE_API_BASE_URL`의 기본값은 `http://localhost:8080`이며, 카카오맵 키는 선택 사항이며, 비워 두면 지도 대신 플레이스홀더가 표시됩니다. 키 발급과 허용 도메인 등록은 README의 환경 변수 항목을 따릅니다.

## 검사와 커밋 훅

개발 변경 후 필요한 검사를 실행합니다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run format:check
```

`typecheck`는 앱 코드와 Vite·Playwright·Tailwind 설정, `e2e/**/*.ts`를 검사합니다. `build`에도 타입 검사가 포함됩니다. `test`는 `src`의 Vitest 단위·컴포넌트 테스트를 실행하고 E2E는 별도 명령으로 실행합니다. 포맷 오류는 `npm run format`으로 정리한 뒤 변경 내용을 확인합니다.

Husky는 `npm ci`의 `prepare` 단계에서 Git 훅을 연결합니다. 설치 후 다음 명령으로 활성화 여부를 확인합니다.

```bash
git config --get core.hooksPath
```

기대값은 `.husky/_`입니다. 결과가 비어 있거나 훅 설치가 실패했다면 다음 명령을 실행한 뒤 경로를 다시 확인합니다.

```bash
npm run prepare
git config --get core.hooksPath
```

이 과정은 저장소의 Git 설정에 쓸 수 있어야 합니다. `.husky/pre-commit` 파일이 존재하는 것만으로 훅이 활성화되지는 않습니다.

현재 pre-commit은 전체 lint → typecheck → 단위 테스트를 실행합니다. 현 규모에서는 충분한 구성이므로 유지하고, 커밋 시간이 실제로 길어질 때 실행 범위를 조정합니다. 포맷 검사는 별도 명령으로 수행하며 훅에는 추가하지 않습니다.

## CI

GitHub Actions의 `.github/workflows/ci.yml`은 다음 상황에 실행됩니다.

- `main` 대상 Pull Request 생성·업데이트
- `main` 브랜치 push
- Actions 화면에서 수동 실행

CI는 `.nvmrc`의 Node.js 버전과 `package-lock.json`을 기준으로 의존성을 설치한 뒤 다음 순서로 검증합니다.

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

같은 브랜치에 새 커밋이 push되면 이전 실행을 취소하고 최신 커밋만 검증합니다. 배포 workflow는 CI와 분리하며, CI가 안정화된 이후 Docker/GHCR 및 EC2 배포 단계로 추가합니다.

## E2E와 API 타입의 현재 범위

Playwright는 Chromium 한 종류로 실행하며, `page.route`로 `/api/**`를 mock하므로 백엔드가 필요 없습니다(공통 헬퍼: `e2e/support/mock-api.ts`, 응답 데이터: `e2e/support/fixtures.ts`). 테스트 브라우저가 없으면 먼저 설치합니다.

```bash
npx playwright install chromium
npm run test:e2e
```

E2E 실행 시 설정된 Vite 개발 서버를 사용하며, 지도 검증이 플레이스홀더 기준이 되도록 `VITE_KAKAO_MAP_APP_KEY`를 빈 값으로 덮어씁니다(이미 5173 포트에서 개발 서버가 실행 중이면 그 서버를 재사용하므로, 키가 설정된 서버라면 종료한 뒤 실행합니다). 테스트 파일 인식이나 TypeScript 검사 성공만으로 브라우저 테스트가 통과했다고 판단하지 않습니다.

`src/types/api.ts`는 현재 빈 placeholder입니다. API 타입 동기화는 로컬 백엔드의 `/v3/api-docs`가 준비된 뒤 수행합니다.

```bash
npm run generate:api
npm run typecheck
```

생성 명령은 `http://localhost:8080/v3/api-docs`를 사용합니다. 백엔드 주소가 다르면 생성 명령의 주소도 맞춰야 하며, 프론트엔드의 `VITE_API_BASE_URL` 변경이 이 명령에 자동 반영되지는 않습니다.

## 미룬 의존성과 재도입 시점

| 패키지                                          | 현재 결정            | 도입 기준                                                              |
| ----------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `recharts`                                      | 직접 의존성에서 제거 | Phase 2 관광기후지수 차트를 구현할 때                                  |
| `date-fns`                                      | 직접 의존성에서 제거 | 기본 날짜 API만으로 처리하기 어려운 포맷·기간 계산이 실제로 필요할 때  |
| `zustand`                                       | 직접 의존성에서 제거 | Phase 3 인증 상태 또는 그 이전에 실제 공유 클라이언트 상태가 필요할 때 |
| `react-hook-form`, `zod`, `@hookform/resolvers` | 직접 의존성에서 제거 | Phase 3 로그인 등 검증이 필요한 폼을 구현할 때                         |
| `@vitest/coverage-v8`                           | 직접 의존성에서 제거 | 커버리지 측정 범위와 운영 기준을 정할 때                               |

의존성은 실제 사용 코드와 함께 도입합니다. Zustand 도입 전에도 TanStack Query가 서버 상태를 관리하며, 간단한 화면 토글은 로컬 React 상태로 처리합니다. 커버리지 패키지와 설정은 함께 제거했으며, 다시 도입할 때는 설치된 Vitest와 정확히 같은 버전의 `@vitest/coverage-v8`을 사용합니다.

직접 의존성에서 제거해도 다른 도구의 내부 의존성으로 설치될 수 있습니다. 현재 `zod`는 `eslint-plugin-react-hooks`가 사용하므로 잠금 파일과 `node_modules`에 남습니다. `npm explain zod`로 경로를 확인할 수 있습니다. 앱에서 Zod를 사용하는 시점에는 직접 의존성으로 다시 선언합니다.

## React Router 후속 검토

React Router 6은 현재 기획과 라우팅 구성을 유지하기 위해 계속 사용합니다. 기존 환경 검토에서 확인한 [신뢰할 수 없는 경로의 외부 리다이렉트](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6)와 [SSR hydration 관련 취약점](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg)은 공식 advisory에서 7.18.0을 수정 버전으로 안내합니다. 현재 앱은 클라이언트 렌더링을 사용하고 SSR을 사용하지 않습니다.

운영 배포나 외부 입력 기반 이동 기능을 구현하기 전에 노출 조건과 수정 버전으로의 업그레이드를 다시 검토합니다. `npm audit` 결과만으로 안전하다고 판단하지 않습니다. Router 7 전환은 React 18 호환성과 라우팅 동작을 함께 검토하는 별도 변경으로 진행합니다.
