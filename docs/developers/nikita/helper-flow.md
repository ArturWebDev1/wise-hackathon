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
3. `app/family-protection.tsx` — хаб из трёх карточек: Requests (N), Protection rules (`/rules`), Maria’s history.
4. `app/family-requests.tsx` — все pending-запросы (не только первый) и отдельно уже отвеченные.
5. `app/family-history.tsx` — все операции Марии.
6. Для роли Nikita `(tabs)/index.tsx` перенаправляет в `/full`; в `full/_layout.tsx` скрыта полоса «Back to Wise Lite»; на `full/index.tsx` баннер запросов или карточка «Family protection».

Экраны 3–5 лежат в корне `app/` как обычные Stack-экраны (как `approval`, `rules`). Внутри `app/full/` они
были скрытыми табами, и `Redirect` из `(tabs)/index` возвращал на `/full`.

## Мои пути
`app/approval.tsx`, `app/family-*.tsx`, `app/full/**`, `features/helper/**`, `docs/developers/nikita/**`.

## Общие файлы
В этой задаче **не меняются**: `lib/wise-store.ts`, `components/wise.tsx`, `lib/wise-theme.ts`,
`global.css`, `app/_layout.tsx`, `package.json`, lockfile.
Изменены по прямому указанию разработчика (напомнить команде): `app/(tabs)/index.tsx` (Redirect для Nikita,
удалён `HelperHome`), `app/rules.tsx` (переключатель в строке заголовка, без дублей подписей),
`components/wise.tsx` (`DashedCard`: необязательный `trailing`). `app/result.tsx` не менялся.

## Ограничения
- Вход и список людей для запросов денег не делаем: нет эндпоинтов в контракте.
- Push-уведомлений нет, только polling 1,5 с.
- Карточка и экраны видны только при `role === 'nikita'`.

## Проверки
`npm run check` из `frontend/`, затем ручной проход в двух вкладках браузера:
Maria 600 € Olga → Nikita: Payments → Family protection → Requests → Approve/Decline → результат у Марии.
