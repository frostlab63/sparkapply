# SparkApply Automated Setup Script for Windows PowerShell
# This script automatically sets up the entire development environment

Write-Host "🚀 Starting SparkApply Automated Setup..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Function to write colored output
function Write-Status {
    param($Message, $Status = "Info")
    switch ($Status) {
        "Success" { Write-Host "✅ $Message" -ForegroundColor Green }
        "Error" { Write-Host "❌ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "⚠️  $Message" -ForegroundColor Yellow }
        "Info" { Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
    }
}

# Step 1: Pull latest changes
Write-Status "Pulling latest changes from GitHub..." "Info"
try {
    git pull origin master
    Write-Status "Successfully pulled latest changes" "Success"
} catch {
    Write-Status "Failed to pull changes: $($_.Exception.Message)" "Error"
    exit 1
}

# Step 2: Copy environment files
Write-Status "Setting up environment files..." "Info"
try {
    Copy-Item "packages\api\user-service\.env.example" "packages\api\user-service\.env" -Force
    Copy-Item "packages\api\job-service\.env.example" "packages\api\job-service\.env" -Force
    Write-Status "Environment files created successfully" "Success"
} catch {
    Write-Status "Failed to copy environment files: $($_.Exception.Message)" "Error"
    exit 1
}

# Step 3: Check if Docker is available and start database
Write-Status "Checking Docker availability..." "Info"
$dockerAvailable = $false
try {
    docker --version | Out-Null
    $dockerAvailable = $true
    Write-Status "Docker is available" "Success"
    
    Write-Status "Starting PostgreSQL and Redis containers..." "Info"
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    
    # Wait for containers to be ready
    Write-Status "Waiting for database to be ready..." "Info"
    Start-Sleep -Seconds 10
    
    Write-Status "Database containers started successfully" "Success"
} catch {
    Write-Status "Docker not available, will use local PostgreSQL" "Warning"
}

# Step 4: Install dependencies for user-service
Write-Status "Installing user-service dependencies..." "Info"
try {
    Set-Location "packages\api\user-service"
    npm install
    Write-Status "User-service dependencies installed" "Success"
} catch {
    Write-Status "Failed to install user-service dependencies: $($_.Exception.Message)" "Error"
    Set-Location "..\..\..\"
    exit 1
}

# Step 5: Test user-service database connection
Write-Status "Testing user-service database connection..." "Info"
try {
    $testResult = node -e "
    require('dotenv').config();
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    sequelize.authenticate()
      .then(() => {
        console.log('SUCCESS');
        process.exit(0);
      })
      .catch(e => {
        console.log('FAILED: ' + e.message);
        process.exit(1);
      });
    "
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "User-service database connection successful!" "Success"
    } else {
        Write-Status "User-service database connection failed" "Error"
    }
} catch {
    Write-Status "Error testing user-service connection: $($_.Exception.Message)" "Error"
}

# Step 6: Install dependencies for job-service
Write-Status "Installing job-service dependencies..." "Info"
try {
    Set-Location "..\job-service"
    npm install
    Write-Status "Job-service dependencies installed" "Success"
} catch {
    Write-Status "Failed to install job-service dependencies: $($_.Exception.Message)" "Error"
    Set-Location "..\..\.."
    exit 1
}

# Step 7: Test job-service database connection
Write-Status "Testing job-service database connection..." "Info"
try {
    $testResult = node -e "
    require('dotenv').config();
    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(
      process.env.POSTGRES_DB,
      process.env.POSTGRES_USER,
      process.env.POSTGRES_PASSWORD,
      {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    sequelize.authenticate()
      .then(() => {
        console.log('SUCCESS');
        process.exit(0);
      })
      .catch(e => {
        console.log('FAILED: ' + e.message);
        process.exit(1);
      });
    "
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Job-service database connection successful!" "Success"
    } else {
        Write-Status "Job-service database connection failed" "Error"
    }
} catch {
    Write-Status "Error testing job-service connection: $($_.Exception.Message)" "Error"
}

# Step 8: Test starting job-service
Write-Status "Testing job-service startup..." "Info"
try {
    # Start the service in background and test if it responds
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm run dev
    }
    
    # Wait a bit for service to start
    Start-Sleep -Seconds 5
    
    # Test if service is responding
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Status "Job-service started successfully and responding on port 3002!" "Success"
        }
    } catch {
        Write-Status "Job-service may have started but not responding yet" "Warning"
    }
    
    # Stop the background job
    Stop-Job $job
    Remove-Job $job
    
} catch {
    Write-Status "Error testing job-service startup: $($_.Exception.Message)" "Warning"
}

# Step 9: Return to project root
Set-Location "..\..\.."

# Final summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Status "Setup Summary:" "Info"
Write-Host "✅ Latest code pulled from GitHub" -ForegroundColor Green
Write-Host "✅ Environment files configured" -ForegroundColor Green
Write-Host "✅ Dependencies installed for both services" -ForegroundColor Green
Write-Host "✅ Database connections tested" -ForegroundColor Green

Write-Host "`n🚀 Ready to start development!" -ForegroundColor Green
Write-Host "`nTo start your services:" -ForegroundColor Cyan
Write-Host "1. User Service:  cd packages\api\user-service && npm run dev" -ForegroundColor Yellow
Write-Host "2. Job Service:   cd packages\api\job-service && npm run dev" -ForegroundColor Yellow
Write-Host "`nHealth Check URLs:" -ForegroundColor Cyan
Write-Host "- User Service: http://localhost:3001/health" -ForegroundColor Yellow
Write-Host "- Job Service:  http://localhost:3002/health" -ForegroundColor Yellow

Write-Host "`n🎯 SparkApply is ready to build the future of job matching in East Africa!" -ForegroundColor Green
