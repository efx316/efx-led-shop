# AWS Deployment Script for EFX LED Shop (PowerShell)
# This script helps automate the deployment process

Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check if EB CLI is installed (for backend deployment)
try {
    eb --version | Out-Null
    Write-Host "✅ EB CLI found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  EB CLI is not installed. Backend deployment will be skipped." -ForegroundColor Yellow
    Write-Host "   Install with: pip install awsebcli" -ForegroundColor Yellow
}

# Build backend
Write-Host "`n📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm install
npm run build
Set-Location ..

# Build frontend
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
Set-Location ..

Write-Host "`n✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy backend: cd backend && eb deploy"
Write-Host "2. Deploy frontend: Upload frontend/dist to AWS Amplify or S3"
Write-Host ""
Write-Host "See AWS_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Cyan
