#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
readonly infrastructure_file="${labflow_test_root}/infra/main.tf"
readonly variables_file="${labflow_test_root}/infra/variables.tf"
readonly cloud_init_file="${labflow_test_root}/infra/cloud-init.yaml.tftpl"
readonly pipeline_file="${labflow_test_root}/.gitlab-ci.yml"

grep --fixed-strings --quiet -- 'admin_enabled       = true' "$infrastructure_file"
grep --fixed-strings --quiet -- 'default     = "Standard_B2ats_v2"' "$variables_file"
grep --fixed-strings --quiet -- 'az acr credential show' "$pipeline_file"
grep --fixed-strings --quiet -- '--password-stdin' "$pipeline_file"
grep --fixed-strings --quiet -- 'cloud-init status --wait' "$pipeline_file"
grep --fixed-strings --quiet -- 'oidc_client_authentication_method' "$pipeline_file"
grep --fixed-strings --quiet -- 'OIDC_CLIENT_AUTHENTICATION_METHOD:' "$pipeline_file"
grep --fixed-strings --quiet -- 'image_tag                  = "latest"' "$infrastructure_file"
grep --fixed-strings --quiet -- 'ignore_changes = [custom_data]' "$infrastructure_file"

if grep --fixed-strings --quiet -- 'resource "azurerm_role_assignment"' "$infrastructure_file"; then
  printf '%s\n' 'The course identity cannot create Azure role assignments.' >&2
  exit 1
fi

if grep --quiet -- 'registry_\(username\|password\)' "$infrastructure_file" "$cloud_init_file"; then
  printf '%s\n' 'Computed registry credentials must not be embedded in VM custom data.' >&2
  exit 1
fi

if grep --quiet -- 'TF_VAR_image_tag\|var\.image_tag' "$pipeline_file" "$infrastructure_file"; then
  printf '%s\n' 'Image revisions must not replace the virtual machine.' >&2
  exit 1
fi

printf 'Azure infrastructure test: 1 passed.\n'
