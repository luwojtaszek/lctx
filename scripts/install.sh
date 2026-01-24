#!/bin/bash
set -euo pipefail

# lctx installer
# Usage: curl -fsSL https://raw.githubusercontent.com/luwojtaszek/lctx/main/scripts/install.sh | bash
# Environment variables:
#   LCTX_VERSION    - specific version to install (default: latest)
#   LCTX_INSTALL_DIR - installation directory (default: ~/.local/bin)

REPO="luwojtaszek/lctx"
INSTALL_DIR="${LCTX_INSTALL_DIR:-$HOME/.local/bin}"
VERSION="${LCTX_VERSION:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}==>${NC} $1"; }
success() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
error() { echo -e "${RED}Error:${NC} $1" >&2; exit 1; }

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "darwin" ;;
    *)       error "Unsupported OS: $(uname -s). Only Linux and macOS are supported." ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *)            error "Unsupported architecture: $(uname -m). Only x64 and arm64 are supported." ;;
  esac
}

# Get latest version from GitHub API
get_latest_version() {
  local latest
  latest=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v?([^"]+)".*/\1/')
  if [[ -z "$latest" ]]; then
    error "Failed to fetch latest version from GitHub"
  fi
  echo "$latest"
}

# Download and verify checksum
download_and_verify() {
  local version="$1"
  local os="$2"
  local arch="$3"
  local artifact="lctx-${os}-${arch}"
  local tarball="${artifact}.tar.gz"
  local tag="v${version}"

  # Handle version without v prefix
  if [[ "$version" == v* ]]; then
    tag="$version"
  fi

  local download_url="https://github.com/${REPO}/releases/download/${tag}/${tarball}"
  local checksum_url="https://github.com/${REPO}/releases/download/${tag}/checksums.txt"

  local tmp_dir
  tmp_dir=$(mktemp -d)
  trap "rm -rf $tmp_dir" EXIT

  info "Downloading lctx ${version} for ${os}-${arch}..."

  # Download tarball
  if ! curl -fsSL -o "${tmp_dir}/${tarball}" "$download_url"; then
    error "Failed to download ${tarball} from ${download_url}"
  fi

  # Download and verify checksum
  info "Verifying checksum..."
  if curl -fsSL -o "${tmp_dir}/checksums.txt" "$checksum_url" 2>/dev/null; then
    cd "$tmp_dir"
    local expected_checksum
    expected_checksum=$(grep "${tarball}" checksums.txt | awk '{print $1}')
    if [[ -n "$expected_checksum" ]]; then
      local actual_checksum
      if command -v sha256sum &>/dev/null; then
        actual_checksum=$(sha256sum "${tarball}" | awk '{print $1}')
      elif command -v shasum &>/dev/null; then
        actual_checksum=$(shasum -a 256 "${tarball}" | awk '{print $1}')
      else
        warn "Neither sha256sum nor shasum found, skipping checksum verification"
        actual_checksum="$expected_checksum"
      fi

      if [[ "$expected_checksum" != "$actual_checksum" ]]; then
        error "Checksum verification failed!\nExpected: ${expected_checksum}\nActual: ${actual_checksum}"
      fi
      success "Checksum verified"
    else
      warn "Could not find checksum for ${tarball}, skipping verification"
    fi
  else
    warn "Could not download checksums.txt, skipping verification"
  fi

  # Extract tarball
  info "Extracting..."
  tar -xzf "${tmp_dir}/${tarball}" -C "$tmp_dir"

  # Install binary
  info "Installing to ${INSTALL_DIR}..."
  mkdir -p "$INSTALL_DIR"
  mv "${tmp_dir}/${artifact}" "${INSTALL_DIR}/lctx"
  chmod +x "${INSTALL_DIR}/lctx"

  success "lctx ${version} installed successfully!"
}

# Check if directory is in PATH
check_path() {
  local dir="$1"
  if [[ ":$PATH:" != *":$dir:"* ]]; then
    echo ""
    warn "Installation directory is not in your PATH"
    echo ""
    echo "Add the following to your shell configuration file (~/.bashrc, ~/.zshrc, etc.):"
    echo ""
    echo "  export PATH=\"\$PATH:$dir\""
    echo ""
    echo "Then restart your shell or run:"
    echo ""
    echo "  source ~/.bashrc  # or ~/.zshrc"
    echo ""
  fi
}

main() {
  info "lctx installer"
  echo ""

  local os
  os=$(detect_os)

  local arch
  arch=$(detect_arch)

  info "Detected platform: ${os}-${arch}"

  # Get version
  if [[ -z "$VERSION" ]]; then
    VERSION=$(get_latest_version)
    info "Latest version: ${VERSION}"
  else
    info "Installing version: ${VERSION}"
  fi

  # Download and install
  download_and_verify "$VERSION" "$os" "$arch"

  # Check PATH
  check_path "$INSTALL_DIR"

  # Verify installation
  if command -v "${INSTALL_DIR}/lctx" &>/dev/null; then
    echo ""
    info "Verifying installation..."
    "${INSTALL_DIR}/lctx" --version
    echo ""
    success "Installation complete! Run 'lctx' to get started."
  fi
}

main "$@"
