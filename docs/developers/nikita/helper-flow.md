# План: сторона помощника (Nikita) в полном Wise

Ветка: `codex/nikita-helper-flow`. Язык: русский.
Источник API: [wise-lite-api.md](wise-lite-api.md) (без изменений, новых эндпоинтов нет).
Общий план Артура: [README.md](README.md).

## Цель
Никита из обычного (full) Wise открывает «Family protection» и видит запросы Марии, правила защиты
и её историю. Экран одобрения и итоги приведены к утверждённым макетам.

## Что делаем
1. `app/approval.tsx` — по макету: без верхней карточки-колокольчика, без метки «Waiting»,
   серая карточка Recipient / Amount / Requested («5 min ago») / IBAN (только если есть),
   флаги причин, подсказка со щитом, Approve (зелёная), Decline (красный контур), «Call Mom» текстом.
   После решения — экран с галочкой: «Approved.» / «Declined.» / «Expired.», сумма и одна строка.
2. `app/full/payments.tsx` — пунктирная карточка «Family protection», только для роли Nikita.
3. `app/full/family.tsx` — хаб из трёх карточек: Requests (N), Protection rules (`/rules`), Maria’s history.
4. `app/full/requests.tsx` — все pending-запросы (не только первый) и отдельно уже отвеченные.
5. `app/full/history.tsx` — все операции Марии.
6. `app/full/_layout.tsx` — скрыть новые маршруты из таб-бара (`href: null`).

## Мои пути
`app/approval.tsx`, `app/full/**`, `features/helper/**`, `docs/developers/nikita/**`.

## Общие файлы
В этой задаче **не меняются**: `lib/wise-store.ts`, `components/wise.tsx`, `lib/wise-theme.ts`,
`global.css`, `app/_layout.tsx`, `package.json`, lockfile.
Ждут устного согласования с командой (предложенный владелец — Nikita, но не подтверждён):
`app/rules.tsx` (убрать дубли серых подписей, переключатель в строку заголовка),
`app/result.tsx` (убрать «You can return home.», упростить текст).

## Ограничения
- Вход и список людей для запросов денег не делаем: нет эндпоинтов в контракте.
- Push-уведомлений нет, только polling 1,5 с.
- Карточка и экраны видны только при `role === 'nikita'`.

## Проверки
`npm run check` из `frontend/`, затем ручной проход в двух вкладках браузера:
Maria 600 € Olga → Nikita: Payments → Family protection → Requests → Approve/Decline → результат у Марии.
