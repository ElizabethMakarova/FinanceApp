#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TEST_USER_EMAIL="testuser_$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPassword123!"
TEST_USER_FIRSTNAME="Test"
TEST_USER_LASTNAME="User"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции вывода
print_success() { echo -e "${GREEN}[SUCCESS] $1${NC}"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
print_info() { echo -e "${BLUE}[INFO] $1${NC}"; }

# 1. Проверка доступности сервера
check_server_availability() {
  print_info "Checking server availability at $BASE_URL..."
  
  local max_attempts=10
  local attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|30[0-9]"; then
      print_success "Server is responding"
      return 0
    fi
    
    attempt=$((attempt + 1))
    print_info "Attempt $attempt/$max_attempts - waiting 3 seconds..."
    sleep 3
  done
  
  print_error "Server is not responding after $max_attempts attempts"
  exit 1
}

# 2. Тест регистрации пользователя
test_registration() {
  print_info "Testing user registration..."
  
  local response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_USER_EMAIL\",
      \"password\": \"$TEST_USER_PASSWORD\",
      \"firstName\": \"$TEST_USER_FIRSTNAME\",
      \"lastName\": \"$TEST_USER_LASTNAME\"
    }")
  
  echo "Response: $response"
  
  local error=$(echo "$response" | jq -r '.message // empty')
  if [ -n "$error" ]; then
    print_error "Registration error: $error"
  fi
  
  TOKEN=$(echo "$response" | jq -r '.token')
  USER_ID=$(echo "$response" | jq -r '.user.id')
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    print_error "Registration failed - no token received"
  fi
  
  print_success "Registration successful. User ID: $USER_ID"
}

# 3. Тест входа пользователя
test_login() {
  print_info "Testing user login..."
  
  local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_USER_EMAIL\",
      \"password\": \"$TEST_USER_PASSWORD\"
    }")
  
  echo "Response: $response"
  
  LOGIN_TOKEN=$(echo "$response" | jq -r '.token')
  
  if [ -z "$LOGIN_TOKEN" ] || [ "$LOGIN_TOKEN" = "null" ]; then
    print_error "Login failed"
  fi
  
  print_success "Login successful. Token: $LOGIN_TOKEN"
}

# 4. Основной поток выполнения
main() {
  # Проверяем доступность сервера
  check_server_availability
  
  # Проверяем наличие jq
  if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install jq first."
  fi
  
  # Выполняем тесты
  test_registration
  test_login
  
  print_success "All basic tests passed successfully!"
}

main

