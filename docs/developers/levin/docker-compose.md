# Запуск через Docker Compose

Из корня проекта `docker compose up -d --build --wait` собирает Spring Boot и Expo Web и поднимает их с PostgreSQL. В браузере приложение открывается на `http://localhost:8081`. Compose сохраняет существующий том PostgreSQL.

Основа ветки согласована с Levin: коммит `de66d50` со связкой Expo и Spring, отдельная рабочая копия. Согласованные общие файлы — `compose.yaml` и `README.md`. Levin также ведёт новые `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`, `frontend/.dockerignore` и `frontend/nginx.conf`.

## API и шаги

HTTP-контракт описан в [плане Wise Lite API](../nikita/wise-lite-api.md). Для веб-сборки Expo использует адрес `/api`. Nginx пересылает `POST /api/auth/login` и `GET /api/state` в Spring как `POST /auth/login` и `GET /state`. `GET /api/status` сохраняет путь Spring и возвращает `{"status":"ok","database":"connected"}`. REST-контракт приложения сохраняется.

1. Собрать JAR на Java 21 через Maven Wrapper и Expo Web на Node 24. Раздавать веб-сборку через Nginx с переходами по прямым ссылкам.
2. Настроить порядок готовности PostgreSQL → Spring → Expo Web. Описать запуск всего стека и отдельной базы в README.
3. Проверить `docker compose config`, сборку и запуск на отдельных портах и томе, ответ `/api/status`, вход в демоаккаунт и чтение `/api/state` через Nginx.

## Результаты проверки

Все три контейнера перешли в `healthy` в проекте `wise-hackathon-compose-check` с отдельным томом. Через Nginx проверены прямой переход на `/full`, выдача service worker, `/api/status`, вход, чтение состояния и выход. Chrome показал демобаланс Марии 4 000 €. Прошли `npm run check` и Maven `verify` на отдельной схеме тестовой базы.
