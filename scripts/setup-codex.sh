#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEFAULT_CODEX_HOME="${HOME}/.codex"
LOCAL_CODEX_HOME="${ROOT_DIR}/.codex-home"

REQUIRED_SKILLS=(
  "gh-fix-ci"
  "gh-address-comments"
  "playwright"
  "security-best-practices"
  "security-threat-model"
)

echo "==> GridSpace Codex bootstrap"
echo "Repo root: ${ROOT_DIR}"

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: codex CLI not found in PATH."
  exit 1
fi

if [ -z "${CODEX_HOME:-}" ]; then
  if [ -w "${DEFAULT_CODEX_HOME}" ]; then
    export CODEX_HOME="${DEFAULT_CODEX_HOME}"
  else
    export CODEX_HOME="${LOCAL_CODEX_HOME}"
    mkdir -p "${CODEX_HOME}"
    echo "Using sandbox-safe CODEX_HOME: ${CODEX_HOME}"
  fi
else
  mkdir -p "${CODEX_HOME}"
  echo "Using caller-provided CODEX_HOME: ${CODEX_HOME}"
fi

CODEX_SKILLS_DIR="${CODEX_HOME}/skills"
SKILL_INSTALLER=""
if [ -f "${CODEX_HOME}/skills/.system/skill-installer/scripts/install-skill-from-github.py" ]; then
  SKILL_INSTALLER="${CODEX_HOME}/skills/.system/skill-installer/scripts/install-skill-from-github.py"
elif [ -f "${DEFAULT_CODEX_HOME}/skills/.system/skill-installer/scripts/install-skill-from-github.py" ]; then
  SKILL_INSTALLER="${DEFAULT_CODEX_HOME}/skills/.system/skill-installer/scripts/install-skill-from-github.py"
fi

echo ""
echo "==> Configuring MCP servers"
codex mcp remove filesystem >/dev/null 2>&1 || true
codex mcp remove playwright >/dev/null 2>&1 || true
codex mcp remove context7 >/dev/null 2>&1 || true

codex mcp add filesystem -- npx @anthropic-ai/mcp-server-filesystem --root "${ROOT_DIR}"
codex mcp add playwright -- npx @anthropic-ai/mcp-server-playwright
codex mcp add context7 -- npx @anthropic-ai/mcp-server-context7

echo ""
echo "==> Installing recommended Codex skills"

if [ ! -f "${SKILL_INSTALLER}" ]; then
  echo "WARNING: skill installer not found in ${CODEX_HOME} or ${DEFAULT_CODEX_HOME}"
  echo "Skipping skill install. MCP setup is complete."
  exit 0
fi

mkdir -p "${CODEX_SKILLS_DIR}"

for skill in "${REQUIRED_SKILLS[@]}"; do
  if [ -d "${CODEX_SKILLS_DIR}/${skill}" ]; then
    echo " - ${skill}: already installed"
    continue
  fi

  echo " - ${skill}: installing"
  python3 "${SKILL_INSTALLER}" \
    --repo openai/skills \
    --path "skills/.curated/${skill}"
done

echo ""
echo "Codex bootstrap complete."
echo "Restart Codex to pick up new skills and MCP configuration."
