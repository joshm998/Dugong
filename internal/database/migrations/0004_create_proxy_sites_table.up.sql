-- Proxy Sites Table
CREATE TABLE proxy_sites
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    container_name  TEXT    NULL,
    port            TEXT    NOT NULL,
    domain          TEXT    NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
