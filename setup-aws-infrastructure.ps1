# AWS Infrastructure Setup Script (PowerShell)
# This script helps set up the initial AWS infrastructure for EFX LED Shop

Write-Host "🚀 AWS Infrastructure Setup for EFX LED Shop" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed." -ForegroundColor Red
    Write-Host "   Install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if AWS credentials are configured
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Host "❌ AWS credentials not configured." -ForegroundColor Red
    Write-Host "   Run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Get region
$REGION = Read-Host "Enter AWS region (default: ap-southeast-2)"
if ([string]::IsNullOrWhiteSpace($REGION)) {
    $REGION = "ap-southeast-2"
}
$env:AWS_DEFAULT_REGION = $REGION

Write-Host ""
Write-Host "Setting up infrastructure in region: $REGION" -ForegroundColor Cyan
Write-Host ""

# 1. Create S3 bucket for uploads
Write-Host "📦 Creating S3 bucket for uploads..." -ForegroundColor Yellow
$TIMESTAMP = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$BUCKET_NAME = "efx-led-shop-uploads-$TIMESTAMP"

try {
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION 2>&1 | Out-Null
    Write-Host "✅ S3 bucket created: $BUCKET_NAME" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Bucket might already exist or creation failed." -ForegroundColor Yellow
    $BUCKET_NAME = Read-Host "Enter existing bucket name"
}

# Apply bucket policy
Write-Host "Applying bucket policy..." -ForegroundColor Yellow
try {
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://s3-bucket-policy.json 2>&1 | Out-Null
} catch {
    Write-Host "⚠️  Warning: Could not apply bucket policy. You may need to do this manually." -ForegroundColor Yellow
}

# Apply CORS config
Write-Host "Applying CORS configuration..." -ForegroundColor Yellow
try {
    aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://s3-cors-config.json 2>&1 | Out-Null
} catch {
    Write-Host "⚠️  Warning: Could not apply CORS config. You may need to do this manually." -ForegroundColor Yellow
}

Write-Host "✅ S3 bucket configured: $BUCKET_NAME" -ForegroundColor Green
Write-Host ""

# 2. Create IAM user for application (optional)
Write-Host "🔐 Creating IAM user for application..." -ForegroundColor Yellow
$CREATE_IAM = Read-Host "Create IAM user for application? (y/n)"
if ($CREATE_IAM -eq "y") {
    $IAM_USER = "efx-led-shop-app"
    
    try {
        aws iam create-user --user-name $IAM_USER 2>&1 | Out-Null
    } catch {
        Write-Host "User already exists, continuing..." -ForegroundColor Yellow
    }
    
    # Create access key
    Write-Host "Creating access key..." -ForegroundColor Yellow
    $CREDENTIALS = aws iam create-access-key --user-name $IAM_USER --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text
    $CREDS_ARRAY = $CREDENTIALS -split "`t"
    $ACCESS_KEY = $CREDS_ARRAY[0]
    $SECRET_KEY = $CREDS_ARRAY[1]
    
    # Attach S3 policy
    $POLICY_ARN = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    try {
        aws iam attach-user-policy --user-name $IAM_USER --policy-arn $POLICY_ARN 2>&1 | Out-Null
    } catch {
        Write-Host "⚠️  Warning: Could not attach policy. You may need to do this manually." -ForegroundColor Yellow
    }
    
    Write-Host "✅ IAM user created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Save these credentials securely!" -ForegroundColor Red
    Write-Host "Access Key ID: $ACCESS_KEY" -ForegroundColor Yellow
    Write-Host "Secret Access Key: $SECRET_KEY" -ForegroundColor Yellow
    Write-Host ""
}

# 3. RDS Database setup instructions
Write-Host "🗄️  RDS Database Setup" -ForegroundColor Yellow
Write-Host "RDS setup must be done manually via AWS Console:"
Write-Host "1. Go to RDS Console"
Write-Host "2. Create PostgreSQL database"
Write-Host "3. Use db.t3.micro (free tier eligible)"
Write-Host "4. Set master username and password"
Write-Host "5. Note the endpoint and update security group"
Write-Host ""

# Summary
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "✅ Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:"
Write-Host "- S3 Bucket: $BUCKET_NAME"
if ($CREATE_IAM -eq "y") {
    Write-Host "- IAM User: $IAM_USER"
    Write-Host "- Access Key: $ACCESS_KEY"
}
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Set up RDS PostgreSQL database"
Write-Host "2. Update backend/.env with these values"
Write-Host "3. Deploy backend to Elastic Beanstalk"
Write-Host "4. Deploy frontend to Amplify"
Write-Host ""
Write-Host "See AWS_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Cyan
