import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Independent of the frontend package manifest. Pinned dev tools; no runtime dependencies.
const root = fileURLToPath(new URL('../', import.meta.url));
const sources = ['lib', 'data', 'prompts'].flatMap(dir => {
  try { return readdirSync(resolve(root, dir)).filter(name => name.endsWith('.ts')).map(name => `${dir}/${name}`); }
  catch { return []; }
});
const tests = readdirSync(resolve(root, 'tests/backend')).filter(name => name.endsWith('.test.ts')).map(name => `tests/backend/${name}`);
function run(args) {
  // All arguments are fixed options or repository-controlled filenames, never customer input.
  const windows = process.platform === 'win32';
  const result = spawnSync(windows ? 'npx.cmd' : 'npx', args, { cwd: root, stdio: 'inherit', shell: windows });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(['--yes', '--package', 'typescript@5.9.3', 'tsc', '--noEmit', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', '--allowImportingTsExtensions', ...sources]);
run(['--yes', '--package', 'tsx@4.20.6', 'tsx', '--test', ...tests]);
