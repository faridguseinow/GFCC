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
        'SELECT client_code, client_source FROM card_connections '
        . 'ORDER BY id DESC LIMIT :limit OFFSET :offset'
    );
    $statement->bindValue('limit', $limit, PDO::PARAM_INT);
    $statement->bindValue('offset', $offset, PDO::PARAM_INT);
    $statement->execute();

    $clients = [];
    foreach ($statement->fetchAll() as $row) {
        $name = 'Не удалось получить данные';

        try {
            $client = gfcc_find_client((string) $row['client_code'], (string) $row['client_source']);
            if ($client !== null && $client['name'] !== '') {
                $name = $client['name'];
            }
        } catch (Throwable $lookupError) {
            error_log('GFCC admin client lookup failed: ' . get_class($lookupError));
        }

        $clients[] = [
            'code' => (string) $row['client_code'],
            'name' => $name,
            'source' => ucfirst((string) $row['client_source']),
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
