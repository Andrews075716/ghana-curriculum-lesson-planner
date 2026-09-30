# 36–38. Deployment Guide, Logging and Monitoring, Backup and Disaster Recovery

[← Back to documentation home](README.md)

**No deployment platform, CI/CD pipeline, Dockerfile, or hosting configuration exists in this repository.** Everything in this document is a **proposed** approach based on the application's actual requirements (a Next.js server process + PostgreSQL + optional headless Chrome), not a description of anything already configured. Treat every recommendation below as a starting point for a real deployment decision, not as documentation of an existing setup.

## 36. Deployment Guide (proposed)

### Production database
- Any PostgreSQL 14+ instance reachable from the application server (e.g. a managed provider). The `embedded-postgres` dev dependency used by `npm run db:local` is explicitly a development convenience and must not be used in production (it has no replication, backup, or high-availability story).
- Set `DATABASE_URL` to the production connection string.

### Environment variables
Set every variable in [12-installation-guide.md](12-installation-guide.md#34-environment-variables) appropriate for production: a freshly generated `SESSION_SECRET` (never reuse a development value), `NODE_ENV=production`, and `AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` only if AI assistance is to be enabled in production.

### Database migrations
```bash
npx prisma migrate deploy
```
This is the non-interactive command intended for production/CI use (as opposed to `migrate dev`, which is interactive and intended for local development only).

### Build process
```bash
npm run build   # next build — includes a full TypeScript check
npm run start   # next start — serves the production build
```

### Application deployment
Two broad options, neither configured in this repository:
- **A platform that natively runs Next.js** (e.g. Vercel or similar) — straightforward for the web app itself, but Puppeteer's headless-Chrome PDF export typically needs extra configuration (a Chromium-compatible serverless build, or a separate rendering service) on serverless platforms; this has not been validated against any specific platform from this codebase.
- **A conventional Node server/container** (e.g. a VM or container platform running `npm run start`) — simpler for Puppeteer, since a real, persistent Chrome/Chromium binary can be installed alongside the app.

### Domain / HTTPS
Not configured. `SESSION_SECRET`-signed cookies are marked `secure` only when `NODE_ENV=production`, so HTTPS is effectively required in production for cookies to function as intended.

### Rate limiter caveat (deployment-critical)
The rate limiter (`src/server/api/rate-limit.ts`) keeps its counters in the Node process's own memory. **If deployed across multiple instances or as serverless functions, each instance/invocation gets its own counters**, silently multiplying the effective limit. Before any multi-instance deployment, replace this with a shared store (e.g. Redis/Upstash) — this is flagged as a concrete pre-deployment action, not a hypothetical concern.

---

## 37. Logging and Monitoring

| Aspect | Current implementation | Recommended for production |
|---|---|---|
| Application logs | `console.log`/`console.error` only, to stdout | Ship stdout to a log aggregator (e.g. your hosting platform's built-in log capture) |
| Authentication events | Not specifically logged (no dedicated audit log for login/logout/password-reset events) | Add structured auth-event logging if operational visibility is needed |
| AI failures | Every AI error is a typed `AppError` returned to the client; server-side, only truly unexpected (non-`AppError`) failures are `console.error`'d | Consider logging AI failure *rates* (not content) for cost/reliability visibility |
| Database failures | Unhandled Prisma errors fall through to the generic 500 handler and are `console.error`'d | Add a database health check / alert on connection failure |
| Performance monitoring | Not implemented | Add an APM tool (e.g. a hosting platform's built-in metrics, or an external APM) if/when deployed |
| Error monitoring | Not implemented (no Sentry or equivalent configured) | Add an error-tracking service before production launch — currently, a production error is visible only in server logs |

---

## 38. Backup and Disaster Recovery (proposed — nothing is currently configured)

| Concern | Recommended strategy |
|---|---|
| Database backup | Use the hosting provider's automated PostgreSQL backups (most managed providers offer daily snapshots + point-in-time recovery); if self-hosting, schedule `pg_dump` on a regular interval and store it off-server |
| Curriculum data | Included automatically in a full database backup; additionally, since curriculum data is admin-authored and versioned by name (`CurriculumVersion`), consider periodically exporting the curriculum tree via the admin import format (JSON) as a human-readable, re-importable secondary backup |
| User-generated planners | Included in the same database backup — there is no separate storage location to back up |
| Recovery | Restore the database snapshot, then run `npx prisma migrate deploy` to ensure the schema matches the current application version before serving traffic |
| Restore testing | Not currently practiced (no backup exists to test against); recommended: periodically restore a backup to a scratch environment and run the automated test suite against it as a restore-verification exercise |

No backup has ever been taken from this codebase's own tooling — there is no backup script, cron job, or documented schedule in the repository.
