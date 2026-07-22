#!/bin/bash
# ForgeFlow Production-Grade Cloudflare Setup & Tunnel Launcher
# Uses Cloudflare's 100% Free Tier Services (Zero Trust Tunnels + Turnstile Bot Protection)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN} 🚀 ForgeFlow Production Cloudflare Integration${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "Cloudflare offers a 100% free tier for small-to-medium websites:"
echo -e " 1. ${CYAN}Cloudflare Zero Trust Tunnels${NC} (Unlimited free bandwidth, no open ports, auto-SSL)"
echo -e " 2. ${CYAN}Cloudflare Turnstile${NC} (10k free smart bot challenges per month)"
echo -e " 3. ${CYAN}Cloudflare WAF / CDN${NC} (Free DDoS mitigation and global edge caching)"
echo ""

MODE="${1:-status}"

case "$MODE" in
  "prod"|"production")
    echo -e "${YELLOW}🔒 Initializing Production Cloudflare Tunnel...${NC}"
    if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
        if [ -f ".env" ];  then
            export $(grep -v '^#' .env | xargs)
        fi
    fi

    if [ -z "$CLOUDFLARE_TUNNEL_TOKEN" ]; then
        echo -e "${YELLOW}⚠️ CLOUDFLARE_TUNNEL_TOKEN is not set in .env${NC}"
        echo -e "To create your free production tunnel token:"
        echo -e " 1. Log in to Cloudflare Zero Trust Dashboard: ${CYAN}https://one.dash.cloudflare.com/${NC}"
        echo -e " 2. Navigate to: ${CYAN}Networks -> Tunnels -> Create a Tunnel${NC}"
        echo -e " 3. Select 'Cloudflared' connector & name it 'forgeflow-prod'"
        echo -e " 4. Copy the Install Token (ey...)"
        echo -e " 5. Add to .env: ${GREEN}CLOUDFLARE_TUNNEL_TOKEN=ey...${NC}"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✅ Cloudflare Tunnel Token detected! Starting production daemon container...${NC}"
    docker compose --env-file .env -f infra/docker-compose.yml up -d cloudflared
    echo -e "${GREEN}🎉 Cloudflare Tunnel daemon is running in production mode!${NC}"
    ;;

  "quick"|"dev")
    echo -e "${YELLOW}🌐 Launching Live Cloudflare Edge Tunnel (Free Quick Mode)...${NC}"
    if ! command -v cloudflared &> /dev/null; then
        echo -e "${YELLOW}Installing cloudflared CLI via Homebrew...${NC}"
        brew install cloudflare/cloudflare/cloudflared || true
    fi

    if command -v cloudflared &> /dev/null; then
        echo -e "${GREEN}Connecting local server to Cloudflare Global Edge Network...${NC}"
        cloudflared tunnel --url http://localhost:80
    else
        echo -e "${RED}Please install cloudflared CLI: brew install cloudflare/cloudflare/cloudflared${NC}"
    fi
    ;;

  *)
    echo -e "${CYAN}Available Commands:${NC}"
    echo -e "  ${GREEN}./scripts/tunnel.sh prod${NC}   - Launch Production Cloudflare Zero Trust Tunnel (uses CLOUDFLARE_TUNNEL_TOKEN)"
    echo -e "  ${GREEN}./scripts/tunnel.sh quick${NC}  - Instant live public Cloudflare HTTPS URL for testing"
    echo ""
    echo -e "${YELLOW}Production Cloudflare Turnstile Configuration (Free Bot Protection):${NC}"
    echo -e "  1. Visit Cloudflare Dashboard -> Turnstile (${CYAN}https://dash.cloudflare.com/?to=/:account/turnstile${NC})"
    echo -e "  2. Add your website domain (e.g. portal.forgeflow.io or localhost)"
    echo -e "  3. Copy your Site Key and Secret Key to your .env:"
    echo -e "     ${GREEN}NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...${NC}"
    echo -e "     ${GREEN}TURNSTILE_SECRET_KEY=0x4AAAAAA...${NC}"
    ;;
esac
