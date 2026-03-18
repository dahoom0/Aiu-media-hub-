@echo off
REM AIU Media Hub - Docker Deployment Script for Network Access

echo ==========================================
echo AIU Media Hub - Docker Network Deployment
echo ==========================================
echo.

echo Detecting network interfaces...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Found IP: !IP!
)
echo.

echo Stopping existing containers...
docker-compose down
echo.

echo Removing old images...
docker rmi aiu_media_hub-backend aiu_media_hub-frontend 2>nul
echo.

echo Building and starting containers (forcing fresh build)...
docker-compose build --no-cache
docker-compose up -d
echo.

echo Waiting for services to start...
timeout /t 10 /nobreak >nul
echo.

echo Container status:
docker-compose ps
echo.

echo ==========================================
echo System is now accessible from:
echo ==========================================
echo.
echo Frontend (Web Interface):
echo   - http://localhost
echo   - http://localhost:3000
echo   - http://YOUR_IP (check ipconfig)
echo.
echo Backend API:
echo   - http://localhost:8000
echo   - http://YOUR_IP:8000
echo.
echo ==========================================
echo Deployment complete!
echo ==========================================
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
