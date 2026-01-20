# AWS Deployment Guide for EFX LED Shop

This guide will help you deploy your full-stack application to AWS.

## Architecture Overview

### Recommended AWS Services:
1. **Frontend**: AWS Amplify (or S3 + CloudFront)
2. **Backend**: AWS Elastic Beanstalk (or ECS/Fargate)
3. **Database**: AWS RDS PostgreSQL
4. **Storage**: AWS S3 (already configured)
5. **Domain/CDN**: CloudFront (optional, for better performance)

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured (`aws configure`)
3. Node.js and npm installed locally
4. PostgreSQL client tools (for database migration)

## Step 1: Set Up AWS RDS PostgreSQL Database

### 1.1 Create RDS Instance

```bash
# Using AWS Console:
# 1. Go to RDS Console
# 2. Click "Create database"
# 3. Choose PostgreSQL
# 4. Select "Free tier" (if eligible) or appropriate instance size
# 5. Set master username and password
# 6. Configure VPC and security groups (allow inbound on port 5432 from your backend)
# 7. Create database

# Or using AWS CLI:
aws rds create-db-instance \
  --db-instance-identifier efx-led-shop-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name efxledshop
```

### 1.2 Run Database Schema

Once your RDS instance is ready, connect and run the schema:

```bash
# Get connection endpoint from RDS console
export DB_ENDPOINT="your-rds-endpoint.region.rds.amazonaws.com"

# Run schema
psql -h $DB_ENDPOINT -U postgres -d efxledshop -f database/schema.sql
```

### 1.3 Get Database Connection String

Your `DATABASE_URL` will be:
```
postgresql://postgres:YOUR_PASSWORD@your-rds-endpoint.region.rds.amazonaws.com:5432/efxledshop
```

## Step 2: Configure AWS S3 Bucket

### 2.1 Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://efx-led-shop-uploads --region ap-southeast-2

# Enable public read access for uploaded files (or use CloudFront)
aws s3api put-bucket-policy --bucket efx-led-shop-uploads --policy file://s3-bucket-policy.json
```

### 2.2 Create S3 Bucket Policy

Create `s3-bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::efx-led-shop-uploads/*"
    }
  ]
}
```

### 2.3 Configure CORS (if needed)

Create `s3-cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply:
```bash
aws s3api put-bucket-cors --bucket efx-led-shop-uploads --cors-configuration file://s3-cors-config.json
```

## Step 3: Deploy Backend to AWS Elastic Beanstalk

### 3.1 Install EB CLI

```bash
pip install awsebcli
```

### 3.2 Initialize Elastic Beanstalk

```bash
cd backend
eb init -p "Node.js" -r ap-southeast-2 efx-led-shop-backend
```

### 3.3 Create Environment

```bash
eb create efx-led-shop-prod \
  --envvars \
    NODE_ENV=production,\
    PORT=8080,\
    DATABASE_URL=postgresql://...,\
    JWT_SECRET=your-jwt-secret,\
    SQUARE_ACCESS_TOKEN=your-square-token,\
    SQUARE_LOCATION_ID=your-location-id,\
    SQUARE_ENVIRONMENT=production,\
    AWS_REGION=ap-southeast-2,\
    AWS_ACCESS_KEY_ID=your-access-key,\
    AWS_SECRET_ACCESS_KEY=your-secret-key,\
    S3_BUCKET_NAME=efx-led-shop-uploads,\
    STORAGE_PROVIDER=s3
```

### 3.4 Deploy

```bash
npm run build
eb deploy
```

## Step 4: Deploy Frontend to AWS Amplify

### 4.1 Build Frontend

```bash
cd frontend
npm run build
```

### 4.2 Deploy via Amplify Console

1. Go to AWS Amplify Console
2. Click "New app" > "Host web app"
3. Connect your Git repository (GitHub, GitLab, etc.)
4. Configure build settings (use `amplify.yml` provided)
5. Set environment variables:
   - `VITE_API_URL`: Your backend URL (from Elastic Beanstalk)

### 4.3 Alternative: Deploy to S3 + CloudFront

```bash
# Build frontend
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://efx-led-shop-frontend --delete

# Create CloudFront distribution (via console or CLI)
# Point it to your S3 bucket
```

## Step 5: Environment Variables

### Backend (.env for Elastic Beanstalk)

Set these in Elastic Beanstalk environment configuration:

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://...
JWT_SECRET=your-secure-jwt-secret-key
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
SQUARE_ENVIRONMENT=production
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET_NAME=efx-led-shop-uploads
STORAGE_PROVIDER=s3
```

### Frontend (Amplify Environment Variables)

```
VITE_API_URL=https://your-backend.elasticbeanstalk.com
```

## Step 6: Security Best Practices

1. **IAM Roles**: Use IAM roles instead of access keys when possible (for EC2/EB)
2. **Secrets Manager**: Store sensitive values in AWS Secrets Manager
3. **Security Groups**: Restrict database access to backend only
4. **HTTPS**: Ensure all traffic uses HTTPS
5. **CORS**: Configure CORS properly on backend

## Step 7: Monitoring and Logging

- **CloudWatch**: Monitor application logs
- **RDS Monitoring**: Set up RDS performance insights
- **Application Load Balancer**: Monitor backend health

## Troubleshooting

### Backend Issues
- Check Elastic Beanstalk logs: `eb logs`
- Verify environment variables: `eb printenv`
- Check database connectivity

### Frontend Issues
- Check Amplify build logs
- Verify API_URL is correct
- Check browser console for CORS errors

### Database Issues
- Verify security group allows connections from backend
- Check RDS endpoint and credentials
- Test connection locally first

## Cost Estimation (Monthly)

- **RDS db.t3.micro**: ~$15/month
- **Elastic Beanstalk**: ~$0-20/month (depends on traffic)
- **S3 Storage**: ~$0.023/GB/month
- **S3 Requests**: ~$0.005 per 1,000 requests
- **Amplify**: Free tier available, then pay-as-you-go
- **Data Transfer**: First 100GB free, then ~$0.09/GB

**Estimated Total**: $20-50/month for low-medium traffic

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, CodePipeline)
2. Configure custom domain
3. Set up SSL certificates
4. Enable CloudFront CDN for better performance
5. Set up monitoring and alerts
