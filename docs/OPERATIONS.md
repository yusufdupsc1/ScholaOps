# Operations Runbook

## 1) Incident Handling

### Severity Levels

- Sev-1: Full outage or data-loss risk.
- Sev-2: Major feature degradation with workaround unavailable.
- Sev-3: Minor degradation with workaround available.

### Response Flow

1. Acknowledge alert and create incident channel.
2. Capture scope:
   - impacted modules
   - start time
   - affected institutions
3. Execute health checks:
   - `GET /api/health`
   - database connectivity
   - recent deployment or config changes
4. Mitigate:
   - roll back last deployment if regression suspected
   - disable feature flags (`ENABLE_AI_ASSIST`, realtime clients) if instability continues
5. Recover and verify:
   - rerun smoke tests for `/dashboard`, `/students`, `/attendance`, `/finance`
6. Publish post-incident report within 24 hours.

## 2) Backup and Restore Validation

### Backup Policy

- Use managed PostgreSQL daily snapshots.
- Keep point-in-time recovery enabled.
- Retain at least 14 days of backups.

### Weekly Validation Drill

1. Provision an isolated restore database from latest snapshot.
2. Run data sanity checks:
   - user count
   - student count
   - payment totals
3. Run app against restored DB in staging and execute:
   - `pnpm type-check`
   - dashboard smoke check
4. Record validation date and owner.

### Restore Procedure (Emergency)

1. Freeze writes (maintenance mode).
2. Restore latest healthy snapshot.
3. Update `DATABASE_URL`/connection target.
4. Run migration compatibility checks.
5. Run smoke validation and reopen traffic.

## 3) Deployment Verification

After production deploy, verify:

1. `GET /api/health` is `200` and `checks.envComplete` is true.
2. Public SEO URLs:
   - `/`
   - `/robots.txt`
   - `/sitemap.xml`
3. API v1 baseline:
   - `/api/v1/students`
   - `/api/v1/attendance?mode=summary`
4. Realtime polling fallback:
   - `/api/v1/realtime/notifications`
