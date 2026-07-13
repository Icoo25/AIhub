# AI Компас

> Вътрешна AI лаборатория за знания, инструменти, новини и експерименти.

**AI Компас** е full-stack вътрешнофирмена платформа, която събира на едно място полезната AI информация на екипа. Продуктът замества разпръснати Trello карти, линкове, бележки и тестове с организирано работно пространство на български език.

- Production: [a-ihub-seven.vercel.app](https://a-ihub-seven.vercel.app/)
- Repository: [github.com/Icoo25/AIhub](https://github.com/Icoo25/AIhub)
- Интерфейс: изцяло на български
- Достъп: само за поканени членове на екипа
- Дизайн: responsive SaaS интерфейс в светла бежова палитра

## Съдържание

1. [Основни възможности](#основни-възможности)
2. [Роли и права](#роли-и-права)
3. [Технологии](#технологии)
4. [Архитектура](#архитектура)
5. [Страници и маршрути](#страници-и-маршрути)
6. [Модел на данните](#модел-на-данните)
7. [Authentication и сигурност](#authentication-и-сигурност)
8. [Локално стартиране](#локално-стартиране)
9. [Supabase настройка](#supabase-настройка)
10. [Deployment във Vercel](#deployment-във-vercel)
11. [Тестване](#тестване)
12. [Производителност](#производителност)
13. [Отстраняване на проблеми](#отстраняване-на-проблеми)

## Основни възможности

### Dashboard

Началната страница дава бърз оперативен преглед:

- брой входящи записи;
- съдържание за преглед;
- общ брой AI инструменти;
- общ брой експерименти;
- последни експерименти и техния резултат;
- любими AI инструменти;
- последни публикации от инфо потока;
- меню за бързо добавяне на съдържание.

### Входящи

„Входящи“ е мястото за бързо записване на все още необработена информация.

- добавяне на идея, линк или бележка;
- търсене и филтриране;
- приоритет, тагове, категория и оценка;
- преобразуване към запис в AI библиотеката;
- преобразуване към AI инструмент;
- преобразуване към новина;
- преобразуване към експеримент;
- автоматично архивиране на обработения входящ запис;
- връзка между оригиналния запис и създадения обект.

### AI инструменти

Каталог за инструментите, които организацията използва или проучва.

- добавяне, редактиране и изтриване;
- търсене по име и описание;
- филтриране по категория;
- изглед с карти или списък;
- статуси „Активен“, „В тестване“ и „Архивиран“;
- рейтинг от 0 до 5, визуализиран със звезди;
- избор на рейтинг директно от формата;
- персонални любими инструменти;
- автоматично извличане на икона от адреса на сайта;
- резервна икона с инициал, ако favicon не може да бъде зареден;
- директен линк към сайта на инструмента.

### Инфо поток

Структуриран поток за AI новини и полезни публикации.

- добавяне и редактиране на новина;
- заглавие, резюме, източник, категория и дата;
- списък, търсене и категории;
- директно отваряне на оригиналния източник;
- импорт от уеб страница или RSS поток.

### Експерименти

Работен процес за документиране на AI тестове от идея до решение.

- Kanban и списъчен изглед;
- преместване между етапите с drag and drop;
- етапи „Идея“, „Планиран“, „В процес“, „Завършен“, „За внедряване“ и „Отхвърлен“;
- описание и хипотеза;
- използван модел;
- prompt, тестови данни и настройки;
- сравнение с втори модел или prompt;
- резултат и оценка от 0 до 10;
- финално решение;
- статистика за активни, приключени и одобрени за внедряване тестове.

### AI библиотека

Гъвкава база от знания, вдъхновена от работния процес в Trello.

- типове съдържание: ресурс, източник, бележка, инструмент, новина, експеримент, съвет, идея, prompt, обучение и видео;
- Kanban, grid и list изглед;
- собствени етапи на работа;
- колекции, категории и тагове;
- лични и споделени записи;
- приоритет, рейтинг и състояние на прочитане;
- отговорник и краен срок;
- закачане на важни записи;
- архивиране и възстановяване;
- запазени персонални филтри и изгледи;
- свързване на знания с инструменти, новини и експерименти;
- история на промените;
- частни прикачени файлове в Supabase Storage.

### Център за импорт

- извличане на заглавие и описание от публичен URL;
- импорт като новина или библиотечен източник;
- RSS preview и избор на конкретни публикации;
- автоматично предложение за категория;
- импорт на Trello JSON export;
- превръщане на Trello списъците в категории;
- пренасяне на описания, линкове и labels.

### Търсене и навигация

- глобално търсене в инструменти, новини, експерименти и библиотека;
- търсене след въвеждане на поне два знака;
- командно меню с `Ctrl + K`;
- навигация с клавишите `↑`, `↓`, `Enter` и `Esc`;
- responsive странична и мобилна навигация;
- потребителско dropdown меню за настройки и изход.

### Екип и настройки

- списък на регистрираните потребители;
- промяна на роли от администратор;
- създаване и отмяна на фирмени покани;
- покана, валидна 7 дни и само за конкретния имейл;
- защита на собствената администраторска роля;
- промяна на име и парола;
- журнал на активността.

## Роли и права

| Роля | Разглеждане | Библиотека и входящи | Инструменти, новини и експерименти | Екип и роли |
|---|---:|---:|---:|---:|
| **Наблюдател** (`viewer`) | Да | Не | Не | Не |
| **Изследовател** (`researcher`) | Да | Добавяне и подреждане | Не | Не |
| **Редактор** (`editor`) | Да | Пълно управление | Пълно управление | Не |
| **Администратор** (`admin`) | Да | Пълно управление | Пълно управление | Да |

Стойността `member` се поддържа само за съвместимост със стари профили и се визуализира като „Наблюдател“.

Правата не се контролират единствено от интерфейса. Supabase Row Level Security (RLS) прилага съответните ограничения и на ниво база данни.

## Технологии

### Frontend

- [Next.js](https://nextjs.org/) 15 с App Router;
- React 19;
- TypeScript;
- Tailwind CSS 3;
- Lucide React икони.

### Backend

- [Supabase](https://supabase.com/) PostgreSQL Database;
- Supabase Authentication;
- Supabase Row Level Security;
- Supabase Storage;
- `@supabase/ssr` за server-side session и middleware;
- `@supabase/supabase-js` за browser data operations.

### Hosting

- GitHub за source control;
- Vercel за build и deployment;
- Supabase като управляван backend.

## Архитектура

```text
Browser
   │
   ├── Next.js App Router
   │     ├── auth routes
   │     ├── protected dashboard routes
   │     ├── reusable React components
   │     └── /api/import/preview
   │
   ├── Supabase Auth ── profiles и sessions
   ├── Supabase Database ── бизнес данни и RLS
   └── Supabase Storage ── private knowledge-files bucket
```

Основните слоеве са:

- `app/` — маршрути, layouts и API endpoint;
- `components/` — екраните и споделените UI компоненти;
- `lib/data.ts` — централен data access слой;
- `lib/auth-context.tsx` — активен профил и роля;
- `lib/permissions.ts` — правила за достъп в интерфейса;
- `lib/supabase/` — browser и server Supabase clients;
- `supabase/` — SQL структура, policies, функции, triggers и начални данни;
- `public/` — изображенията на login екрана.

## Структура на проекта

```text
AI Компас/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/
│   │   ├── activity/
│   │   ├── experiments/
│   │   ├── import/
│   │   ├── inbox/
│   │   ├── library/
│   │   ├── news/
│   │   ├── search/
│   │   ├── settings/
│   │   ├── team/
│   │   └── tools/
│   ├── api/import/preview/
│   ├── auth/callback/
│   ├── globals.css
│   └── layout.tsx
├── components/
├── lib/
│   └── supabase/
├── public/
├── supabase/
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

## Страници и маршрути

| Маршрут | Предназначение | Достъп |
|---|---|---|
| `/login` | Вход в платформата | Публичен |
| `/register?invite=...` | Регистрация с фирмена покана | Само с token |
| `/forgot-password` | Заявка за възстановяване на парола | Публичен |
| `/reset-password` | Задаване на нова парола | Recovery session |
| `/auth/callback` | Supabase email confirmation callback | Системен |
| `/` | Dashboard | Влезли потребители |
| `/inbox` | Бързо събиране и обработване на информация | Според ролята |
| `/library` | AI библиотека | Според ролята |
| `/tools` | Каталог с AI инструменти | Според ролята |
| `/news` | Инфо поток | Според ролята |
| `/experiments` | AI експерименти | Според ролята |
| `/import` | URL, RSS и Trello импорт | Contributor роли |
| `/search` | Глобално търсене | Влезли потребители |
| `/activity` | Журнал на активността | Влезли потребители |
| `/team` | Покани, потребители и роли | Администратор |
| `/settings` | Име и парола | Влезли потребители |

`middleware.ts` защитава всички маршрути извън authentication зоната. В production Supabase валидира потребителя server-side преди зареждане на защитената част.

## Модел на данните

Приложението използва следните основни Supabase обекти:

| Таблица | Предназначение |
|---|---|
| `ai_tools` | AI инструменти, категории, статуси и рейтинг |
| `tool_favorites` | Персонални любими инструменти |
| `ai_news` | Новини и публикации в инфо потока |
| `experiments` | Документация и workflow на експериментите |
| `knowledge_items` | Основни записи във входящи и AI библиотеката |
| `knowledge_collections` | Колекции в библиотеката |
| `knowledge_stages` | Конфигурируеми Kanban етапи |
| `knowledge_attachments` | Метаданни за прикачени файлове |
| `knowledge_item_history` | История на промените |
| `saved_views` | Персонални и споделени изгледи |
| `entity_links` | Връзки между знания, инструменти, новини и експерименти |
| `profiles` | Име, имейл и роля на потребителя |
| `team_invites` | Token-и за фирмени покани |
| `activity_log` | Журнал на потребителските действия |

Storage bucket-ът `knowledge-files` е частен. Файловете се отварят чрез краткотраен signed URL, а текущият лимит за един файл е 20 MB.

## Authentication и сигурност

### Invite-only регистрация

Публичната регистрация не се използва. Работният процес е:

1. Администраторът отваря „Екип и роли“.
2. Въвежда служебния имейл и избира роля.
3. Платформата създава уникален линк `/register?invite=TOKEN`.
4. Линкът работи 7 дни и само за посочения имейл.
5. След регистрация Supabase изпраща email confirmation.
6. Потвърждението връща потребителя през `/auth/callback`.
7. Създава се ред в `profiles`, а поканата се маркира като използвана.

`supabase/invite-only-auth.sql` съдържа Before User Created hook, който отхвърля регистрация без валидна покана и на backend ниво.

### Защитни механизми

- защитени dashboard маршрути;
- server-side проверка на Supabase session в production;
- RLS за всички бизнес таблици;
- роли и права в базата данни;
- частен Storage bucket;
- signed URLs за файлове;
- защита срещу достъп до локални/private адреси при URL import;
- ограничение на отговорите и timeout при външен import;
- custom confirmation dialogs вместо browser `confirm()`;
- липса на `service_role` ключ във frontend кода.

Никога не добавяйте Supabase `service_role` ключ в променлива с префикс `NEXT_PUBLIC_` или в GitHub repository.

## Локално стартиране

### Изисквания

- Node.js 20 LTS или по-нова поддържана версия;
- npm;
- Supabase проект за реален режим;
- Git по желание.

### 1. Изтегляне и инсталиране

```bash
git clone https://github.com/Icoo25/AIhub.git
cd AIhub
npm install
```

### 2. Environment variables

Копирайте `.env.example` като `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_DEMO_MODE=false
```

Значение на променливите:

| Променлива | Задължителна | Описание |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Да | Project URL от Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Да | Publishable/anon public key |
| `NEXT_PUBLIC_DEMO_MODE` | Да | `false` за реална база, `true` за demo данни |

Файлът `.env.local` не трябва да се качва в GitHub.

### 3. Стартиране

```bash
npm run dev
```

Отворете [http://localhost:3000](http://localhost:3000).

Процесът работи само докато терминалът е отворен. Спрете го с `Ctrl + C`, когато приключите, за да не натоварва машината.

### Demo режим

За преглед без Supabase:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Demo режимът използва примерните данни от `lib/demo-data.ts`. Промените са временни и не трябва да се приемат като записани в база данни.

## Supabase настройка

### 1. Създаване на проект

1. Създайте нов Supabase проект.
2. Отворете **Project Settings → API**.
3. Копирайте Project URL и publishable/anon key.
4. Добавете ги в `.env.local` и във Vercel Environment Variables.

### 2. SQL структура

За нова среда SQL файловете се изпълняват в **Supabase → SQL Editor** в следния логически ред:

1. `supabase/schema.sql` — основни таблици за инструменти, новини и експерименти;
2. `supabase/seed.sql` — примерни данни, по желание;
3. `supabase/knowledge-library.sql` — начална AI библиотека;
4. `supabase/roles-and-permissions.sql` — профили, първи администратор и RLS;
5. `supabase/library-enhancements.sql` — колекции, етапи, история и Storage;
6. `supabase/platform-enhancements.sql` — покани, любими, activity log и profile helpers;
7. `supabase/flexible-workspace.sql` — четирите роли, saved views и разширени библиотечни полета;
8. `supabase/workflow-and-links.sql` — workflow на експериментите и връзки между обектите;
9. `supabase/invite-only-auth.sql` — backend забрана за регистрация без покана.

`seed.sql` е по желание и е предназначен за празна тестова среда. Не го изпълнявайте повторно върху production, ако не искате дублирани примерни записи.

При вече работещия production проект не изпълнявайте всички миграции отначало. Прилагайте само новия SQL файл, който придружава конкретна промяна.

### 3. Email Authentication

В **Authentication → Providers**:

- активирайте Email provider;
- оставете email confirmation включен за production;
- настройте подходящ email template и sender при фирмена употреба.

### 4. URL Configuration

В **Authentication → URL Configuration** задайте:

- Site URL: `https://a-ihub-seven.vercel.app` или бъдещия custom domain;
- Redirect URLs:

```text
http://localhost:3000/**
http://localhost:3000/auth/callback
https://a-ihub-seven.vercel.app/**
https://a-ihub-seven.vercel.app/auth/callback
```

Ако използвате друг Vercel preview или production domain, добавете и него.

### 5. Invite-only hook

След изпълнение на `invite-only-auth.sql`:

1. отворете **Authentication → Hooks**;
2. намерете **Before User Created**;
3. изберете Postgres функцията `public.hook_require_valid_invite`;
4. запазете настройката;
5. тествайте валидна покана и директен опит за регистрация без token.

Преди активиране на hook-а трябва вече да има първи администратор, който да може да създава покани.

## Deployment във Vercel

### Първи deployment

1. Качете проекта в GitHub repository.
2. Влезте във Vercel и изберете **Add New → Project**.
3. Import-нете `Icoo25/AIhub`.
4. Framework preset трябва автоматично да бъде **Next.js**.
5. Добавете environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_DEMO_MODE=false
```

6. Стартирайте deployment.
7. Добавете Vercel URL адреса в Supabase Authentication URL Configuration.

Vercel използва:

```bash
npm run build
```

Не е необходим custom output directory.

### Следващи промени

Всеки push към свързания GitHub branch стартира нов deployment. След успешен deployment използвайте `Ctrl + F5`, ако браузърът показва стар CSS, заглавие или asset.

## Команди

| Команда | Предназначение |
|---|---|
| `npm install` | Инсталира dependencies |
| `npm run dev` | Стартира development server |
| `npx tsc --noEmit` | Проверява TypeScript типовете |
| `npm run build` | Production build и цялостна Next.js проверка |
| `npm run start` | Стартира вече създадения production build |

Препоръчителна проверка преди качване:

```bash
npx tsc --noEmit
npm run build
```

## Тестване

### Authentication

- директното отваряне на `/register` без `invite` връща към `/login`;
- логото на login екрана не отваря защитената платформа;
- невалидна или изтекла покана не позволява регистрация;
- валидна покана работи само за посочения имейл;
- email confirmation връща през `/auth/callback`;
- входът работи след потвърждение;
- изходът прекратява session-а;
- защитен маршрут без session връща към `/login`;
- forgot/reset password работят с production URL.

### AI инструменти

- добавяне, редактиране и изтриване;
- търсене и филтър по категория;
- grid/list превключване;
- избор и запазване на рейтинг;
- favicon се извлича от сайта;
- fallback инициал се показва при невалидна икона;
- любимите са персонални;
- външният линк се отваря в нов tab.

### Библиотека и входящи

- бърз запис във входящи;
- преобразуване към четирите възможни дестинации;
- grid/list/Kanban изгледи;
- drag and drop между етапи;
- филтри, колекции и saved views;
- личен запис не се вижда от друг потребител;
- архивиране и възстановяване;
- качване, отваряне и изтриване на файл;
- история на промените;
- връзки между обекти.

### Експерименти

- създаване на пълна документация;
- преместване между Kanban етапи;
- сравнение на два модела;
- оценка и финално решение;
- филтър и търсене;
- изтриване чрез custom confirmation modal.

### Импорт

- публична `https://` статия;
- redirect към друга публична страница;
- RSS feed и избор на публикации;
- Trello JSON export;
- отказ за `localhost`, private IP и невалиден URL;
- подходящо съобщение при timeout или недостъпен сайт.

### Роли

Тествайте с отделен акаунт за всяка роля. Не е достатъчно само бутоните да са скрити — забранената операция трябва да бъде отказана и от Supabase RLS.

## Производителност

В приложението са приложени следните оптимизации:

- singleton Supabase browser client;
- краткотраен in-memory cache за повторни заявки;
- deduplication на едновременни заявки;
- целево invalidation след промяна;
- локално обновяване на React state вместо пълно презареждане;
- lazy loading на каталозите за свързани обекти;
- server-side филтриране на входящи записи;
- по-леки experiment summaries за dashboard и търсене;
- deferred search при големи списъци;
- лимити на заявките;
- off-screen rendering оптимизация за Kanban карти;
- оптимизирано WebP изображение за login екрана;
- намалени blur ефекти;
- AVIF/WebP и image cache настройки в Next.js.

Първото зареждане от Supabase може да отнеме повече време. Повторните отваряния в рамките на cache прозореца обикновено са по-бързи.

## UI и дизайн

- бежова, olive и мека violet цветова система;
- професионална SaaS визуална йерархия;
- отделен desktop/mobile login layout;
- 3D AI compass фон;
- responsive карти, таблици и Kanban колони;
- достъпни labels, dialog роли и keyboard navigation;
- логични custom modals за опасни операции;
- browser title и application name „AI Компас“.

Основният фон на login екрана е:

```text
public/ai-compass-login-background-v3.webp
```

WebP версията се използва в runtime за по-малък размер и по-бързо зареждане.

## Отстраняване на проблеми

### Browser tab-ът показва старото име

Проверете `app/layout.tsx`, изчакайте Vercel deployment-а и обновете с `Ctrl + F5`.

### След login потребителят остава на същата страница

- проверете URL и anon key във Vercel;
- проверете Supabase Site URL и Redirect URLs;
- проверете дали email адресът е потвърден;
- изтрийте старите cookies и влезте отново;
- прегледайте Vercel Function Logs и browser Network tab.

Ред в `profiles` е необходим за роля и име, но Supabase Auth session се управлява от `auth.users`, а не чрез ръчно създаден потребителски ред.

### Потвърждението по имейл отваря грешен адрес

Добавете точния production domain и `/auth/callback` в Supabase Authentication URL Configuration. Проверете и Site URL.

### Данните не се зареждат

- уверете се, че `NEXT_PUBLIC_DEMO_MODE=false`;
- проверете дали всички нужни SQL миграции са изпълнени;
- проверете RLS policy за текущата роля;
- потърсете липсваща таблица или колона в browser console;
- проверете Supabase Logs.

### Иконата на AI инструмент липсва

Уверете се, че адресът е пълен, например `https://example.com`. Някои сайтове блокират favicon заявки; тогава платформата показва резервен инициал.

### `self is not defined` в middleware build

Не импортирайте browser-only зависимости в `middleware.ts` или server компоненти. Supabase middleware трябва да използва `@supabase/ssr`, без код, който очаква `window` или `self`.

### Vercel build не намира компонент

Проверете дали новият файл действително е качен в GitHub, дали главните/малките букви съвпадат и дали import path-ът е точен. GitHub и Vercel са case-sensitive дори когато локалният Windows filesystem не е.

### Локалният адрес не работи

Development server-ът спира при затваряне на терминала или Codex процеса, който го е стартирал. Стартирайте отново с `npm run dev` и проверете дали порт 3000 не е зает.

## Работа с данните

- Не редактирайте production данни директно, ако операцията съществува в интерфейса.
- Не изтривайте SQL migrations, които вече са използвани.
- За всяка нова database промяна добавяйте отделен migration файл.
- Не променяйте стари migrations след production приложение; създавайте нови idempotent промени.
- Използвайте `if not exists` и `drop policy if exists`, когато това е безопасно.
- Винаги проверявайте RLS с потребител без администраторски права.

## Име и продуктова посока

**AI Компас** изразява ролята на платформата: да дава посока към по-умна работа с AI, без да автоматизира сляпо събирането на информация. Екипът сам подбира стойностните източници, инструменти, съвети и експерименти и ги превръща в споделено фирмено знание.

---

Вътрешен фирмен продукт. Не публикувайте environment variables, покани, лични данни или вътрешни файлове в публичен repository.
