#!/usr/bin/env bash

set -Eeuo pipefail

labflow_require_preflight_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Azure preflight requires command: %s\n' "$command_name" >&2
    return 1
  fi
}

labflow_require_preflight_command az

az account get-access-token \
  --resource https://management.azure.com/ \
  --query expires_on \
  --output tsv >/dev/null

unregistered_providers=()

for provider_namespace in \
  Microsoft.Authorization \
  Microsoft.Compute \
  Microsoft.ContainerRegistry \
  Microsoft.Network \
  Microsoft.Resources \
  Microsoft.Storage; do
  registration_state="$(
    az provider show \
      --namespace "$provider_namespace" \
      --query registrationState \
      --output tsv
  )"
  printf '%-36s %s\n' "$provider_namespace" "$registration_state"
  if [[ "$registration_state" != "Registered" ]]; then
    unregistered_providers+=("$provider_namespace")
  fi
done

if (( ${#unregistered_providers[@]} > 0 )); then
  printf 'Azure preflight failed; providers are not registered: %s\n' \
    "${unregistered_providers[*]}" >&2
  exit 1
fi

printf 'Azure preflight completed without creating resources.\n'
