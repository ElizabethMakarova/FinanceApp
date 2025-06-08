#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
print_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
print_info() { echo -e "${BLUE}[INFO] $1${NC}"; }

# Проверка доступности сервера
check_server() {
  print_info "Checking server at $BASE_URL..."
  
  local max_attempts=5
  local attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|30[0-9]"; then
      print_success "Server is responding"
      return 0
    fi
    
    attempt=$((attempt + 1))
    print_info "Attempt $attempt/$max_attempts - waiting 2 seconds..."
    sleep 2
  done
  
  print_error "Server is not responding after $max_attempts attempts"
  exit 1
}

# Проверка основных роутов
check_routes() {
  local routes=("/" "/api/status" "/api/auth/register" "/api/auth/login")
  
  for route in "${routes[@]}"; do
    print_info "Checking route $route..."
    
    local url="$BASE_URL$route"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [[ "$response" =~ ^(200|201|302|404)$ ]]; then
      print_success "Route $route responded with HTTP $response"
    else
      print_error "Route $route failed with HTTP $response"
    fi
  done
}

main() {
  check_server
  check_routes
  print_success "Basic connectivity tests passed!"
}

main
