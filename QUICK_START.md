# Quick Start AWS Deployment

This is a condensed guide for deploying to AWS. For detailed instructions, see `AWS_DEPLOYMENT_GUIDE.md`.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js and npm installed
- [ ] PostgreSQL client tools (optional, for database setup)

## Step-by-Step Deployment

### 1. Set Up Database (RDS)

```bash
# Option A: Via AWS Console (Recommended)
# 1. Go to RDS Console → Create database
# 2. Choose PostgreSQL
# 3. Select Free tier or db.t3.micro
# 4. Note down: endpoint, username, password, database name

# Option B: Via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier efx-led-shop-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

**After creation:**
- Note the endpoint (e.g., `efx-led-shop-db.xxxxx.ap-southeast-2.rds.amazonaws.com`)
- Update security group to allow inbound connections on port 5432 from your backend
- Run schema: `psql -h ENDPOINT -U postgres -d DATABASE -f database/schema.sql`

### 2. Set Up S3 Bucket

```bash
# Create bucket
aws s3 mb s3://efx-led-shop-uploads --region ap-southeast-2

# Apply bucket policy (make uploads publicly readable)
aws s3api put-bucket-policy --bucket efx-led-shop-uploads --policy file://s3-bucket-policy.json

# Apply CORS config
aws s3api put-bucket-cors --bucket efx-led-shop-uploads --cors-configuration file://s3-cors-config.json
```

### 3. Deploy Backend (Elastic Beanstalk)

```bash
cd backend

# Install EB CLI (if not installed)
pip install awsebcli

# Initialize EB
eb init -p "Node.js" -r ap-southeast-2 efx-led-shop-backend

# Create environment (replace values with your actual credentials)
eb create efx-led-shop-prod \
  --envvars \
    NODE_ENV=production,\
    PORT=8080,\
    DATABASE_URL=postgresql://user:pass@endpoint:5432/dbname,\
    JWT_SECRET=your-secret-key,\
    SQUARE_ACCESS_TOKEN=your-token,\
    SQUARE_LOCATION_ID=your-location-id,\
    SQUARE_ENVIRONMENT=production,\
    AWS_REGION=ap-southeast-2,\
    AWS_ACCESS_KEY_ID=your-key,\
    AWS_SECRET_ACCESS_KEY=your-secret,\
    S3_BUCKET_NAME=efx-led-shop-uploads,\
    STORAGE_PROVIDER=s3

# Build and deploy
npm run build
eb deploy
```

**Note your backend URL** (e.g., `http://efx-led-shop-prod.ap-southeast-2.elasticbeanstalk.com`)

### 4. Deploy Frontend (Amplify)

**Option A: Via Amplify Console (Recommended)**
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Build settings will auto-detect (or use provided `amplify.yml`)
5. Add environment variable: `VITE_API_URL` = your backend URL from step 3
6. Deploy

**Option B: Manual S3 + CloudFront**
```bash
cd frontend

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://efx-led-shop-frontend --delete

# Create CloudFront distribution via console
# Point it to your S3 bucket
```

### 5. Update Frontend API URL

If deploying manually, update `frontend/.env.production`:
```
VITE_API_URL=https://your-backend-url.elasticbeanstalk.com
```

Then rebuild: `npm run build`

## Environment Variables Summary

### Backend (Set in Elastic Beanstalk)
- `DATABASE_URL` - RDS PostgreSQL connection string
- `JWT_SECRET` - Random secret for JWT tokens
- `SQUARE_ACCESS_TOKEN` - Your Square API token
- `SQUARE_LOCATION_ID` - Your Square location ID
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `S3_BUCKET_NAME` - Your S3 bucket name

### Frontend (Set in Amplify)
- `VITE_API_URL` - Your backend URL

## Testing Deployment

1. **Backend Health Check**: Visit `http://your-backend-url.elasticbeanstalk.com/api/health` (if you have a health endpoint)
2. **Frontend**: Visit your Amplify URL or CloudFront distribution
3. **Test Login**: Try logging in with test credentials
4. **Test File Upload**: Upload a photo to test S3 integration

## Troubleshooting

- **Backend not starting**: Check `eb logs` for errors
- **Database connection failed**: Verify security group allows connections from EB
- **Frontend can't reach backend**: Check CORS settings and `VITE_API_URL`
- **S3 uploads failing**: Verify bucket policy and IAM permissions

## Next Steps

- Set up custom domain
- Configure SSL certificates
- Set up monitoring and alerts
- Configure CI/CD pipeline
