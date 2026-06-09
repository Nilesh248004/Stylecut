#!/bin/sh

set -e

echo "Stopping existing containers..."
docker compose down

echo "Building and starting Stylecut..."
docker compose up -d --build

echo "Current container status:"
docker compose ps

echo "Waiting for API to start..."
sleep 5

echo "Checking API health..."
curl http://localhost:5001/api/health

echo ""
echo "Deployment completed successfully."