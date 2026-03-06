#!/bin/bash

# AIU Media Hub - Deployment Verification Script
# This script verifies that all services are running correctly

echo "=========================================="
echo "AIU Media Hub - Deployment Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "1. Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "  Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"
echo ""

# Check if containers are running
echo "2. Checking containers..."
CONTAINERS=$(docker compose ps --format json 2>/dev/null | jq -r '.Name' 2>/dev/null || docker compose ps 2>/dev/null | grep -c "Up" || echo "0")

if [ "$CONTAINERS" = "0" ]; then
    echo -e "${RED}✗ No containers are running${NC}"
    echo "  Run: docker compose up -d"
    exit 1
fi

# Check each service
echo ""
echo "3. Checking services..."

# MySQL
echo -n "   MySQL Database... "
if docker compose exec -T db mysqladmin ping -h localhost -u root -proot123 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Backend
echo -n "   Django Backend... "
if curl -f -s http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not responding (may still be starting)${NC}"
fi

# Frontend
echo -n "   React Frontend... "
if curl -f -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not responding (may still be starting)${NC}"
fi

echo ""
echo "4. Checking resource usage..."
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -n 4

echo ""
echo "5. Checking logs for errors..."
ERROR_COUNT=$(docker compose logs --tail=100 2>&1 | grep -i "error" | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $ERROR_COUNT error messages in logs${NC}"
    echo "  Run: docker compose logs -f"
else
    echo -e "${GREEN}✓ No errors in recent logs${NC}"
fi

echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  Frontend:    http://localhost"
echo "  Backend API: http://localhost:8000"
echo "  Admin Panel: http://localhost:8000/admin"
echo ""
echo "Default Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Useful Commands:"
echo "  View logs:    docker compose logs -f"
echo "  Stop all:     docker compose down"
echo "  Restart:      docker compose restart"
echo "  Check status: docker compose ps"
echo ""
