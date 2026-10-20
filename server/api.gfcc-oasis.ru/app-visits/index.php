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
        header('Access-Control-Allow-Credentials: true');
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

session_name('gfcc_app_visit');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

$now = time();
$rateLimit = $_SESSION['visit_rate'] ?? ['started_at' => $now, 'count' => 0];
if ($now - (int) $rateLimit['started_at'] >= 60) {
    $rateLimit = ['started_at' => $now, 'count' => 0];
}
$rateLimit['count']++;
$_SESSION['visit_rate'] = $rateLimit;

if ($rateLimit['count'] > 30) {
    respond(['ok' => false, 'error' => 'TOO_MANY_REQUESTS'], 429);
}

$input = json_decode(file_get_contents('php://input') ?: '', true);
$visitorId = trim((string) ($input['visitorId'] ?? ''));
$source = strtolower(trim((string) ($input['source'] ?? '')));
$appVersion = trim((string) ($input['appVersion'] ?? ''));
$hasClientCard = ($input['hasClientCard'] ?? false) === true ? 1 : 0;

if (preg_match('/^[A-Za-z0-9-]{16,80}$/D', $visitorId) !== 1) {
    respond(['ok' => false, 'error' => 'INVALID_VISITOR'], 400);
}

if (!in_array($source, ['web', 'pwa', 'apk', 'rustore', 'telegram'], true)) {
    respond(['ok' => false, 'error' => 'INVALID_SOURCE'], 400);
}

if (preg_match('/^[0-9A-Za-z._-]{1,20}$/D', $appVersion) !== 1) {
    respond(['ok' => false, 'error' => 'INVALID_VERSION'], 400);
}

$configFile = '/var/www/cl449121/data/backend/config/gfcc-statistics.php';
$config = is_file($configFile) ? require $configFile : null;

if (!is_array($config)) {
    respond(['ok' => false, 'error' => 'SERVICE_NOT_CONFIGURED'], 503);
}

$hashKey = (string) ($config['analytics_salt'] ?? $config['db_password'] ?? '');
if ($hashKey === '') {
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

    $visitDate = (new DateTimeImmutable('now', new DateTimeZone('Asia/Baku')))->format('Y-m-d');
    $visitorHash = hash_hmac('sha256', $visitorId, $hashKey);
    $statement = $pdo->prepare(
        'INSERT INTO app_visit_daily '
        . '(visitor_hash, visit_date, source, app_version, has_client_card, open_count) '
        . 'VALUES (:visitor_hash, :visit_date, :source, :app_version, :has_client_card, 1) '
        . 'ON DUPLICATE KEY UPDATE '
        . 'app_version = VALUES(app_version), '
        . 'has_client_card = GREATEST(has_client_card, VALUES(has_client_card)), '
        . 'open_count = open_count + 1, '
        . 'last_seen_at = CURRENT_TIMESTAMP'
    );
    $statement->execute([
        'visitor_hash' => $visitorHash,
        'visit_date' => $visitDate,
        'source' => $source,
        'app_version' => $appVersion,
        'has_client_card' => $hasClientCard,
    ]);

    respond(['ok' => true], 200);
} catch (Throwable $error) {
    error_log('GFCC app visit failed: ' . get_class($error));
    respond(['ok' => false, 'error' => 'SERVICE_UNAVAILABLE'], 503);
}
