#!/bin/bash
# ForgeFlow Cloudflare Tunnel Setup Script
# Use this script to start a quick dev tunnel or get instructions for production.

set -e

echo "🔧 ForgeFlow Cloudflare Tunnel Setup"
echo "-------------------------------------"
echo "This script provides instructions for setting up Cloudflare Tunnel (Zero Trust)."
echo ""

echo "For Production (Docker Compose):"
echo "1. Go to Cloudflare Zero Trust Dashboard (https://one.dash.cloudflare.com/)"
echo "2. Navigate to Access -> Tunnels -> Create a tunnel (Cloudflared)"
echo "3. Name it 'forgeflow-prod' (or similar)"
echo "4. Choose Docker environment and copy the Tunnel Token."
echo "5. Add the token to your .env file as: CLOUDFLARE_TUNNEL_TOKEN=ey..."
echo "6. Run 'docker-compose -f infra/docker-compose.yml up -d'"
echo "7. In Cloudflare, route public hostnames to internal services:"
echo "   - portal.yourdomain.com -> http://nginx:80"
echo "   - api.yourdomain.com -> http://backend:8000"
echo "   - storage.yourdomain.com -> http://minio:9001"
echo ""
echo "For Quick Local Dev Testing:"
if ! command -v cloudflared &> /dev/null; then
    echo "❌ 'cloudflared' CLI is not installed locally."
    echo "Install via Homebrew: brew install cloudflare/cloudflare/cloudflared"
else
    echo "✅ 'cloudflared' CLI is installed."
    echo "To test locally without a domain, you can use a quick tunnel:"
    echo "Run: cloudflared tunnel --url http://localhost:3000"
fi
