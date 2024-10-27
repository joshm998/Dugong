CREATE TABLE log_entries (
                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                             container_id TEXT NOT NULL,
                             timestamp DATETIME NOT NULL,
                             message TEXT NOT NULL,
                             unique_id TEXT NOT NULL UNIQUE,
                             log_level TEXT NOT NULL,
                             created_at DATETIME NOT NULL,
                             updated_at DATETIME NOT NULL
);

CREATE INDEX idx_log_entries_container_id ON log_entries(container_id);
CREATE INDEX idx_log_entries_timestamp ON log_entries(timestamp);
CREATE INDEX idx_log_entries_log_level ON log_entries(log_level);