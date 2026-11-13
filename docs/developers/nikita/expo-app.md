# План: перенос Wise Lite (Expo) в репозиторий

Ветка: `codex/nikita-wise-lite`. Язык: русский.

## Цель
Перенести готовое приложение Wise Lite в `frontend/` (вместо Next.js), оставить рабочий
временный API, подготовить контракт для переписывания бэкенда на Spring Boot (делает команда).

## Что сделано
- `frontend/` — Expo-приложение (React Native, web и телефон). Next.js удалён по договорённости.
- `api-prototype/` — временный Node API на `:3001`, подключается к Postgres из `compose.yaml`,
  таблицы с префиксом `wl_` создаёт сам. Удалить после переписывания на Spring Boot.
- [Контракт API](wise-lite-api.md) и [схема БД](wise-lite-schema.sql) — единый источник для
  Spring-версии. Бизнес-правила описаны там же.
- Правила рисков и IBAN вынесены в `frontend/lib/rules.ts` с тестами Vitest (8 тестов).

## Мои пути
`frontend/**`, `api-prototype/**`, `docs/developers/nikita/**`.

## Общие файлы, которые изменены (согласовано устно)
- `frontend/` целиком, включая `package-lock.json` (Next.js заменён на Expo).
- `.gitignore` (`dist/`, `.expo/`), `README.md`, `docs/demo.md` (команды запуска).
- `.github/workflows/ci.yml` и `.nvmrc` **не менялись**: скрипты `lint`, `typecheck`, `test`,
  `build` у нового фронтенда совпадают с теми, что вызывает CI.

## Проверки
`npm run check` в `frontend/`: lint, typecheck, 8 тестов, `expo export -p web` — проходит.
Бэкенд-прототип проверен вручную `curl` на Postgres из `compose.yaml`.

## Ограничения
- Переписывание бэкенда на Spring Boot не сделано. Прототип не проверяет, кто вызывает API.
- Старой проверки «Check connection» (Next → Spring → Postgres) во фронтенде больше нет.
- Тестов UI нет, только чистые правила.
- Postgres на `5432` может быть занят локальным; запуск: `POSTGRES_PORT=5433 docker compose up -d --wait`.
