# Agentes del proyecto (transversal nube + local)

Los agentes que viven aquí (`.claude/agents/*.md`) están **versionados en el repo**,
así que funcionan igual en:

- **Local** → cuando abres este proyecto, Claude Code lee los agentes de proyecto.
- **Nube / web** → el contenedor clona el repo y los trae automáticamente.

> Los agentes "personales" de `C:\Users\josed\.claude\agents` son globales de tu
> usuario y **NO viajan a la nube**. Por eso, para que un agente esté disponible en
> ambos entornos, debe estar en esta carpeta.

## Cómo migrar tus agentes locales a este repo (PowerShell, en tu PC)

```powershell
# 1. Posiciónate en la carpeta del repo clonado en tu PC
cd C:\ruta\a\nivra-whatsapp-bot

# 2. Trae tu rama
git fetch origin
git checkout claude/mcp-integration-monetize-xfteim

# 3. Copia tus agentes personales al repo
Copy-Item "C:\Users\josed\.claude\agents\*.md" ".\.claude\agents\" -Force

# 4. Commitea y sube
git add .claude/agents
git commit -m "Add personal agents to repo for cloud+local use"
git push origin claude/mcp-integration-monetize-xfteim
```

A partir de ahí los verás también en las sesiones web.

## Formato de un agente

Cada agente es un `.md` con frontmatter:

```markdown
---
name: nombre-del-agente
description: Cuándo usar este agente.
tools: Read, Grep, Glob   # opcional; si se omite, hereda todas
model: sonnet             # opcional
---

Prompt de sistema del agente: rol, instrucciones, criterios.
```
