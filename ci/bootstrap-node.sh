#!/usr/bin/env bash

set -Eeuo pipefail

readonly labflow_node_version="22.19.0"
readonly labflow_node_sha256="d36e56998220085782c0ca965f9d51b7726335aed2f5fc7321c6c0ad233aa96d"
readonly labflow_node_project_directory="${CI_PROJECT_DIR:-$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
readonly labflow_node_tools_directory="${LABFLOW_CI_TOOLS_DIR:-${labflow_node_project_directory}/.ci-tools}"
readonly labflow_node_home="${labflow_node_tools_directory}/node-v${labflow_node_version}-linux-x64"

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

if [[ ! -x "${labflow_node_home}/bin/node" ]]; then
  command -v curl >/dev/null 2>&1 || {
    printf 'curl is required to install Node.js in the CI workspace.\n' >&2
    return 1 2>/dev/null || exit 1
  }

  mkdir -p "$labflow_node_tools_directory"
  labflow_node_download_directory="$(mktemp -d "${labflow_node_tools_directory}/.node-download.XXXXXX")"
  trap 'rm -rf "$labflow_node_download_directory"' EXIT
  labflow_node_archive="${labflow_node_download_directory}/node-v${labflow_node_version}-linux-x64.tar.gz"

  curl \
    --fail \
    --location \
    --retry 4 \
    --retry-all-errors \
    --show-error \
    --silent \
    --output "$labflow_node_archive" \
    "https://nodejs.org/dist/v${labflow_node_version}/node-v${labflow_node_version}-linux-x64.tar.gz"

  verify_sha256 "$labflow_node_sha256" "$labflow_node_archive"
  tar --extract --gzip --file "$labflow_node_archive" --directory "$labflow_node_tools_directory"
  rm -rf "$labflow_node_download_directory"
  trap - EXIT
fi

export PATH="${labflow_node_home}/bin:${PATH}"
node --version
npm --version
