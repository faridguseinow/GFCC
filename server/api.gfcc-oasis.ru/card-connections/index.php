<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$allowedOrigins = [
    'https://gfcc-oasis.ru',
    'https://gfcc-chi.vercel.app',
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === '' || in_array($origin, $allowedOrigins, true)) {
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

function respond(array $payload, int $status): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    respond(['ok' => false, 'error' => 'JSON_REQUIRED'], 415);
}

session_name('gfcc_card_connection');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

$now = time();
$rateLimit = $_SESSION['card_connection_rate'] ?? ['started_at' => $now, 'count' => 0];
if ($now - (int) $rateLimit['started_at'] >= 60) {
    $rateLimit = ['started_at' => $now, 'count' => 0];
}
$rateLimit['count']++;
$_SESSION['card_connection_rate'] = $rateLimit;

if ($rateLimit['count'] > 20) {
    respond(['ok' => false, 'error' => 'TOO_MANY_REQUESTS'], 429);
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
$code = trim((string) ($input['code'] ?? ''));
$source = strtolower(trim((string) ($input['source'] ?? '')));

if (!preg_match('/^\d{6}$/D', $code)) {
    respond(['ok' => false, 'error' => 'INVALID_CLIENT_CODE'], 400);
}

if (!in_array($source, ['golden', 'oasis'], true)) {
    respond(['ok' => false, 'error' => 'INVALID_CLIENT_SOURCE'], 400);
}

$indexFile = '/var/www/cl449121/data/backend/clients-data/clients-index.json';
$raw = is_file($indexFile) ? file_get_contents($indexFile) : false;
$index = is_string($raw) ? json_decode($raw, true) : null;

if (!is_array($index)) {
    respond(['ok' => false, 'error' => 'CLIENT_CACHE_UNAVAILABLE'], 503);
}

$clients = $index[$code] ?? [];
if (!is_array($clients)) {
    $clients = [];
}

$clientExists = false;
foreach ($clients as $client) {
    $warehouse = strtolower(trim((string) ($client['sklad'] ?? '')));
    if (str_contains($warehouse, $source)) {
        $clientExists = true;
        break;
    }
}

if (!$clientExists) {
    respond(['ok' => false, 'error' => 'CLIENT_NOT_FOUND'], 404);
}

$configFile = '/var/www/cl449121/data/backend/config/gfcc-statistics.php';
$config = is_file($configFile) ? require $configFile : null;

if (!is_array($config)) {
    respond(['ok' => false, 'error' => 'SERVICE_NOT_CONFIGURED'], 503);
}

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        (string) ($config['db_host'] ?? ''),
        (int) ($config['db_port'] ?? 3306),
        (string) ($config['db_name'] ?? '')
    );
    $pdo = new PDO($dsn, (string) ($config['db_user'] ?? ''), (string) ($config['db_password'] ?? ''), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $statement = $pdo->prepare(
        'INSERT INTO card_connections (client_code, client_source) VALUES (:code, :source) '
        . 'ON DUPLICATE KEY UPDATE client_code = VALUES(client_code)'
    );
    $statement->execute(['code' => $code, 'source' => $source]);

    respond(['ok' => true], 200);
} catch (Throwable $error) {
    error_log('GFCC card connection failed: ' . get_class($error));
    respond(['ok' => false, 'error' => 'SERVICE_UNAVAILABLE'], 503);
}
