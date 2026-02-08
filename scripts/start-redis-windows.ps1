# Start Redis via Docker Compose (Windows PowerShell helper)
param()

Write-Host "Checking for Docker..."
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  Write-Error "Docker is not installed or not in PATH. Please install Docker Desktop and try again."
  exit 1
}

Write-Host "Starting Redis container via docker compose..."
docker compose up -d redis
if ($LASTEXITCODE -ne 0) {
  Write-Error "docker compose up failed. Please inspect output above."
  exit $LASTEXITCODE
}

Write-Host "Redis container started. You can verify with: docker ps --filter 'name=redis'"
Write-Host "Next steps: copy .env.example to .env and fill MONGODB_URI, MONGODB_DB_NAME, REDIS_URL, ANTHROPIC_API_KEY as needed. Then run: npm install && npm run dev"