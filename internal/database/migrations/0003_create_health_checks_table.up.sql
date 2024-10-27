CREATE TABLE health_checks
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    url        TEXT    NOT NULL,
    interval   INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Health Check Results table
CREATE TABLE health_check_results
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    health_check_id INTEGER NOT NULL,
    status          TEXT    NOT NULL,
    message         TEXT,
    checked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (health_check_id) REFERENCES health_checks (id) ON DELETE CASCADE
);