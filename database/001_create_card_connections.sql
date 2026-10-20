CREATE TABLE IF NOT EXISTS card_connections (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    client_code CHAR(6) NOT NULL,
    client_source VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_source_code (client_source, client_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
