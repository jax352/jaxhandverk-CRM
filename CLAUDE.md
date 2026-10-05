# Jax Handverk CRM

This repository is the shared source of truth for work across computers and phones in Claude Code cloud sessions. User-facing content is Icelandic. Read CLOUD.md and README.md before changing behavior.

## Setup and checks

Use Node.js >=22.13 (the .nvmrc selects Node 22). Use npm and the committed package-lock.json. A cloud-only SessionStart hook runs npm run install:ci when the lockfile or Node/platform changes. If it fails, report the actual error; do not claim tests passed or silently replace the lockfile.

```sh
npm run cloud:setup
npm run check
npm run build
```

For a synthetic local preview: build first, then npm run db:local, then npm run dev. The database helper applies pending migrations only to local .wrangler/state and records Wrangler migration history. It refuses existing manually migrated databases rather than deleting data or replaying migrations. CLI help and preview URLs are environment-specific; keep servers on loopback unless a private authenticated preview tunnel is deliberately configured.

## Data and hosting

Live records stay in the existing Sites Cloudflare D1 database. Git commits synchronize code, not live records. Cloud development databases are disposable test data, not backups. Preserve .openai/hosting.json project identity and existing bindings. A GitHub push does not deploy the site. Do not migrate production storage or invent deployment credentials as part of an ordinary code task.

Never commit .env, .dev.vars, passwords, tokens, database exports, customer spreadsheets, .wrangler, node_modules or generated build output. Append migrations; do not rewrite previously published SQL. CRM API routes rely on hosting-level access restrictions; moving off Sites requires adding verified server-side authorization before connecting real customer data. Keep cloud previews private.

## Collaboration

Start from current main and use a task branch. Commit and push finished work so another cloud session can continue it. Use a pull request for feature changes. Before completion, report the changed behavior, checks actually run, remaining limits and whether anything was deployed. Avoid parallel edits to the same files. Never overwrite another session's changes or force-push main.
