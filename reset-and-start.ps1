# Complete Frontend Reset and Restart

Write-Host ""
Write-Host "🔄 Complete Frontend Reset" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running processes
Write-Host "1. Stopping any running npm processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Delete .next folder
Write-Host "2. Deleting .next cache folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "   ✅ .next folder deleted" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .next folder not found" -ForegroundColor Gray
}

# Step 3: Delete node_modules/.cache (if exists)
Write-Host "3. Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
    Write-Host "   ✅ Node modules cache cleared" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No cache folder found" -ForegroundColor Gray
}

# Step 4: Verify API config
Write-Host "4. Verifying API configuration..." -ForegroundColor Yellow
$apiConfig = Get-Content "lib\api-config.ts" | Select-String -Pattern "unpronouncing-kaylin"
if ($apiConfig) {
    Write-Host "   ✅ ngrok URL found in config" -ForegroundColor Green
} else {
    Write-Host "   ❌ ngrok URL NOT found in config!" -ForegroundColor Red
    Write-Host "   Please check lib\api-config.ts file" -ForegroundColor Red
    exit 1
}

# Step 5: Verify ngrok header
Write-Host "5. Verifying ngrok header..." -ForegroundColor Yellow
$ngrokHeader = Get-Content "lib\api-config.ts" | Select-String -Pattern "ngrok-skip-browser-warning"
if ($ngrokHeader) {
    Write-Host "   ✅ ngrok header found" -ForegroundColor Green
} else {
    Write-Host "   ❌ ngrok header NOT found!" -ForegroundColor Red
    Write-Host "   Please check lib\api-config.ts file" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting fresh development server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 What to expect:" -ForegroundColor Yellow
Write-Host "   - Server will compile (~20-30 seconds)" -ForegroundColor Gray
Write-Host "   - Open http://localhost:3000" -ForegroundColor Gray
Write-Host "   - Look for green 'Backend Connected' badge" -ForegroundColor Gray
Write-Host "   - Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the development server
npm run dev
