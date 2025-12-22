# Start Backend Server Script
# This script starts the FastAPI backend with the local BART model

Write-Host "🚀 Starting NL2SQL Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists, if not create it
if (-not (Test-Path ".env")) {
    Write-Host "⚙️  Creating .env file with default configuration..." -ForegroundColor Yellow
    @"
MODEL_MODE=local
DATABASE_URL=postgresql://postgres:password@localhost:5432/nl2sql_db
READ_ONLY_DB_USER=true
MAX_EXECUTION_MS=10000
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
}

Write-Host "📦 Installing dependencies (if needed)..." -ForegroundColor Cyan
pip install -q -r requirements.txt

Write-Host ""
Write-Host "🔥 Starting server on http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Documentation: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Note: First startup will download the BART model (~1.6GB)" -ForegroundColor Yellow
Write-Host "    This only happens once and may take 1-2 minutes." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
