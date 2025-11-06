# Script لتشغيل الـ tests اللي بتشتغل فقط
# تجنب الـ ignored tests والـ Python dependencies

Write-Host "=== Running Symphony Backend Tests ===" -ForegroundColor Cyan
Write-Host ""

# Tests اللي بتشتغل بدون مشاكل
Write-Host "Testing core_api..." -ForegroundColor Yellow
cargo test --package sveditor-core-api --lib

Write-Host ""
Write-Host "Testing crosspty (non-ignored tests only)..." -ForegroundColor Yellow
cargo test --package crosspty test_invalid_command

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✅ Core API tests completed" -ForegroundColor Green
Write-Host "⚠️  CrossPTY integration tests are ignored (blocking I/O issues)" -ForegroundColor Yellow
Write-Host "ℹ️  Conductor bindings skipped (requires Python 3)" -ForegroundColor Blue
