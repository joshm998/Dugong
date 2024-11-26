-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = ? LIMIT 1;

-- name: GetUserById :one
SELECT * FROM users
WHERE id = ? LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (username, hashed_password)
VALUES (?, ?)
RETURNING *;

-- name: UpdatePassword :exec
UPDATE users
SET hashed_password = ?, updated_at = CURRENT_TIMESTAMP
WHERE username = ?;

-- name: UpdateTotp :exec
UPDATE users
SET totp_secret = ?, updated_at = CURRENT_TIMESTAMP
WHERE username = ?;

-- name: SaveLog :exec
INSERT INTO log_entries (
    container_id, timestamp, message, unique_id, log_level, created_at, updated_at
) VALUES (
             ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
         )
ON CONFLICT(unique_id) DO NOTHING;

-- name: GetContainerLogs :many
SELECT container_id, timestamp, message, unique_id, log_level
FROM log_entries
WHERE container_id = ?
ORDER BY timestamp DESC
LIMIT 100;

-- name: SearchLogs :many
SELECT container_id, timestamp, message, unique_id, log_level
FROM log_entries
WHERE message LIKE ?
ORDER BY timestamp DESC
LIMIT 100;

-- name: GetFilteredLogs :many
WITH filtered_logs AS (
    SELECT container_id, timestamp, message, unique_id, log_level
    FROM log_entries
    WHERE
        (COALESCE(@container_ids, '') = '' OR container_id IN (@container_ids))
      AND (@message_filter = '' OR message LIKE '%' || @message_filter || '%')
      AND (COALESCE(@log_levels, '') = '' OR log_level IN (@log_levels))
      AND (@start_time IS NULL OR timestamp >= @start_time)
      AND (@end_time IS NULL OR timestamp <= @end_time)
)
SELECT
    container_id, timestamp, message, unique_id, log_level,
    (SELECT COUNT(*) FROM filtered_logs) AS total_count
FROM filtered_logs
ORDER BY timestamp DESC
LIMIT @page_size OFFSET @offset;

-- name: DeleteOldLogs :exec
DELETE FROM log_entries WHERE timestamp < ?;

-- name: GetHealthChecks :many
SELECT hc.id, hc.name, hc.url, hc.interval, MAX(hcr.checked_at) as last_checked_at
FROM health_checks hc
LEFT JOIN health_check_results hcr ON hc.id = hcr.health_check_id
GROUP BY hc.id, hc.name, hc.url, hc.interval;

-- Fix this awful query
-- name: GetHealthCheckResults :many
SELECT hcr.health_check_id,
       COUNT(CASE WHEN hcr.status != 'success' THEN 1 END) AS failed_count,
       CASE
           WHEN hcr.health_check_id IN (
               SELECT inner_hcr.health_check_id
               FROM health_check_results inner_hcr
               WHERE inner_hcr.checked_at = (
                   SELECT MAX(inner_most_hcr.checked_at)
                   FROM health_check_results inner_most_hcr
                   WHERE inner_most_hcr.health_check_id = inner_hcr.health_check_id
               )
                 AND inner_hcr.status != 'success'
           ) THEN 1
           ELSE 0
           END AS is_latest_failure
FROM health_check_results hcr
WHERE hcr.checked_at >= ?
GROUP BY hcr.health_check_id;

-- name: AddHealthCheckResult :one
INSERT INTO health_check_results (health_check_id, status, message, checked_at)
VALUES (?, ?, ?, ?)
RETURNING *;

-- name: AddHealthCheck :one
INSERT INTO health_checks (name, url, interval)
VALUES (?, ?, ?)
RETURNING *;

-- name: DeleteHealthCheck :exec
DELETE FROM health_checks WHERE id = ?;

-- name: DeleteOldHealthChecks :exec
DELETE FROM health_check_results WHERE checked_at < ?;


-- name: AddProxySite :one
INSERT INTO proxy_sites (container_name, port, domain)
VALUES (?, ?, ?)
    RETURNING *;

-- name: DeleteProxySite :exec
DELETE FROM proxy_sites WHERE id = ?;

-- name: GetProxySites :many
SELECT * FROM proxy_sites