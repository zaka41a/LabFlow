#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
labflow_test_directory="$(mktemp -d "${TMPDIR:-/tmp}/labflow-azure-auth.XXXXXX")"
trap 'rm -rf "$labflow_test_directory"' EXIT

mkdir -p "${labflow_test_directory}/bin"

cat > "${labflow_test_directory}/bin/az" <<'AZURE_STUB'
#!/usr/bin/env bash
set -Eeuo pipefail

printf '%s\n' "$*" >> "${LABFLOW_AZURE_STUB_LOG}"

case "$*" in
  "account show --output none")
    [[ "${LABFLOW_AZURE_STUB_SESSION:-false}" == "true" ]]
    ;;
  "account show --query id --output tsv")
    printf '%s\n' '11111111-1111-1111-1111-111111111111'
    ;;
  "account show --query {subscription:name,state:state,tenant:tenantId} --output json")
    printf '%s\n' '{"subscription":"Course Azure","state":"Enabled","tenant":"tenant"}'
    ;;
  login*|"account set"*)
    ;;
  *)
    printf 'Unexpected Azure CLI call in test: %s\n' "$*" >&2
    exit 1
    ;;
esac
AZURE_STUB
chmod +x "${labflow_test_directory}/bin/az"

assert_equal() {
  local expected="$1"
  local actual="$2"
  local message="$3"

  if [[ "$expected" != "$actual" ]]; then
    printf '%s: expected %s, got %s\n' "$message" "$expected" "$actual" >&2
    return 1
  fi
}

test_runner_authentication() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  export LABFLOW_AZURE_STUB_LOG="${labflow_test_directory}/runner.log"
  export LABFLOW_AZURE_STUB_SESSION="true"
  export LABFLOW_AZURE_AUTH_MODE="auto"
  unset ARM_CLIENT_ID ARM_CLIENT_SECRET ARM_OIDC_TOKEN ARM_SUBSCRIPTION_ID ARM_TENANT_ID ARM_USE_OIDC

  source "${labflow_test_root}/ci/azure-auth.sh"
  labflow_configure_azure_auth >/dev/null

  assert_equal "runner" "$LABFLOW_AZURE_AUTH_RESOLVED" "runner mode"
  assert_equal \
    "11111111-1111-1111-1111-111111111111" \
    "$ARM_SUBSCRIPTION_ID" \
    "runner subscription"
  [[ -z "${ARM_USE_OIDC:-}" ]]
)

test_oidc_authentication() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  export LABFLOW_AZURE_STUB_LOG="${labflow_test_directory}/oidc.log"
  export LABFLOW_AZURE_STUB_SESSION="false"
  export LABFLOW_AZURE_AUTH_MODE="oidc"
  export ARM_CLIENT_ID="client"
  export ARM_TENANT_ID="tenant"
  export ARM_SUBSCRIPTION_ID="subscription"
  export AZURE_OIDC_TOKEN="short-lived-token"

  source "${labflow_test_root}/ci/azure-auth.sh"
  labflow_configure_azure_auth >/dev/null

  assert_equal "oidc" "$LABFLOW_AZURE_AUTH_RESOLVED" "OIDC mode"
  assert_equal "true" "$ARM_USE_OIDC" "OpenTofu OIDC flag"
  assert_equal "short-lived-token" "$ARM_OIDC_TOKEN" "OpenTofu OIDC token"
  grep --quiet -- '--federated-token short-lived-token' "$LABFLOW_AZURE_STUB_LOG"
)

test_incomplete_oidc_is_rejected() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  export LABFLOW_AZURE_STUB_LOG="${labflow_test_directory}/incomplete.log"
  export LABFLOW_AZURE_AUTH_MODE="oidc"
  export ARM_CLIENT_ID="client"
  unset ARM_TENANT_ID ARM_SUBSCRIPTION_ID AZURE_OIDC_TOKEN

  source "${labflow_test_root}/ci/azure-auth.sh"
  ! labflow_configure_azure_auth >/dev/null 2>&1
)

test_invalid_mode_is_rejected() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  export LABFLOW_AZURE_STUB_LOG="${labflow_test_directory}/invalid.log"
  export LABFLOW_AZURE_AUTH_MODE="password"

  source "${labflow_test_root}/ci/azure-auth.sh"
  ! labflow_configure_azure_auth >/dev/null 2>&1
)

test_runner_authentication
test_oidc_authentication
test_incomplete_oidc_is_rejected
test_invalid_mode_is_rejected

printf 'Azure authentication tests: 4 passed.\n'
