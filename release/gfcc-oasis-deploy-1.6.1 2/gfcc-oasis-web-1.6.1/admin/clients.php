<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/api/_bootstrap.php';

gfcc_security_headers(true);
gfcc_start_session();

if (!gfcc_is_admin()) {
    header('Location: /admin/login.php', true, 302);
    exit;
}

$csrfToken = gfcc_csrf_token();
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подключённые клиенты — GFCC Oasis</title>
  <script>try{const a=localStorage.getItem('gfcc_admin_theme'),t=localStorage.getItem('theme');document.documentElement.dataset.theme=a||(t==='dark-theme'?'dark':'light')}catch(e){}</script>
  <link rel="stylesheet" href="/admin/style.css?v=1.6.1">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <div class="admin-brand">
        <a class="back-button" href="/admin/" aria-label="Назад">←</a>
        <div>
          <p class="eyebrow">GFCC Oasis · Клиенты</p>
          <h1>Подключённые карты</h1>
          <p class="admin-subtitle">Уникальные клиентские коды</p>
        </div>
      </div>
      <div class="admin-header-actions">
        <button class="theme-button" type="button" data-theme-toggle aria-label="Переключить тему">◐</button>
        <form action="/admin/logout.php" method="post">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
          <button class="secondary-button" type="submit">Выйти</button>
        </form>
      </div>
    </header>

    <section class="clients-page-card">
      <div class="clients-page-summary"><span>Всего подключено</span><strong id="connection-count">—</strong></div>
      <div id="loading-state" class="state">Загрузка…</div>
      <div id="error-state" class="state error" hidden></div>
      <div id="empty-state" class="state" hidden>Подключений пока нет</div>
      <div id="table-wrap" class="table-wrap" hidden>
        <table>
          <thead><tr><th>Код клиента</th><th>Клиент / организация</th><th>База</th><th>Подключён</th></tr></thead>
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
  <script src="/admin/theme.js?v=1.6.1" defer></script>
  <script src="/admin/clients.js?v=1.6.1" defer></script>
</body>
</html>
