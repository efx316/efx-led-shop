# AWS Setup Guide for Beginners

This guide will help you set up AWS from scratch, step by step.

## Prerequisites

- A computer with Windows, Mac, or Linux
- An internet connection
- About 30 minutes of time

## Step 1: Create an AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account" (top right)
3. Follow the sign-up process:
   - Enter your email and choose a password
   - Provide payment information (you'll get a free tier)
   - Verify your phone number
   - Choose a support plan (Basic/Free is fine)

**Important**: AWS Free Tier includes:
- 750 hours/month of EC2 (for 12 months)
- 20GB of S3 storage
- 750 hours/month of RDS (for 12 months)
- And more!

## Step 2: Install AWS CLI

### Windows (PowerShell)

**Option 1: Using MSI Installer (Recommended)**
1. Download from: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Run the installer
3. Follow the installation wizard
4. Restart your terminal/PowerShell

**Option 2: Using winget**
```powershell
winget install Amazon.AWSCLI
```

**Option 3: Using Chocolatey**
```powershell
choco install awscli
```

### Verify Installation

Open PowerShell and run:
```powershell
aws --version
```

You should see something like: `aws-cli/2.x.x Python/3.x.x Windows/10`

## Step 3: Get Your AWS Access Keys

1. **Log into AWS Console**: Go to [console.aws.amazon.com](https://console.aws.amazon.com)
2. **Go to IAM**: Search for "IAM" in the top search bar
3. **Navigate to Users**:
   - Click "Users" in the left sidebar
   - Click on your username (or create a new user)
4. **Create Access Key**:
   - Click the "Security credentials" tab
   - Scroll to "Access keys"
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Click "Next" and then "Create access key"
5. **Save Your Keys**:
   - **Access Key ID**: Copy this (looks like: `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Access Key**: Copy this (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   - ⚠️ **IMPORTANT**: You can only see the secret key once! Save it securely.
   - Click "Done"

**Security Tip**: Never share these keys or commit them to Git!

## Step 4: Configure AWS CLI

Open PowerShell and run:

```powershell
aws configure
```

You'll be asked for 4 things:

1. **AWS Access Key ID**: Paste your Access Key ID
2. **AWS Secret Access Key**: Paste your Secret Access Key
3. **Default region name**: Enter `ap-southeast-2` (Sydney) or choose a region near you:
   - `us-east-1` (N. Virginia)
   - `us-west-2` (Oregon)
   - `eu-west-1` (Ireland)
   - `ap-southeast-2` (Sydney)
4. **Default output format**: Enter `json` (recommended)

Example:
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-southeast-2
Default output format [None]: json
```

## Step 5: Verify Your Setup

Run the verification script:

```powershell
.\verify-aws-setup.ps1
```

Or manually test:

```powershell
# Test your credentials
aws sts get-caller-identity

# List S3 buckets (should be empty for new account)
aws s3 ls
```

You should see:
- Your AWS account ID
- Your user ARN
- An empty list (or your existing buckets)

## Common Issues and Solutions

### Issue: "aws: command not found"
**Solution**: AWS CLI is not installed or not in PATH
- Reinstall AWS CLI
- Restart your terminal
- Check if it's in your PATH: `$env:PATH`

### Issue: "Unable to locate credentials"
**Solution**: Credentials not configured
- Run `aws configure` again
- Make sure you copied the keys correctly
- Check if credentials file exists: `~/.aws/credentials`

### Issue: "Access Denied"
**Solution**: Your IAM user doesn't have permissions
- Go to IAM → Users → Your User → Permissions
- Attach policies: `AmazonS3FullAccess`, `AmazonRDSFullAccess`, `ElasticBeanstalkFullAccess`
- Or attach `AdministratorAccess` for learning (not recommended for production)

### Issue: "Invalid credentials"
**Solution**: Wrong keys or keys were deleted
- Go back to IAM and create new access keys
- Run `aws configure` again with new keys

## What's Next?

Once your setup is verified:

1. ✅ Run `.\verify-aws-setup.ps1` to confirm everything works
2. 📖 Read `QUICK_START.md` for deployment steps
3. 🚀 Start deploying your app!

## Getting Help

- **AWS Documentation**: https://docs.aws.amazon.com/cli/
- **AWS Support**: Available in AWS Console
- **AWS Free Tier**: https://aws.amazon.com/free/

## Security Reminders

- ⚠️ Never commit AWS credentials to Git
- ⚠️ Use IAM roles when possible (instead of access keys)
- ⚠️ Rotate your access keys regularly
- ⚠️ Use the principle of least privilege (only grant necessary permissions)

---

**Ready to proceed?** Run `.\verify-aws-setup.ps1` and let's make sure everything is set up correctly!
