#!/bin/bash
set -eo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
TIMEOUT=10
TEST_USER_EMAIL="testuser_$(date +%s)@example.com"
TEST_PASSWORD="SecurePass123!"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции логирования
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Проверка зависимостей
check_dependencies() {
  local dependencies=("curl" "jq")
  for dep in "${dependencies[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
      log_error "Необходимо установить $dep"
      exit 1
    fi
  done
}

# Функция для выполнения HTTP-запросов с обработкой ошибок
make_request() {
  local method=$1
  local url=$2
  local options=("${@:3}")
  
  local response
  if ! response=$(curl -s -X "$method" "$url" \
    --connect-timeout "$TIMEOUT" \
    --max-time "$TIMEOUT" \
    "${options[@]}" 2>&1); then
    log_error "Ошибка при выполнении запроса к $url"
    return 1
  fi
  
  echo "$response"
}

# Проверяем зависимости
check_dependencies

# 1. Проверка доступности сервера
log_info "Проверяем доступность сервера по адресу $BASE_URL"
if ! make_request GET "$BASE_URL" >/dev/null; then
  log_error "Сервер не отвечает"
  exit 1
fi
log_success "Сервер доступен"

# 2. Тест регистрации
log_info "Тестируем регистрацию пользователя"
register_payload=$(jq -n \
  --arg email "$TEST_USER_EMAIL" \
  --arg password "$TEST_PASSWORD" \
  --arg firstName "$TEST_FIRST_NAME" \
  --arg lastName "$TEST_LAST_NAME" \
  '{
    email: $email,
    password: $password,
    firstName: $firstName,
    lastName: $lastName
  }')

register_response=$(make_request POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "$register_payload")

if ! echo "$register_response" | jq -e '.token' >/dev/null 2>&1; then
  log_error "Ошибка регистрации"
  echo "Ответ сервера: $register_response" | jq .
  exit 1
fi

AUTH_TOKEN=$(echo "$register_response" | jq -r '.token')
log_success "Пользователь успешно зарегистрирован"

# 3. Тест авторизации
log_info "Тестируем авторизацию"
login_payload=$(jq -n \
  --arg email "$TEST_USER_EMAIL" \
  --arg password "$TEST_PASSWORD" \
  '{
    email: $email,
    password: $password
  }')

login_response=$(make_request POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login_payload")

if ! echo "$login_response" | jq -e '.token' >/dev/null 2>&1; then
  log_error "Ошибка авторизации"
  echo "Ответ сервера: $login_response" | jq .
  exit 1
fi

AUTH_TOKEN=$(echo "$login_response" | jq -r '.token')
log_success "Пользователь успешно авторизован"

# 4. Тест получения профиля
log_info "Тестируем получение профиля"
profile_response=$(make_request GET "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if ! echo "$profile_response" | jq -e '.email' >/dev/null 2>&1; then
  log_error "Ошибка получения профиля"
  echo "Ответ сервера: $profile_response" | jq .
  exit 1
fi

log_success "Профиль успешно получен"
echo "Данные профиля:"
echo "$profile_response" | jq .

# 5. Тест создания транзакции
log_info "Тестируем создание транзакции"
transaction_payload=$(jq -n \
  --arg date "$(date +%Y-%m-%d)" \
  '{
    amount: 100.50,
    category: "food",
    description: "Test transaction",
    date: $date
  }')

transaction_response=$(make_request POST "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$transaction_payload")

if ! echo "$transaction_response" | jq -e '.id' >/dev/null 2>&1; then
  log_error "Ошибка создания транзакции"
  echo "Ответ сервера: $transaction_response" | jq .
  exit 1
fi

TRANSACTION_ID=$(echo "$transaction_response" | jq -r '.id')
log_success "Транзакция успешно создана (ID: $TRANSACTION_ID)"


# 6. Тест получения списка транзакций
log_info "Тестируем получение списка транзакций"
transactions_response=$(make_request GET "$BASE_URL/api/transactions" \
  -H "Authorization: Bearer $AUTH_TOKEN")

if ! echo "$transactions_response" | jq -e 'length > 0' >/dev/null 2>&1; then
  log_warning "Список транзакций пуст"
else
  log_success "Список транзакций успешно получен"
fi

# 7. Тест удаления транзакции
log_info "Тестируем удаление транзакции"
delete_status=$(make_request DELETE "$BASE_URL/api/transactions/$TRANSACTION_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -o /dev/null \
  -w "%{http_code}")

if [ "$delete_status" -ne 204 ]; then
  log_error "Ошибка удаления транзакции. Код статуса: $delete_status"
  exit 1
fi

log_success "Транзакция успешно удалена"

# 8. Проверка, что транзакция действительно удалена
log_info "Проверяем, что транзакция удалена"
deleted_check_response=$(make_request GET "$BASE_URL/api/transactions/$TRANSACTION_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" || true)

if echo "$deleted_check_response" | jq -e '.message' >/dev/null 2>&1; then
  log_success "Транзакция не найдена (ожидаемо после удаления)"
else
  log_error "Транзакция все еще доступна после удаления"
  exit 1
fi

# Финальный результат
echo -e "\n${GREEN}==============================================${NC}"
log_success "ВСЕ ТЕСТЫ УСПЕШНО ПРОЙДЕНЫ"
echo -e "${GREEN}==============================================${NC}"
exit 0

