<#
  _project-guard-rollout.ps1
  Inyecta (o actualiza) el bloque PROJECT-GUARD en los agentes Nivra.
  Dos carriles:
    - ESTRICTO (fail-closed): agentes de producto/ingenieria. Sentinels PROJECT-GUARD:v1.
    - SUAVE (recordatorio):   agentes marketing/comercial.    Sentinels PROJECT-GUARD-SOFT:v1.
  Cada agente recibe EXACTAMENTE un carril (o ninguno, si esta excluido).
  Idempotente. Soporta -DryRun y -Verify. Hace backup .bak solo al escribir.

  Uso:
    powershell -ExecutionPolicy Bypass -File _project-guard-rollout.ps1 -DryRun   # muestra, no escribe
    powershell -ExecutionPolicy Bypass -File _project-guard-rollout.ps1           # aplica (backup .bak)
    powershell -ExecutionPolicy Bypass -File _project-guard-rollout.ps1 -Verify   # estado, no escribe

  Los textos viven en:
    _project-guard-block.md       (estricto)  entre <!-- PROJECT-GUARD:v1:START -->      ... :END
    _project-guard-block-soft.md  (suave)     entre <!-- PROJECT-GUARD-SOFT:v1:START --> ... :END
#>
param(
  [switch]$DryRun,
  [switch]$Verify
)

$ErrorActionPreference = 'Stop'
$AgentsDir = $PSScriptRoot

# --- Definicion de carriles ---
$StrictFile      = Join-Path $AgentsDir '_project-guard-block.md'
$SoftFile        = Join-Path $AgentsDir '_project-guard-block-soft.md'
$StrictStartTag  = '<!-- PROJECT-GUARD:v1:START -->'
$SoftStartTag    = '<!-- PROJECT-GUARD-SOFT:v1:START -->'
# Regex de cada carril (anclados para NO solaparse: 'GUARD:' vs 'GUARD-SOFT:').
$StrictRegex = '(?s)<!-- PROJECT-GUARD:v\d+:START -->.*?<!-- PROJECT-GUARD:v\d+:END -->\r?\n?'
$SoftRegex   = '(?s)<!-- PROJECT-GUARD-SOFT:v\d+:START -->.*?<!-- PROJECT-GUARD-SOFT:v\d+:END -->\r?\n?'

# --- Agentes EXCLUIDOS (no-Nivra) ---
$Exclude = @(
  'game-3d-artist.md'   # proyecto image-to-3d-studio (generico)
)

# --- Agentes con carril SUAVE (marketing/comercial) ---
$Soft = @(
  'cmo.md',
  'copywriter-b2b.md',
  'demand-gen.md',
  'icp-analyst.md',
  'kam.md',
  'market-analyst.md',
  'paid-media.md',
  'sales-enablement.md',
  'sales-engineer.md',
  'growth-analyst.md',
  'commercial-manager.md'
)
# adversary -> ESTRICTO por decision CIO: agente tecnico read-only con Bash; no es marketing.

if (-not (Test-Path -LiteralPath $StrictFile)) { throw "Falta el bloque estricto: $StrictFile" }
if (-not (Test-Path -LiteralPath $SoftFile))   { throw "Falta el bloque suave: $SoftFile" }
$StrictBody = (Get-Content -LiteralPath $StrictFile -Raw).TrimEnd()
$SoftBody   = (Get-Content -LiteralPath $SoftFile   -Raw).TrimEnd()

# --- Recolectar agentes (.md, sin _*.md de tooling) ---
$all = Get-ChildItem -Path $AgentsDir -Filter '*.md' -File | Where-Object { $_.Name -notlike '_*' }

function Get-Lane($name) {
  if ($Exclude -contains $name) { return 'excluded' }
  if ($Soft    -contains $name) { return 'soft' }
  return 'strict'
}

# Estado de un archivo respecto del carril que LE TOCA.
function Get-State($content, $lane) {
  switch ($lane) {
    'strict'   { if ($content -match [regex]::Escape($StrictStartTag)) { return 'current' }
                 if ($content -match $StrictRegex) { return 'outdated' }
                 return 'missing' }
    'soft'     { if ($content -match [regex]::Escape($SoftStartTag)) { return 'current' }
                 if ($content -match $SoftRegex) { return 'outdated' }
                 return 'missing' }
    default    { return 'n/a' }
  }
}

$report = foreach ($f in $all) {
  $lane = Get-Lane $f.Name
  $raw  = Get-Content -LiteralPath $f.FullName -Raw
  [pscustomobject]@{ File = $f.Name; Lane = $lane; State = (Get-State $raw $lane) }
}

if ($Verify) {
  Write-Host '=== VERIFY (no escribe) ===' -ForegroundColor Cyan
  $report | Group-Object Lane | Sort-Object Name | ForEach-Object {
    Write-Host ('{0,-9}: {1}' -f $_.Name, $_.Count) -ForegroundColor Green
  }
  Write-Host '--- detalle estado por carril ---' -ForegroundColor DarkGray
  $report | Group-Object Lane, State | Sort-Object Name | ForEach-Object {
    Write-Host ('  {0,-22}: {1}' -f $_.Name, $_.Count)
  }
  Write-Host ('Excluidos (no-Nivra): ' + (($report | Where-Object Lane -eq 'excluded').File -join ', ')) -ForegroundColor Yellow
  $report | Sort-Object Lane, State, File | Format-Table -AutoSize
  return
}

$tag = if ($DryRun) { '[DRY-RUN]' } else { '' }
Write-Host ('=== ROLLOUT PROJECT-GUARD (estricto + suave) ' + $tag + ' ===') -ForegroundColor Cyan
$cs = ($report | Where-Object Lane -eq 'strict').Count
$cf = ($report | Where-Object Lane -eq 'soft').Count
$ce = ($report | Where-Object Lane -eq 'excluded').Count
Write-Host ('Estricto: ' + $cs + ' | Suave: ' + $cf + ' | Excluidos: ' + $ce)

foreach ($f in $all) {
  $lane = Get-Lane $f.Name
  if ($lane -eq 'excluded') {
    Write-Host ('  [skip:excl] ' + $f.Name + ' -- no-Nivra') -ForegroundColor Yellow
    continue
  }

  $raw   = Get-Content -LiteralPath $f.FullName -Raw
  $state = Get-State $raw $lane

  if ($state -eq 'current') {
    Write-Host ('  [skip:ok  ] ' + $f.Name + ' (' + $lane + ') -- ya al dia') -ForegroundColor DarkGray
    continue
  }

  # Carril y cuerpo correspondientes.
  if ($lane -eq 'strict') { $body = $StrictBody; $thisRegex = $StrictRegex; $otherRegex = $SoftRegex }
  else                    { $body = $SoftBody;   $thisRegex = $SoftRegex;   $otherRegex = $StrictRegex }

  # 1) Eliminar cualquier bloque del OTRO carril (un agente solo lleva su carril).
  $work = [regex]::Replace($raw, $otherRegex, '')

  if ($state -eq 'outdated') {
    # 2a) Reemplazar el bloque existente de este carril.
    $new    = [regex]::Replace($work, $thisRegex, ($body + "`n"))
    $action = 'update'
  }
  else {
    # 2b) Insertar tras el frontmatter (segundo '---' en las primeras lineas).
    $lines = $work -split "`r?`n"
    $dashIdx = New-Object System.Collections.Generic.List[int]
    $limit = [Math]::Min(8, $lines.Count)
    for ($i = 0; $i -lt $limit; $i++) { if ($lines[$i] -eq '---') { $dashIdx.Add($i) } }
    if ($dashIdx.Count -lt 2) {
      Write-Host ('  [WARN     ] ' + $f.Name + ' -- frontmatter no estandar; SALTADO') -ForegroundColor Red
      continue
    }
    $close = $dashIdx[1]
    $head = ($lines[0..$close] -join "`n")
    $tail = ($lines[($close + 1)..($lines.Count - 1)] -join "`n")
    $new = $head + "`n`n" + $body + "`n" + $tail
    $action = 'insert'
  }

  if ($DryRun) {
    Write-Host ('  [' + $action + (' ' * (7 - $action.Length)) + '] ' + $f.Name + ' (' + $lane + ')') -ForegroundColor Green
  }
  else {
    Copy-Item -LiteralPath $f.FullName -Destination ($f.FullName + '.bak') -Force
    Set-Content -LiteralPath $f.FullName -Value $new -Encoding UTF8 -NoNewline
    Write-Host ('  [' + $action + (' ' * (7 - $action.Length)) + '] ' + $f.Name + ' (' + $lane + ') (backup .bak)') -ForegroundColor Green
  }
}

$end = if ($DryRun) { '(dry-run, nada escrito)' } else { '(aplicado)' }
Write-Host ('=== FIN ' + $end + ' ===') -ForegroundColor Cyan
