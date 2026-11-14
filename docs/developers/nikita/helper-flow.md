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
3. `app/family-protection.tsx` — список людей, которых защищает Nikita: Maria (с числом ожидающих запросов),
   добавленные люди и пунктирная карточка «Add someone to protect».
   `app/family-person.tsx?id=` — у Марии три карточки: Requests (N), Protection rules (`/rules`), Maria’s history;
   у добавленного человека — статус «Invite sent», выбранные правила и «Remove».
   `app/family-add.tsx` — добавление в три шага: имя и кем приходится → лимит и проверка новых получателей →
   приглашение (системный Share, ссылка на 24 часа) → «Invite sent.»
4. `app/family-requests.tsx` — все pending-запросы (не только первый) и отдельно уже отвеченные.
5. `app/family-history.tsx` — все операции Марии.
6. Для роли Nikita `(tabs)/index.tsx` перенаправляет в `/full`; в `full/_layout.tsx` скрыта полоса «Back to Wise Lite»; на `full/index.tsx` баннер запросов или карточка «Family protection».

Экраны 3–5 лежат в корне `app/` как обычные Stack-экраны (как `approval`, `rules`). Внутри `app/full/` они
были скрытыми табами, и `Redirect` из `(tabs)/index` возвращал на `/full`.

## Полный Wise один в один (по скриншотам настоящего приложения)
Home, Cards, Recipients и Payments пересобраны по скриншотам реального Wise и захардкожены:
Home: баннер «Start using Wise now», «Welcome to Wise», Send / Add money / Upload, три пунктирные карточки,
Tasks, Your returns, Explore, Transfer calculator, «Your money, protected». Cards: Travel hub и «Global spending
made simple». Recipients: Invite / Add / Upload и список. Payments: Send / Request, шесть пунктирных карточек и
Payment tools (Wisetag, Send via link, Auto Conversions).
Наша функция вставлена в двух местах, как в продуктовом описании: **Payments → Payment tools → «Family protection»**
и **Home → Tasks → «Mom needs your help»** (появляется, когда есть запрос Марии). Код: `features/fullwise/*`,
route-файлы `app/full/*` стали тонкими. Фото и иллюстрации заменены плоскими формами, настоящие логотипы и
ассеты не копировались. Имена и Wisetag демонстрационные.

## Навигация Никиты в полном Wise
В полном Wise **работает только наша функция**: Payments → Payment tools → «Family protection», задача
«Mom needs your help» на Home (ведёт в Requests), аватар (переключение роли для демо), скрытие карточек
(Dismiss и крестики), нижние вкладки. Все остальные кнопки Wise (Send, Add money, Upload, Earn €150,
Scheduled transfers и так далее) намеренно ничего не делают: компонент `Tap` без `onPress` не реагирует на нажатие.
Баланс Марии Никите не показывается: вместо него «You protect Maria (Mom)».

## Мои пути
`app/approval.tsx`, `app/family-*.tsx`, `app/full/**`, `features/helper/**`, `docs/developers/nikita/**`.

## Общие файлы
В этой задаче **не меняются**: `lib/wise-store.ts`, `lib/wise-theme.ts`, `global.css`,
`app/_layout.tsx`, `package.json`, lockfile.
Изменены по прямому указанию разработчика (напомнить команде): `app/(tabs)/index.tsx` (Redirect для Nikita,
удалён `HelperHome`), `app/rules.tsx` (переключатель в строке заголовка, без дублей подписей),
`components/wise.tsx` (`DashedCard`: необязательный `trailing`). `app/result.tsx` не менялся.

## Ограничения
- Вход и список людей для запросов денег не делаем: нет эндпоинтов в контракте.
- Добавленные люди хранятся только локально на устройстве (`features/helper/people-store.ts`,
  AsyncStorage), сервер знает одну семью (Maria). Настоящая многосемейность требует нового контракта и схемы.
- Push-уведомлений нет, только polling 1,5 с.
- Карточка и экраны видны только при `role === 'nikita'`.

## Проверки
`npm run check` из `frontend/`, затем ручной проход в двух вкладках браузера:
Maria 600 € Olga → Nikita: Payments → Family protection → Requests → Approve/Decline → результат у Марии.
