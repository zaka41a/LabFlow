#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly pipeline_file="${labflow_test_root}/.gitlab-ci.yml"

required_settings=(
  'TF_HTTP_ADDRESS:'
  'TF_HTTP_LOCK_ADDRESS:'
  'TF_HTTP_UNLOCK_ADDRESS:'
  'TF_HTTP_USERNAME: "gitlab-ci-token"'
  'TF_HTTP_PASSWORD: "$CI_JOB_TOKEN"'
  'TF_HTTP_LOCK_METHOD: "POST"'
  'TF_HTTP_UNLOCK_METHOD: "DELETE"'
  'TF_HTTP_RETRY_WAIT_MIN: "5"'
)

for setting in "${required_settings[@]}"; do
  if ! grep --fixed-strings --quiet -- "$setting" "$pipeline_file"; then
    printf 'Missing GitLab HTTP state setting: %s\n' "$setting" >&2
    exit 1
  fi
done

if grep --quiet -- '-backend-config=' "$pipeline_file"; then
  printf '%s\n' 'Do not cache job-scoped GitLab credentials in an OpenTofu plan.' >&2
  exit 1
fi

printf 'GitLab state backend test: 1 passed.\n'
