import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
if (process.argv.includes('--hook') && process.env.CLAUDE_CODE_REMOTE !== 'true') process.exit(0);
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) throw new Error('Node.js 22.13 or newer is required.');
const fingerprint = createHash('sha256').update(readFileSync(path.join(root, 'package-lock.json')))
  .update(`${process.platform}/${process.arch}/${major}`).digest('hex');
const marker = path.join(root, '.sites-runtime/cloud-install.sha256');
const ready = ['typescript/bin/tsc', 'vinext/dist/cli.js', 'wrangler/bin/wrangler.js']
  .every(file => existsSync(path.join(root, 'node_modules', file)));
if (ready && existsSync(marker) && readFileSync(marker, 'utf8').trim() === fingerprint) {
  console.log('Cloud dependencies already match the lockfile.');
  process.exit(0);
}
const npm = process.env.npm_execpath;
const command = npm ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const args = [...(npm ? [npm] : []), 'run', 'install:ci'];
const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: !npm && process.platform === 'win32' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
mkdirSync(path.dirname(marker), { recursive: true });
writeFileSync(marker, fingerprint + '\n');
console.log('Dependencies ready. Run npm run check and npm run build; see CLOUD.md for preview and test data.');
