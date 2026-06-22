# Instala los agentes de este repo en el scope de USUARIO (C:\Users\<tu>\.claude\agents)
# para poder invocarlos desde CUALQUIER repo local.
#
# Uso (PowerShell, dentro del repo clonado):
#   .\scripts\install-agents.ps1
$ErrorActionPreference = 'Stop'

$src  = Join-Path $PSScriptRoot '..\.claude\agents'
$dest = Join-Path $HOME '.claude\agents'

if (-not (Test-Path $src)) {
  Write-Error "No encuentro la carpeta de agentes: $src"
  exit 1
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null

$n = 0
Get-ChildItem -Path $src -Filter '*.md' |
  Where-Object { $_.Name -ne 'README.md' } |
  ForEach-Object { Copy-Item $_.FullName -Destination $dest -Force; $n++ }

# Helpers del PROJECT-GUARD
Get-ChildItem -Path $src -Filter '_project-guard*' -ErrorAction SilentlyContinue |
  ForEach-Object { Copy-Item $_.FullName -Destination $dest -Force }

Write-Host "OK: $n agentes instalados en $dest"
Write-Host "    Ahora son invocables desde cualquier repo local."
