# AWS Setup Verification Script
# This script helps verify your AWS CLI installation and configuration

Write-Host "🔍 AWS Setup Verification" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if AWS CLI is installed
Write-Host "Step 1: Checking AWS CLI installation..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI is installed!" -ForegroundColor Green
    Write-Host "   Version: $awsVersion" -ForegroundColor Gray
} catch {
    Write-Host "❌ AWS CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install AWS CLI:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://aws.amazon.com/cli/" -ForegroundColor White
    Write-Host "2. Or use: winget install Amazon.AWSCLI" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

# Step 2: Check if AWS credentials are configured
Write-Host "Step 2: Checking AWS credentials configuration..." -ForegroundColor Yellow
try {
    $callerIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS credentials are configured!" -ForegroundColor Green
        $identity = $callerIdentity | ConvertFrom-Json
        Write-Host "   Account ID: $($identity.Account)" -ForegroundColor Gray
        Write-Host "   User ARN: $($identity.Arn)" -ForegroundColor Gray
        Write-Host "   User ID: $($identity.UserId)" -ForegroundColor Gray
    } else {
        throw "Credentials not configured"
    }
} catch {
    Write-Host "❌ AWS credentials are not configured" -ForegroundColor Red
    Write-Host ""
    Write-Host "To configure AWS credentials:" -ForegroundColor Yellow
    Write-Host "1. You need an AWS account (sign up at aws.amazon.com if you don't have one)" -ForegroundColor White
    Write-Host "2. Get your Access Key ID and Secret Access Key:" -ForegroundColor White
    Write-Host "   - Go to AWS Console → IAM → Users → Your User → Security Credentials" -ForegroundColor White
    Write-Host "   - Click 'Create access key'" -ForegroundColor White
    Write-Host "   - Save both keys securely!" -ForegroundColor White
    Write-Host "3. Run: aws configure" -ForegroundColor White
    Write-Host "   - Enter your Access Key ID" -ForegroundColor White
    Write-Host "   - Enter your Secret Access Key" -ForegroundColor White
    Write-Host "   - Enter region (e.g., ap-southeast-2 for Sydney)" -ForegroundColor White
    Write-Host "   - Enter output format (json is recommended)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Keep your credentials secure and never share them!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""

# Step 3: Check configured region
Write-Host "Step 3: Checking configured region..." -ForegroundColor Yellow
try {
    $region = aws configure get region
    if ($region) {
        Write-Host "✅ Region configured: $region" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No default region configured" -ForegroundColor Yellow
        Write-Host "   You can set it with: aws configure set region ap-southeast-2" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not check region" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test AWS access
Write-Host "Step 4: Testing AWS access..." -ForegroundColor Yellow
try {
    $s3Buckets = aws s3 ls 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS access is working!" -ForegroundColor Green
        if ($s3Buckets) {
            Write-Host "   Found S3 buckets:" -ForegroundColor Gray
            $s3Buckets | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
        } else {
            Write-Host "   No S3 buckets found (this is normal for a new account)" -ForegroundColor Gray
        }
    } else {
        throw "Access test failed"
    }
} catch {
    Write-Host "⚠️  Could not test AWS access" -ForegroundColor Yellow
    Write-Host "   This might be normal if you don't have S3 permissions yet" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ AWS Setup Verification Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If everything shows OK, you're ready to proceed with deployment!" -ForegroundColor White
Write-Host "2. If you see errors, follow the instructions above to fix the issues" -ForegroundColor White
Write-Host "3. Once fixed, run this script again to verify" -ForegroundColor White
Write-Host ""
