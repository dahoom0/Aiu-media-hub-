@echo off
REM AIU Media Hub - Deployment Verification Script (Windows)
REM This script verifies that all services are running correctly

echo ==========================================
echo AIU Media Hub - Deployment Verification
echo ==========================================
echo.

REM Check if Docker is running
echo 1. Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo   Please start Docker Desktop and try again
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Check if containers are running
echo 2. Checking containers...
docker compose ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No containers are running
    echo   Run: docker compose up -d
    exit /b 1
)
echo.

REM Check each service
echo 3. Checking services...

REM MySQL
echo    MySQL Database...
docker compose exec -T db mysqladmin ping -h localhost -u root -proot123 >nul 2>&1
if errorlevel 1 (
    echo    [ERROR] Not responding
) else (
    echo    [OK] Running
)

REM Backend
echo    Django Backend...
curl -f -s http://localhost:8000/api/health/ >nul 2>&1
if errorlevel 1 (
    echo    [WARNING] Not responding ^(may still be starting^)
) else (
    echo    [OK] Running
)

REM Frontend
echo    React Frontend...
curl -f -s http://localhost/ >nul 2>&1
if errorlevel 1 (
    echo    [WARNING] Not responding ^(may still be starting^)
) else (
    echo    [OK] Running
)

echo.
echo 4. Checking resource usage...
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo.
echo 5. Container status...
docker compose ps

echo.
echo ==========================================
echo Verification Complete
echo ==========================================
echo.
echo Access Points:
echo   Frontend:    http://localhost
echo   Backend API: http://localhost:8000
echo   Admin Panel: http://localhost:8000/admin
echo.
echo Default Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Useful Commands:
echo   View logs:    docker compose logs -f
echo   Stop all:     docker compose down
echo   Restart:      docker compose restart
echo   Check status: docker compose ps
echo.
pause
