<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

gfcc_security_headers(true);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    gfcc_json(['error' => 'Метод не поддерживается'], 405);
}

gfcc_require_admin();

$page = max(1, (int) ($_GET['page'] ?? 1));
$limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

try {
    $pdo = gfcc_db();
    $count = (int) $pdo->query('SELECT COUNT(*) FROM card_connections')->fetchColumn();

    if (($_GET['summary'] ?? '') === '1') {
        gfcc_json(['count' => $count, 'clients' => []]);
    }

    $statement = $pdo->prepare(
        'SELECT client_code, client_source, created_at FROM card_connections '
        . 'ORDER BY id DESC LIMIT :limit OFFSET :offset'
    );
    $statement->bindValue('limit', $limit, PDO::PARAM_INT);
    $statement->bindValue('offset', $offset, PDO::PARAM_INT);
    $statement->execute();

    $indexFile = gfcc_env(
        'GFCC_CLIENT_INDEX_FILE',
        '/var/www/cl449121/data/backend/clients-data/clients-index.json'
    );
    $clientIndex = null;

    if ($indexFile && is_file($indexFile)) {
        $decodedIndex = json_decode(file_get_contents($indexFile) ?: '', true);
        if (is_array($decodedIndex)) {
            $clientIndex = $decodedIndex;
        }
    }

    $clients = [];
    foreach ($statement->fetchAll() as $row) {
        $name = 'Не удалось получить данные';
        $code = (string) $row['client_code'];
        $source = (string) $row['client_source'];

        if (is_array($clientIndex)) {
            foreach (($clientIndex[$code] ?? []) as $client) {
                $warehouse = (string) ($client['sklad'] ?? $client['warehouse'] ?? '');
                $clientName = trim((string) ($client['name'] ?? ''));

                if (gfcc_source_from_warehouse($warehouse) === $source && $clientName !== '') {
                    $name = $clientName;
                    break;
                }
            }
        } else {
            try {
                $client = gfcc_find_client($code, $source);
                if ($client !== null && $client['name'] !== '') {
                    $name = $client['name'];
                }
            } catch (Throwable $lookupError) {
                error_log('GFCC admin client lookup failed: ' . get_class($lookupError));
            }
        }

        $clients[] = [
            'code' => $code,
            'name' => $name,
            'source' => ucfirst($source),
            'connectedAt' => (string) $row['created_at'],
        ];
    }

    gfcc_json([
        'count' => $count,
        'page' => $page,
        'limit' => $limit,
        'clients' => $clients,
    ]);
} catch (Throwable $error) {
    error_log('GFCC admin statistics failed: ' . get_class($error));
    gfcc_json(['error' => 'Статистика временно недоступна'], 503);
}
