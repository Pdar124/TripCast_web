#!/usr/bin/env bash

set -Eeuo pipefail

readonly IMAGE_REFERENCE="${1:?image reference is required}"
readonly HOST_PORT="${2:-80}"
readonly BACKEND_UPSTREAM="${3:-http://host.docker.internal:8080}"
readonly CONTAINER_NAME="tripcast-web"
readonly GHCR_TOKEN_PARAMETER="${GHCR_TOKEN_PARAMETER:-}"
readonly GHCR_USERNAME="${GHCR_USERNAME:-}"

if ! [[ "${HOST_PORT}" =~ ^[0-9]+$ ]] || ((HOST_PORT < 1 || HOST_PORT > 65535)); then
  echo "invalid host port: ${HOST_PORT}" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the EC2 instance" >&2
  exit 1
fi

case "${BACKEND_UPSTREAM}" in
  http://* | https://*) ;;
  *)
    echo "invalid backend upstream: ${BACKEND_UPSTREAM}" >&2
    exit 1
    ;;
esac

logout_from_ghcr() {
  docker logout ghcr.io >/dev/null 2>&1 || true
}

if [[ -n "${GHCR_TOKEN_PARAMETER}" ]]; then
  if [[ -z "${GHCR_USERNAME}" ]]; then
    echo "GHCR_USERNAME is required with GHCR_TOKEN_PARAMETER" >&2
    exit 1
  fi

  if ! command -v aws >/dev/null 2>&1; then
    echo "AWS CLI is required to retrieve the temporary GHCR token" >&2
    exit 1
  fi

  ghcr_token="$(
    aws ssm get-parameter \
      --name "${GHCR_TOKEN_PARAMETER}" \
      --with-decryption \
      --query Parameter.Value \
      --output text
  )"

  printf '%s' "${ghcr_token}" | \
    docker login ghcr.io --username "${GHCR_USERNAME}" --password-stdin >/dev/null
  unset ghcr_token
  trap logout_from_ghcr EXIT
fi

run_container() {
  local image="$1"

  docker run --detach \
    --name "${CONTAINER_NAME}" \
    --restart unless-stopped \
    --add-host host.docker.internal:host-gateway \
    --env "BACKEND_UPSTREAM=${BACKEND_UPSTREAM}" \
    --publish "127.0.0.1:${HOST_PORT}:80" \
    --label com.tripcast.service=frontend \
    "${image}" >/dev/null
}

wait_until_healthy() {
  local status

  for _ in $(seq 1 20); do
    status="$(
      docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "${CONTAINER_NAME}" 2>/dev/null || true
    )"

    case "${status}" in
      healthy)
        return 0
        ;;
      exited | dead)
        return 1
        ;;
    esac

    sleep 3
  done

  return 1
}

previous_image_id="$(
  docker inspect --format '{{.Image}}' "${CONTAINER_NAME}" 2>/dev/null || true
)"

docker pull "${IMAGE_REFERENCE}"
docker rm --force "${CONTAINER_NAME}" >/dev/null 2>&1 || true
run_container "${IMAGE_REFERENCE}"

if ! wait_until_healthy; then
  echo "new frontend container did not become healthy" >&2
  docker logs --tail 100 "${CONTAINER_NAME}" >&2 || true
  docker rm --force "${CONTAINER_NAME}" >/dev/null 2>&1 || true

  if [[ -n "${previous_image_id}" ]]; then
    echo "rolling back to ${previous_image_id}" >&2
    run_container "${previous_image_id}"
    wait_until_healthy || echo "rollback container is not healthy" >&2
  fi

  exit 1
fi

docker image prune --force --filter 'until=168h' >/dev/null
echo "deployed ${IMAGE_REFERENCE} on 127.0.0.1:${HOST_PORT} with backend ${BACKEND_UPSTREAM}"
