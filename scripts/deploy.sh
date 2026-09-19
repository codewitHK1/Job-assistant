#!/usr/bin/env bash
# ==============================================================================
# JobPilot AI - Production Deployment & Build Script
# Usage:
#   ./scripts/deploy.sh [COMMAND] [OPTIONS]
#
# Commands:
#   build          Compile frontend & bundle backend for production
#   start          Build and start local production server on port 3000
#   docker         Build and run production Docker container
#   cloudrun       Deploy to Google Cloud Run (requires gcloud CLI)
#   check          Run pre-deployment diagnostics (lint + build check)
#   help           Show this help message
# ==============================================================================

set -euo pipefail

# Visual Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

APP_NAME="JobPilot AI"
PORT="${PORT:-3000}"
IMAGE_NAME="jobpilot-ai"
TAG="${TAG:-latest}"

print_header() {
  echo -e "\n${CYAN}======================================================${NC}"
  echo -e "${CYAN}   🚀 $APP_NAME Deployment Engine${NC}"
  echo -e "${CYAN}======================================================${NC}\n"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking environment prerequisites..."

  if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not installed. Please install Node.js 18+ to proceed."
    exit 1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed. Please install npm to proceed."
    exit 1
  fi

  NODE_VER=$(node -v)
  log_info "Detected Node.js: $NODE_VER"

  if [ ! -f "package.json" ]; then
    log_error "package.json not found in current directory. Please run from project root."
    exit 1
  fi

  # Ensure .env exists
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      log_warn ".env file missing. Copying template from .env.example..."
      cp .env.example .env
    else
      touch .env
    fi
  fi
}

run_diagnostics() {
  print_header
  check_prerequisites
  log_info "Running project diagnostics & lint verification..."

  if npm run lint; then
    log_success "Lint check passed successfully!"
  else
    log_warn "Lint check encountered warnings/errors. Continuing verification..."
  fi

  log_info "Validating production build pipeline..."
  npm run build
  log_success "Verification passed! Production bundle verified in ./dist/"
}

build_app() {
  print_header
  check_prerequisites
  log_info "Building $APP_NAME for production deployment..."

  # Install clean production dependencies if node_modules missing
  if [ ! -d "node_modules" ]; then
    log_info "node_modules directory missing. Installing packages..."
    npm install
  fi

  # Run standard unified build
  log_info "Compiling React SPA and bundling Express server with esbuild..."
  npm run build

  if [ -f "dist/server.cjs" ] && [ -f "dist/index.html" ]; then
    log_success "Build complete! Static assets and dist/server.cjs generated."
  else
    log_error "Build output verification failed. Missing dist/server.cjs or dist/index.html"
    exit 1
  fi
}

start_local_production() {
  build_app
  log_info "Starting production server on http://0.0.0.0:${PORT}..."
  export NODE_ENV="production"
  export PORT="${PORT}"

  echo -e "\n${GREEN}Server online! Health check accessible at:${NC}"
  echo -e "  -> http://localhost:${PORT}/api/health\n"
  node dist/server.cjs
}

deploy_docker() {
  print_header
  check_prerequisites

  if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH. Please install Docker to use this mode."
    exit 1
  fi

  log_info "Building Docker image: ${IMAGE_NAME}:${TAG}..."
  docker build -t "${IMAGE_NAME}:${TAG}" .

  log_success "Docker image built successfully!"
  log_info "Launching container on port ${PORT}..."

  docker run --rm -it \
    -p "${PORT}:3000" \
    -e NODE_ENV=production \
    -e GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
    --name "jobpilot-app" \
    "${IMAGE_NAME}:${TAG}"
}

deploy_cloud_run() {
  print_header
  check_prerequisites

  if ! command -v gcloud >/dev/null 2>&1; then
    log_error "gcloud CLI is not installed. Install Google Cloud SDK to deploy directly to Cloud Run."
    exit 1
  fi

  SERVICE_NAME="jobpilot-ai"
  REGION="${CLOUD_RUN_REGION:-asia-east1}"

  log_info "Deploying $APP_NAME directly to Google Cloud Run (Region: ${REGION})..."

  gcloud run deploy "${SERVICE_NAME}" \
    --source . \
    --region "${REGION}" \
    --platform managed \
    --allow-unauthenticated \
    --port 3000

  log_success "Cloud Run deployment command finished!"
}

show_help() {
  print_header
  echo -e "Usage: ./scripts/deploy.sh [COMMAND]\n"
  echo "Available Commands:"
  echo "  build       Compile client assets (Vite) and backend server (esbuild)"
  echo "  start       Compile and start standalone Node.js production server"
  echo "  docker      Build Docker container image and start container"
  echo "  cloudrun    Deploy application to Google Cloud Run"
  echo "  check       Run linting and dry-run build checks"
  echo "  help        Display this help documentation"
  echo ""
  echo "Environment Variables Supported:"
  echo "  PORT                Port to bind to (Default: 3000)"
  echo "  NODE_ENV            Environment mode (Default: production)"
  echo "  CLOUD_RUN_REGION    Target Cloud Run region (Default: asia-east1)"
  echo ""
}

# Command Router
ACTION="${1:-build}"

case "$ACTION" in
  build)
    build_app
    ;;
  start)
    start_local_production
    ;;
  docker)
    deploy_docker
    ;;
  cloudrun)
    deploy_cloud_run
    ;;
  check)
    run_diagnostics
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    log_error "Unknown command: $ACTION"
    show_help
    exit 1
    ;;
esac
