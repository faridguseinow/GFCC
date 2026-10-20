CREATE TABLE IF NOT EXISTS app_visit_daily (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    visitor_hash CHAR(64) NOT NULL,
    visit_date DATE NOT NULL,
    source VARCHAR(20) NOT NULL,
    app_version VARCHAR(20) NOT NULL,
    has_client_card TINYINT(1) NOT NULL DEFAULT 0,
    open_count INT UNSIGNED NOT NULL DEFAULT 1,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_visit_day_source (visitor_hash, visit_date, source),
    KEY idx_visit_date (visit_date),
    KEY idx_visit_source_date (source, visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
