#!/bin/bash

# AWS Deployment Script for EFX LED Shop
# This script helps automate the deployment process

set -e

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if EB CLI is installed (for backend deployment)
if ! command -v eb &> /dev/null; then
    echo "⚠️  EB CLI is not installed. Backend deployment will be skipped."
    echo "   Install with: pip install awsebcli"
fi

# Build backend
echo -e "${YELLOW}📦 Building backend...${NC}"
cd backend
npm install
npm run build
cd ..

# Build frontend
echo -e "${YELLOW}📦 Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy backend: cd backend && eb deploy"
echo "2. Deploy frontend: Upload frontend/dist to AWS Amplify or S3"
echo ""
echo "See AWS_DEPLOYMENT_GUIDE.md for detailed instructions."
