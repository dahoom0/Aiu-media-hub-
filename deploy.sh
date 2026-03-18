#!/bin/bash

# AIU Media Hub - Quick Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "========================================="
echo "AIU Media Hub - Docker Deployment"
echo "========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "Please install Docker Compose"
    exit 1
fi

echo "✅ Docker is installed"
echo "✅ Docker Compose is installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please review and update .env file if needed"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Stop existing containers
echo "🛑 Stopping existing containers (if any)..."
docker-compose down 2>/dev/null || true
echo ""

# Remove old images to force fresh rebuild
echo "🗑️  Removing old images to ensure fresh build..."
docker rmi aiu_media_hub-backend aiu_media_hub-frontend 2>/dev/null || true
echo ""

# Build and start containers with no cache
echo "🏗️  Building Docker images (forcing fresh build)..."
echo "This may take a few minutes..."
echo ""
docker-compose build --no-cache

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "🌐 Access the application:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8000"
echo "   Admin:     http://localhost:8000/admin"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default passwords in production!"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Verify:           ./verify-deployment.sh"
echo ""
echo "⏳ Waiting 30 seconds for services to fully start..."
sleep 30
echo ""
echo "🔍 Running verification..."
chmod +x verify-deployment.sh
./verify-deployment.sh
echo ""
echo "📖 For more information, see:"
echo "   - README.md (Quick start guide)"
echo "   - DOCKER_DEPLOYMENT_GUIDE.md (Detailed deployment)"
echo "   - PERFORMANCE_OPTIMIZATION.md (Performance tuning)"
echo ""
