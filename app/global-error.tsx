"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#090d18", color: "#f5f7ff" }}>
          <section role="alert" style={{ width: "min(560px, 100%)", padding: 24, border: "1px solid #334155", borderRadius: 20, background: "#111827" }}>
            <h1>Приложение временно недоступно</h1>
            <p>Локальные данные сохранены в браузере. Повторите запуск интерфейса.</p>
            <button type="button" onClick={reset} style={{ padding: "12px 18px", borderRadius: 12, border: 0, cursor: "pointer" }}>Повторить</button>
          </section>
        </main>
      </body>
    </html>
  );
}
