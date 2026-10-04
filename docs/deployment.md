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

프론트 보안 그룹에는 80/443만 외부에 공개하고 22/3000은 공개하지 않습니다. 80은 HTTPS 리다이렉트와 인증서 발급·갱신 검증에도 필요합니다([호스트 Nginx와 HTTPS](#호스트-nginx와-https)). 백엔드 보안 그룹에는 프론트 보안 그룹을 source로 지정한 TCP 8080 규칙만 추가합니다.

다음 명령으로 인스턴스 상태를 확인할 수 있습니다.

```bash
docker info
aws --version
sudo systemctl status nginx
sudo systemctl status amazon-ssm-agent
```

Systems Manager의 `Fleet Manager > Managed nodes`에서도 프론트 인스턴스가 `Online`이어야 합니다.

## 호스트 Nginx와 HTTPS

프론트 컨테이너는 `127.0.0.1:3000`에만 publish합니다. EC2의 호스트 Nginx가 80/443을 받아 컨테이너로 전달하고, 443에서 TLS를 종료합니다. React 컨테이너의 포트나 프론트 보안 그룹의 3000 포트를 추가로 열 필요는 없습니다.

배포 도메인은 DuckDNS 서브도메인 `tripcastwith.duckdns.org`이고, 인증서는 Let's Encrypt(무료, 90일 만료, 자동 갱신)를 사용합니다. DuckDNS는 무료 서브도메인이라 서비스 종료나 장애에 영향을 받으므로, 서비스가 안정되면 직접 구매한 도메인으로 옮기는 것을 권장합니다.

설정 파일은 두 단계로 나뉩니다. 인증서 파일이 없으면 `ssl_certificate` 경로 때문에 `nginx -t`가 실패하므로, 발급 전에는 80 포트만 쓰는 1단계 파일을 사용합니다.

| 단계 | 파일                                                                   | 용도                                                   |
| ---- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| 1    | [tripcast-web.http.conf](../infra/nginx/conf.d/tripcast-web.http.conf) | 80만 사용. 인증서 발급용 (`server_name`, ACME 경로)    |
| 2    | [tripcast-web.conf](../infra/nginx/conf.d/tripcast-web.conf)           | 80→443 리다이렉트와 443 TLS. 발급 후 1단계 파일을 대체 |

Amazon Linux 2023의 `default.d`는 배포판 기본 server 블록(`server_name _`) 안에 include되어 `server_name`과 443 설정을 둘 수 없으므로, 이 저장소의 설정은 `/etc/nginx/conf.d/`에 설치합니다.

### 사전 준비

1. DuckDNS의 `tripcastwith` 서브도메인이 프론트 EC2의 공인 IP(`3.34.192.80`)를 가리키는지 확인합니다. EC2를 중지/시작하면 공인 IP가 바뀌므로 Elastic IP를 연결하는 것을 권장합니다. 연결하지 않으면 IP가 바뀔 때마다 DuckDNS 레코드도 갱신해야 합니다.
2. 프론트 보안 그룹에 TCP 80과 443 인바운드를 `0.0.0.0/0`으로 허용합니다. 80은 인증서 발급·갱신 검증(http-01)과 HTTPS 리다이렉트에 필요하므로 닫지 않습니다. 22/3000은 계속 열지 않습니다.
3. certbot을 설치하고 검증용 디렉터리를 만듭니다.

```bash
sudo dnf install -y certbot
sudo mkdir -p /var/www/certbot
```

certbot의 `nginx` 플러그인(`python3-certbot-nginx`)은 사용하지 않습니다. 이 저장소의 Nginx 설정을 certbot이 고쳐 쓰지 않도록 `--webroot` 방식으로 발급하고, 최종 설정은 저장소 파일 하나로 관리합니다.

### 1단계: 80 전용 설정 적용

저장소를 clone한 디렉터리에서 실행합니다.

```bash
sudo install -m 644 infra/nginx/conf.d/tripcast-web.http.conf /etc/nginx/conf.d/tripcast-web.conf
sudo nginx -t && sudo systemctl reload nginx
curl -i http://tripcastwith.duckdns.org/healthz
```

`200 ok`가 응답되어야 합니다. 이 단계에서는 기존 `/etc/nginx/default.d/tripcast-web.conf`를 지우지 않아 IP 주소 접속도 계속 동작합니다.

### 인증서 발급

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d tripcastwith.duckdns.org \
  --deploy-hook "systemctl reload nginx"
```

이메일 입력과 약관 동의는 프롬프트를 따릅니다. 성공하면 `/etc/letsencrypt/live/tripcastwith.duckdns.org/`에 `fullchain.pem`과 `privkey.pem`이 생깁니다. `--deploy-hook`은 갱신될 때마다 Nginx를 reload하여 새 인증서를 적용합니다.

### 2단계: HTTPS 설정 적용

```bash
sudo install -m 644 infra/nginx/conf.d/tripcast-web.conf /etc/nginx/conf.d/tripcast-web.conf
sudo rm -f /etc/nginx/default.d/tripcast-web.conf
sudo nginx -t && sudo systemctl reload nginx
```

`default.d`의 기존 설정을 지우면 IP 주소로 직접 접속하는 요청은 더 이상 앱으로 전달되지 않습니다. 접속과 `/healthz` 확인은 도메인으로 합니다.

### 자동 갱신 확인

```bash
sudo systemctl enable --now certbot-renew.timer
systemctl list-timers certbot-renew.timer
sudo certbot renew --dry-run
```

`certbot-renew.timer`가 없으면 `certbot` 패키지의 systemd 유닛 이름을 `systemctl list-unit-files | grep certbot`로 확인합니다. `dry-run`은 80 포트의 `/.well-known/acme-challenge/`가 외부에서 접근 가능해야 성공합니다.

### 접속 확인

```bash
curl -I https://tripcastwith.duckdns.org/
curl -I http://tripcastwith.duckdns.org/
curl -i http://tripcastwith.duckdns.org/healthz
curl -i https://tripcastwith.duckdns.org/healthz
```

- `https://` 요청은 `200`이고 `Strict-Transport-Security: max-age=300` 헤더가 있어야 합니다.
- `http://` 요청은 `301`로 `https://tripcastwith.duckdns.org/`를 가리켜야 합니다.
- `http://…/healthz`와 `https://…/healthz`는 모두 `200 ok`여야 합니다.

### HSTS 기간 조정

HSTS는 브라우저가 기간 동안 HTTP 접속을 막으므로 처음에는 `max-age=300`(5분)으로 둡니다. HTTPS와 자동 갱신이 안정적인 것을 확인한 뒤 [tripcast-web.conf](../infra/nginx/conf.d/tripcast-web.conf)의 값을 `86400`(1일), `31536000`(1년) 순으로 PR을 통해 늘립니다. `duckdns.org`는 공용 도메인이므로 `includeSubDomains`와 `preload`는 사용하지 않습니다.

### 롤백

HTTPS에 문제가 있으면 80 전용 설정으로 되돌립니다. HSTS가 짧아 브라우저 캐시는 최대 5분 안에 풀립니다.

```bash
sudo install -m 644 infra/nginx/conf.d/tripcast-web.http.conf /etc/nginx/conf.d/tripcast-web.conf
sudo nginx -t && sudo systemctl reload nginx
```

인증서 발급 자체가 실패해도 1단계 설정만 유지하면 HTTP로 계속 서비스됩니다. IP 주소 접속까지 복구하려면 `default.d`에 `proxy_pass http://127.0.0.1:3000;`을 전달하는 `location /` 설정을 다시 설치해야 합니다.

## 백엔드 연결

브라우저는 `VITE_API_BASE_URL=/`을 사용합니다. 컨테이너 Nginx는 `/api/` 요청을 런타임 환경변수 `BACKEND_UPSTREAM`으로 전달합니다.

```text
BACKEND_UPSTREAM=http://<BACKEND_PRIVATE_IP>:8080
```

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

카카오맵 JavaScript 앱 키는 브라우저 번들에 포함되는 공개 식별자이므로 Secret이 아니라 Variable로 관리하고, 카카오 개발자 콘솔에서 허용 도메인을 제한합니다. 카카오 개발자 콘솔의 Web 플랫폼 사이트 도메인에는 다음 두 개만 등록하고, 이전에 등록한 `http://3.34.192.80` 같은 IP 주소 항목은 삭제합니다.

```text
https://tripcastwith.duckdns.org
http://localhost:5173
```

도메인은 스킴과 포트까지 일치해야 하므로 `https://` 주소와 로컬 개발 서버 주소를 각각 등록해야 합니다. 카카오맵 SDK 스크립트도 `https://` 주소로 불러와야 HTTPS 페이지에서 혼합 콘텐츠로 차단되지 않습니다.

## 최초 배포

1. `DEPLOY_ENABLED=false` 상태에서 변경사항을 `main`에 병합합니다.
2. `CI`와 GHCR 이미지 발행이 성공하는지 확인합니다.
3. 프론트 EC2의 호스트 Nginx 설정(HTTPS는 [호스트 Nginx와 HTTPS](#호스트-nginx와-https)의 순서대로)과 SSM `Online` 상태를 확인합니다.
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
5. EC2에서 `curl http://127.0.0.1:3000/healthz`와 `curl -i https://tripcastwith.duckdns.org/healthz`
6. 프론트 EC2에서 `curl <BACKEND_UPSTREAM>/swagger-ui.html`

배포는 EC2의 SSM Agent가 AWS로 만드는 outbound 연결을 사용하므로 GitHub Actions를 위해 SSH 22번 포트를 공개할 필요가 없습니다.
