#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_maven_version="3.9.11"
readonly labflow_maven_sha512="bcfe4fe305c962ace56ac7b5fc7a08b87d5abd8b7e89027ab251069faebee516b0ded8961445d6d91ec1985dfe30f8153268843c89aa392733d1a3ec956c9978"
readonly labflow_maven_project_directory="${CI_PROJECT_DIR:-$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
readonly labflow_maven_tools_directory="${LABFLOW_CI_TOOLS_DIR:-${labflow_maven_project_directory}/.ci-tools}"
readonly labflow_maven_home="${labflow_maven_tools_directory}/apache-maven-${labflow_maven_version}"

verify_sha512() {
  local expected="$1"
  local file="$2"

  if command -v sha512sum >/dev/null 2>&1; then
    printf '%s  %s\n' "$expected" "$file" | sha512sum --check --status
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    printf '%s  %s\n' "$expected" "$file" | shasum --algorithm 512 --check --status
    return
  fi

  printf 'Neither sha512sum nor shasum is available.\n' >&2
  return 1
}

if [[ ! -x "${labflow_maven_home}/bin/mvn" ]]; then
  command -v curl >/dev/null 2>&1 || {
    printf 'curl is required to install Maven in the CI workspace.\n' >&2
    return 1 2>/dev/null || exit 1
  }

  mkdir -p "$labflow_maven_tools_directory"
  labflow_maven_download_directory="$(mktemp -d "${labflow_maven_tools_directory}/.maven-download.XXXXXX")"
  trap 'rm -rf "$labflow_maven_download_directory"' EXIT
  labflow_maven_archive="${labflow_maven_download_directory}/apache-maven-${labflow_maven_version}-bin.tar.gz"

  curl \
    --fail \
    --location \
    --retry 4 \
    --retry-all-errors \
    --show-error \
    --silent \
    --output "$labflow_maven_archive" \
    "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/${labflow_maven_version}/apache-maven-${labflow_maven_version}-bin.tar.gz"

  verify_sha512 "$labflow_maven_sha512" "$labflow_maven_archive"
  tar --extract --gzip --file "$labflow_maven_archive" --directory "$labflow_maven_tools_directory"
  rm -rf "$labflow_maven_download_directory"
  trap - EXIT
fi

export PATH="${labflow_maven_home}/bin:${PATH}"
mvn --version
