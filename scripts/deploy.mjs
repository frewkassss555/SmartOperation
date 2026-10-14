// Publishes the GitHub Pages build: `npm run build:pages`, then this script force-pushes
// dist/ as the single commit of the gh-pages branch (Pages serves that branch).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const run = (cmd, args, cwd = '.') => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const read = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const remote = read('git', ['remote', 'get-url', 'origin']);
const source = read('git', ['rev-parse', '--short', 'HEAD']);
const name = read('git', ['config', 'user.name']);
const email = read('git', ['config', 'user.email']);

// No Jekyll processing: serve the files as they are.
writeFileSync('dist/.nojekyll', '');
run('git', ['init', '-q', '-b', 'gh-pages'], 'dist');
run('git', ['add', '-A'], 'dist');
run('git', ['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '-q', '-m', `Deploy ${source}`], 'dist');
run('git', ['push', '-f', remote, 'gh-pages'], 'dist');
console.log(`Deployed ${source} to gh-pages.`);
