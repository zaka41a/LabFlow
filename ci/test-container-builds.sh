#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

for dockerfile in \
  "${labflow_test_root}/backend/Dockerfile" \
  "${labflow_test_root}/frontend/Dockerfile"; do
  if grep --fixed-strings --quiet -- 'RUN --mount=' "$dockerfile"; then
    printf 'ACR does not support BuildKit cache mounts: %s\n' "$dockerfile" >&2
    exit 1
  fi
done

printf 'Container build compatibility test: 1 passed.\n'
