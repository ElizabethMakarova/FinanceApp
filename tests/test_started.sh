#!/bin/bash
set -e

BASE_URL="${BASE_URL:-http://localhost:5000}"
TIMEOUT=5  # Максимальное время ожидания ответа

# Проверяем доступность сервера
echo "Проверяем доступность сервера по адресу $BASE_URL"

if curl -s -m $TIMEOUT "$BASE_URL" >/dev/null; then
  echo "Сервер доступен и отвечает"
  exit 0
else
  echo "Сервер не ответил за $TIMEOUT секунд"
  exit 1
fi
