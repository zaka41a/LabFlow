#!/usr/bin/env bash

set -Eeuo pipefail

readonly project_directory="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly compose_file="${project_directory}/compose.yaml"

if ! command -v docker >/dev/null 2>&1; then
  printf '[LabFlow] Docker wurde nicht gefunden.\n' >&2
  exit 1
fi

cd "$project_directory"

printf '[LabFlow] Stoppe alle LabFlow Dienste ...\n'
docker compose --file "$compose_file" down --remove-orphans
printf '[LabFlow] Alle Dienste sind gestoppt. Das lokale Azure Datenvolume bleibt erhalten.\n'
