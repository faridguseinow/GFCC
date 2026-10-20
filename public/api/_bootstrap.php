<?php

declare(strict_types=1);

const GFCC_SESSION_NAME = 'gfcc_admin';
const GFCC_ALLOWED_SOURCES = ['golden', 'oasis'];

function gfcc_is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function gfcc_security_headers(bool $admin = false): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');

    if ($admin) {
        header('Cache-Control: no-store, max-age=0');
        header('Pragma: no-cache');
        header('X-Robots-Tag: noindex, nofollow');
        header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    }
}

function gfcc_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name(GFCC_SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => gfcc_is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function gfcc_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function gfcc_env(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    if ($value !== false && $value !== '') {
        return $value;
    }

    static $privateConfig = null;
    if ($privateConfig === null) {
        $configPath = getenv('GFCC_CONFIG_FILE') ?: '/var/www/cl449121/data/backend/config/gfcc-statistics.php';
        $privateConfig = is_file($configPath) ? require $configPath : [];
        if (!is_array($privateConfig)) {
            $privateConfig = [];
        }
    }

    $configKeys = [
        'GFCC_DB_HOST' => 'db_host',
        'GFCC_DB_PORT' => 'db_port',
        'GFCC_DB_NAME' => 'db_name',
        'GFCC_DB_USER' => 'db_user',
        'GFCC_DB_PASSWORD' => 'db_password',
        'GFCC_ADMIN_PASSWORD_HASH' => 'admin_password_hash',
        'GFCC_CLIENT_LOOKUP_API_URL' => 'client_lookup_api_url',
    ];
    $configKey = $configKeys[$name] ?? null;
    $configValue = $configKey !== null ? ($privateConfig[$configKey] ?? null) : null;

    return $configValue === null || $configValue === '' ? $default : (string) $configValue;
}

function gfcc_db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = gfcc_env('GFCC_DB_HOST');
    $name = gfcc_env('GFCC_DB_NAME');
    $user = gfcc_env('GFCC_DB_USER');
    $password = gfcc_env('GFCC_DB_PASSWORD');
    $port = gfcc_env('GFCC_DB_PORT', '3306');

    if (!$host || !$name || !$user || $password === null) {
        throw new RuntimeException('Database is not configured');
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function gfcc_csrf_token(): string
{
    gfcc_start_session();

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['csrf_token'];
}

function gfcc_verify_csrf(?string $token): bool
{
    gfcc_start_session();
    return is_string($token)
        && isset($_SESSION['csrf_token'])
        && hash_equals((string) $_SESSION['csrf_token'], $token);
}

function gfcc_is_admin(): bool
{
    gfcc_start_session();
    return ($_SESSION['admin_authenticated'] ?? false) === true;
}

function gfcc_require_admin(): void
{
    if (!gfcc_is_admin()) {
        gfcc_json(['error' => 'Требуется авторизация'], 401);
    }
}

function gfcc_normalize_code(mixed $value): ?string
{
    $code = trim((string) $value);
    return preg_match('/^\d{6}$/D', $code) === 1 ? $code : null;
}

function gfcc_normalize_source(mixed $value): ?string
{
    $source = strtolower(trim((string) $value));
    return in_array($source, GFCC_ALLOWED_SOURCES, true) ? $source : null;
}

function gfcc_source_from_warehouse(mixed $value): ?string
{
    $warehouse = strtolower(trim((string) $value));

    foreach (GFCC_ALLOWED_SOURCES as $source) {
        if (str_contains($warehouse, $source)) {
            return $source;
        }
    }

    return null;
}

function gfcc_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);
    return is_array($data) ? $data : [];
}

function gfcc_rate_limit(string $key, int $limit, int $windowSeconds): bool
{
    gfcc_start_session();
    $now = time();
    $bucket = $_SESSION['rate_limits'][$key] ?? ['started_at' => $now, 'count' => 0];

    if ($now - (int) $bucket['started_at'] >= $windowSeconds) {
        $bucket = ['started_at' => $now, 'count' => 0];
    }

    $bucket['count']++;
    $_SESSION['rate_limits'][$key] = $bucket;

    return $bucket['count'] <= $limit;
}

function gfcc_client_api_url(string $code): string
{
    $baseUrl = gfcc_env('GFCC_CLIENT_LOOKUP_API_URL', 'https://api.gfcc-oasis.ru/client-by-code/');
    $separator = str_contains((string) $baseUrl, '?') ? '&' : '?';
    return (string) $baseUrl . $separator . http_build_query(['code' => $code]);
}

function gfcc_fetch_json(string $url): mixed
{
    if (function_exists('curl_init')) {
        $handle = curl_init($url);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if (!is_string($body) || $status < 200 || $status >= 300) {
            throw new RuntimeException($error ?: 'Client API request failed');
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\n",
                'timeout' => 12,
                'ignore_errors' => true,
            ],
        ]);
        $body = @file_get_contents($url, false, $context);
        $statusLine = $http_response_header[0] ?? '';

        if (!is_string($body) || !preg_match('/\s2\d{2}\s/', $statusLine)) {
            throw new RuntimeException('Client API request failed');
        }
    }

    $decoded = json_decode($body, true);
    for ($depth = 0; $depth < 4 && is_string($decoded); $depth++) {
        $decoded = json_decode($decoded, true);
    }

    if (!is_array($decoded)) {
        throw new RuntimeException('Client API returned invalid JSON');
    }

    return $decoded;
}

function gfcc_collect_client_records(mixed $value, string $fallbackCode, array &$records): void
{
    if (is_string($value)) {
        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            gfcc_collect_client_records($decoded, $fallbackCode, $records);
        }
        return;
    }

    if (!is_array($value)) {
        return;
    }

    $hasClientFields = array_key_exists('code', $value)
        || array_key_exists('clientCode', $value)
        || array_key_exists('kod', $value)
        || array_key_exists('name', $value)
        || array_key_exists('clientName', $value)
        || array_key_exists('sklad', $value)
        || array_key_exists('warehouse', $value);

    if ($hasClientFields) {
        $rawCode = $value['code'] ?? $value['clientCode'] ?? $value['kod'] ?? $fallbackCode;
        $code = str_pad(trim((string) $rawCode), 6, '0', STR_PAD_LEFT);
        $name = trim((string) ($value['name'] ?? $value['title'] ?? $value['clientName'] ?? ''));
        $warehouse = trim((string) ($value['sklad'] ?? $value['warehouse'] ?? ''));

        if (gfcc_normalize_code($code) !== null && $name !== '') {
            $records[] = ['code' => $code, 'name' => $name, 'warehouse' => $warehouse];
        }
        return;
    }

    foreach ($value as $key => $child) {
        $childFallback = preg_match('/^\d{1,6}$/D', (string) $key) === 1
            ? str_pad((string) $key, 6, '0', STR_PAD_LEFT)
            : $fallbackCode;
        gfcc_collect_client_records($child, $childFallback, $records);
    }
}

function gfcc_lookup_clients(string $code): array
{
    static $cache = [];

    if (array_key_exists($code, $cache)) {
        return $cache[$code];
    }

    $payload = gfcc_fetch_json(gfcc_client_api_url($code));

    if (($payload['found'] ?? null) === false) {
        return $cache[$code] = [];
    }

    $records = [];
    gfcc_collect_client_records($payload, $code, $records);

    return $cache[$code] = array_values(array_filter(
        $records,
        static fn(array $record): bool => $record['code'] === $code
    ));
}

function gfcc_find_client(string $code, string $source): ?array
{
    foreach (gfcc_lookup_clients($code) as $client) {
        if (gfcc_source_from_warehouse($client['warehouse']) === $source) {
            return $client;
        }
    }

    return null;
}
