#!/bin/bash

# AWS Infrastructure Setup Script
# This script helps set up the initial AWS infrastructure for EFX LED Shop

set -e

echo "🚀 AWS Infrastructure Setup for EFX LED Shop"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed.${NC}"
    echo "   Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    echo "   Run: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo ""

# Get region (default to ap-southeast-2)
read -p "Enter AWS region (default: ap-southeast-2): " REGION
REGION=${REGION:-ap-southeast-2}
export AWS_DEFAULT_REGION=$REGION

echo ""
echo "Setting up infrastructure in region: $REGION"
echo ""

# 1. Create S3 bucket for uploads
echo -e "${YELLOW}📦 Creating S3 bucket for uploads...${NC}"
BUCKET_NAME="efx-led-shop-uploads-$(date +%s)"
aws s3 mb "s3://$BUCKET_NAME" --region "$REGION" || {
    echo -e "${RED}Failed to create bucket. It might already exist.${NC}"
    read -p "Enter existing bucket name: " BUCKET_NAME
}

# Apply bucket policy
echo "Applying bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://s3-bucket-policy.json || {
    echo -e "${YELLOW}Warning: Could not apply bucket policy. You may need to do this manually.${NC}"
}

# Apply CORS config
echo "Applying CORS configuration..."
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file://s3-cors-config.json || {
    echo -e "${YELLOW}Warning: Could not apply CORS config. You may need to do this manually.${NC}"
}

echo -e "${GREEN}✅ S3 bucket created: $BUCKET_NAME${NC}"
echo ""

# 2. Create IAM user for application (optional)
echo -e "${YELLOW}🔐 Creating IAM user for application...${NC}"
read -p "Create IAM user for application? (y/n): " CREATE_IAM
if [[ $CREATE_IAM == "y" ]]; then
    IAM_USER="efx-led-shop-app"
    aws iam create-user --user-name "$IAM_USER" 2>/dev/null || {
        echo "User already exists, continuing..."
    }
    
    # Create access key
    echo "Creating access key..."
    CREDENTIALS=$(aws iam create-access-key --user-name "$IAM_USER" --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
    ACCESS_KEY=$(echo $CREDENTIALS | awk '{print $1}')
    SECRET_KEY=$(echo $CREDENTIALS | awk '{print $2}')
    
    # Attach S3 policy
    POLICY_ARN="arn:aws:iam::aws:policy/AmazonS3FullAccess"
    aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$POLICY_ARN" || {
        echo -e "${YELLOW}Warning: Could not attach policy. You may need to do this manually.${NC}"
    }
    
    echo -e "${GREEN}✅ IAM user created${NC}"
    echo ""
    echo "⚠️  IMPORTANT: Save these credentials securely!"
    echo "Access Key ID: $ACCESS_KEY"
    echo "Secret Access Key: $SECRET_KEY"
    echo ""
fi

# 3. RDS Database setup instructions
echo -e "${YELLOW}🗄️  RDS Database Setup${NC}"
echo "RDS setup must be done manually via AWS Console:"
echo "1. Go to RDS Console"
echo "2. Create PostgreSQL database"
echo "3. Use db.t3.micro (free tier eligible)"
echo "4. Set master username and password"
echo "5. Note the endpoint and update security group"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}✅ Infrastructure Setup Complete!${NC}"
echo ""
echo "Summary:"
echo "- S3 Bucket: $BUCKET_NAME"
if [[ $CREATE_IAM == "y" ]]; then
    echo "- IAM User: $IAM_USER"
    echo "- Access Key: $ACCESS_KEY"
fi
echo ""
echo "Next steps:"
echo "1. Set up RDS PostgreSQL database"
echo "2. Update backend/.env with these values"
echo "3. Deploy backend to Elastic Beanstalk"
echo "4. Deploy frontend to Amplify"
echo ""
echo "See AWS_DEPLOYMENT_GUIDE.md for detailed instructions."
