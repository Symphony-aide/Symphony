# Build script for native-shell-symphony extension
# Usage: .\build.ps1 [target]
#   target: native (default), wasm, all

param(
    [string]$Target = "native"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Native Shell Symphony - Build Script ===" -ForegroundColor Cyan
Write-Host ""

function Build-Native {
    Write-Host "Building for native target..." -ForegroundColor Green
    cargo build --package native-shell-symphony --release
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Native build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Native build failed!" -ForegroundColor Red
        exit 1
    }
}

function Build-Wasm {
    Write-Host "Checking WASM target..." -ForegroundColor Yellow
    $targets = rustup target list --installed
    if ($targets -notcontains "wasm32-unknown-unknown") {
        Write-Host "Installing wasm32-unknown-unknown target..." -ForegroundColor Yellow
        rustup target add wasm32-unknown-unknown
    }
    
    Write-Host "Building for WASM target..." -ForegroundColor Green
    Write-Host "⚠️  Note: WASM build will have limited functionality (no PTY support)" -ForegroundColor Yellow
    
    cargo build --package native-shell-symphony --target wasm32-unknown-unknown --release
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WASM build completed successfully!" -ForegroundColor Green
        Write-Host "⚠️  Remember: This extension requires OS features not available in WASM" -ForegroundColor Yellow
    } else {
        Write-Host "❌ WASM build failed!" -ForegroundColor Red
        exit 1
    }
}

switch ($Target.ToLower()) {
    "native" {
        Build-Native
    }
    "wasm" {
        Build-Wasm
    }
    "all" {
        Build-Native
        Write-Host ""
        Build-Wasm
    }
    default {
        Write-Host "❌ Unknown target: $Target" -ForegroundColor Red
        Write-Host "Valid targets: native, wasm, all" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
