# GitHub & Railway Setup Guide

## Step 1: Create GitHub Repository

1. **Go to GitHub**: Open [github.com](https://github.com) in your browser
2. **Sign in**: Use your GitHub account (the one you're using with Railway)
3. **Create New Repository**:
   - Click the "+" icon in the top right corner
   - Select "New repository"
   - Repository name: `efx-led-shop` (or any name you prefer)
   - Description: "Custom LED strip ordering app for electrical contractors"
   - Choose **Public** or **Private** (your choice)
   - **DO NOT** check "Initialize with README" (we already have files)
   - Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you commands. Use these commands in PowerShell:

```powershell
# Navigate to your project directory (if not already there)
cd c:\Users\jett\OneDrive\Desktop\replitsite\efx2026

# Add the GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/efx-led-shop.git

# Rename branch to main (if needed)
git branch -M main

# Push your code
git push -u origin main
```

**Note**: You'll be prompted for your GitHub username and password/token. If you have 2FA enabled, you'll need to use a Personal Access Token instead of your password.

## Step 3: Connect to Railway

1. **Go to Railway**: Open [railway.app](https://railway.app)
2. **Sign in with GitHub**: Click "Login" and authorize Railway to access your GitHub account
3. **Create New Project**: 
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Find and select your `efx-led-shop` repository
   - Click "Deploy Now"

## Step 4: Configure Railway Services

Railway will auto-detect your project structure. You'll need to set up:

1. **Backend Service**:
   - Railway should detect your `backend` folder
   - Set root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

2. **Frontend Service** (separate service):
   - Add a new service
   - Connect to same repo
   - Set root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run preview` (or configure static hosting)

3. **PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will create a database and provide connection string

## Step 5: Set Environment Variables in Railway

### Backend Environment Variables:
- `NODE_ENV=production`
- `PORT=8080` (or Railway's assigned port)
- `DATABASE_URL` (Railway will provide this automatically)
- `JWT_SECRET` (generate a random secret)
- `SQUARE_ACCESS_TOKEN` (your Square API token)
- `SQUARE_LOCATION_ID` (your Square location ID)
- `SQUARE_ENVIRONMENT=production`
- `AWS_REGION` (if still using S3)
- `AWS_ACCESS_KEY_ID` (if still using S3)
- `AWS_SECRET_ACCESS_KEY` (if still using S3)
- `S3_BUCKET_NAME` (if still using S3)
- `STORAGE_PROVIDER=s3` (or switch to local/railway storage)

### Frontend Environment Variables:
- `VITE_API_URL` (your backend service URL from Railway)

## Step 6: Update Frontend API URL

After Railway deploys your backend, copy the backend URL and set it as `VITE_API_URL` in your frontend service environment variables.

## Troubleshooting

- **Build fails**: Check Railway logs for errors
- **Database connection fails**: Verify `DATABASE_URL` is set correctly
- **Frontend can't reach backend**: Check CORS settings and `VITE_API_URL`
- **Port issues**: Railway assigns ports automatically, use `PORT` env var or `process.env.PORT`

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL (automatic with Railway)
3. Set up monitoring
4. Configure CI/CD (automatic with GitHub integration)
