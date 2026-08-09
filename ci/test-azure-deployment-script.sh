#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly deployment_script="${labflow_test_root}/ci/azure-deploy-vm.sh"
readonly test_directory="$(mktemp -d)"
readonly fake_bin="${test_directory}/bin"
readonly compose_file="${test_directory}/compose.yaml"
readonly docker_log="${test_directory}/docker.log"
readonly revision="8399ce6123456789abcdef0123456789abcdef01"

trap 'rm -rf "$test_directory"' EXIT
mkdir -p "$fake_bin"

cat > "${fake_bin}/cloud-init" <<'SCRIPT'
#!/bin/sh
test "$1" = "status"
test "$2" = "--wait"
SCRIPT

cat > "${fake_bin}/docker" <<'SCRIPT'
#!/bin/sh
printf '%s\n' "$*" >> "$LABFLOW_DOCKER_LOG"
if [ "$1" = "--config" ] && [ "$3" = "login" ]; then
  while IFS= read -r _; do :; done
fi
SCRIPT

cat > "$compose_file" <<'YAML'
services:
  backend:
    image: labflowdev.azurecr.io/labflow-backend:latest
    environment:
      OIDC_CLIENT_AUTHENTICATION_METHOD: "client_secret_basic"
      LABFLOW_OIDC_BORROWER_IDENTITIES: "stale-borrower"
      LABFLOW_OIDC_MANAGER_IDENTITIES: "stale-manager"
      LABFLOW_OIDC_TECHNICIAN_IDENTITIES: "stale-technician"
  frontend:
    image: labflowdev.azurecr.io/labflow-frontend:latest
YAML

chmod +x "${fake_bin}/cloud-init" "${fake_bin}/docker"

LABFLOW_COMPOSE_FILE="$compose_file" \
LABFLOW_DOCKER_CONFIG="${test_directory}/docker-config" \
LABFLOW_DOCKER_LOG="$docker_log" \
PATH="${fake_bin}:$PATH" \
sh "$deployment_script" \
  labflowdev.azurecr.io \
  registry-user \
  "$(printf '%s' 'registry-password' | base64 | tr -d '\n=')" \
  "$revision" \
  client_secret_post \
  'zaka41a,lsit-2026/roles/labflow/borrower' \
  'SaadFihi,lsit-2026/roles/labflow/lab-manager' \
  'othmane022-jj,lsit-2026/roles/labflow/technician'

grep --fixed-strings --quiet -- "labflow-backend:${revision}" "$compose_file"
grep --fixed-strings --quiet -- "labflow-frontend:${revision}" "$compose_file"
grep --fixed-strings --line-regexp --quiet -- '      OIDC_CLIENT_AUTHENTICATION_METHOD: "client_secret_post"' "$compose_file"
grep --fixed-strings --line-regexp --quiet -- '      LABFLOW_OIDC_BORROWER_IDENTITIES: "zaka41a,lsit-2026/roles/labflow/borrower"' "$compose_file"
grep --fixed-strings --line-regexp --quiet -- '      LABFLOW_OIDC_MANAGER_IDENTITIES: "SaadFihi,lsit-2026/roles/labflow/lab-manager"' "$compose_file"
grep --fixed-strings --line-regexp --quiet -- '      LABFLOW_OIDC_TECHNICIAN_IDENTITIES: "othmane022-jj,lsit-2026/roles/labflow/technician"' "$compose_file"
grep --fixed-strings --quiet -- "pull labflowdev.azurecr.io/labflow-backend:${revision}" "$docker_log"
grep --fixed-strings --quiet -- "pull labflowdev.azurecr.io/labflow-frontend:${revision}" "$docker_log"
grep --fixed-strings --quiet -- 'config --quiet' "$docker_log"
grep --fixed-strings --quiet -- 'up --detach --force-recreate --remove-orphans' "$docker_log"
grep --fixed-strings --quiet -- 'exec --no-TTY backend' "$docker_log"

if LABFLOW_COMPOSE_FILE="$compose_file" PATH="${fake_bin}:$PATH" \
  sh "$deployment_script" registry user password invalid-revision client_secret_post \
  borrower manager technician \
  >/dev/null 2>&1; then
  printf '%s\n' 'The deployment script accepted an invalid revision.' >&2
  exit 1
fi

if LABFLOW_COMPOSE_FILE="$compose_file" PATH="${fake_bin}:$PATH" \
  sh "$deployment_script" registry user password "$revision" client_secret_post \
  'invalid identity' manager technician \
  >/dev/null 2>&1; then
  printf '%s\n' 'The deployment script accepted unsafe role identities.' >&2
  exit 1
fi

printf '%s\n' 'Azure VM deployment script tests: 3 passed.'
