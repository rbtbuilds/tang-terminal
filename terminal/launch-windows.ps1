param([int]$Port = 8787)
$ErrorActionPreference = "Stop"
$Project = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://127.0.0.1:$Port"
$EnvFile = Join-Path $Project ".tang-terminal.env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
      [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
    }
  }
}

try { Invoke-WebRequest -UseBasicParsing "$Url/index.html" -TimeoutSec 1 | Out-Null }
catch {
  $Python = Get-Command python -ErrorAction SilentlyContinue
  if (-not $Python) { $Python = Get-Command py -ErrorAction SilentlyContinue }
  if (-not $Python) { throw "Python 3 is required. Install it from python.org, then try again." }
  Start-Process -WindowStyle Hidden -FilePath $Python.Source -ArgumentList @("$Project\local-server.py", "--port", "$Port")
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 150
    try { Invoke-WebRequest -UseBasicParsing "$Url/index.html" -TimeoutSec 1 | Out-Null; break } catch { }
  }
}
Start-Process $Url
