#!/bin/sh

set -eu

if [ "$#" -ne 5 ]; then
  printf '%s\n' 'Usage: azure-deploy-vm.sh REGISTRY USERNAME PASSWORD_BASE64 REVISION OIDC_METHOD' >&2
  exit 64
fi

readonly registry_server="$1"
readonly registry_username="$2"
registry_password_base64="$3"
readonly revision="$4"
readonly oidc_client_authentication_method="$5"
readonly compose_file="${LABFLOW_COMPOSE_FILE:-/opt/labflow/compose.yaml}"
readonly docker_config="${LABFLOW_DOCKER_CONFIG:-/root/.docker}"

case "$revision" in
  ''|*[!0-9a-f]*)
    printf '%s\n' 'The deployment revision must be a lowercase hexadecimal Git commit.' >&2
    exit 64
    ;;
esac

case "$oidc_client_authentication_method" in
  none|client_secret_basic|client_secret_post) ;;
  *)
    printf '%s\n' 'Unsupported OIDC client authentication method.' >&2
    exit 64
    ;;
esac

case $((${#registry_password_base64} % 4)) in
  0) ;;
  2) registry_password_base64="${registry_password_base64}==" ;;
  3) registry_password_base64="${registry_password_base64}=" ;;
  *)
    printf '%s\n' 'Invalid registry password encoding.' >&2
    exit 64
    ;;
esac

readonly backend_image="${registry_server}/labflow-backend:${revision}"
readonly frontend_image="${registry_server}/labflow-frontend:${revision}"

cloud-init status --wait
test -f "$compose_file"
install -d -m 0700 "$docker_config"

registry_password="$(printf '%s' "$registry_password_base64" | base64 --decode)"
printf '%s' "$registry_password" | docker --config "$docker_config" login \
  "$registry_server" --username "$registry_username" --password-stdin
unset registry_password registry_password_base64

docker --config "$docker_config" pull "$backend_image"
docker --config "$docker_config" pull "$frontend_image"

sed -E -i.bak \
  -e "s|^[[:space:]]*OIDC_CLIENT_AUTHENTICATION_METHOD:.*|            OIDC_CLIENT_AUTHENTICATION_METHOD: \"${oidc_client_authentication_method}\"|" \
  -e "s|labflow-backend:[^[:space:]]+|labflow-backend:${revision}|" \
  -e "s|labflow-frontend:[^[:space:]]+|labflow-frontend:${revision}|" \
  "$compose_file"
rm -f "${compose_file}.bak"

grep --fixed-strings --quiet -- "$backend_image" "$compose_file"
grep --fixed-strings --quiet -- "$frontend_image" "$compose_file"

DOCKER_CONFIG="$docker_config" docker compose --file "$compose_file" \
  up --detach --force-recreate --remove-orphans
DOCKER_CONFIG="$docker_config" docker compose --file "$compose_file" ps

printf 'Deployed LabFlow revision %s.\n' "$revision"
