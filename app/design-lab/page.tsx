import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Inbox, Menu, MessageCircle, Search, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";

export const metadata = { title: "Design Lab — NEURODELO", robots: { index: false, follow: false } };

export default function DesignLabPage() {
  return <main className="design-lab-shell" id="main-content">
    <header className="design-lab-header">
      <div><Badge tone="violet"><Sparkles />Внутренний QA</Badge><h1>Design Lab</h1><p>Постоянная страница для проверки визуальной системы: карточек, окон, форм, длинных текстов, таблиц и мобильной компоновки. Она не включена в основную навигацию.</p></div>
      <Link className="ghost-button" href="/">Вернуться на платформу</Link>
    </header>

    <div className="design-lab-grid">
      <section className="panel design-lab-card design-lab-span-8">
        <h2>Кнопки, статусы и прогресс</h2><p>Проверка высоты, переносов и различимости состояний.</p>
        <div className="design-lab-actions"><button type="button" className="primary-button">Основное действие</button><button type="button" className="ghost-button">Вторичное действие с длинной подписью</button><button type="button" className="text-button">Текстовая кнопка</button><button type="button" className="primary-button" disabled>Недоступно</button></div>
        <div className="design-lab-badges" style={{ marginTop: 16 }}><Badge tone="success"><CheckCircle2 />Принято</Badge><Badge tone="warning"><AlertTriangle />Нужна проверка</Badge><Badge tone="danger">Отклонено</Badge><Badge tone="violet">+420 XP</Badge></div>
        <div style={{ marginTop: 18 }}><Progress value={68} label="68% · проверка длинной подписи прогресса" /></div>
      </section>

      <section className="panel design-lab-card design-lab-span-4">
        <h2>Пустое состояние</h2><p>Контент не должен выглядеть сломанным без данных.</p>
        <div className="design-lab-empty"><Inbox size={30} /><strong>Пока ничего нет</strong><span>Создайте первый элемент или измените фильтр.</span><button type="button" className="ghost-button small">Создать</button></div>
      </section>

      <section className="panel design-lab-card design-lab-span-6">
        <h2>Форма</h2><p>Поля должны сохранять ширину и не сжимать подписи.</p>
        <div className="design-lab-form"><label>Название проекта<input defaultValue="Open Companion" /></label><label>Лицензия<select defaultValue="Apache-2.0"><option>Apache-2.0</option><option>MIT</option></select></label><label>Описание<textarea defaultValue="Проект с достаточно длинным описанием, которое проверяет перенос строк и вертикальный ритм формы." /></label></div>
      </section>

      <section className="panel design-lab-card design-lab-span-6">
        <h2>Чат и окно</h2><p>Проверка пузырей сообщений, заголовка и действий.</p>
        <div className="design-lab-window"><header><div><strong>Команда Open Companion</strong><div style={{ color: "var(--muted)", fontSize: ".75rem", marginTop: 3 }}>4 участника · перевод включён</div></div><button type="button" className="icon-button" aria-label="Закрыть"><X /></button></header><div className="design-lab-window-body"><div className="design-lab-message">Проверьте, пожалуйста, адаптивность карточки проекта на маленьком экране.</div><div className="design-lab-message out">Готово. Добавил тест переполнения и перенос длинных названий.</div><div className="design-lab-actions"><button type="button" className="ghost-button small"><MessageCircle />Ответить</button><button type="button" className="primary-button small">Отправить</button></div></div></div>
      </section>

      <section className="panel design-lab-card design-lab-span-12">
        <h2>Перегруженная шапка и длинные вкладки</h2><p>Проверка сжатия заголовка, действий и горизонтальной навигации без наложений.</p>
        <div className="design-lab-topbar-stress"><div><strong>Очень длинное название рабочего раздела международного open-source проекта</strong><span>Подзаголовок не должен выталкивать действия</span></div><div className="design-lab-topbar-actions"><button type="button" className="ghost-button small"><Settings2 />Настройки</button><button type="button" className="icon-button" aria-label="Уведомления"><Bell /></button><button type="button" className="icon-button" aria-label="Открыть меню"><Menu /></button></div></div>
        <div className="design-lab-tabs-stress"><button type="button" className="active">Обзор проекта</button><button type="button">Открытые задачи</button><button type="button">Участники и роли</button><button type="button">Pull Request и проверки</button><button type="button">История релизов</button><button type="button">Благодарности</button><button type="button">Настройки проекта</button></div>
      </section>

      <section className="panel design-lab-card design-lab-span-12">
        <h2>Таблица и горизонтальный скролл</h2><p>На телефоне таблица прокручивается внутри блока, а не расширяет всю страницу.</p>
        <div className="design-lab-table-wrap"><table className="design-lab-table"><thead><tr><th>Участник</th><th>Проект</th><th>Тип вклада</th><th>Статус</th><th>Награда</th></tr></thead><tbody><tr><td>Алина Морозова</td><td>Open Companion</td><td>Дизайн пустых состояний</td><td><Badge tone="success">Принято</Badge></td><td>+260 XP</td></tr><tr><td>Иван Крылов</td><td>Smart Photo Indexer</td><td>Документация Windows</td><td><Badge tone="warning">Ревью</Badge></td><td>+180 XP</td></tr></tbody></table></div><p className="design-lab-scroll-note">Проведите таблицу в сторону, чтобы увидеть остальные столбцы.</p>
      </section>

      <section className="panel design-lab-card design-lab-span-6">
        <h2>Длинные данные</h2><p>Непрерывные строки не должны ломать сетку.</p><div className="design-lab-long-token">https://github.com/neurodelo/open-companion/pull/very-long-reference-without-natural-breakpoints-1234567890abcdef</div>
      </section>

      <section className="panel design-lab-card design-lab-span-6">
        <h2>Предпросмотр модального окна</h2><p>На узком экране окно превращается в безопасную нижнюю панель.</p>
        <div className="design-lab-modal-preview"><article className="modal-card community-modal"><header><div><Badge tone="warning"><ShieldCheck />Подтверждение</Badge><h2>Опубликовать изменения?</h2></div><button type="button" className="icon-button" aria-label="Закрыть"><X /></button></header><p style={{ color: "var(--muted)", lineHeight: 1.6 }}>Изменения станут видны участникам проекта. Длинное пояснение переносится и не выталкивает кнопки за пределы окна.</p><footer><button type="button" className="ghost-button">Отмена</button><button type="button" className="primary-button">Опубликовать</button></footer></article></div>
      </section>

      <section className="panel design-lab-card design-lab-span-12">
        <h2>Поиск и стресс-текст</h2><p>Проверка поисковой строки, кириллицы и очень длинного заголовка карточки.</p>
        <label className="search-box wide"><Search size={17} /><input aria-label="Тестовый поиск" placeholder="Найти проект, участника или задачу…" /></label>
        <article className="panel content-panel" style={{ marginTop: 14 }}><Badge tone="violet">Высокая сложность</Badge><h3>Подготовить устойчивую архитектуру автоматического перевода сообщений между участниками международной open-source команды</h3><p>Заголовок и описание должны переноситься без сжатия соседних элементов и без горизонтальной прокрутки страницы.</p></article>
      </section>
    </div>
  </main>;
}
