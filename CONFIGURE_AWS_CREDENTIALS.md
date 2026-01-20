# Step-by-Step: Configure AWS Credentials

Follow these steps to configure your AWS credentials. This is required before you can deploy your app.

## Step 1: Get Your AWS Access Keys

### Option A: If you already have an AWS account

1. **Open AWS Console**: Go to https://console.aws.amazon.com
2. **Search for IAM**: Type "IAM" in the top search bar and click on it
3. **Go to Users**: Click "Users" in the left sidebar
4. **Select Your User**: Click on your username (or the user you want to use)
5. **Security Credentials Tab**: Click the "Security credentials" tab
6. **Create Access Key**:
   - Scroll down to "Access keys" section
   - Click "Create access key"
   - Select "Command Line Interface (CLI)" as the use case
   - Check the confirmation box
   - Click "Next"
   - Optionally add a description tag
   - Click "Create access key"
7. **Save Your Keys**:
   - **Access Key ID**: Copy this (looks like: `AKIAIOSFODNN7EXAMPLE`)
   - **Secret Access Key**: Click "Show" and copy this (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
   - ⚠️ **IMPORTANT**: You can only see the secret key ONCE! Save it somewhere safe.
   - Click "Done"

### Option B: If you DON'T have an AWS account yet

1. **Create AWS Account**: Go to https://aws.amazon.com
2. **Sign Up**: Click "Create an AWS Account"
3. **Follow the Process**:
   - Enter your email and password
   - Provide payment information (don't worry, you'll get free tier)
   - Verify your phone number
   - Choose "Basic" support plan (free)
4. **Wait for Account Activation**: This can take a few minutes
5. **Then follow Option A above** to create access keys

## Step 2: Configure AWS CLI

Open PowerShell (or Command Prompt) and run:

```powershell
aws configure
```

You'll be asked 4 questions. Here's what to enter:

### Question 1: AWS Access Key ID
```
AWS Access Key ID [None]: 
```
**Answer**: Paste your Access Key ID (the one that starts with `AKIA...`)

### Question 2: AWS Secret Access Key
```
AWS Secret Access Key [None]: 
```
**Answer**: Paste your Secret Access Key (the long one)

### Question 3: Default region name
```
Default region name [None]: 
```
**Answer**: Enter `ap-southeast-2` (for Sydney, Australia)
- Or choose a region near you:
  - `us-east-1` (N. Virginia, USA)
  - `us-west-2` (Oregon, USA)
  - `eu-west-1` (Ireland)
  - `ap-southeast-2` (Sydney, Australia)

### Question 4: Default output format
```
Default output format [None]: 
```
**Answer**: Enter `json` (this is recommended)

## Step 3: Verify Your Configuration

After running `aws configure`, test it:

```powershell
aws sts get-caller-identity
```

You should see something like:
```json
{
    "UserId": "AIDAIOSFODNN7EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

If you see this, **you're all set!** ✅

## Step 4: Run the Verification Script

Now run the verification script:

```powershell
.\verify-aws-setup.ps1
```

This will check:
- ✅ AWS CLI is installed
- ✅ Credentials are configured
- ✅ Region is set
- ✅ You can access AWS services

## Troubleshooting

### "Unable to locate credentials"
- Make sure you ran `aws configure`
- Check that you copied the keys correctly (no extra spaces)
- Try running `aws configure` again

### "Access Denied"
- Your IAM user might not have permissions
- Go to IAM → Users → Your User → Permissions
- Attach the policy: `AdministratorAccess` (for learning/testing)
- Or attach specific policies: `AmazonS3FullAccess`, `AmazonRDSFullAccess`, `ElasticBeanstalkFullAccess`

### "Invalid credentials"
- Your keys might be wrong or deleted
- Go back to IAM and create new access keys
- Run `aws configure` again with the new keys

### AWS CLI not found after restarting terminal
- Run `.\fix-aws-path.ps1` as Administrator
- Or manually add `C:\Program Files\Amazon\AWSCLIV2` to your PATH

## Security Reminders

⚠️ **IMPORTANT**:
- Never share your AWS credentials
- Never commit them to Git
- Don't paste them in chat or email
- Rotate your keys regularly (every 90 days is good practice)

## What's Next?

Once your credentials are configured and verified:

1. ✅ You're ready to proceed with deployment!
2. 📖 Read `QUICK_START.md` for the next steps
3. 🚀 Start deploying your app!

---

**Need help?** If you get stuck, share the error message and I'll help you troubleshoot!
