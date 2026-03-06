@echo off
REM AIU Media Hub - Quick Deployment Script for Windows
REM This script automates the deployment process

echo =========================================
echo AIU Media Hub - Docker Deployment
echo =========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo X Docker Compose is not installed!
    echo Please install Docker Compose
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo [OK] Docker Compose is installed
echo.

REM Check if .env file exists
if not exist .env (
    echo [*] Creating .env file from .env.example...
    copy .env.example .env >nul
    echo [OK] .env file created
    echo [!] Please review and update .env file if needed
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

REM Stop existing containers
echo [*] Stopping existing containers if any...
docker-compose down 2>nul
echo.

REM Build and start containers
echo [*] Building Docker images...
echo This may take a few minutes on first run...
echo.
docker-compose build

echo.
echo [*] Starting services...
docker-compose up -d

echo.
echo [*] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo.
echo [*] Service Status:
docker-compose ps

echo.
echo =========================================
echo [OK] Deployment Complete!
echo =========================================
echo.
echo [*] Access the application:
echo    Frontend:  http://localhost
echo    Backend:   http://localhost:8000
echo    Admin:     http://localhost:8000/admin
echo.
echo [*] Default Admin Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo [!] IMPORTANT: Change default passwords in production!
echo.
echo [*] Useful Commands:
echo    View logs:        docker-compose logs -f
echo    Stop services:    docker-compose down
echo    Restart services: docker-compose restart
echo    Verify:           verify-deployment.bat
echo.
echo [*] Waiting 30 seconds for services to fully start...
timeout /t 30 /nobreak >nul
echo.
echo [*] Running verification...
call verify-deployment.bat
echo.
echo [*] For more information, see:
echo    - README.md (Quick start guide)
echo    - DOCKER_DEPLOYMENT_GUIDE.md (Detailed deployment)
echo    - PERFORMANCE_OPTIMIZATION.md (Performance tuning)
echo.
pause
