#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_java_version="21.0.12+8"
readonly labflow_java_archive_version="21.0.12_8"
readonly labflow_java_sha256="e4446ff06a276155697597cc0f1b15da004ff083f4964a35271ecee567177370"
readonly labflow_java_project_directory="${CI_PROJECT_DIR:-$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
readonly labflow_java_tools_directory="${LABFLOW_CI_TOOLS_DIR:-${labflow_java_project_directory}/.ci-tools}"
readonly labflow_java_home="${labflow_java_tools_directory}/jdk-${labflow_java_version}"

verify_sha256() {
  local expected="$1"
  local file="$2"

  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s  %s\n' "$expected" "$file" | sha256sum --check --status
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    printf '%s  %s\n' "$expected" "$file" | shasum --algorithm 256 --check --status
    return
  fi

  printf 'Neither sha256sum nor shasum is available.\n' >&2
  return 1
}

if [[ ! -x "${labflow_java_home}/bin/java" ]]; then
  command -v curl >/dev/null 2>&1 || {
    printf 'curl is required to install Java in the CI workspace.\n' >&2
    return 1 2>/dev/null || exit 1
  }

  mkdir -p "$labflow_java_tools_directory"
  labflow_java_download_directory="$(mktemp -d "${labflow_java_tools_directory}/.java-download.XXXXXX")"
  trap 'rm -rf "$labflow_java_download_directory"' EXIT
  labflow_java_archive="${labflow_java_download_directory}/OpenJDK21U-jdk_x64_linux_hotspot_${labflow_java_archive_version}.tar.gz"

  curl \
    --fail \
    --location \
    --retry 4 \
    --retry-all-errors \
    --show-error \
    --silent \
    --output "$labflow_java_archive" \
    "https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.12%2B8/OpenJDK21U-jdk_x64_linux_hotspot_${labflow_java_archive_version}.tar.gz"

  verify_sha256 "$labflow_java_sha256" "$labflow_java_archive"
  tar --extract --gzip --file "$labflow_java_archive" --directory "$labflow_java_tools_directory"
  rm -rf "$labflow_java_download_directory"
  trap - EXIT
fi

export JAVA_HOME="$labflow_java_home"
export PATH="${JAVA_HOME}/bin:${PATH}"
java --version
