#!/usr/bin/env bash

set -Eeuo pipefail

readonly project_directory="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly compose_file="${project_directory}/compose.yaml"
readonly startup_timeout="${LABFLOW_STARTUP_TIMEOUT:-240}"

info() {
  printf '\033[1;34m[LabFlow]\033[0m %s\n' "$1"
}

error() {
  printf '\033[1;31m[LabFlow]\033[0m %s\n' "$1" >&2
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "Erforderliches Programm nicht gefunden: $1"
    exit 1
  fi
}

wait_for_service() {
  local service_name="$1"
  local url="$2"
  local accept_error_status="${3:-false}"
  local deadline=$((SECONDS + startup_timeout))

  info "Warte auf ${service_name} ..."
  until service_is_reachable "$url" "$accept_error_status"; do
    if (( SECONDS >= deadline )); then
      error "${service_name} war nach ${startup_timeout} Sekunden nicht erreichbar."
      docker compose --file "$compose_file" logs --tail 100
      exit 1
    fi
    sleep 2
  done
}

service_is_reachable() {
  local url="$1"
  local accept_error_status="$2"

  if [[ "$accept_error_status" == "true" ]]; then
    curl --silent --show-error --output /dev/null "$url"
  else
    curl --fail --silent --show-error --output /dev/null "$url"
  fi
}

require_command docker
require_command curl

if ! docker info >/dev/null 2>&1; then
  error "Docker ist nicht gestartet. Bitte Docker Desktop öffnen und erneut versuchen."
  exit 1
fi

cd "$project_directory"

info "Baue und starte Keycloak, Frontend, Spring Boot API und Azure Storage Emulator."
docker compose --file "$compose_file" up --build --detach --remove-orphans

wait_for_service "OpenID Connect Provider" "http://127.0.0.1:8180/realms/labflow/.well-known/openid-configuration"
wait_for_service "Azure Storage Emulator" "http://127.0.0.1:10000/" "true"
wait_for_service "Spring Boot API" "http://127.0.0.1:8080/actuator/health"
wait_for_service "Weboberfläche" "http://127.0.0.1/healthz"

docker compose --file "$compose_file" ps

printf '\n'
info "LabFlow ist vollständig gestartet."
printf '  Weboberfläche:  http://localhost\n'
printf '  Alternative URL: http://localhost:5173\n'
printf '  REST API:       http://localhost:8080/api\n'
printf '  OpenID Connect: http://keycloak.localhost:8180/realms/labflow\n'
printf '  Health Check:   http://localhost:8080/actuator/health\n'
printf '  Azure Blob:     http://localhost:10000/devstoreaccount1\n'
printf '\nZum Beenden: ./stop.sh\n'
