#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_test_root="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
labflow_test_directory="$(mktemp -d "${TMPDIR:-/tmp}/labflow-azure-preflight.XXXXXX")"
trap 'rm -rf "$labflow_test_directory"' EXIT

mkdir -p "${labflow_test_directory}/bin"

cat > "${labflow_test_directory}/bin/az" <<'AZURE_STUB'
#!/usr/bin/env bash
set -Eeuo pipefail

case "$*" in
  "account get-access-token --resource https://management.azure.com/ --query expires_on --output tsv")
    printf '%s\n' '2099-01-01 00:00:00.000000'
    ;;
  provider\ show\ --namespace\ *\ --query\ registrationState\ --output\ tsv)
    provider_namespace="${4}"
    if [[ "$provider_namespace" == "${LABFLOW_UNREGISTERED_PROVIDER:-}" ]]; then
      printf '%s\n' 'NotRegistered'
    else
      printf '%s\n' 'Registered'
    fi
    ;;
  *)
    printf 'Unexpected Azure CLI call in preflight test: %s\n' "$*" >&2
    exit 1
    ;;
esac
AZURE_STUB
chmod +x "${labflow_test_directory}/bin/az"

test_registered_providers_pass() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  unset LABFLOW_UNREGISTERED_PROVIDER

  bash "${labflow_test_root}/ci/azure-preflight.sh" >/dev/null
)

test_unregistered_provider_fails() (
  export PATH="${labflow_test_directory}/bin:${PATH}"
  export LABFLOW_UNREGISTERED_PROVIDER="Microsoft.Storage"

  ! bash "${labflow_test_root}/ci/azure-preflight.sh" >/dev/null 2>&1
)

test_registered_providers_pass
test_unregistered_provider_fails

printf 'Azure preflight tests: 2 passed.\n'
