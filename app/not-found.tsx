import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="not-found-title">
        <p className="eyebrow">Ошибка 404</p>
        <h1 id="not-found-title">Страница не найдена</h1>
        <p>Адрес мог измениться или раздел пока не создан в локальном прототипе.</p>
        <Link className="primary-button" href="/">Вернуться на главную</Link>
      </section>
    </main>
  );
}
