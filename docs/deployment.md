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

저장소가 관리하는 호스트 Nginx 설정은 [tripcast-web.conf](../infra/nginx/default.d/tripcast-web.conf) 하나이며 `location /`이 컨테이너(`127.0.0.1:3000`)로 프록시하고 `X-Forwarded-Proto`를 전달합니다. Amazon Linux 2023에서는 이 파일을 `/etc/nginx/default.d/tripcast-web.conf`로 설치합니다. TLS 설정(443, 인증서 경로, 80→443 리다이렉트)은 `certbot --nginx`가 서버의 `/etc/nginx/nginx.conf`에 직접 추가하며 저장소에는 없습니다.

### 현재 서버 구성 (스냅샷)

프론트 EC2에는 이미 HTTPS가 적용되어 있습니다. 인증서는 2027-01-02에 만료되며 갱신 주기에 따라 자동 갱신됩니다. 구조는 다음과 같습니다.

- `/etc/nginx/nginx.conf`의 기본 server 블록은 `server_name tripcastwith.duckdns.org;`입니다. certbot이 이 블록에 `listen 443 ssl`, `listen [::]:443 ssl ipv6only=on`, `ssl_certificate`, `ssl_certificate_key`, `include /etc/letsencrypt/options-ssl-nginx.conf`, `ssl_dhparam`을 추가했습니다.
- 이 블록은 `include /etc/nginx/default.d/*.conf;`로 `default.d/tripcast-web.conf`를 불러와 컨테이너로 프록시합니다. 따라서 이 파일을 삭제하거나 이름을 바꾸면 사이트가 응답하지 않습니다.
- `nginx.conf` 끝에 certbot이 80용 server 블록을 추가했고, `if ($host = tripcastwith.duckdns.org)`에서 `301`로 `https://$host$request_uri`로 리다이렉트합니다.
- 변경 전 `nginx.conf`는 `/etc/nginx/nginx.conf.bak`에 백업되어 있습니다.

### 적용 절차

새 EC2에 같은 구성을 만들 때의 순서입니다.

1. DuckDNS의 `tripcastwith` 서브도메인이 프론트 EC2의 공인 IP를 가리키게 합니다. EC2를 중지/시작하면 공인 IP가 바뀌므로 Elastic IP를 연결하는 것을 권장합니다. 연결하지 않으면 IP가 바뀔 때마다 DuckDNS 레코드도 갱신해야 합니다.
2. 프론트 보안 그룹에 TCP 80과 443 인바운드를 `0.0.0.0/0`으로 허용합니다. 80은 인증서 발급·갱신 검증(http-01)과 HTTPS 리다이렉트에 필요하므로 닫지 않습니다. 22/3000은 열지 않습니다.
3. certbot과 Nginx 플러그인을 설치합니다.

   ```bash
   sudo dnf install -y certbot python3-certbot-nginx
   ```

4. `default.d/tripcast-web.conf`를 설치한 상태에서 `nginx.conf`의 기본 server 블록 `server_name`을 도메인으로 바꿉니다. certbot은 `server_name`이 일치하는 블록을 찾아 인증서를 설치하므로 `server_name _;` 상태에서는 `Could not automatically find a matching server block` 오류가 납니다.

   ```bash
   sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
   sudo vi /etc/nginx/nginx.conf   # server_name _;  →  server_name tripcastwith.duckdns.org;
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. 인증서를 발급하고 설치합니다.

   ```bash
   sudo certbot --nginx -d tripcastwith.duckdns.org -m <이메일> --agree-tos --no-eff-email --redirect
   ```

   발급은 성공했지만 설치 단계에서 위 오류가 났다면 `server_name`을 고친 뒤 다시 설치만 수행합니다.

   ```bash
   sudo certbot install --cert-name tripcastwith.duckdns.org --nginx
   ```

6. Amazon Linux 2023은 갱신 타이머가 기본으로 켜져 있지 않으므로 직접 활성화하고 갱신을 확인합니다.

   ```bash
   sudo systemctl enable --now certbot-renew.timer
   systemctl list-timers certbot-renew.timer
   sudo certbot renew --dry-run
   ```

### 접속 확인

```bash
curl -I https://tripcastwith.duckdns.org/
curl -I http://tripcastwith.duckdns.org/
curl -i https://tripcastwith.duckdns.org/healthz
```

- `https://` 요청은 `200`이어야 합니다.
- `http://` 요청은 `301`로 `https://tripcastwith.duckdns.org/`를 가리켜야 합니다.
- `--redirect`는 80의 모든 요청을 리다이렉트하므로 `http://…/healthz`도 `301`입니다. 헬스체크는 `https://…/healthz`나 EC2 내부의 `http://127.0.0.1:3000/healthz`로 합니다.

### 선택 사항: HSTS

HSTS는 현재 적용하지 않았습니다. 적용하려면 `nginx.conf`의 443 server 블록에 다음 줄을 추가하고 `sudo nginx -t && sudo systemctl reload nginx`를 실행합니다.

```nginx
add_header Strict-Transport-Security "max-age=300" always;
```

브라우저가 기간 동안 HTTP 접속을 막으므로 처음에는 5분(`300`)으로 두고, HTTPS와 자동 갱신이 안정적인 것을 확인한 뒤 1일(`86400`), 1년(`31536000`) 순으로 늘립니다. `duckdns.org`는 공용 도메인이므로 `includeSubDomains`와 `preload`는 사용하지 않습니다. `certbot --hsts` 옵션은 처음부터 1년 값을 설정하므로 쓰지 않습니다.

### 롤백

HTTPS에 문제가 있으면 certbot이 수정하기 전의 `nginx.conf`로 되돌립니다. 이 경우 `server_name`도 원래 값(`_`)으로 돌아가며 HTTP로만 서비스됩니다.

```bash
sudo cp /etc/nginx/nginx.conf.bak /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

HSTS를 적용했다면 브라우저가 설정한 기간 동안 HTTP 접속이 막힐 수 있습니다. 인증서까지 제거하려면 `sudo certbot delete --cert-name tripcastwith.duckdns.org`를 실행합니다.

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
