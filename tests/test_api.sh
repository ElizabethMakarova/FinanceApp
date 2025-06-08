#!/bin/bash

# Настройки
BASE_URL="http://localhost:5000"
TEST_USER_EMAIL="testuser_$(date +%s)@example.com"
TEST_USER_PASSWORD="TestPassword123!"
TEST_USER_FIRSTNAME="Test"
TEST_USER_LASTNAME="User"

# Функции для вывода
print_success() {
  echo -e "\033[32m[SUCCESS] $1\033[0m"
}

print_error() {
  echo -e "\033[31m[ERROR] $1\033[0m"
  exit 1
}

print_info() {
  echo -e "\033[34m[INFO] $1\033[0m"
}

# 1. Тест регистрации пользователя
print_info "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_USER_EMAIL\",
    \"password\": \"$TEST_USER_PASSWORD\",
    \"firstName\": \"$TEST_USER_FIRSTNAME\",
    \"lastName\": \"$TEST_USER_LASTNAME\"
  }")

echo "$REGISTER_RESPONSE" | jq .

USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  print_error "Registration failed"
else
  print_success "Registration successful. Token: $TOKEN"
fi

# 2. Тест входа пользователя
print_info "2. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_USER_EMAIL\",
    \"password\": \"$TEST_USER_PASSWORD\"
  }")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ -z "$LOGIN_TOKEN" ] || [ "$LOGIN_TOKEN" = "null" ]; then
  print_error "Login failed"
else
  print_success "Login successful. Token: $LOGIN_TOKEN"
fi

# 3. Тест получения профиля
print_info "3. Testing get user profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "$PROFILE_RESPONSE" | jq .

PROFILE_EMAIL=$(echo "$PROFILE_RESPONSE" | jq -r '.email')

if [ "$PROFILE_EMAIL" != "$TEST_USER_EMAIL" ]; then
  print_error "Profile test failed"
else
  print_success "Profile test successful"
fi

# 4. Тест создания транзакции
print_info "4. Testing transaction creation..."
TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"amount\": 100.50,
    \"description\": \"Test transaction\",
    \"type\": \"expense\",
    \"category\": \"food\",
    \"date\": \"$(date -I)\"
  }")

echo "$TRANSACTION_RESPONSE" | jq .

TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.id')

if [ -z "$TRANSACTION_ID" ] || [ "$TRANSACTION_ID" = "null" ]; then
  print_error "Transaction creation failed"
else
  print_success "Transaction created successfully. ID: $TRANSACTION_ID"
fi

# 5. Тест получения списка транзакций
print_info "5. Testing get transactions list..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $TOKEN")

TRANSACTIONS_COUNT=$(echo "$TRANSACTIONS_RESPONSE" | jq '. | length')

if [ "$TRANSACTIONS_COUNT" -eq 0 ]; then
  print_error "No transactions found"
else
  print_success "Found $TRANSACTIONS_COUNT transactions"
fi

# 6. Тест создания категории
print_info "6. Testing category creation..."
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Category\",
    \"type\": \"expense\",
    \"color\": \"#FF0000\"
  }")

echo "$CATEGORY_RESPONSE" | jq .

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')

if [ -z "$CATEGORY_ID" ] || [ "$CATEGORY_ID" = "null" ]; then
  print_error "Category creation failed"
else
  print_success "Category created successfully. ID: $CATEGORY_ID"
fi

# 7. Тест создания цели
print_info "7. Testing goal creation..."
GOAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/goals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Goal\",
    \"description\": \"Save for vacation\",
    \"targetAmount\": 1000,
    \"targetDate\": \"$(date -d "+1 month" -I)\"
  }")

echo "$GOAL_RESPONSE" | jq .

GOAL_ID=$(echo "$GOAL_RESPONSE" | jq -r '.id')

if [ -z "$GOAL_ID" ] || [ "$GOAL_ID" = "null" ]; then
  print_error "Goal creation failed"
else
  print_success "Goal created successfully. ID: $GOAL_ID"
fi

# 8. Тест получения статистики
print_info "8. Testing dashboard stats..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "$STATS_RESPONSE" | jq .

if [ -z "$STATS_RESPONSE" ]; then
  print_error "Failed to get stats"
else
  print_success "Stats retrieved successfully"
fi

# 9. Тест удаления тестовых данных
print_info "9. Cleaning up test data..."

# Удаление цели
curl -s -X DELETE "$BASE_URL/api/goals/$GOAL_ID" \
  -H "Authorization: Bearer $TOKEN"

# Удаление категории
curl -s -X DELETE "$BASE_URL/api/categories/$CATEGORY_ID" \
  -H "Authorization: Bearer $TOKEN"

# Удаление транзакции
curl -s -X DELETE "$BASE_URL/api/transactions/$TRANSACTION_ID" \
  -H "Authorization: Bearer $TOKEN"

# Удаление пользователя
curl -s -X DELETE "$BASE_URL/api/user" \
  -H "Authorization: Bearer $TOKEN"

print_success "Test data cleaned up"

print_success "All API tests completed successfully!"
