import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Uses the pinned devDependencies (typescript, tsx) from package.json: no shell, no runtime downloads.
const root = fileURLToPath(new URL('../', import.meta.url));
const safeName = /^[A-Za-z0-9._-]+\.ts$/;
const list = dir => {
  try { return readdirSync(resolve(root, dir)).filter(name => safeName.test(name)); }
  catch { return []; }
};
const sources = ['lib', 'data', 'prompts'].flatMap(dir => list(dir).map(name => `${dir}/${name}`));
const tests = list('tests/backend').filter(name => name.endsWith('.test.ts')).map(name => `tests/backend/${name}`);

function tool(path) {
  const file = resolve(root, 'node_modules', path);
  if (!existsSync(file)) {
    console.error(`Missing ${path}. Run "npm install" first.`);
    process.exit(1);
  }
  return file;
}
function run(args) {
  // Runs Node directly with fixed options and repository file names; nothing is interpreted by a shell.
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run([tool('typescript/bin/tsc'), '--noEmit', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', '--allowImportingTsExtensions', ...sources]);
run([tool('tsx/dist/cli.mjs'), '--test', ...tests]);
