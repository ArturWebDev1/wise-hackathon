# Spring Boot backend

Java 21 и PostgreSQL. Код WiseEASE лежит в `src/main/java/com/team/hackathon/features/wiselite/`. Порядок реализации и принятые решения описаны в [роадмапе](../docs/developers/levin/spring-boot-backend.md) и [заметках](../docs/developers/levin/spring-boot-decisions.md).

## Запуск на Windows

Запусти PostgreSQL из корня репозитория.

```powershell
docker compose up -d --wait
```

В другом терминале запусти бэкенд. Деморежим включён в корневом `.env`, который Spring читает при запуске из корня проекта или из `backend/`.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

На macOS и Linux из `backend/` используй `./mvnw spring-boot:run`. API слушает `http://localhost:8080`. `/api/status` проверяет доступность базы. Аккаунты Марии и Никиты доступны по `maria@example.com` и `nikita@example.com` с демопаролем `WiseEaseDemo!`. Wise ID для знакомого получателя — `olga`, для нового — `anna`.

В этой ветке существующие кнопки Марии и Никиты открывают демосессии Spring. Из `frontend/` запусти `npm ci`, затем `npm run start -- --go --lan` для Expo Go или `npm run start -- --web` для браузера. По умолчанию клиент использует порт `8080` на хосте Expo. `EXPO_PUBLIC_API_URL` позволяет переопределить адрес. На телефоне укажи LAN IP компьютера со Spring. Веб-адрес вне стандартного порта Expo задаётся через `WISEEASE_CORS_ORIGIN_PATTERN` на сервере.

## Схема PostgreSQL и демоданные

Flyway применяет `src/main/resources/db/migration/V1__wiseease_schema.sql` перед запуском JPA. Hibernate проверяет соответствие сущностей схеме. Таблицы живут в отдельной схеме `wiseease`, старые `public.wl_*` и `public.we_*` остаются доступны старому коду.

Данные загружает повторяемая миграция `R__wiseease_demo_seed.sql`. При `WISEEASE_DEMO_ENABLED=true` она создаёт демосемью с фиксированным демопаролем на чистой схеме. Повторное включение режима сохраняет уже созданные аккаунты, баланс и историю, в том числе данные прежнего Java-сидера. Выключение режима отключает вставку новых демоданных. Для чистой демонстрации укажи новый `WISEEASE_DB_SCHEMA`, например `wiseease_demo2`.

## Быстрая проверка API

```powershell
$api = 'http://localhost:8080'
$login = Invoke-RestMethod -Method Post -Uri "$api/auth/login" -ContentType 'application/json' `
    -Body (@{ email = 'maria@example.com'; password = 'WiseEaseDemo!' } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri "$api/state" -Headers $headers
Invoke-RestMethod -Method Post -Uri "$api/transfers/preview" -Headers $headers -ContentType 'application/json' `
    -Body (@{ recipientId = 'anna'; amount = 600 } | ConvertTo-Json)
```

На чистых демоданных состояние покажет баланс 4 000 €, а предпросмотр вернёт `ABOVE_THRESHOLD` и `NEW_RECIPIENT`. Остальные методы описаны в [контракте API](../docs/developers/nikita/wise-lite-api.md).

## Код и проверки

- `api/WiseEaseController.java` — HTTP-вход, работа с сессией и маршруты WiseEASE.
- `application/Transfers.java` — причины одобрения, транзакции, сроки и решения.
- `application/Households.java` — представление счёта, история, настройки и денежные запросы.
- `application/Sessions.java` — вход и проверка токена сессии.
- `infrastructure/entity/` — JPA-сущности. `infrastructure/repository/` — Spring Data JPA-репозитории. `src/main/resources/db/migration/` — схема и демоданные.

Из `backend/` выполни `./mvnw verify` или `.\mvnw.cmd verify` на Windows. Проверки используют реальный PostgreSQL.

В `frontend/` команда `npm run check` запускает lint, TypeScript, Vitest и веб-сборку.
