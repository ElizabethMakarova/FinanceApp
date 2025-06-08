#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TIMEOUT=5
TEST_USER_EMAIL="test_$(date +%s)@test.com"
TEST_PASSWORD="test123"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

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
    "firstName": "'"$TEST_FIRST_NAME"'",
    "lastName": "'"$TEST_LAST_NAME"'"
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
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
else
  echo "ОШИБКА авторизации: $LOGIN_RESPONSE"
  exit 1
fi

echo "4. Проверяем защищенный роут профиля..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"email"'; then
  echo "✓ Профиль получен успешно"
else
  echo "ОШИБКА доступа к профилю: $PROFILE_RESPONSE"
  exit 1
fi

echo "5. Тестируем создание транзакции..."
TRANSACTION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.50,
    "category": "food",
    "description": "Test transaction",
    "date": "'"$(date +%Y-%m-%d)"'"
  }')

if echo "$TRANSACTION_RESPONSE" | grep -q '"id"'; then
  echo "✓ Транзакция создана успешно"
  TRANSACTION_ID=$(echo "$TRANSACTION_RESPONSE" | jq -r '.id')
else
  echo "ОШИБКА создания транзакции: $TRANSACTION_RESPONSE"
  exit 1
fi

echo "6. Проверяем список транзакций..."
TRANSACTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $TOKEN")

if echo "$TRANSACTIONS_RESPONSE" | grep -q '"amount"'; then
  echo "✓ Список транзакций получен"
else
  echo "ОШИБКА получения списка транзакций: $TRANSACTIONS_RESPONSE"
  exit 1
fi

echo "7. Тестируем удаление транзакции..."
DELETE_STATUS=$(curl -s -X DELETE "$BASE_URL/api/transactions/$TRANSACTION_ID" \
  -H "Authorization: Bearer $TOKEN" -w "%{http_code}")

if [ "$DELETE_STATUS" -eq 204 ]; then
  echo "✓ Транзакция удалена успешно"
else
  echo "ОШИБКА удаления транзакции. Код: $DELETE_STATUS"
  exit 1
fi

echo "8. Проверяем создание категории..."
CATEGORY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Category",
    "type": "expense"
  }')

if echo "$CATEGORY_RESPONSE" | grep -q '"id"'; then
  echo "✓ Категория создана успешно"
  CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')
else
  echo "ОШИБКА создания категории: $CATEGORY_RESPONSE"
  exit 1
fi

echo "9. Тестируем удаление категории..."
DELETE_STATUS=$(curl -s -X DELETE "$BASE_URL/api/categories/$CATEGORY_ID" \
  -H "Authorization: Bearer $TOKEN" -w "%{http_code}")

if [ "$DELETE_STATUS" -eq 204 ]; then
  echo "✓ Категория удалена успешно"
else
  echo "ОШИБКА удаления категории. Код: $DELETE_STATUS"
  exit 1
fi

echo "10. Проверяем статистику пользователя..."
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/user/stats" \
  -H "Authorization: Bearer $TOKEN")

if echo "$STATS_RESPONSE" | grep -q '"total"'; then
  echo "✓ Статистика получена успешно"
else
  echo "ОШИБКА получения статистики: $STATS_RESPONSE"
  exit 1
fi

echo -e "\n✓✓✓ ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ ✓✓✓"
exit 0

