#Requires -Version 5.1
<#
.SYNOPSIS
  UJUz Mobile - Emulator + Expo LAN Dev Workflow
.DESCRIPTION
  1. Android SDK 환경 확인
  2. 에뮬레이터 시작 (부팅 대기)
  3. Expo Metro 서버 LAN 모드 시작
  4. ADB reverse port forwarding 설정
.NOTES
  Usage: pwsh -File apps/mobile/scripts/start-dev.ps1
  Run from monorepo root: C:\Users\sihu2\ujuz-hybrid-starter
#>

param(
    [string]$AvdName = "Medium_Phone_API_36.1",
    [int]$MetroPort = 8081,
    [int]$ApiPort = 3000,
    [int]$BootTimeoutSec = 120,
    [switch]$SkipEmulator,
    [switch]$SkipMetro
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Colors ───
function Write-Step  { param([string]$msg) Write-Host "[STEP] $msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$msg) Write-Host "[  OK] $msg" -ForegroundColor Green }
function Write-Warn  { param([string]$msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail  { param([string]$msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  UJUz Mobile Dev Workflow" -ForegroundColor Magenta
Write-Host "  Emulator + Expo LAN Mode" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# ─── 1. Android SDK 환경 확인 ───
Write-Step "Android SDK 환경 확인..."

$androidSdk = $env:ANDROID_HOME
if (-not $androidSdk) { $androidSdk = $env:ANDROID_SDK_ROOT }
if (-not $androidSdk) { $androidSdk = "$env:LOCALAPPDATA\Android\Sdk" }

if (-not (Test-Path $androidSdk)) {
    Write-Fail "Android SDK를 찾을 수 없습니다: $androidSdk"
    Write-Fail "Android Studio를 설치하거나 ANDROID_HOME 환경변수를 설정하세요."
    exit 1
}
Write-OK "Android SDK: $androidSdk"

$adbPath = Join-Path $androidSdk "platform-tools\adb.exe"
$emulatorPath = Join-Path $androidSdk "emulator\emulator.exe"

if (-not (Test-Path $adbPath)) {
    Write-Fail "ADB를 찾을 수 없습니다: $adbPath"
    exit 1
}
Write-OK "ADB: $adbPath"

if (-not (Test-Path $emulatorPath)) {
    Write-Fail "Emulator를 찾을 수 없습니다: $emulatorPath"
    exit 1
}
Write-OK "Emulator: $emulatorPath"

# ─── 2. AVD 목록 확인 ───
Write-Step "AVD 목록 확인..."
$avdList = & $emulatorPath -list-avds 2>$null
if (-not $avdList) {
    Write-Fail "사용 가능한 AVD가 없습니다. Android Studio에서 에뮬레이터를 생성하세요."
    exit 1
}

$avdNames = $avdList -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
Write-OK "사용 가능한 AVD:"
$avdNames | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkGray }

# AVD 이름 매칭 (exact or partial)
$targetAvd = $avdNames | Where-Object { $_ -eq $AvdName } | Select-Object -First 1
if (-not $targetAvd) {
    $targetAvd = $avdNames | Where-Object { $_ -like "*$AvdName*" } | Select-Object -First 1
}
if (-not $targetAvd) {
    $targetAvd = $avdNames | Select-Object -First 1
    Write-Warn "AVD '$AvdName'를 찾을 수 없어 첫 번째 AVD 사용: $targetAvd"
}
Write-OK "대상 AVD: $targetAvd"

# ─── 3. 에뮬레이터 시작 ───
if (-not $SkipEmulator) {
    Write-Step "에뮬레이터 상태 확인..."

    $devices = & $adbPath devices 2>$null
    $emulatorRunning = $devices | Select-String "emulator-" | Select-String "device"

    if ($emulatorRunning) {
        Write-OK "에뮬레이터 이미 실행 중"
    } else {
        Write-Step "에뮬레이터 시작: $targetAvd"
        Start-Process -FilePath $emulatorPath -ArgumentList "-avd", $targetAvd, "-no-snapshot-load", "-gpu", "auto" -WindowStyle Minimized

        # 부팅 대기
        Write-Step "에뮬레이터 부팅 대기 (최대 ${BootTimeoutSec}초)..."
        $elapsed = 0
        $booted = $false

        while ($elapsed -lt $BootTimeoutSec) {
            Start-Sleep -Seconds 3
            $elapsed += 3

            try {
                $bootAnim = & $adbPath shell getprop sys.boot_completed 2>$null
                if ($bootAnim -and $bootAnim.Trim() -eq "1") {
                    $booted = $true
                    break
                }
            } catch {
                # ADB not yet connected
            }

            $pct = [math]::Min(100, [math]::Round(($elapsed / $BootTimeoutSec) * 100))
            Write-Host "`r  부팅 중... ${elapsed}s / ${BootTimeoutSec}s (${pct}%)" -NoNewline -ForegroundColor DarkGray
        }
        Write-Host ""

        if (-not $booted) {
            Write-Fail "에뮬레이터 부팅 타임아웃 (${BootTimeoutSec}초)"
            Write-Warn "수동으로 에뮬레이터를 시작한 후 -SkipEmulator 플래그로 재시도하세요."
            exit 1
        }
        Write-OK "에뮬레이터 부팅 완료 (${elapsed}초)"
    }

    # ─── 4. ADB reverse port forwarding ───
    Write-Step "ADB 포트 포워딩 설정..."
    & $adbPath reverse tcp:$MetroPort tcp:$MetroPort 2>$null
    & $adbPath reverse tcp:$ApiPort tcp:$ApiPort 2>$null
    Write-OK "포트 포워딩: Metro(:$MetroPort), API(:$ApiPort)"
} else {
    Write-Warn "에뮬레이터 시작 건너뜀 (-SkipEmulator)"
}

# ─── 5. Expo Metro 서버 시작 ───
if (-not $SkipMetro) {
    Write-Step "Expo Metro 서버 시작 (LAN 모드)..."

    $mobileDir = Join-Path $PSScriptRoot ".."
    $monorepoRoot = Join-Path $PSScriptRoot "..\..\.."

    # .env 파일 확인
    $envFile = Join-Path $mobileDir ".env"
    if (-not (Test-Path $envFile)) {
        $envExample = Join-Path $mobileDir ".env.example"
        if (Test-Path $envExample) {
            Write-Warn ".env 파일이 없습니다. .env.example을 복사합니다."
            Copy-Item $envExample $envFile
        }
    }

    Write-Host ""
    Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  Metro 서버가 시작됩니다." -ForegroundColor Green
    Write-Host "  에뮬레이터에서 앱을 열면 자동 연결됩니다." -ForegroundColor Green
    Write-Host "  종료: Ctrl+C" -ForegroundColor Yellow
    Write-Host "────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host ""

    Set-Location $mobileDir
    npx expo start --lan --clear
} else {
    Write-Warn "Metro 서버 시작 건너뜀 (-SkipMetro)"
    Write-OK "워크플로우 완료. 수동으로 Metro를 시작하세요:"
    Write-Host "  cd apps/mobile && npx expo start --lan --clear" -ForegroundColor DarkGray
}
