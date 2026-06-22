#!/usr/bin/env bash
# Instala los agentes de este repo en el scope de USUARIO (~/.claude/agents),
# para que estén disponibles al invocarlos desde CUALQUIER repo (local o nube).
#
# Uso:
#   bash scripts/install-agents.sh            # usa ./.claude/agents
#   bash scripts/install-agents.sh /ruta/src  # usa otra carpeta fuente
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="${1:-$SCRIPT_DIR/../.claude/agents}"
DEST="${HOME}/.claude/agents"

if [ ! -d "$SRC" ]; then
  echo "❌ No encuentro la carpeta de agentes: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST"

n=0
for f in "$SRC"/*.md; do
  [ -e "$f" ] || continue
  b="$(basename "$f")"
  [ "$b" = "README.md" ] && continue          # README no es un agente
  cp -f "$f" "$DEST/$b"
  n=$((n + 1))
done

# Helpers del PROJECT-GUARD (no son agentes, pero algunos los referencian)
for f in "$SRC"/_project-guard*; do
  [ -e "$f" ] || continue
  cp -f "$f" "$DEST/"
done

echo "✅ $n agentes instalados en $DEST"
echo "   Ahora son invocables desde cualquier repo en este equipo/entorno."
