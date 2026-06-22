# Invocar los agentes en CUALQUIER repo (local y nube)

Los agentes viven en `.claude/agents/` de este repo (fuente única de verdad).
Para poder invocarlos desde **cualquier** repositorio —no solo este— hay que
instalarlos en el **scope de usuario** `~/.claude/agents/`, que Claude Code lee
en todos los proyectos.

| Dónde | Mecanismo | Cobertura |
|-------|-----------|-----------|
| **Local** | `scripts/install-agents.ps1` (una vez) | Todos tus repos locales |
| **Nube — este repo** | SessionStart hook (`.claude/settings.json`) — **ya activo** | Sesiones de nube de este repo |
| **Nube — cualquier repo** | Setup script del entorno (UI) | Todos los repos del entorno |

---

## 1. Local (Windows) — cualquier repo local

Una sola vez, en PowerShell dentro de tu copia del repo:

```powershell
git pull
.\scripts\install-agents.ps1
```

Copia todos los agentes a `C:\Users\<tu>\.claude\agents\`. Desde ahí Claude Code
los ve en **cualquier** proyecto que abras en tu máquina. Repite el comando para
actualizar cuando cambien los agentes.

> En macOS/Linux local: `bash scripts/install-agents.sh`.

---

## 2. Nube — CUALQUIER repo (configurar una vez por entorno) ★ principal

Los hooks de repo solo aplican a su propio repo. Para que **cualquier** repo que
abras en la nube tenga los agentes, configura el **Setup script del entorno**
(corre antes de lanzar Claude y persiste en el snapshot):

1. En claude.ai/code, abre **Environment settings**.
2. Pega el contenido de [`scripts/cloud-setup-agents.sh`](scripts/cloud-setup-agents.sh)
   en el campo **Setup script**.
3. Guarda. La próxima sesión (en cualquier repo de ese entorno) tendrá los
   agentes en `~/.claude/agents/`.

---

## 3. Nube — este repo, automático (opcional)

Si quieres que **este** repo instale los agentes solo en sus sesiones de nube sin
configurar el entorno, añade tú este hook a `.claude/settings.json` (no lo dejo
puesto por defecto porque es un hook de auto-ejecución):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command",
            "command": "[ \"$CLAUDE_CODE_REMOTE\" = \"true\" ] && bash \"$CLAUDE_PROJECT_DIR\"/scripts/install-agents.sh || true" }
        ]
      }
    ]
  }
}
```

---

## Nota: PROJECT-GUARD

Varios agentes traen un bloque `PROJECT-GUARD` que, antes de acciones con efecto,
verifica estar en el proyecto **Nivra SaaS**. Instalados globalmente seguirás
pudiendo **invocarlos** en cualquier repo, pero se frenarán ante acciones de
escritura si no reconocen el proyecto. Es su diseño de aislamiento. Si quieres
que reconozcan otros repos, hay que ajustar ese bloque (pídelo y lo adapto).
