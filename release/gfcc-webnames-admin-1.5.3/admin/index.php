<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/api/_bootstrap.php';

gfcc_security_headers(true);
gfcc_start_session();

if (!gfcc_is_admin()) {
    header('Location: /admin/login', true, 302);
    exit;
}

$csrfToken = gfcc_csrf_token();
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Статистика подключений — GFCC Oasis</title>
  <link rel="stylesheet" href="/admin/style.css">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <div>
        <p class="eyebrow">GFCC Oasis</p>
        <h1>Подключённые клиенты</h1>
      </div>
      <form action="/admin/logout" method="post">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
        <button class="secondary-button" type="submit">Выйти</button>
      </form>
    </header>

    <button id="summary-card" class="summary-card" type="button" aria-expanded="false" aria-controls="clients-panel">
      <span class="summary-label">Всего уникальных клиентов</span>
      <strong id="connection-count">—</strong>
      <span class="summary-hint">Нажмите, чтобы открыть список</span>
    </button>

    <section id="clients-panel" class="clients-panel" hidden>
      <div id="loading-state" class="state">Загрузка…</div>
      <div id="error-state" class="state error" hidden></div>
      <div id="empty-state" class="state" hidden>Подключений пока нет</div>
      <div id="table-wrap" class="table-wrap" hidden>
        <table>
          <thead>
            <tr>
              <th>Код клиента</th>
              <th>Клиент / организация</th>
              <th>База</th>
            </tr>
          </thead>
          <tbody id="clients-body"></tbody>
        </table>
        <nav class="pagination" aria-label="Страницы списка">
          <button id="prev-page" class="secondary-button" type="button">Назад</button>
          <span id="page-label"></span>
          <button id="next-page" class="secondary-button" type="button">Вперёд</button>
        </nav>
      </div>
    </section>
  </main>
  <script src="/admin/admin.js" defer></script>
</body>
</html>
