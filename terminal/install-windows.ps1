$ErrorActionPreference = "Stop"
$Project = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "TANG Terminal.lnk"
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$Project\launch-windows.ps1`""
$Shortcut.WorkingDirectory = $Project
$Shortcut.Description = "Open TANG Global Market Terminal"
$Shortcut.Save()
Write-Host "Installed desktop shortcut: $ShortcutPath"
Read-Host "Press Enter to finish"
