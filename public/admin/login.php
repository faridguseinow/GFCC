<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/api/_bootstrap.php';

gfcc_security_headers(true);
gfcc_start_session();

if (gfcc_is_admin()) {
    header('Location: /admin/', true, 302);
    exit;
}

$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!gfcc_verify_csrf($_POST['csrf_token'] ?? null)) {
        $errorMessage = 'Сессия устарела. Обновите страницу.';
    } elseif (!gfcc_rate_limit('admin_login', 5, 900)) {
        $errorMessage = 'Слишком много попыток. Повторите через 15 минут.';
    } else {
        $passwordHash = gfcc_env('GFCC_ADMIN_PASSWORD_HASH');
        $password = (string) ($_POST['password'] ?? '');

        if ($passwordHash && password_verify($password, $passwordHash)) {
            session_regenerate_id(true);
            $_SESSION['admin_authenticated'] = true;
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            unset($_SESSION['rate_limits']['admin_login']);
            header('Location: /admin/', true, 303);
            exit;
        }

        usleep(250000);
        $errorMessage = 'Неверный пароль.';
    }
}

$csrfToken = gfcc_csrf_token();
?>
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход — GFCC Oasis</title>
  <script>try{const a=localStorage.getItem('gfcc_admin_theme'),t=localStorage.getItem('theme');document.documentElement.dataset.theme=a||(t==='dark-theme'?'dark':'light')}catch(e){}</script>
  <link rel="stylesheet" href="/admin/style.css?v=1.6.0">
</head>
<body class="login-page">
  <button class="theme-button login-theme" type="button" data-theme-toggle aria-label="Переключить тему">◐</button>
  <main class="login-card">
    <div class="login-brand"><img src="/icons/icon-192x192.png" alt=""><span>GFCC Oasis</span></div>
    <div class="login-icon" aria-hidden="true">⌁</div>
    <p class="eyebrow">Администрирование</p>
    <h1>Вход в статистику</h1>
    <p class="login-copy">Защищённый доступ к статистике подключений клиентских карт.</p>
    <?php if ($errorMessage !== ''): ?>
      <p class="login-error" role="alert"><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></p>
    <?php endif; ?>
    <?php if (!gfcc_env('GFCC_ADMIN_PASSWORD_HASH')): ?>
      <p class="login-error" role="alert">Пароль администратора не настроен.</p>
    <?php endif; ?>
    <form method="post" action="/admin/login.php" class="login-form">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">
      <label for="password">Пароль</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button class="primary-button" type="submit">Войти</button>
    </form>
    <small class="login-note">Доступ разрешён только администратору приложения.</small>
  </main>
  <script src="/admin/theme.js?v=1.6.0" defer></script>
</body>
</html>
