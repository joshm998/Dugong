CREATE TABLE users
(
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT UNIQUE NOT NULL,
    hashed_password TEXT        NOT NULL,
    totp_secret     TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_entries
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    container_id TEXT     NOT NULL,
    timestamp    DATETIME NOT NULL,
    message      TEXT     NOT NULL,
    unique_id    TEXT     NOT NULL UNIQUE,
    log_level    TEXT     NOT NULL,
    created_at   DATETIME NOT NULL,
    updated_at   DATETIME NOT NULL
);

CREATE INDEX idx_log_entries_container_id ON log_entries (container_id);
CREATE INDEX idx_log_entries_timestamp ON log_entries (timestamp);
CREATE INDEX idx_log_entries_log_level ON log_entries (log_level);


-- Health Checks table
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
    FOREIGN KEY (health_check_id) REFERENCES health_checks (id)
);