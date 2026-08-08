#!/usr/bin/env bash

set -Eeuo pipefail

labflow_require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command is not available: %s\n' "$command_name" >&2
    return 1
  fi
}

labflow_configure_runner_auth() {
  local subscription_id

  if ! subscription_id="$(az account show --query id --output tsv 2>/dev/null)" || \
    [[ -z "$subscription_id" ]]; then
    printf 'No Azure CLI session is available on the GitLab runner.\n' >&2
    return 1
  fi

  unset ARM_CLIENT_ID ARM_CLIENT_SECRET ARM_OIDC_TOKEN ARM_TENANT_ID ARM_USE_OIDC
  export ARM_SUBSCRIPTION_ID="$subscription_id"
  export LABFLOW_AZURE_AUTH_RESOLVED="runner"

  printf 'Azure authentication: preconfigured course runner identity.\n'
}

labflow_configure_oidc_auth() {
  local variable_name

  for variable_name in ARM_CLIENT_ID ARM_TENANT_ID ARM_SUBSCRIPTION_ID AZURE_OIDC_TOKEN; do
    if [[ -z "${!variable_name:-}" ]]; then
      printf 'Azure OIDC requires CI/CD variable %s.\n' "$variable_name" >&2
      return 1
    fi
  done

  unset ARM_CLIENT_SECRET
  export ARM_USE_OIDC="true"
  export ARM_OIDC_TOKEN="$AZURE_OIDC_TOKEN"
  export LABFLOW_AZURE_AUTH_RESOLVED="oidc"

  az login \
    --service-principal \
    --username "$ARM_CLIENT_ID" \
    --tenant "$ARM_TENANT_ID" \
    --federated-token "$AZURE_OIDC_TOKEN" \
    --allow-no-subscriptions \
    --output none
  az account set --subscription "$ARM_SUBSCRIPTION_ID"

  printf 'Azure authentication: GitLab OIDC workload identity.\n'
}

labflow_configure_azure_auth() {
  local requested_mode="${LABFLOW_AZURE_AUTH_MODE:-auto}"

  labflow_require_command az || return 1

  case "$requested_mode" in
    auto)
      if az account show --output none >/dev/null 2>&1; then
        labflow_configure_runner_auth || return 1
      else
        labflow_configure_oidc_auth || return 1
      fi
      ;;
    runner)
      labflow_configure_runner_auth || return 1
      ;;
    oidc)
      labflow_configure_oidc_auth || return 1
      ;;
    *)
      printf 'Unsupported LABFLOW_AZURE_AUTH_MODE: %s\n' "$requested_mode" >&2
      return 1
      ;;
  esac

  az account show \
    --query '{subscription:name,state:state,tenant:tenantId}' \
    --output json
}
