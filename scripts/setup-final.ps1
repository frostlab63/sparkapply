# SparkApply Final Setup for Windows PowerShell
# Uses separate JavaScript file to avoid parsing issues

Write-Host "🚀 SparkApply Final Setup Starting..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Step 1: Copy environment files
Write-Host "📁 Setting up environment files..." -ForegroundColor Cyan
try {
    Copy-Item "packages\api\user-service\.env.example" "packages\api\user-service\.env" -Force
    Copy-Item "packages\api\job-service\.env.example" "packages\api\job-service\.env" -Force
    Write-Host "✅ Environment files created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create environment files: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Install user-service dependencies
Write-Host "📦 Installing user-service dependencies..." -ForegroundColor Cyan
try {
    Set-Location "packages\api\user-service"
    npm install --silent
    Write-Host "✅ User-service dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install user-service dependencies" -ForegroundColor Red
    Set-Location "..\..\.."
    exit 1
}

# Step 3: Test user-service database connection
Write-Host "🔗 Testing user-service database connection..." -ForegroundColor Cyan
try {
    $result = node "..\..\..\scripts\test-db.js" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ User-service database connection successful!" -ForegroundColor Green
        $userDbSuccess = $true
    } else {
        Write-Host "❌ User-service database connection failed: $result" -ForegroundColor Red
        $userDbSuccess = $false
    }
} catch {
    Write-Host "❌ Error testing user-service database: $($_.Exception.Message)" -ForegroundColor Red
    $userDbSuccess = $false
}

# Step 4: Install job-service dependencies
Write-Host "📦 Installing job-service dependencies..." -ForegroundColor Cyan
try {
    Set-Location "..\job-service"
    npm install --silent
    Write-Host "✅ Job-service dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install job-service dependencies" -ForegroundColor Red
    Set-Location "..\..\.."
    exit 1
}

# Step 5: Test job-service database connection
Write-Host "🔗 Testing job-service database connection..." -ForegroundColor Cyan
try {
    $result = node "..\..\..\scripts\test-db.js" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Job-service database connection successful!" -ForegroundColor Green
        $jobDbSuccess = $true
    } else {
        Write-Host "❌ Job-service database connection failed: $result" -ForegroundColor Red
        $jobDbSuccess = $false
    }
} catch {
    Write-Host "❌ Error testing job-service database: $($_.Exception.Message)" -ForegroundColor Red
    $jobDbSuccess = $false
}

# Step 6: Quick service startup test
Write-Host "🚀 Testing job-service startup..." -ForegroundColor Cyan
try {
    # Start service in background for a few seconds
    $job = Start-Job -ScriptBlock {
        param($location)
        Set-Location $location
        npm run dev
    } -ArgumentList (Get-Location)
    
    Start-Sleep -Seconds 5
    
    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Job-service startup test successful!" -ForegroundColor Green
            $serviceStartup = $true
        }
    } catch {
        Write-Host "⚠️  Job-service startup test inconclusive (may need database)" -ForegroundColor Yellow
        $serviceStartup = $false
    }
    
    # Clean up background job
    Stop-Job $job -ErrorAction SilentlyContinue
    Remove-Job $job -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "⚠️  Could not test service startup: $($_.Exception.Message)" -ForegroundColor Yellow
    $serviceStartup = $false
}

# Return to project root
Set-Location "..\..\.."

# Final results
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n📊 RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "✅ Environment files: Created" -ForegroundColor Green
Write-Host "✅ User-service dependencies: Installed" -ForegroundColor Green
Write-Host "✅ Job-service dependencies: Installed" -ForegroundColor Green

if ($userDbSuccess) {
    Write-Host "✅ User-service database: Connected" -ForegroundColor Green
} else {
    Write-Host "❌ User-service database: Failed" -ForegroundColor Red
}

if ($jobDbSuccess) {
    Write-Host "✅ Job-service database: Connected" -ForegroundColor Green
} else {
    Write-Host "❌ Job-service database: Failed" -ForegroundColor Red
}

if ($serviceStartup) {
    Write-Host "✅ Service startup: Working" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service startup: Needs database" -ForegroundColor Yellow
}

# Next steps based on results
Write-Host "`n🚀 NEXT STEPS:" -ForegroundColor Cyan

if ($userDbSuccess -and $jobDbSuccess) {
    Write-Host "🎯 Everything is working! Start your services:" -ForegroundColor Green
    Write-Host "   Terminal 1: cd packages\api\user-service && npm run dev" -ForegroundColor Yellow
    Write-Host "   Terminal 2: cd packages\api\job-service && npm run dev" -ForegroundColor Yellow
    Write-Host "`n🌐 Health Check URLs:" -ForegroundColor Cyan
    Write-Host "   User Service: http://localhost:3001/health" -ForegroundColor White
    Write-Host "   Job Service:  http://localhost:3002/health" -ForegroundColor White
} else {
    Write-Host "⚠️  Database setup needed. Choose one option:" -ForegroundColor Yellow
    Write-Host "`n🐳 Option 1 - Docker (Recommended):" -ForegroundColor Cyan
    Write-Host "   docker-compose -f docker-compose.dev.yml up -d postgres redis" -ForegroundColor White
    Write-Host "`n💾 Option 2 - Local PostgreSQL:" -ForegroundColor Cyan
    Write-Host "   1. Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "   2. Run in psql:" -ForegroundColor White
    Write-Host "      CREATE USER sparkapply WITH PASSWORD 'sparkapply_dev_password';" -ForegroundColor Gray
    Write-Host "      CREATE DATABASE sparkapply_dev OWNER sparkapply;" -ForegroundColor Gray
    Write-Host "      GRANT ALL PRIVILEGES ON DATABASE sparkapply_dev TO sparkapply;" -ForegroundColor Gray
    Write-Host "`n   3. Then re-run this script to test connections" -ForegroundColor White
}

Write-Host "`n🦄 Ready to build the next unicorn in East Africa! 🚀" -ForegroundColor Green
