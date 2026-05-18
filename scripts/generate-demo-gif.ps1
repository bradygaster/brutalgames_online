[CmdletBinding()]
param(
    [string]$SpecPath = 'tests/demo-recording.spec.js',
    [string]$TestResultsDir = 'test-results',
    [string]$OutputPath = 'docs/demo.gif',
    [string]$InputVideo,
    [int]$Width = 1280,
    [int]$FramesPerSecond = 12,
    [int]$MaxColors = 96,
    [string]$SiteUrl = 'http://127.0.0.1:4173',
    [switch]$SkipRecording
)

<#
BrutalGames demo GIF generator

Requirements:
- PowerShell 7+
- ffmpeg available on PATH
- Nikon's Playwright spec at tests/demo-recording.spec.js

Windows:
  pwsh -File .\scripts\generate-demo-gif.ps1

macOS / Linux:
  pwsh -File ./scripts/generate-demo-gif.ps1

Defaults:
- Recording spec: tests/demo-recording.spec.js
- GIF output: docs/demo.gif
- Resolution: 1280px wide
- Quality target: 12 FPS, 96 colors, palette-based conversion for smaller file size
#>

$ErrorActionPreference = 'Stop'

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found on PATH."
    }
}

function Resolve-ProjectPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Get-LatestRecording {
    param([Parameter(Mandatory = $true)][string]$Directory)

    if (-not (Test-Path $Directory)) {
        return $null
    }

    return Get-ChildItem -Path $Directory -Recurse -File |
        Where-Object { $_.Extension -in '.webm', '.mp4', '.mov' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

Require-Command -Name 'ffmpeg'

if (-not $SkipRecording) {
    Require-Command -Name 'npx'

    $env:DEMO_RECORDING_URL = $SiteUrl
    Write-Host "Running Playwright demo recording against $SiteUrl..." -ForegroundColor Cyan
    & npx playwright test $SpecPath --reporter=line

    if ($LASTEXITCODE -ne 0) {
        throw "Playwright demo recording failed. Fix the test before generating the GIF."
    }
}

if (-not $InputVideo) {
    $latestRecording = Get-LatestRecording -Directory (Resolve-ProjectPath -Path $TestResultsDir)
    if ($latestRecording) {
        $InputVideo = $latestRecording.FullName
    }
}

if (-not $InputVideo) {
    throw "No recording found. Expected a Playwright video under '$TestResultsDir' or pass -InputVideo explicitly."
}

$resolvedInput = Resolve-ProjectPath -Path $InputVideo
if (-not (Test-Path $resolvedInput)) {
    throw "Input video '$resolvedInput' does not exist."
}

$resolvedOutput = Resolve-ProjectPath -Path $OutputPath
$outputDirectory = Split-Path -Parent $resolvedOutput
if (-not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

$palettePath = Join-Path $outputDirectory 'demo-palette.png'
$baseFilter = "fps=$FramesPerSecond,scale=$Width:-1:flags=lanczos"
$paletteFilter = "$baseFilter,palettegen=max_colors=$MaxColors:stats_mode=diff"
$gifFilter = "$baseFilter[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle"

Write-Host "Converting '$resolvedInput' to '$resolvedOutput'..." -ForegroundColor Cyan
& ffmpeg -y -i $resolvedInput -vf $paletteFilter $palettePath | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to generate GIF palette with ffmpeg.'
}

& ffmpeg -y -i $resolvedInput -i $palettePath -lavfi $gifFilter $resolvedOutput | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Failed to generate GIF with ffmpeg.'
}

if (Test-Path $palettePath) {
    Remove-Item $palettePath -Force
}

$fileInfo = Get-Item $resolvedOutput
$sizeMb = [Math]::Round($fileInfo.Length / 1MB, 2)

Write-Host "Demo GIF ready: $resolvedOutput ($sizeMb MB)" -ForegroundColor Green
Write-Host "Quality settings -> width: $Width px, fps: $FramesPerSecond, colors: $MaxColors" -ForegroundColor DarkGreen
