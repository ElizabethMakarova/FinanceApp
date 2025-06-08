#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TIMEOUT=5
TEST_USER_EMAIL="test_$(date +%s)@test.com"
TEST_PASSWORD="test123"

echo "1. Проверяем доступность сервера..."
if ! curl -s -m $TIMEOUT "$BASE_URL" >/dev/null; then
  echo "ОШИБКА: Сервер не отвечает"
  exit 1
fi
echo "✓ Сервер доступен"

echo "2. Тестируем регистрацию нового пользователя..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_USER_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'",
    "firstName": "Test",
    "lastName": "User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
  echo "✓ Регистрация успешна"
  TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
else
  echo "ОШИБКА регистрации: $REGISTER_RESPONSE"
  exit 1
fi

echo "3. Тестируем авторизацию..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$TEST_USER_EMAIL"'",
    "password": "'"$TEST_PASSWORD"'"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
  echo "✓ Авторизация успешна"
else
  echo "ОШИБКА авторизации: $LOGIN_RESPONSE"
  exit 1
fi

echo "4. Проверяем защищенный роут..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"email"'; then
  echo "✓ Защищенный роут доступен"
  echo "Тест пройден успешно!"
  exit 0
else
  echo "ОШИБКА доступа к защищенному роуту: $PROFILE_RESPONSE"
  exit 1
fi

