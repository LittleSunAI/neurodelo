import type { CommunityRequest, ContributionTask, OpenSourceProject, Skill } from "../types/platform";

export const brand = {
  name: "NEURODELO",
  subtitle: "open-source hub",
};

export const skills: Skill[] = [
  { name: "Frontend", level: 7, progress: 72 },
  { name: "Backend", level: 4, progress: 46 },
  { name: "AI-инструменты", level: 8, progress: 81 },
  { name: "Базы данных", level: 5, progress: 58 },
];

const defaultXpPolicy = {
  requiresAcceptedResult: true,
  requiresMergeForCode: true,
  reviewXp: 70,
  documentationXp: 90,
  beginnerMultiplier: 1.15,
  maxTaskXp: 1000,
} as const;

export const openSourceProjects: OpenSourceProject[] = [
  {
    id: "open-companion",
    slug: "open-companion",
    title: "Open Companion",
    tagline: "Открытый AI-компаньон для игр",
    summary: "Платформа с профилями игр, структурированными знаниями, подсказками и расширяемыми адаптерами моделей.",
    description: "Open Companion помогает сообществу собирать структурированные знания об играх, подключать разные модели и создавать понятные инструменты для игроков. Проект развивается открыто: решения фиксируются в roadmap, задачи имеют критерии готовности, а принятые вклады становятся частью подтверждённого портфолио.",
    license: "Apache-2.0",
    stage: "MVP",
    status: "published",
    progress: 62,
    members: 8,
    contributors: 21,
    openTasks: 5,
    repository: "neurodelo/open-companion",
    defaultBranch: "main",
    stack: ["Next.js", "NestJS", "PostgreSQL", "LLM"],
    needs: ["Frontend", "QA", "Документация"],
    tags: ["AI", "Игры", "Knowledge base", "Beginner friendly"],
    beginnerFriendly: true,
    active: true,
    initials: "OC",
    ownerId: "mikhail-o",
    ownerName: "Михаил Орлов",
    createdAt: "12 марта 2026",
    updatedAt: "сегодня, 10:40",
    subscribers: 486,
    forumThreads: 34,
    readme: "Open Companion — открытая платформа игровых профилей и AI-помощников. Локальный запуск выполняется через npm ci и npm run dev. Перед первым вкладом изучите CONTRIBUTING.md.",
    contributionGuide: "Выберите небольшую issue, оставьте комментарий о намерении, создайте отдельную ветку, выполните проверки и откройте Pull Request со ссылкой на задачу. Один PR должен решать одну понятную проблему.",
    codeOfConduct: "Обсуждаем идеи уважительно, критикуем результат, а не человека. Запрещены дискриминация, давление, публикация чужих секретов и намеренное нарушение работы проекта.",
    roadmap: [
      { id: "oc-road-1", title: "Каркас платформы", summary: "Базовая навигация, профили игр и адаптеры данных.", state: "done", progress: 100, targetVersion: "v0.1", dueLabel: "завершено" },
      { id: "oc-road-2", title: "Паспорт игры", summary: "Структурированные системы, факты и интерфейсы игры.", state: "done", progress: 100, targetVersion: "v0.2", dueLabel: "завершено" },
      { id: "oc-road-3", title: "Командная база знаний", summary: "Совместное редактирование, ревью и история источников.", state: "active", progress: 58, targetVersion: "v0.3", dueLabel: "август 2026" },
      { id: "oc-road-4", title: "Плагины сообщества", summary: "Безопасные расширения и каталог адаптеров.", state: "planned", progress: 12, targetVersion: "v0.4", dueLabel: "осень 2026" },
    ],
    roles: [
      { id: "oc-role-fe", title: "Frontend contributor", skill: "Frontend", minLevel: 4, slots: 2, filled: 1, summary: "Мобильные экраны, доступность и дизайн-система.", mentorAvailable: true },
      { id: "oc-role-qa", title: "QA contributor", skill: "Тестирование", minLevel: 2, slots: 3, filled: 1, summary: "Проверка сценариев, баг-репорты и регрессия.", mentorAvailable: true },
      { id: "oc-role-docs", title: "Docs contributor", skill: "Документация", minLevel: 1, slots: 4, filled: 2, summary: "Инструкции запуска, примеры и глоссарий.", mentorAvailable: false },
    ],
    tasks: [
      { id: "oc-142", projectId: "open-companion", project: "Open Companion", title: "Сделать мобильную навигацию профиля игры", category: "Frontend", kind: "Код", difficulty: "Средняя", rewardXp: 420, estimatedTime: "4–6 часов", applicants: 2, slots: 1, requiredLevel: 4, summary: "Переработать вкладки профиля игры для экранов до 430 px и добавить клавиатурную доступность.", skills: ["Next.js", "CSS", "Accessibility"], issueLabel: "good-first-feature", mentorReview: true, repositoryPath: "issues/142" },
      { id: "oc-151", projectId: "open-companion", project: "Open Companion", title: "Переписать инструкцию локального запуска", category: "Документация", kind: "Документация", difficulty: "Начальная", rewardXp: 180, estimatedTime: "1 час", applicants: 0, slots: 2, requiredLevel: 1, summary: "Проверить установку на чистой Windows и обновить README понятными командами и решениями типичных ошибок.", skills: ["Markdown", "Windows", "Docs"], issueLabel: "documentation", mentorReview: false, repositoryPath: "issues/151" },
      { id: "oc-158", projectId: "open-companion", project: "Open Companion", title: "Добавить пустое состояние поиска", category: "Frontend", kind: "Код", difficulty: "Начальная", rewardXp: 220, estimatedTime: "2 часа", applicants: 1, slots: 1, requiredLevel: 2, summary: "Добавить понятное пустое состояние, кнопку сброса фильтров и тест для клавиатурного сценария.", skills: ["React", "UX", "Testing"], issueLabel: "good-first-issue", mentorReview: true, repositoryPath: "issues/158" },
    ],
    news: [
      { id: "oc-news-1", title: "Началась работа над версией v0.3", summary: "Фокус релиза — совместная база знаний, источники и понятное ревью изменений.", publishedAt: "сегодня", author: "Михаил Орлов", pinned: true },
      { id: "oc-news-2", title: "Открыты задачи для первого вклада", summary: "Добавлены небольшие задачи по документации, мобильной вёрстке и тестированию.", publishedAt: "15 июля", author: "Елена Ким", pinned: false },
    ],
    releases: [
      { id: "oc-release-2", version: "v0.2", title: "Паспорта игр", summary: "Добавлена структура игровых систем и единый формат данных.", publishedAt: "2 июля 2026", contributionCount: 18 },
      { id: "oc-release-1", version: "v0.1", title: "Первый каркас", summary: "Профиль игры, навигация и базовые AI-адаптеры.", publishedAt: "8 июня 2026", contributionCount: 12 },
    ],
    faq: [
      { id: "oc-faq-1", question: "Можно начать без большого опыта?", answer: "Да. Выберите задачу с меткой good-first-issue и запросите помощь наставника." },
      { id: "oc-faq-2", question: "Как начисляется XP?", answer: "XP появляется только после принятого результата. Для кода обычно требуется merge Pull Request." },
      { id: "oc-faq-3", question: "Можно использовать проект коммерчески?", answer: "Использование регулируется лицензией Apache-2.0. Проверьте её условия и сохраняйте необходимые уведомления." },
    ],
    xpPolicy: { ...defaultXpPolicy, reviewXp: 80, documentationXp: 110 },
  },
  {
    id: "photo-indexer",
    slug: "smart-photo-indexer",
    title: "Smart Photo Indexer",
    tagline: "Локальная каталогизация фотографий",
    summary: "Open-source приложение для индексации изображений, описаний, тегов и безопасной работы с локальными папками.",
    description: "Локальное приложение на Tauri, которое помогает индексировать большие коллекции фотографий без обязательной отправки файлов в облако. Сообщество улучшает производительность, доступность, поддержку Windows и безопасные AI-провайдеры.",
    license: "MIT", stage: "Прототип", status: "published", progress: 38, members: 5, contributors: 12, openTasks: 3,
    repository: "neurodelo/smart-photo-indexer", defaultBranch: "main", stack: ["Tauri", "React", "SQLite", "Rust"], needs: ["Rust", "UX", "Windows QA"], tags: ["Desktop", "Photos", "Privacy"], beginnerFriendly: false, active: true, initials: "SP",
    ownerId: "tbv", ownerName: "Тимур", createdAt: "21 июня 2026", updatedAt: "вчера", subscribers: 214, forumThreads: 18,
    readme: "Smart Photo Indexer работает локально и хранит индекс в SQLite. AI-функции подключаются только после явного согласия пользователя.",
    contributionGuide: "Сначала создайте issue с воспроизводимым сценарием. Изменения Rust и миграций требуют теста на чистой базе. UI-изменения должны иметь скриншоты до и после.",
    codeOfConduct: "Не публикуйте личные фотографии, токены и пути пользователей. Тестовые данные должны быть синтетическими.",
    roadmap: [
      { id: "sp-road-1", title: "Индекс без AI", summary: "Папки, миниатюры, SQLite и статусы.", state: "active", progress: 72, targetVersion: "v0.1", dueLabel: "август 2026" },
      { id: "sp-road-2", title: "Провайдеры описания", summary: "Mock и облачные адаптеры с согласием пользователя.", state: "planned", progress: 24, targetVersion: "v0.2", dueLabel: "осень 2026" },
    ],
    roles: [
      { id: "sp-role-rust", title: "Rust contributor", skill: "Backend", minLevel: 5, slots: 2, filled: 0, summary: "Файловая система, миграции и производительность.", mentorAvailable: false },
      { id: "sp-role-qa", title: "Windows QA", skill: "Тестирование", minLevel: 1, slots: 3, filled: 1, summary: "Чистая установка и сценарии работы с папками.", mentorAvailable: true },
    ],
    tasks: [
      { id: "sp-88", projectId: "photo-indexer", project: "Smart Photo Indexer", title: "Проверить импорт папок на Windows 11", category: "Тестирование", kind: "Тестирование", difficulty: "Начальная", rewardXp: 240, estimatedTime: "1–2 часа", applicants: 1, slots: 3, requiredLevel: 1, summary: "Пройти сценарии выбора папки, отмены операции, повторного импорта и записать воспроизводимые баг-репорты.", skills: ["QA", "Windows", "Баг-репорт"], issueLabel: "good-first-issue", mentorReview: true, repositoryPath: "issues/88" },
      { id: "sp-95", projectId: "photo-indexer", project: "Smart Photo Indexer", title: "Добавить пустой экран библиотеки", category: "Дизайн", kind: "Дизайн", difficulty: "Начальная", rewardXp: 260, estimatedTime: "2–3 часа", applicants: 0, slots: 1, requiredLevel: 2, summary: "Подготовить пустое состояние библиотеки и подсказку первого импорта.", skills: ["Figma", "UX", "Desktop"], issueLabel: "design", mentorReview: false, repositoryPath: "issues/95" },
    ],
    news: [{ id: "sp-news-1", title: "Опубликован технический план", summary: "Зафиксированы этапы от чтения папок до безопасного переименования.", publishedAt: "вчера", author: "Тимур", pinned: true }],
    releases: [{ id: "sp-release-0", version: "0.0.1", title: "Технический прототип", summary: "Каркас Tauri и тестовое чтение папок.", publishedAt: "10 июля 2026", contributionCount: 5 }],
    faq: [{ id: "sp-faq-1", question: "Фотографии отправляются в облако?", answer: "Нет по умолчанию. Облачная обработка включается отдельно и требует явного согласия." }],
    xpPolicy: { ...defaultXpPolicy, maxTaskXp: 800 },
  },
  {
    id: "knowledge-map", slug: "knowledge-map", title: "Knowledge Map", tagline: "Визуальная карта знаний сообщества", summary: "Инструмент для связывания документов, заметок, репозиториев и учебных материалов в единую графовую карту.",
    description: "Проект исследует, как объединить документы, репозитории и обсуждения в понятный граф знаний. Сейчас команда формирует требования, дизайн и модель хранения.",
    license: "MPL-2.0", stage: "Идея", status: "published", progress: 18, members: 11, contributors: 33, openTasks: 2, repository: "neurodelo/knowledge-map", defaultBranch: "main", stack: ["React", "TypeScript", "Graph DB"], needs: ["Архитектор", "Дизайнер", "Research"], tags: ["Knowledge", "Graph", "Research"], beginnerFriendly: true, active: true, initials: "KM", ownerId: "elena-k", ownerName: "Елена Ким", createdAt: "1 июля 2026", updatedAt: "3 часа назад", subscribers: 352, forumThreads: 41,
    readme: "Knowledge Map находится на стадии исследования. Приветствуются схемы, прототипы и аргументированные сравнения технологий.", contributionGuide: "На стадии идеи вклад оформляется через Discussion или небольшой документ. Для реализации создаётся issue с критериями результата.", codeOfConduct: "Фиксируйте источники, отделяйте факты от гипотез и уважайте альтернативные технические решения.",
    roadmap: [{ id: "km-road-1", title: "Исследование сценариев", summary: "Интервью, схемы и прототипы.", state: "active", progress: 48, targetVersion: "research-1", dueLabel: "август 2026" }, { id: "km-road-2", title: "Интерактивный прототип", summary: "Навигация по графу и поиск источников.", state: "planned", progress: 5, targetVersion: "v0.1", dueLabel: "осень 2026" }],
    roles: [{ id: "km-role-arch", title: "Solution architect", skill: "Архитектура", minLevel: 6, slots: 1, filled: 0, summary: "Сравнение графовых хранилищ и модели синхронизации.", mentorAvailable: false }, { id: "km-role-design", title: "Product designer", skill: "Дизайн", minLevel: 3, slots: 2, filled: 1, summary: "Прототип карты и сценарии навигации.", mentorAvailable: true }],
    tasks: [{ id: "km-31", projectId: "knowledge-map", project: "Knowledge Map", title: "Нарисовать схему первого экрана", category: "Дизайн", kind: "Дизайн", difficulty: "Начальная", rewardXp: 300, estimatedTime: "2–4 часа", applicants: 4, slots: 2, requiredLevel: 2, summary: "Подготовить wireframe главной карты, панели источников и режима быстрого поиска.", skills: ["Figma", "UX", "Wireframe"], issueLabel: "design-needed", mentorReview: false, repositoryPath: "discussions/31" }],
    news: [{ id: "km-news-1", title: "Открыто исследование графовых баз", summary: "Собираем сравнение Neo4j, PostgreSQL и локальных вариантов.", publishedAt: "сегодня", author: "Елена Ким", pinned: true }], releases: [], faq: [{ id: "km-faq-1", question: "Можно помочь без кода?", answer: "Да. Нужны исследования, схемы, UX-прототипы и примеры реальных сценариев." }], xpPolicy: { ...defaultXpPolicy, beginnerMultiplier: 1.25 },
  },
  {
    id: "local-ai-workbench", slug: "local-ai-workbench", title: "Local AI Workbench", tagline: "Единый интерфейс для локальных моделей", summary: "Рабочее пространство для Ollama-совместимых моделей, сценариев, инструментов и безопасных локальных агентов.",
    description: "Local AI Workbench объединяет локальные модели, инструменты и сценарии в одном интерфейсе. Главный приоритет — безопасность ключей, прозрачность действий и работа без обязательного облака.",
    license: "GPL-3.0", stage: "Развитие", status: "published", progress: 78, members: 14, contributors: 58, openTasks: 4, repository: "neurodelo/local-ai-workbench", defaultBranch: "main", stack: ["Python", "React", "Ollama", "Docker"], needs: ["Python", "Security", "Docs"], tags: ["Local AI", "Agents", "Security"], beginnerFriendly: true, active: true, initials: "LW", ownerId: "daniel-s", ownerName: "Даниил Соколов", createdAt: "18 января 2026", updatedAt: "40 минут назад", subscribers: 1290, forumThreads: 86,
    readme: "Локальная рабочая среда для моделей и инструментов. Перед запуском ознакомьтесь с моделью угроз и правилами хранения секретов.", contributionGuide: "Изменения безопасности требуют описания угроз и тестов. Новые провайдеры реализуются через общий контракт и не должны читать лишние данные.", codeOfConduct: "Не публикуйте реальные ключи, вредоносные сценарии и обходы защиты. Демонстрации должны быть безопасными и воспроизводимыми.",
    roadmap: [{ id: "lw-road-1", title: "Локальные провайдеры", summary: "Ollama, управление моделями и контекстом.", state: "done", progress: 100, targetVersion: "v1.0", dueLabel: "завершено" }, { id: "lw-road-2", title: "Безопасные инструменты", summary: "Разрешения, журналы и изоляция действий.", state: "active", progress: 74, targetVersion: "v1.2", dueLabel: "август 2026" }, { id: "lw-road-3", title: "Каталог сценариев", summary: "Проверенные шаблоны автоматизации.", state: "planned", progress: 20, targetVersion: "v1.3", dueLabel: "осень 2026" }],
    roles: [{ id: "lw-role-sec", title: "Security reviewer", skill: "Security", minLevel: 7, slots: 2, filled: 1, summary: "Модель угроз, ревью секретов и изоляции.", mentorAvailable: false }, { id: "lw-role-docs", title: "Technical writer", skill: "Документация", minLevel: 2, slots: 3, filled: 1, summary: "Инструкции локального запуска и провайдеров.", mentorAvailable: true }],
    tasks: [{ id: "lw-207", projectId: "local-ai-workbench", project: "Local AI Workbench", title: "Добавить страницу безопасного хранения ключей", category: "Backend", kind: "Код", difficulty: "Высокая", rewardXp: 760, estimatedTime: "2–3 дня", applicants: 3, slots: 1, requiredLevel: 6, summary: "Реализовать абстракцию секретного хранилища и документировать модель угроз без передачи ключей в интерфейс.", skills: ["Python", "Security", "API"], issueLabel: "security", mentorReview: true, repositoryPath: "issues/207" }],
    news: [{ id: "lw-news-1", title: "Вышел аудит модели разрешений", summary: "Опубликованы риски и план изоляции инструментов.", publishedAt: "сегодня", author: "Даниил Соколов", pinned: true }], releases: [{ id: "lw-release-12", version: "v1.2-beta", title: "Разрешения инструментов", summary: "Первый вариант политик и журнала действий.", publishedAt: "12 июля 2026", contributionCount: 27 }], faq: [{ id: "lw-faq-1", question: "Нужен ли Docker?", answer: "Нет для базового режима, но он рекомендуется для изоляции отдельных провайдеров." }], xpPolicy: { ...defaultXpPolicy, reviewXp: 120, maxTaskXp: 1200 },
  },
];

export const contributionTasks: ContributionTask[] = openSourceProjects.flatMap((project) => project.tasks);


export const specialists = [
  { name: "Алина Морозова", role: "Контрибьютор · AI-дизайн", rating: 4.9, reliability: 98, projects: 11, contributions: 48, available: true, initials: "АМ", skills: ["Figma", "Midjourney", "UX"] },
  { name: "Михаил Орлов", role: "Мейнтейнер · Full-stack", rating: 4.8, reliability: 96, projects: 7, contributions: 126, available: false, initials: "МО", skills: ["React", "NestJS", "PostgreSQL"] },
  { name: "Елена Ким", role: "Ментор · QA и аналитика", rating: 5.0, reliability: 100, projects: 9, contributions: 74, available: true, initials: "ЕК", skills: ["QA", "ТЗ", "Аудит"] },
  { name: "Даниил Соколов", role: "Контрибьютор · AI-автоматизация", rating: 4.7, reliability: 93, projects: 6, contributions: 39, available: true, initials: "ДС", skills: ["Python", "n8n", "LLM"] },
];

export const communityRequests: CommunityRequest[] = [
  {
    id: "req-1",
    title: "Нужна помощь с простым Telegram-ботом",
    author: "Игорь П.",
    type: "Платный запрос",
    budget: "до 8 000 ₽",
    category: "Автоматизация",
    summary: "Небольшой бот для записи заявок в Google-таблицу. Договорённости и расчёты происходят напрямую между участниками.",
    responseCount: 5,
    publishedAt: "25 минут назад",
    skills: ["Python", "Telegram Bot", "Google Sheets"],
  },
  {
    id: "req-2",
    title: "Подскажите, как исправить миграцию SQLite",
    author: "Марина К.",
    type: "Бесплатная помощь",
    category: "Базы данных",
    summary: "После обновления приложения одна колонка не создаётся. Нужен совет или короткое ревью схемы.",
    responseCount: 8,
    publishedAt: "1 час назад",
    skills: ["SQLite", "Migration", "Tauri"],
  },
  {
    id: "req-3",
    title: "Сверстать один адаптивный экран",
    author: "Денис Л.",
    type: "Платный запрос",
    budget: "по договорённости",
    category: "Frontend",
    summary: "Есть готовый макет в Figma. Платформа не участвует в оплате и не гарантирует исполнение.",
    responseCount: 3,
    publishedAt: "сегодня",
    skills: ["React", "CSS", "Figma"],
  },
];

export const courses = [
  { title: "Первый вклад в open source", author: "Команда Neurodelo", lessons: 12, students: 1540, level: "Начальный", progress: 64 },
  { title: "Git и Pull Request без страха", author: "Илья Романов", lessons: 18, students: 932, level: "Средний", progress: 18 },
  { title: "Как проверять чужой код", author: "Команда CodeGuard", lessons: 12, students: 407, level: "Продвинутый", progress: 0 },
];

export const projectContributors = [
  { id: "mikhail-o", name: "Михаил Орлов", initials: "МО", role: "Lead maintainer", primarySkill: "Backend", acceptedContributions: 18, projectXp: 4820, kudos: 26, heroClass: "guardian", status: "active", lastContribution: "Проверил архитектуру API" },
  { id: "elena-k", name: "Елена Ким", initials: "ЕК", role: "Mentor и QA", primarySkill: "QA", acceptedContributions: 9, projectXp: 2840, kudos: 31, heroClass: "architect", status: "review", lastContribution: "Чек-лист доступности" },
  { id: "alina-m", name: "Алина Морозова", initials: "АМ", role: "Design contributor", primarySkill: "Design", acceptedContributions: 5, projectXp: 1920, kudos: 18, heroClass: "pathfinder", status: "active", lastContribution: "Мобильные empty states" },
  { id: "ivan-k", name: "Иван Крылов", initials: "ИК", role: "Docs contributor", primarySkill: "Документация", acceptedContributions: 4, projectXp: 1160, kudos: 11, heroClass: "technomancer", status: "active", lastContribution: "Инструкция Windows" },
] satisfies import("../types/platform").ProjectContributor[];

export const rewardCatalog = [
  { id: "frame-cyan-pulse", kind: "frame", title: "Рамка «Пульс кода»", description: "Бирюзовая рамка профиля с мягкой пульсацией.", cost: 35, rarity: "Редкая", preview: "cyan" },
  { id: "badge-first-merge", kind: "badge", title: "Значок «Первый merge»", description: "Открывается после первого принятого вклада.", cost: 0, rarity: "Обычная", preview: "merge" },
  { id: "companion-byte", kind: "companion", title: "Спутник Байт", description: "Небольшой цифровой помощник рядом с героем.", cost: 80, rarity: "Эпическая", preview: "byte" },
  { id: "title-rescue", kind: "title", title: "Титул «Спасатель релиза»", description: "Для участника, который помог завершить критический этап.", cost: 55, rarity: "Редкая", preview: "rescue" },
  { id: "effect-open-source", kind: "effect", title: "Эффект «Открытая энергия»", description: "Косметический фон героя для активных контрибьюторов.", cost: 120, rarity: "Легендарная", preview: "energy" },
] satisfies import("../types/platform").RewardCatalogItem[];
