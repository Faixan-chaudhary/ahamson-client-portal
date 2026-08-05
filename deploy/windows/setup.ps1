# AHamson Portal — Windows RDP setup script
# Run in PowerShell (as Administrator recommended for firewall step):
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\deploy\windows\setup.ps1 -ServerIp "192.168.1.50"

param(
    [Parameter(Mandatory = $true)]
    [string]$ServerIp,

    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Backend = Join-Path $Root "backend"
$VenvPython = Join-Path $Backend "venv\Scripts\python.exe"
$VenvPip = Join-Path $Backend "venv\Scripts\pip.exe"

Write-Host "=== AHamson Portal Windows Setup ===" -ForegroundColor Cyan
Write-Host "Project: $Root"
Write-Host "Server URL: http://${ServerIp}:${Port}"

function Require-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is not installed or not in PATH. Install Node.js 20+ and Python 3.11+ first."
    }
}

Require-Command node
Require-Command npm
Require-Command python

Write-Host "`n[1/6] Python virtual environment..." -ForegroundColor Yellow
Push-Location $Backend
if (-not (Test-Path $VenvPython)) {
    python -m venv venv
}
& $VenvPip install --upgrade pip
& $VenvPip install -r requirements.txt
Pop-Location

Write-Host "`n[2/6] Backend .env..." -ForegroundColor Yellow
$BackendEnv = Join-Path $Backend ".env"
if (-not (Test-Path $BackendEnv)) {
    Copy-Item (Join-Path $PSScriptRoot "backend.env.production.example") $BackendEnv
}
$secret = -join ((48..57 + 65..90 + 97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
$backendContent = Get-Content $BackendEnv -Raw
$backendContent = $backendContent.Replace("YOUR_SERVER_IP", $ServerIp)
$backendContent = $backendContent.Replace("CHANGE_ME_USE_32_PLUS_RANDOM_CHARACTERS", $secret)
$backendContent = $backendContent.Replace("PORT=8080", "PORT=$Port")
Set-Content -Path $BackendEnv -Value $backendContent -NoNewline

Write-Host "`n[3/6] Frontend .env.production..." -ForegroundColor Yellow
$FrontendEnv = Join-Path $Root ".env.production"
Copy-Item (Join-Path $Root ".env.production.example") $FrontendEnv -Force
$frontendContent = Get-Content $FrontendEnv -Raw
$frontendContent = $frontendContent.Replace("YOUR_SERVER_IP", $ServerIp)
$frontendContent = $frontendContent.Replace(":8080", ":$Port")
Set-Content -Path $FrontendEnv -Value $frontendContent -NoNewline

Write-Host "`n[4/6] npm install + build..." -ForegroundColor Yellow
Push-Location $Root
npm install
npm run build
Pop-Location

Write-Host "`n[5/6] Windows Firewall rule (port $Port)..." -ForegroundColor Yellow
$ruleName = "AHamson Portal ($Port)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Firewall rule already exists."
} else {
    try {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
        Write-Host "Firewall rule created."
    } catch {
        Write-Warning "Could not create firewall rule (run as Administrator). Open port $Port manually in Windows Firewall."
    }
}

Write-Host "`n[6/6] Done!" -ForegroundColor Green
Write-Host @"

Next steps:
1. Edit backend\.env — set ADMIN_PASSWORD and SMTP settings
2. Start the app:  .\deploy\windows\start.ps1
3. Open browser:   http://${ServerIp}:${Port}/admin/login

Default admin email: admin@ahamson.com
(Password = whatever you set in backend\.env)

To run on boot: .\deploy\windows\install-task.ps1
"@
