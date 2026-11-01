# Copies the client plugin into a DeepSeek Harness profile and registers it.
#
#   .\scripts\install.ps1                      # install into the desktop profile
#   .\scripts\install.ps1 -ProfileName web     # install into another profile
#   .\scripts\install.ps1 -WhatIfCopy          # print the plan, change nothing
#
# The script is idempotent: an existing entry is not duplicated, and
# cordis.patch.yml is backed up before the first modification.

[CmdletBinding()]
param(
  [string]$ProfileName = 'desktop',
  [string]$DshHome = (Join-Path $env:USERPROFILE '.dsh'),
  [switch]$WhatIfCopy
)

$ErrorActionPreference = 'Stop'

$repo       = Split-Path -Parent $PSScriptRoot
$profileDir = Join-Path $DshHome "profiles\$ProfileName"
$packageDir = Join-Path $profileDir 'node_modules\dsh-client-rtl'
$patchFile  = Join-Path $profileDir 'cordis.patch.yml'

if (-not (Test-Path $profileDir)) {
  throw "Profile not found: $profileDir`nOpen DeepSeek Harness at least once with this profile, or pass -ProfileName."
}

$files = @('package.json', 'index.js', 'client.js') | ForEach-Object { Join-Path $repo $_ }
foreach ($file in $files) {
  if (-not (Test-Path $file)) { throw "Missing plugin file: $file" }
}

Write-Host "Profile : $profileDir"
Write-Host "Target  : $packageDir"
Write-Host ""

if ($WhatIfCopy) {
  Write-Host "Would copy:" -ForegroundColor Yellow
  $files | ForEach-Object { Write-Host "  $_" }
  Write-Host "Would register 'dsh-client-rtl' in: $patchFile" -ForegroundColor Yellow
  return
}

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null
foreach ($file in $files) { Copy-Item $file $packageDir -Force }
Write-Host "Copied 3 files into the profile." -ForegroundColor Green

$registration = @'

- insert:
    - id: rtl
      name: "dsh-client-rtl"
'@

$needsPatch = $true
if (Test-Path $patchFile) {
  $content = Get-Content -LiteralPath $patchFile -Raw
  if ($content -match 'dsh-client-rtl') {
    $needsPatch = $false
    Write-Host "Patch already contains the entry; left unchanged." -ForegroundColor Green
  }
}

if ($needsPatch) {
  if (Test-Path $patchFile) {
    Copy-Item $patchFile "$patchFile.bak" -Force
    Add-Content -LiteralPath $patchFile -Value $registration
    Write-Host "Registered in cordis.patch.yml (backup: cordis.patch.yml.bak)." -ForegroundColor Green
  } else {
    New-Item -ItemType File -Path $patchFile -Force | Out-Null
    Add-Content -LiteralPath $patchFile -Value $registration
    Write-Host "Created cordis.patch.yml with the entry." -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Restart DeepSeek Harness to load the plugin." -ForegroundColor Cyan
Write-Host "To uninstall: remove the '- insert:' block from $patchFile and restart." -ForegroundColor DarkGray
