# Deployment Overview

This document provides an overview of the deployment files and their purposes.

## Files Created for AWS Deployment

### Documentation
- **`AWS_DEPLOYMENT_GUIDE.md`** - Comprehensive guide covering all aspects of AWS deployment
- **`QUICK_START.md`** - Condensed step-by-step deployment instructions
- **`README_DEPLOYMENT.md`** - This file, overview of deployment setup

### Configuration Files

#### Backend
- **`backend/Dockerfile`** - Docker container configuration for backend (useful for ECS/Fargate deployment)
- **`backend/.dockerignore`** - Files to exclude from Docker build
- **`backend/.ebextensions/01-environment.config`** - Elastic Beanstalk environment configuration
- **`backend/.ebextensions/02-nginx.config`** - Nginx configuration for file uploads (20MB limit)
- **`backend/.ebignore`** - Files to exclude from Elastic Beanstalk deployment

#### Frontend
- **`amplify.yml`** - AWS Amplify build configuration

#### AWS Infrastructure
- **`s3-bucket-policy.json`** - S3 bucket policy for public read access
- **`s3-cors-config.json`** - CORS configuration for S3 bucket

### Scripts
- **`deploy.sh`** - Build script for Unix/Linux/Mac
- **`deploy.ps1`** - Build script for Windows PowerShell
- **`setup-aws-infrastructure.sh`** - Automated AWS infrastructure setup (Unix/Linux/Mac)
- **`setup-aws-infrastructure.ps1`** - Automated AWS infrastructure setup (Windows)

## Quick Reference

### Environment Variables Needed

#### Backend (Elastic Beanstalk)
```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
SQUARE_ACCESS_TOKEN=your-token
SQUARE_LOCATION_ID=your-location-id
SQUARE_ENVIRONMENT=production
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=efx-led-shop-uploads
STORAGE_PROVIDER=s3
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (Amplify)
```
VITE_API_URL=https://your-backend.elasticbeanstalk.com
```

## Deployment Steps Summary

1. **Set up AWS Infrastructure**
   - Run `setup-aws-infrastructure.ps1` (Windows) or `setup-aws-infrastructure.sh` (Unix)
   - Or manually create RDS, S3 bucket via AWS Console

2. **Deploy Backend**
   ```bash
   cd backend
   npm install
   npm run build
   eb init
   eb create
   eb deploy
   ```

3. **Deploy Frontend**
   - Via Amplify Console (connect Git repo)
   - Or manually: build and upload to S3

4. **Configure Environment Variables**
   - Set backend vars in Elastic Beanstalk
   - Set frontend vars in Amplify

5. **Test Deployment**
   - Check backend health: `/api/health`
   - Test frontend connection
   - Verify file uploads work

## Architecture

```
┌─────────────────┐
│   AWS Amplify   │  Frontend (React)
│   or S3+CF      │
└────────┬────────┘
         │ HTTPS
         │
┌────────▼────────┐
│ Elastic Beanstalk│  Backend (Node.js/Express)
│   or ECS/Fargate │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│  RDS  │ │  S3   │
│  PG   │ │Bucket │
└───────┘ └───────┘
```

## Support

For detailed instructions, see:
- **`AWS_DEPLOYMENT_GUIDE.md`** - Full deployment guide
- **`QUICK_START.md`** - Quick reference guide

For issues:
- Check AWS CloudWatch logs
- Review Elastic Beanstalk logs: `eb logs`
- Verify environment variables: `eb printenv`
