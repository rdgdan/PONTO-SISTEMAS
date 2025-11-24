<#
Copies the main source folders into `source/` for easy access without changing the original project layout.
Run from the repository root (PowerShell):
  .\scripts\make_source.ps1

This script will copy folders: `app`, `lib`, `context`, `components`, `public`, and key files if they exist.
#>
Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $root

$target = Join-Path $root 'source'
if (Test-Path $target) {
    Write-Host "Removing existing 'source' folder..."
    Remove-Item $target -Recurse -Force
}

New-Item -ItemType Directory -Path $target | Out-Null

$itemsToCopy = @('app','lib','context','components','public','package.json','package-lock.json','next.config.js','tsconfig.json','README.md')

foreach ($item in $itemsToCopy) {
    $src = Join-Path $root $item
    if (Test-Path $src) {
        Write-Host "Copying $item to source/"
        Copy-Item $src -Destination $target -Recurse -Force
    }
}

Write-Host "Source folder created at: $target"
Pop-Location
