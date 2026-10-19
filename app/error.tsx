"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" role="alert" aria-labelledby="error-title">
        <p className="eyebrow">Локальная ошибка</p>
        <h1 id="error-title">Раздел не удалось открыть</h1>
        <p>Состояние fallback не удалено. Можно повторить загрузку раздела.</p>
        <button className="primary-button" type="button" onClick={reset}>Повторить</button>
      </section>
    </main>
  );
}
