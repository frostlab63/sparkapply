# SparkApply Quick Setup for Windows PowerShell
# Simple script that does the essential setup without complex testing

Write-Host "🚀 SparkApply Quick Setup Starting..." -ForegroundColor Green

# Step 1: Copy environment files
Write-Host "📁 Setting up environment files..." -ForegroundColor Cyan
Copy-Item "packages\api\user-service\.env.example" "packages\api\user-service\.env" -Force
Copy-Item "packages\api\job-service\.env.example" "packages\api\job-service\.env" -Force
Write-Host "✅ Environment files created" -ForegroundColor Green

# Step 2: Install user-service dependencies
Write-Host "📦 Installing user-service dependencies..." -ForegroundColor Cyan
Set-Location "packages\api\user-service"
npm install
Write-Host "✅ User-service dependencies installed" -ForegroundColor Green

# Step 3: Test user-service database connection
Write-Host "🔗 Testing user-service database..." -ForegroundColor Cyan
$testResult = node -e "require('dotenv').config(); const { Sequelize } = require('sequelize'); const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://sparkapply:sparkapply_dev_password@localhost:5432/sparkapply_dev'); sequelize.authenticate().then(() => console.log('SUCCESS')).catch(e => console.log('FAILED: ' + e.message));"

if ($testResult -eq "SUCCESS") {
    Write-Host "✅ User-service database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ User-service database connection failed: $testResult" -ForegroundColor Red
}

# Step 4: Install job-service dependencies
Write-Host "📦 Installing job-service dependencies..." -ForegroundColor Cyan
Set-Location "..\job-service"
npm install
Write-Host "✅ Job-service dependencies installed" -ForegroundColor Green

# Step 5: Test job-service database connection
Write-Host "🔗 Testing job-service database..." -ForegroundColor Cyan
$testResult2 = node -e "require('dotenv').config(); const { Sequelize } = require('sequelize'); const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://sparkapply:sparkapply_dev_password@localhost:5432/sparkapply_dev'); sequelize.authenticate().then(() => console.log('SUCCESS')).catch(e => console.log('FAILED: ' + e.message));"

if ($testResult2 -eq "SUCCESS") {
    Write-Host "✅ Job-service database connection successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Job-service database connection failed: $testResult2" -ForegroundColor Red
}

# Return to root
Set-Location "..\..\.."

Write-Host "`n🎉 QUICK SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

if ($testResult -eq "SUCCESS" -and $testResult2 -eq "SUCCESS") {
    Write-Host "✅ Both services are ready to run!" -ForegroundColor Green
    Write-Host "`nStart your services with:" -ForegroundColor Cyan
    Write-Host "User Service:  cd packages\api\user-service && npm run dev" -ForegroundColor Yellow
    Write-Host "Job Service:   cd packages\api\job-service && npm run dev" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Database connections failed. You need to set up PostgreSQL:" -ForegroundColor Yellow
    Write-Host "Option 1 - Docker: docker-compose -f docker-compose.dev.yml up -d postgres" -ForegroundColor Cyan
    Write-Host "Option 2 - Local PostgreSQL: Install from postgresql.org and create database" -ForegroundColor Cyan
}

Write-Host "`n🚀 Ready to build SparkApply!" -ForegroundColor Green
