# Fix AWS CLI PATH - Run this as Administrator
# This script adds AWS CLI to your system PATH permanently

Write-Host "Adding AWS CLI to PATH..." -ForegroundColor Yellow

$awsPath = "C:\Program Files\Amazon\AWSCLIV2"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($currentPath -notlike "*$awsPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$awsPath", "User")
    Write-Host "✅ AWS CLI added to PATH!" -ForegroundColor Green
    Write-Host "Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host "✅ AWS CLI is already in PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "To verify, restart PowerShell and run: aws --version" -ForegroundColor Cyan
