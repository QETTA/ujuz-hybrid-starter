#Requires -Version 5.1
<#
.SYNOPSIS
  에뮬레이터 + Metro 상태 빠른 점검
.DESCRIPTION
  에뮬레이터, ADB, Metro, API 연결 상태를 한눈에 확인
.NOTES
  Usage: pwsh -File apps/mobile/scripts/emu-check.ps1
#>

Set-StrictMode -Version Latest

function Write-OK   { param([string]$msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "=== UJUz Mobile Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Android SDK
$androidSdk = $env:ANDROID_HOME
if (-not $androidSdk) { $androidSdk = $env:ANDROID_SDK_ROOT }
if (-not $androidSdk) { $androidSdk = "$env:LOCALAPPDATA\Android\Sdk" }
$adbPath = Join-Path $androidSdk "platform-tools\adb.exe"

# 1. ADB
if (Test-Path $adbPath) {
    Write-OK "ADB found: $adbPath"
} else {
    Write-Fail "ADB not found"
}

# 2. Emulator connection
try {
    $devices = & $adbPath devices 2>$null
    $emuDevice = $devices | Select-String "emulator-" | Select-String "device"
    if ($emuDevice) {
        Write-OK "Emulator connected"
        $model = & $adbPath shell getprop ro.product.model 2>$null
        Write-Host "       Model: $($model.Trim())" -ForegroundColor DarkGray
    } else {
        Write-Fail "No emulator connected"
    }
} catch {
    Write-Fail "ADB error: $_"
}

# 3. Metro server (port 8081)
try {
    $metro = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
    if ($metro) {
        Write-OK "Metro server running on :8081"
    } else {
        Write-Fail "Metro server not running on :8081"
    }
} catch {
    Write-Fail "Metro check failed"
}

# 4. API server (port 3000)
try {
    $api = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($api) {
        Write-OK "API server running on :3000"
    } else {
        Write-Fail "API server not running on :3000"
    }
} catch {
    Write-Fail "API check failed"
}

# 5. ADB reverse ports
try {
    $reverseList = & $adbPath reverse --list 2>$null
    if ($reverseList) {
        Write-OK "ADB reverse ports:"
        $reverseList | ForEach-Object { Write-Host "       $_" -ForegroundColor DarkGray }
    } else {
        Write-Fail "No ADB reverse ports configured"
    }
} catch {
    Write-Fail "ADB reverse check failed"
}

Write-Host ""
