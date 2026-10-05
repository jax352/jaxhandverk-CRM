import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This helper has no remote mode. Production migrations remain owned by Sites.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'dist/server/wrangler.json');
const config = JSON.parse(readFileSync(source, 'utf8'));
const binding = config.d1_databases?.find(db => db.binding === 'DB');
if (!binding) throw new Error('Build first; the generated Worker must have a DB binding.');
binding.migrations_dir = path.join(root, 'drizzle');
const localConfig = path.join(root, 'dist/server/wrangler-local-migrations.json');
writeFileSync(localConfig, JSON.stringify(config));
const common = ['--local', '--config', localConfig, '--persist-to', path.join(root, '.wrangler/state')];
function run(args, capture = false) {
  const result = spawnSync(process.execPath, ['--import', path.join(root, 'scripts/sites-env.mjs'),
    path.join(root, 'node_modules/wrangler/bin/wrangler.js'), ...args], {
    cwd: root, env: { ...process.env, CI: 'true' }, encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture) console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}
const output = run(['d1', 'execute', 'DB', ...common, '--json', '--command',
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"], true);
const tables = JSON.parse(output).flatMap(block => block.results ?? []).map(row => row.name);
if (tables.length && !tables.includes('d1_migrations')) {
  throw new Error('Existing local tables have no Wrangler migration history. Stop to reconcile earlier manual migrations; this helper will not replay or delete them. Use a fresh development checkout for a new test database.');
}
run(['d1', 'migrations', 'apply', 'DB', ...common]);
