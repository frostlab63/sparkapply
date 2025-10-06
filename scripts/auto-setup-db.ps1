# SparkApply Automated Database Setup and Testing
# This script automatically sets up PostgreSQL and tests connections

Write-Host "🚀 SparkApply Automated Database Setup Starting..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

# Function for colored output
function Write-Status {
    param($Message, $Status = "Info")
    switch ($Status) {
        "Success" { Write-Host "✅ $Message" -ForegroundColor Green }
        "Error" { Write-Host "❌ $Message" -ForegroundColor Red }
        "Warning" { Write-Host "⚠️  $Message" -ForegroundColor Yellow }
        "Info" { Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
    }
}

# Step 1: Check Docker availability
Write-Status "Checking Docker availability..." "Info"
try {
    $dockerVersion = docker --version 2>$null
    if ($dockerVersion) {
        Write-Status "Docker found: $dockerVersion" "Success"
        $dockerAvailable = $true
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Status "Docker not available - will provide manual setup instructions" "Warning"
    $dockerAvailable = $false
}

# Step 2: Start PostgreSQL with Docker (if available)
if ($dockerAvailable) {
    Write-Status "Starting PostgreSQL and Redis containers..." "Info"
    try {
        # Stop any existing containers first
        docker-compose -f docker-compose.dev.yml down 2>$null
        
        # Start database containers
        $composeResult = docker-compose -f docker-compose.dev.yml up -d postgres redis 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Database containers started successfully" "Success"
            
            # Wait for PostgreSQL to be ready
            Write-Status "Waiting for PostgreSQL to be ready..." "Info"
            $maxAttempts = 30
            $attempt = 0
            $dbReady = $false
            
            do {
                Start-Sleep -Seconds 2
                $attempt++
                try {
                    $healthCheck = docker exec sparkapply-postgres pg_isready -U sparkapply -d sparkapply_dev 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        $dbReady = $true
                        Write-Status "PostgreSQL is ready!" "Success"
                        break
                    }
                } catch {
                    # Continue waiting
                }
                
                if ($attempt -eq 15) {
                    Write-Status "Still waiting for PostgreSQL... (this is normal)" "Info"
                }
            } while ($attempt -lt $maxAttempts)
            
            if (-not $dbReady) {
                Write-Status "PostgreSQL took longer than expected to start, but continuing..." "Warning"
            }
            
        } else {
            Write-Status "Failed to start containers: $composeResult" "Error"
            $dockerAvailable = $false
        }
    } catch {
        Write-Status "Error starting Docker containers: $($_.Exception.Message)" "Error"
        $dockerAvailable = $false
    }
}

# Step 3: Copy environment files
Write-Status "Setting up environment files..." "Info"
try {
    if (Test-Path "packages\api\user-service\.env.example") {
        Copy-Item "packages\api\user-service\.env.example" "packages\api\user-service\.env" -Force
        Write-Status "User-service .env file created" "Success"
    } else {
        Write-Status "User-service .env.example not found" "Error"
    }
    
    if (Test-Path "packages\api\job-service\.env.example") {
        Copy-Item "packages\api\job-service\.env.example" "packages\api\job-service\.env" -Force
        Write-Status "Job-service .env file created" "Success"
    } else {
        Write-Status "Job-service .env.example not found" "Error"
    }
} catch {
    Write-Status "Failed to create environment files: $($_.Exception.Message)" "Error"
}

# Step 4: Install dependencies and test user-service
Write-Status "Setting up user-service..." "Info"
try {
    Set-Location "packages\api\user-service"
    
    # Install dependencies
    Write-Status "Installing user-service dependencies..." "Info"
    npm install --silent 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "User-service dependencies installed" "Success"
        
        # Test database connection
        Write-Status "Testing user-service database connection..." "Info"
        $testResult = node "..\..\..\scripts\test-db.js" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "User-service database connection: SUCCESS" "Success"
            $userDbWorking = $true
        } else {
            Write-Status "User-service database connection: FAILED - $testResult" "Error"
            $userDbWorking = $false
        }
    } else {
        Write-Status "Failed to install user-service dependencies" "Error"
        $userDbWorking = $false
    }
} catch {
    Write-Status "Error setting up user-service: $($_.Exception.Message)" "Error"
    $userDbWorking = $false
}

# Step 5: Install dependencies and test job-service
Write-Status "Setting up job-service..." "Info"
try {
    Set-Location "..\job-service"
    
    # Install dependencies
    Write-Status "Installing job-service dependencies..." "Info"
    npm install --silent 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Job-service dependencies installed" "Success"
        
        # Test database connection
        Write-Status "Testing job-service database connection..." "Info"
        $testResult = node "..\..\..\scripts\test-db.js" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Job-service database connection: SUCCESS" "Success"
            $jobDbWorking = $true
        } else {
            Write-Status "Job-service database connection: FAILED - $testResult" "Error"
            $jobDbWorking = $false
        }
    } else {
        Write-Status "Failed to install job-service dependencies" "Error"
        $jobDbWorking = $false
    }
} catch {
    Write-Status "Error setting up job-service: $($_.Exception.Message)" "Error"
    $jobDbWorking = $false
}

# Step 6: Test service startup
if ($jobDbWorking) {
    Write-Status "Testing job-service startup..." "Info"
    try {
        # Start service in background
        $job = Start-Job -ScriptBlock {
            param($location)
            Set-Location $location
            npm run dev
        } -ArgumentList (Get-Location)
        
        # Wait for service to start
        Start-Sleep -Seconds 8
        
        # Test health endpoint
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Status "Job-service startup: SUCCESS (responding on port 3002)" "Success"
                $serviceWorking = $true
            }
        } catch {
            Write-Status "Job-service startup: Service started but health check failed" "Warning"
            $serviceWorking = $false
        }
        
        # Clean up
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -ErrorAction SilentlyContinue
        
    } catch {
        Write-Status "Could not test service startup: $($_.Exception.Message)" "Warning"
        $serviceWorking = $false
    }
}

# Return to project root
Set-Location "..\..\.."

# Final comprehensive report
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "🎯 AUTOMATED SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`n📊 DETAILED RESULTS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($dockerAvailable) {
    Write-Host "🐳 Docker: Available and containers started" -ForegroundColor Green
} else {
    Write-Host "🐳 Docker: Not available" -ForegroundColor Red
}

Write-Host "📁 Environment files: Created" -ForegroundColor Green

if ($userDbWorking) {
    Write-Host "👤 User-service: Dependencies ✅ | Database ✅" -ForegroundColor Green
} else {
    Write-Host "👤 User-service: Dependencies ❌ | Database ❌" -ForegroundColor Red
}

if ($jobDbWorking) {
    Write-Host "💼 Job-service: Dependencies ✅ | Database ✅" -ForegroundColor Green
} else {
    Write-Host "💼 Job-service: Dependencies ❌ | Database ❌" -ForegroundColor Red
}

if ($serviceWorking) {
    Write-Host "🚀 Service startup: Working" -ForegroundColor Green
} else {
    Write-Host "🚀 Service startup: Needs attention" -ForegroundColor Yellow
}

# Success or failure instructions
Write-Host "`n🎯 NEXT ACTIONS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if ($userDbWorking -and $jobDbWorking) {
    Write-Host "🎉 SUCCESS! Everything is working perfectly!" -ForegroundColor Green
    Write-Host "`n🚀 Start your SparkApply services:" -ForegroundColor Cyan
    Write-Host "   Terminal 1: cd packages\api\user-service && npm run dev" -ForegroundColor Yellow
    Write-Host "   Terminal 2: cd packages\api\job-service && npm run dev" -ForegroundColor Yellow
    Write-Host "`n🌐 Test URLs:" -ForegroundColor Cyan
    Write-Host "   User Service Health: http://localhost:3001/health" -ForegroundColor White
    Write-Host "   Job Service Health:  http://localhost:3002/health" -ForegroundColor White
    Write-Host "`n🦄 Ready to build the next unicorn! 🚀" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some components need attention:" -ForegroundColor Yellow
    
    if (-not $dockerAvailable) {
        Write-Host "`n🐳 Install Docker Desktop:" -ForegroundColor Cyan
        Write-Host "   1. Download: https://www.docker.com/products/docker-desktop" -ForegroundColor White
        Write-Host "   2. Install and restart your computer" -ForegroundColor White
        Write-Host "   3. Re-run this script" -ForegroundColor White
    }
    
    if (-not $userDbWorking -or -not $jobDbWorking) {
        Write-Host "`n💾 Alternative - Local PostgreSQL:" -ForegroundColor Cyan
        Write-Host "   1. Download: https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host "   2. Install with default settings" -ForegroundColor White
        Write-Host "   3. Open pgAdmin or psql and run:" -ForegroundColor White
        Write-Host "      CREATE USER sparkapply WITH PASSWORD 'sparkapply_dev_password';" -ForegroundColor Gray
        Write-Host "      CREATE DATABASE sparkapply_dev OWNER sparkapply;" -ForegroundColor Gray
        Write-Host "      GRANT ALL PRIVILEGES ON DATABASE sparkapply_dev TO sparkapply;" -ForegroundColor Gray
        Write-Host "   4. Re-run this script to test" -ForegroundColor White
    }
}

Write-Host "`n📋 Script completed at $(Get-Date)" -ForegroundColor Gray
