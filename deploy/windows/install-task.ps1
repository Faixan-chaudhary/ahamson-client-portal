# Register a Windows Scheduled Task to start the portal on boot
# Run PowerShell as Administrator
# Usage: .\deploy\windows\install-task.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$StartScript = Join-Path $PSScriptRoot "start.ps1"
$TaskName = "AHamsonDocumentPortal"

if (-not (Test-Path $StartScript)) {
    throw "start.ps1 not found."
}

$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$StartScript`""
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force

Write-Host "Scheduled task '$TaskName' installed — app will start on boot." -ForegroundColor Green
Write-Host "Start now:  Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "Remove:     Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
