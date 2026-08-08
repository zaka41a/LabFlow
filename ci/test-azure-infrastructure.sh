#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly infrastructure_file="${labflow_test_root}/infra/main.tf"
readonly variables_file="${labflow_test_root}/infra/variables.tf"
readonly cloud_init_file="${labflow_test_root}/infra/cloud-init.yaml.tftpl"

grep --fixed-strings --quiet -- 'admin_enabled       = true' "$infrastructure_file"
grep --fixed-strings --quiet -- 'default     = "Standard_B2ats_v2"' "$variables_file"
grep --fixed-strings --quiet -- '--password-stdin' "$cloud_init_file"

if grep --fixed-strings --quiet -- 'resource "azurerm_role_assignment"' "$infrastructure_file"; then
  printf '%s\n' 'The course identity cannot create Azure role assignments.' >&2
  exit 1
fi

printf 'Azure infrastructure test: 1 passed.\n'
