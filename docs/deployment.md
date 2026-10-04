# 프론트엔드 배포

TripCast 프론트엔드는 React 정적 파일과 Nginx를 하나의 Docker 이미지로 만들고, GHCR을 거쳐 백엔드와 분리된 EC2에 배포합니다. 이미지 경로는 `ghcr.io/trip-cast/tripcast-web`입니다.

```text
사용자
  └─ 프론트 EC2의 Nginx :80/:443
       └─ React 컨테이너 127.0.0.1:3000
            └─ /api → 백엔드 EC2 사설 주소 :8080

GitHub Actions
  └─ OIDC → AWS IAM 역할 → SSM Run Command → 프론트 EC2
```

## 배포 흐름

1. Pull Request에서는 Docker 이미지만 빌드하여 패키징 오류를 검사합니다.
2. `main` 브랜치의 `CI` workflow가 성공합니다.
3. Docker 이미지를 `latest`와 `sha-<commit>` 태그로 GHCR에 발행합니다.
4. GitHub Actions가 OIDC로 AWS IAM 역할의 단기 자격 증명을 받습니다.
5. 해당 실행의 임시 `GITHUB_TOKEN`을 Parameter Store `SecureString`에 저장합니다.
6. Systems Manager Run Command가 프론트 EC2에서 배포 스크립트를 실행합니다.
7. EC2가 불변 SHA 태그 이미지를 pull하고 `tripcast-web` 컨테이너를 교체합니다.
8. 새 컨테이너가 정상 상태가 되지 않으면 직전 이미지로 롤백합니다.
9. 배포가 끝나면 GHCR 로그인을 해제하고 임시 Parameter를 삭제합니다.

SSH private key, GitHub Actions용 SSH 22번 포트, 장기 AWS Access Key는 사용하지 않습니다.

## 프론트 EC2 준비

백엔드와 같은 VPC에 프론트 전용 EC2를 생성합니다. Amazon Linux 2023 기준으로 다음 항목이 필요합니다.

- Docker Engine
- Nginx
- AWS CLI
- 실행 중인 SSM Agent
- `AmazonSSMManagedInstanceCore` 정책이 연결된 instance profile
- 백엔드 EC2의 사설 8080 포트에 접근 가능한 보안 그룹

프론트 보안 그룹에는 80/443만 외부에 공개하고 22/3000은 공개하지 않습니다. 백엔드 보안 그룹에는 프론트 보안 그룹을 source로 지정한 TCP 8080 규칙만 추가합니다.

다음 명령으로 인스턴스 상태를 확인할 수 있습니다.

```bash
docker info
aws --version
sudo systemctl status nginx
sudo systemctl status amazon-ssm-agent
```

Systems Manager의 `Fleet Manager > Managed nodes`에서도 프론트 인스턴스가 `Online`이어야 합니다.

## 호스트 Nginx

프론트 컨테이너는 `127.0.0.1:3000`에만 publish합니다. EC2의 호스트 Nginx가 80번 요청을 컨테이너로 전달합니다.

Amazon Linux 2023에서는 [tripcast-web.conf](../infra/nginx/default.d/tripcast-web.conf)의 내용을 `/etc/nginx/default.d/tripcast-web.conf`로 설치합니다.

```bash
sudo nginx -t
sudo systemctl reload nginx
```

도메인과 인증서를 준비한 뒤에는 호스트 Nginx에서 443 TLS를 종료합니다. React 컨테이너의 포트나 프론트 보안 그룹의 3000 포트를 추가로 열 필요는 없습니다.

## 백엔드 연결

브라우저는 `VITE_API_BASE_URL=/`을 사용합니다. 컨테이너 Nginx는 `/api/` 요청을 런타임 환경변수 `BACKEND_UPSTREAM`으로 전달합니다.

```text
BACKEND_UPSTREAM=http://<BACKEND_PRIVATE_IP>:8080
```

컨테이너 Nginx는 호스트 Nginx가 보낸 `X-Forwarded-Proto`(HTTPS에서는 `https`)를 `/api/` 요청에 그대로 실어 백엔드로 전달합니다. 컨테이너는 `127.0.0.1`로만 publish되어 호스트 Nginx만 접근하므로 이 값을 신뢰합니다. 헤더가 없으면 컨테이너의 `$scheme`을 사용합니다.

백엔드 IP는 Docker 이미지에 포함하지 않습니다. GitHub repository Variable로 관리하여 이미지를 다시 빌드하지 않고 배포 대상만 변경할 수 있습니다.

## GitHub OIDC 공급자

AWS IAM의 `Identity providers`에 다음 공급자를 계정당 한 번만 생성합니다.

| 항목         | 값                                            |
| ------------ | --------------------------------------------- |
| Provider URL | `https://token.actions.githubusercontent.com` |
| Audience     | `sts.amazonaws.com`                           |

## GitHub Actions 배포 역할

GitHub Actions 전용 IAM 역할을 만들고 [github-oidc-trust-policy.json](../infra/aws/github-oidc-trust-policy.json)의 `<AWS_ACCOUNT_ID>`를 실제 계정 ID로 교체해 신뢰 정책으로 사용합니다.

이 저장소는 다음 immutable OIDC subject를 사용합니다.

```text
repo:Trip-Cast@337654581/TripCast-web@1383867320:environment:production
```

GitHub의 `production` 환경은 `main` 브랜치만 배포할 수 있도록 제한합니다.

[github-actions-deploy-policy.json](../infra/aws/github-actions-deploy-policy.json)의 placeholder를 실제 리전, 계정 ID, 프론트 EC2 인스턴스 ID로 교체한 뒤 역할의 인라인 정책으로 연결합니다. 이 정책은 다음 작업만 허용합니다.

- 지정 프론트 EC2에 `AWS-RunShellScript` 명령 전송
- 명령 상태 조회
- `/tripcast/deploy/*` 경로의 임시 GHCR 토큰 생성 및 삭제

## GitHub 설정

`Settings > Secrets and variables > Actions > Variables`에 다음 repository Variables를 등록합니다.

| Variable                 | 설명                                     | 예시 또는 기본값                                       |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------ |
| `AWS_REGION`             | 프론트 EC2 리전                          | `ap-northeast-2`                                       |
| `AWS_ROLE_ARN`           | GitHub Actions 배포 역할 ARN             | `arn:aws:iam::123456789012:role/TripCastWebDeployRole` |
| `EC2_INSTANCE_ID`        | 프론트 EC2 인스턴스 ID                   | `i-0123456789abcdef0`                                  |
| `BACKEND_UPSTREAM`       | 백엔드 EC2의 사설 HTTP 주소              | `http://172.31.0.10:8080`                              |
| `DEPLOY_ENABLED`         | EC2 자동 배포 활성화 여부                | `false`                                                |
| `TRIPCAST_WEB_PORT`      | 호스트 Nginx가 전달할 로컬 컨테이너 포트 | `3000`                                                 |
| `VITE_API_BASE_URL`      | 브라우저에서 사용할 same-origin API 경로 | `/`                                                    |
| `VITE_KAKAO_MAP_APP_KEY` | 카카오맵 JavaScript 앱 키                | 빈 값                                                  |

EC2, IAM, Nginx 설정을 확인한 뒤에만 `DEPLOY_ENABLED=true`로 변경합니다. 활성화 전에도 CI 성공 후 GHCR 이미지 발행까지는 수행하고 EC2 배포만 건너뜁니다.

카카오맵 JavaScript 앱 키는 브라우저 번들에 포함되는 공개 식별자이므로 Secret이 아니라 Variable로 관리하고, 카카오 개발자 콘솔에서 허용 도메인을 제한합니다.

## 최초 배포

1. `DEPLOY_ENABLED=false` 상태에서 변경사항을 `main`에 병합합니다.
2. `CI`와 GHCR 이미지 발행이 성공하는지 확인합니다.
3. 프론트 EC2의 호스트 Nginx 설정과 SSM `Online` 상태를 확인합니다.
4. `DEPLOY_ENABLED=true`로 변경합니다.
5. `Actions > Deploy > Run workflow`에서 `main`을 선택해 수동 배포합니다.
6. 프론트 주소의 `/healthz`와 실제 `/api` 요청을 확인합니다.

정상 배포 후 더 이상 사용하지 않는 SSH Secrets를 삭제할 수 있습니다.

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_KNOWN_HOSTS`

## 장애 확인

`Deploy to EC2` 작업에서 다음 상태를 순서대로 확인합니다.

1. OIDC 역할을 정상적으로 받았는지
2. SSM managed node 상태가 `Online`인지
3. Run Command의 표준 출력과 오류
4. EC2에서 `docker ps`와 `docker logs --tail 100 tripcast-web`
5. EC2에서 `curl http://127.0.0.1:3000/healthz`
6. 프론트 EC2에서 `curl <BACKEND_UPSTREAM>/swagger-ui.html`

배포는 EC2의 SSM Agent가 AWS로 만드는 outbound 연결을 사용하므로 GitHub Actions를 위해 SSH 22번 포트를 공개할 필요가 없습니다.
