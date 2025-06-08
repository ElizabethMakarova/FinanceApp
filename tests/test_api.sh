#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TEST_USER_EMAIL="testuser_$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPassword123!"
TEST_USER_FIRSTNAME="Test"
TEST_USER_LASTNAME="User"

# Функции вывода
print_success() { echo -e "\033[32m[SUCCESS] $1\033[0m"; }
print_error() { echo -e "\033[31m[ERROR] $1\033[0m"; exit 1; }
print_info() { echo -e "\033[34m[INFO] $1\033[0m"; }

# Проверка доступности сервера
check_server() {
  if ! curl -s "$BASE_URL/api/health" >/dev/null; then
    print_error "Server is not responding at $BASE_URL"
  fi
}

# 1. Тест регистрации с улучшенной диагностикой
test_register() {
  print_info "1. Testing registration..."
  local data=$(jq -n \
    --arg email "$TEST_USER_EMAIL" \
    --arg pass "$TEST_USER_PASSWORD" \
    --arg first "$TEST_USER_FIRSTNAME" \
    --arg last "$TEST_USER_LASTNAME" \
    '{email: $email, password: $pass, firstName: $first, lastName: $last}')
  
  local response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$data")
  
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
  
  print_success "Registration successful"
}

# Остальные тесты остаются без изменений...

# Основной поток
check_server
test_register
# Другие тесты...
