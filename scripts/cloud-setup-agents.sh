#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SETUP SCRIPT para Claude Code on the web.
# Pegar TAL CUAL en: Environment settings ▸ campo "Setup script".
#
# Qué hace: clona este repo (fuente de los agentes) e instala TODOS los agentes
# en ~/.claude/agents para que estén disponibles en CUALQUIER repo que abras en
# este entorno de la nube. Corre como root antes de lanzar Claude y persiste en
# el snapshot del entorno.
# ─────────────────────────────────────────────────────────────────────────────
set +e   # nunca bloquear el arranque de la sesión

REPO="https://github.com/joseduranmunoz-afk/nivra-whatsapp-bot.git"
BRANCH="claude/mcp-integration-monetize-xfteim"

rm -rf /tmp/agents-src
git clone --depth 1 -b "$BRANCH" "$REPO" /tmp/agents-src || true

mkdir -p ~/.claude/agents
if [ -d /tmp/agents-src/.claude/agents ]; then
  cp -f /tmp/agents-src/.claude/agents/*.md            ~/.claude/agents/ 2>/dev/null
  cp -f /tmp/agents-src/.claude/agents/_project-guard* ~/.claude/agents/ 2>/dev/null
  rm -f ~/.claude/agents/README.md
  echo "Agentes instalados: $(ls ~/.claude/agents/*.md 2>/dev/null | wc -l)"
else
  echo "WARN: no se pudo clonar el repo de agentes; revisa acceso/red." >&2
fi

exit 0
