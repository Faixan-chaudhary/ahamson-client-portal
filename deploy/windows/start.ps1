# Start AHamson Portal on Windows (production mode)
# Usage: .\deploy\windows\start.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Backend = Join-Path $Root "backend"
$Uvicorn = Join-Path $Backend "venv\Scripts\uvicorn.exe"
$EnvFile = Join-Path $Backend ".env"

if (-not (Test-Path $Uvicorn)) {
    throw "Backend not set up. Run .\deploy\windows\setup.ps1 first."
}
if (-not (Test-Path $EnvFile)) {
    throw "Missing backend\.env — run setup.ps1 first."
}
if (-not (Test-Path (Join-Path $Root "dist\index.html"))) {
    throw "Frontend not built. Run setup.ps1 or: npm run build"
}

Push-Location $Backend

# Read PORT from .env
$port = 8080
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^PORT=(\d+)') { $port = [int]$Matches[1] }
}

Write-Host "Starting AHamson Portal on http://0.0.0.0:$port ..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray

& $VenvPython run.py

Pop-Location
