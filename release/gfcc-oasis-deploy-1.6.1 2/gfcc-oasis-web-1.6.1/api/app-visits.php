<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

gfcc_security_headers();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$allowedOrigins = [
    'https://gfcc-oasis.ru',
    'https://gfcc-chi.vercel.app',
    'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    gfcc_json(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED'], 405);
}

if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    gfcc_json(['ok' => false, 'error' => 'JSON_REQUIRED'], 415);
}

if (!gfcc_rate_limit('app_visit', 30, 60)) {
    gfcc_json(['ok' => false, 'error' => 'TOO_MANY_REQUESTS'], 429);
}

$input = gfcc_read_json_body();
$visitorId = trim((string) ($input['visitorId'] ?? ''));
$source = strtolower(trim((string) ($input['source'] ?? '')));
$appVersion = trim((string) ($input['appVersion'] ?? ''));
$hasClientCard = ($input['hasClientCard'] ?? false) === true ? 1 : 0;

if (preg_match('/^[A-Za-z0-9-]{16,80}$/D', $visitorId) !== 1) {
    gfcc_json(['ok' => false, 'error' => 'INVALID_VISITOR'], 400);
}

if (!in_array($source, ['web', 'pwa', 'apk', 'rustore', 'telegram'], true)) {
    gfcc_json(['ok' => false, 'error' => 'INVALID_SOURCE'], 400);
}

if (preg_match('/^[0-9A-Za-z._-]{1,20}$/D', $appVersion) !== 1) {
    gfcc_json(['ok' => false, 'error' => 'INVALID_VERSION'], 400);
}

$hashKey = gfcc_env('GFCC_ANALYTICS_SALT') ?: gfcc_env('GFCC_DB_PASSWORD');
if (!$hashKey) {
    gfcc_json(['ok' => false, 'error' => 'SERVICE_NOT_CONFIGURED'], 503);
}

try {
    $visitDate = (new DateTimeImmutable('now', new DateTimeZone('Asia/Baku')))->format('Y-m-d');
    $visitorHash = hash_hmac('sha256', $visitorId, $hashKey);
    $statement = gfcc_db()->prepare(
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

    gfcc_json(['ok' => true]);
} catch (Throwable $error) {
    error_log('GFCC app visit failed: ' . get_class($error));
    gfcc_json(['ok' => false, 'error' => 'SERVICE_UNAVAILABLE'], 503);
}
