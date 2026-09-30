# 프론트엔드 배포

TripCast 프론트엔드는 React 정적 파일과 Nginx를 하나의 Docker 이미지로 만들고, GHCR을 거쳐 EC2에 배포합니다. 이미지 경로는 `ghcr.io/pdar124/tripcast-web`입니다.

## 배포 흐름

1. Pull Request에서는 Docker 이미지만 빌드하여 패키징 오류를 검사하고 GHCR 발행과 배포는 수행하지 않습니다.
2. `main` 브랜치의 `CI` workflow가 성공합니다.
3. `Deploy` workflow가 성공한 커밋을 checkout합니다.
4. Docker 이미지를 `latest`와 `sha-<commit>` 태그로 GHCR에 발행합니다.
5. GitHub Actions가 SSH로 EC2에 접속합니다.
6. EC2가 불변 SHA 태그 이미지를 pull하고 `tripcast-web` 컨테이너를 교체합니다.
7. 새 컨테이너가 정상 상태가 되지 않으면 직전 이미지로 롤백합니다.

Actions와 EC2의 GHCR 인증에는 해당 실행에서만 유효한 `GITHUB_TOKEN`을 사용합니다. 별도 PAT는 필요하지 않으며, 배포가 끝나면 EC2의 GHCR 로그인을 해제합니다.

## GitHub 설정

저장소의 `Settings > Environments`에서 `production` 환경을 만들고 다음 Secrets를 등록합니다.

| Secret            | 설명                             |
| ----------------- | -------------------------------- |
| `EC2_HOST`        | EC2의 도메인 또는 공인 IP        |
| `EC2_USER`        | SSH 사용자 이름(예: `ubuntu`)    |
| `EC2_SSH_KEY`     | EC2 접속용 private key 전체 내용 |
| `EC2_KNOWN_HOSTS` | 검증한 EC2 SSH host key          |

`EC2_KNOWN_HOSTS`는 신뢰할 수 있는 네트워크에서 `ssh-keyscan -H <EC2_HOST>`로 얻은 뒤, EC2 콘솔에 표시된 fingerprint와 대조하여 등록합니다. 운영 배포에 승인이 필요하면 `production` 환경에 required reviewer를 설정합니다.

저장소의 `Settings > Secrets and variables > Actions > Variables`에 등록하는 다음 repository Variables는 선택 사항입니다.

| Variable                 | 설명                                  | 기본값 |
| ------------------------ | ------------------------------------- | ------ |
| `VITE_API_BASE_URL`      | 브라우저에서 사용할 API base URL      | `/`    |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오맵 JavaScript 앱 키             | 빈 값  |
| `TRIPCAST_WEB_PORT`      | EC2에서 프론트 컨테이너를 공개할 포트 | `80`   |

카카오맵 JavaScript 앱 키는 브라우저 번들에 포함되는 공개 식별자이므로 Secret이 아니라 Variable로 관리하고, 카카오 개발자 콘솔에서 허용 도메인을 제한합니다.

## EC2 요구 사항

- Docker Engine이 설치되어 있어야 합니다.
- EC2가 x86_64 또는 arm64 아키텍처여야 합니다. GHCR 이미지는 두 아키텍처를 모두 지원합니다.
- `EC2_USER`가 `sudo` 없이 Docker 명령을 실행할 수 있어야 합니다.
- 보안 그룹에서 서비스 포트(기본 80)를 허용하고, SSH 22번 포트는 관리 IP로 제한합니다.
- 백엔드는 같은 EC2의 8080 포트에서 접근 가능해야 합니다. 보안 그룹에서 8080을 외부에 공개할 필요는 없습니다.

프론트 컨테이너의 Nginx는 `/api/` 요청을 `host.docker.internal:8080`으로 전달합니다. 배포 스크립트가 Linux Docker의 host gateway를 컨테이너에 자동 등록하므로, 백엔드를 EC2 호스트 프로세스로 실행하거나 호스트의 8080 포트에 publish한 컨테이너로 실행할 수 있습니다.

## 수동 배포

GitHub의 `Actions > Deploy > Run workflow`에서 수동 배포할 수 있습니다. 수동 실행도 선택한 커밋의 이미지를 새로 발행한 뒤 같은 절차로 EC2에 배포합니다.

현재 Nginx 컨테이너는 HTTP를 제공합니다. 실제 도메인의 HTTPS는 ALB, CloudFront 또는 EC2 앞단의 TLS reverse proxy에서 종료하는 구성을 권장합니다.
