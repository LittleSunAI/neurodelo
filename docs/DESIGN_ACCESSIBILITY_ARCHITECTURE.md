# Архитектура дизайна и доступности

## Принцип

Настройки интерфейса хранятся в `PlatformPreferences.appearance`, но их применение отделено от конкретных страниц.

- `AccessibilityBootstrap` читает сохранённые настройки до входа и применяет их к публичным и авторизационным страницам.
- `AccessibilitySync` синхронизирует настройки внутри авторизованного приложения.
- состояние записывается в data-атрибуты корневого элемента HTML.
- CSS использует эти атрибуты без привязки к React-компонентам.

## Корневые атрибуты

```text
data-theme="dark|light|system"
data-text-scale="compact|normal|large"
data-reduce-motion="true|false"
data-high-contrast="true|false"
```

## Дизайн-примитивы

`components/ui/primitives.tsx` содержит базовые элементы:

- Badge;
- Progress;
- SectionTitle;
- EmptyState;
- Card;
- Button;
- IconButton;
- Notice;
- Skeleton;
- VisuallyHidden.

Компоненты используют существующие CSS-классы, поэтому их можно внедрять постепенно без переписывания всех страниц.

## Мобильная навигация

- до 950 px основная боковая панель становится выдвижной;
- до 760 px появляется `MobileDock`;
- рабочая область получает нижний safe-area;
- технический индикатор runtime-режимов скрывается на телефоне;
- основные цели нажатия имеют высоту не менее 40–44 px.

## Клавиатура и экранные дикторы

- Ctrl/Cmd+K переводит фокус в поиск;
- Escape закрывает popover-окна верхней панели;
- ссылка skip-link переводит фокус к `main-content`;
- при смене раздела обновляется `document.title` и live-region;
- активный пункт навигации имеет `aria-current="page"`;
- прогресс использует `role="progressbar"` и числовые aria-атрибуты.

## Проверка

`tests/accessibility-static.mjs` проверяет:

- skip-link;
- main-content;
- live-region;
- aria-current;
- Ctrl/Cmd+K;
- разрешённое масштабирование viewport;
- reduced motion;
- высокий контраст;
- мобильную навигацию;
- видимый фокус;
- минимальный размер текста;
- доступные имена icon-button;
- семантику модальных окон.
