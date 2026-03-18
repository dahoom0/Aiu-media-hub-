#!/bin/bash

# AIU Media Hub - Docker Deployment Script for Network Access
# This script deploys the system to be accessible from any network (192.168.x.x, 10.100.10.x)

echo "=========================================="
echo "AIU Media Hub - Docker Network Deployment"
echo "=========================================="
echo ""

# Get the host IP addresses
echo "Detecting network interfaces..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    ETH_IP=$(ifconfig en0 | grep "inet " | awk '{print $2}')
    WIFI_IP=$(ifconfig en1 | grep "inet " | awk '{print $2}')
else
    # Linux
    ETH_IP=$(ip addr show eth0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
    WIFI_IP=$(ip addr show wlan0 2>/dev/null | grep "inet " | awk '{print $2}' | cut -d/ -f1)
fi

echo "Ethernet IP: ${ETH_IP:-Not found}"
echo "WiFi IP: ${WIFI_IP:-Not found}"
echo ""

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down
echo ""

# Build and start containers
echo "Building and starting containers..."
docker-compose up -d --build
echo ""

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check container status
echo "Container status:"
docker-compose ps
echo ""

# Show access URLs
echo "=========================================="
echo "System is now accessible from:"
echo "=========================================="
echo ""
echo "Frontend (Web Interface):"
echo "  - http://localhost"
echo "  - http://localhost:3000"
if [ -n "$ETH_IP" ]; then
    echo "  - http://$ETH_IP"
    echo "  - http://$ETH_IP:3000"
fi
if [ -n "$WIFI_IP" ]; then
    echo "  - http://$WIFI_IP"
    echo "  - http://$WIFI_IP:3000"
fi
echo ""
echo "Backend API:"
echo "  - http://localhost:8000"
if [ -n "$ETH_IP" ]; then
    echo "  - http://$ETH_IP:8000"
fi
if [ -n "$WIFI_IP" ]; then
    echo "  - http://$WIFI_IP:8000"
fi
echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
echo ""
