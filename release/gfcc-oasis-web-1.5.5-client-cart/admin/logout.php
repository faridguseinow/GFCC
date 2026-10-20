<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/api/_bootstrap.php';

gfcc_security_headers(true);
gfcc_start_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !gfcc_verify_csrf($_POST['csrf_token'] ?? null)) {
    http_response_code(400);
    exit('Некорректный запрос');
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}
session_destroy();

header('Location: /admin/login.php', true, 303);
exit;
