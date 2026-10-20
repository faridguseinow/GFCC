<?php

declare(strict_types=1);

require_once __DIR__ . '/_bootstrap.php';

gfcc_security_headers(true);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    gfcc_json(['error' => 'Метод не поддерживается'], 405);
}

gfcc_require_admin();

try {
    $pdo = gfcc_db();
    $today = new DateTimeImmutable('now', new DateTimeZone('Asia/Baku'));
    $todayValue = $today->format('Y-m-d');
    $monthStart = $today->modify('first day of this month')->format('Y-m-d');
    $dailyStart = $today->modify('-29 days')->format('Y-m-d');

    $clients = (int) $pdo->query('SELECT COUNT(*) FROM card_connections')->fetchColumn();

    $periodStatement = $pdo->prepare(
        'SELECT COUNT(DISTINCT visitor_hash) AS visitors, COALESCE(SUM(open_count), 0) AS opens '
        . 'FROM app_visit_daily WHERE visit_date BETWEEN :start_date AND :end_date'
    );

    $periodStatement->execute(['start_date' => $todayValue, 'end_date' => $todayValue]);
    $todayStats = $periodStatement->fetch() ?: ['visitors' => 0, 'opens' => 0];

    $periodStatement->execute(['start_date' => $monthStart, 'end_date' => $todayValue]);
    $monthStats = $periodStatement->fetch() ?: ['visitors' => 0, 'opens' => 0];

    $sourceStatement = $pdo->prepare(
        'SELECT source, COUNT(DISTINCT visitor_hash) AS visitors, COALESCE(SUM(open_count), 0) AS opens '
        . 'FROM app_visit_daily WHERE visit_date BETWEEN :start_date AND :end_date '
        . 'GROUP BY source ORDER BY visitors DESC, opens DESC'
    );
    $sourceStatement->execute(['start_date' => $monthStart, 'end_date' => $todayValue]);

    $dailyStatement = $pdo->prepare(
        'SELECT visit_date, COUNT(DISTINCT visitor_hash) AS visitors, COALESCE(SUM(open_count), 0) AS opens '
        . 'FROM app_visit_daily WHERE visit_date BETWEEN :start_date AND :end_date '
        . 'GROUP BY visit_date ORDER BY visit_date DESC'
    );
    $dailyStatement->execute(['start_date' => $dailyStart, 'end_date' => $todayValue]);

    gfcc_json([
        'clients' => $clients,
        'today' => ['visitors' => (int) $todayStats['visitors'], 'opens' => (int) $todayStats['opens']],
        'month' => ['visitors' => (int) $monthStats['visitors'], 'opens' => (int) $monthStats['opens']],
        'sources' => array_map(static fn(array $row): array => [
            'source' => (string) $row['source'],
            'visitors' => (int) $row['visitors'],
            'opens' => (int) $row['opens'],
        ], $sourceStatement->fetchAll()),
        'daily' => array_map(static fn(array $row): array => [
            'date' => (string) $row['visit_date'],
            'visitors' => (int) $row['visitors'],
            'opens' => (int) $row['opens'],
        ], $dailyStatement->fetchAll()),
        'updatedAt' => $today->format(DATE_ATOM),
    ]);
} catch (Throwable $error) {
    error_log('GFCC dashboard statistics failed: ' . get_class($error));
    gfcc_json(['error' => 'Статистика временно недоступна'], 503);
}
