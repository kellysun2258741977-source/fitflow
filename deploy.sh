#!/usr/bin/env bash

set -Eeuo pipefail

APP_NAME="${APP_NAME:-fit-flow}"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
APP_DIR="${APP_DIR:-/opt/${APP_NAME}}"
RELEASES_DIR="${RELEASES_DIR:-${APP_DIR}/releases}"
SHARED_DIR="${SHARED_DIR:-${APP_DIR}/shared}"
CURRENT_LINK="${CURRENT_LINK:-${APP_DIR}/current}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-}"
GITHUB_SHA="${GITHUB_SHA:-}"

SYSTEMD_SERVICE="${SYSTEMD_SERVICE:-${APP_NAME}-backend}"

HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:8000/healthz}"

die() {
  echo "[deploy] ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command: $1"
}

timestamp() {
  date -u +"%Y%m%d%H%M%S"
}

acquire_lock() {
  mkdir -p "${SHARED_DIR}"
  exec 9>"${SHARED_DIR}/deploy.lock"
  if ! flock -n 9; then
    die "another deployment is running"
  fi
}

write_temp_git_key() {
  if [[ -n "${GIT_SSH_PRIVATE_KEY_B64:-}" ]]; then
    require_cmd base64
    local key_path
    key_path="$(mktemp)"
    printf '%s' "${GIT_SSH_PRIVATE_KEY_B64}" | base64 --decode >"${key_path}"
    chmod 600 "${key_path}"
    export GIT_SSH_COMMAND="ssh -i ${key_path} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
    echo "${key_path}"
    return 0
  fi
  echo ""
}

cleanup_git_key() {
  local key_path="$1"
  if [[ -n "${key_path}" && -f "${key_path}" ]]; then
    rm -f "${key_path}" || true
  fi
}

prepare_dirs() {
  mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}"
}

fetch_repo() {
  [[ -n "${GITHUB_REPOSITORY}" ]] || die "GITHUB_REPOSITORY is required"
  [[ -n "${GITHUB_SHA}" ]] || die "GITHUB_SHA is required"

  local repo_dir
  repo_dir="${APP_DIR}/repo"

  if [[ ! -d "${repo_dir}/.git" ]]; then
    mkdir -p "${APP_DIR}"
    git clone --no-checkout "git@github.com:${GITHUB_REPOSITORY}.git" "${repo_dir}"
  fi

  git -C "${repo_dir}" fetch --prune origin
  git -C "${repo_dir}" cat-file -e "${GITHUB_SHA}^{commit}" || die "commit not found on server: ${GITHUB_SHA}"

  echo "${repo_dir}"
}

create_release() {
  local repo_dir="$1"
  local rel
  rel="${RELEASES_DIR}/$(timestamp)-${GITHUB_SHA:0:7}"

  git -C "${repo_dir}" worktree add --force "${rel}" "${GITHUB_SHA}"
  echo "${rel}"
}

build_backend() {
  local rel="$1"
  require_cmd python3

  local venv_dir
  venv_dir="${SHARED_DIR}/venv"

  if [[ ! -d "${venv_dir}" ]]; then
    python3 -m venv "${venv_dir}"
  fi

  "${venv_dir}/bin/python" -m pip install --upgrade pip
  "${venv_dir}/bin/python" -m pip install -r "${rel}/backend/requirements.txt"
}

build_frontend() {
  local rel="$1"
  require_cmd node
  require_cmd npm

  pushd "${rel}/frontend" >/dev/null
  npm ci
  npm run build
  popd >/dev/null
}

switch_current() {
  local rel="$1"
  local prev=""
  if [[ -L "${CURRENT_LINK}" ]]; then
    prev="$(readlink "${CURRENT_LINK}")"
  fi
  ln -sfn "${rel}" "${CURRENT_LINK}"
  echo "${prev}"
}

restart_services() {
  require_cmd sudo
  sudo systemctl restart "${SYSTEMD_SERVICE}" || die "failed to restart service ${SYSTEMD_SERVICE}"
}

health_check() {
  require_cmd curl
  local i
  for i in {1..20}; do
    if curl -fsS "${HEALTHCHECK_URL}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

cleanup_old_releases() {
  local count
  count=$(ls -1dt "${RELEASES_DIR}"/* 2>/dev/null | wc -l | tr -d ' ')
  if [[ "${count}" -le "${KEEP_RELEASES}" ]]; then
    return 0
  fi
  ls -1dt "${RELEASES_DIR}"/* | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
    if [[ -n "${old}" && -d "${old}" ]]; then
      rm -rf "${old}" || true
    fi
  done
}

main() {
  require_cmd git
  require_cmd flock

  acquire_lock
  prepare_dirs

  local key_path
  key_path="$(write_temp_git_key)"
  trap 'cleanup_git_key "${key_path}"' EXIT

  local repo_dir
  repo_dir="$(fetch_repo)"

  local rel
  rel="$(create_release "${repo_dir}")"

  local switched=0
  local prev_link=""

  trap 'if [[ "${switched}" -eq 1 && -n "${prev_link}" ]]; then ln -sfn "${prev_link}" "${CURRENT_LINK}" || true; sudo systemctl restart "${SYSTEMD_SERVICE}" || true; fi' ERR

  build_backend "${rel}"
  build_frontend "${rel}"

  prev_link="$(switch_current "${rel}")"
  switched=1

  restart_services
  health_check || die "health check failed: ${HEALTHCHECK_URL}"

  cleanup_old_releases
  echo "[deploy] OK: ${APP_NAME} ${DEPLOY_ENV} @ ${GITHUB_SHA}"
}

main "$@"
