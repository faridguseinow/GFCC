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
  <title>Статистика — GFCC Oasis</title>
  <script>try{const a=localStorage.getItem('gfcc_admin_theme'),t=localStorage.getItem('theme');document.documentElement.dataset.theme=a||(t==='dark-theme'?'dark':'light')}catch(e){}</script>
  <link rel="stylesheet" href="/admin/style.css?v=1.6.0">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <div class="admin-brand">
        <img src="/icons/icon-192x192.png" alt="">
        <div>
          <p class="eyebrow">GFCC Oasis · Администратор</p>
          <h1>Статистика приложения</h1>
          <p class="admin-subtitle">Подключения клиентов и посещаемость</p>
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

    <a class="summary-card" href="/admin/clients.php">
      <span class="summary-top"><span class="summary-label">Подключённые клиенты</span><span class="live-badge">Главный показатель</span></span>
      <strong id="connection-count">—</strong>
      <span class="summary-hint">Открыть отдельный список клиентов <b>→</b></span>
    </a>

    <section class="metrics-section" aria-labelledby="visits-title">
      <div class="section-heading">
        <div><p class="eyebrow">Посещаемость</p><h2 id="visits-title">Использование приложения</h2></div>
        <span id="updated-at">Обновление…</span>
      </div>
      <div class="metric-grid">
        <article class="metric-card"><span>Пользователи сегодня</span><strong id="today-visitors">—</strong><small>Уникальные устройства</small></article>
        <article class="metric-card"><span>Открытия сегодня</span><strong id="today-opens">—</strong><small>Все запуски</small></article>
        <article class="metric-card"><span>Пользователи за месяц</span><strong id="month-visitors">—</strong><small>Уникальные устройства</small></article>
        <article class="metric-card"><span>Открытия за месяц</span><strong id="month-opens">—</strong><small>Все запуски</small></article>
      </div>
    </section>

    <section class="analytics-grid">
      <article class="analytics-card">
        <div class="card-heading"><div><p class="eyebrow">Источники</p><h2>Откуда открывают</h2></div><span>Текущий месяц</span></div>
        <div id="sources-list" class="sources-list"><div class="state">Загрузка…</div></div>
      </article>
      <article class="analytics-card">
        <div class="card-heading"><div><p class="eyebrow">Динамика</p><h2>Последние 30 дней</h2></div><span>По дням</span></div>
        <div id="daily-list" class="daily-list"><div class="state">Загрузка…</div></div>
      </article>
    </section>

    <div id="dashboard-error" class="dashboard-error" hidden></div>
  </main>
  <script src="/admin/theme.js?v=1.6.0" defer></script>
  <script src="/admin/dashboard.js?v=1.6.0" defer></script>
</body>
</html>
