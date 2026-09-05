/**
 * Creates rakesh-hostinger.zip for Hostinger Node.js "Upload your files".
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const outZip = path.join(root, 'rakesh-hostinger.zip');

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

const exclude = [
  'node_modules',
  'dist',
  '.git',
  '.env',
  '.env.local',
  'rakesh-hostinger.zip',
  'store.db-shm',
  'store.db-wal',
  'index.legacy.html',
];

const isWin = process.platform === 'win32';

if (isWin) {
  const staging = path.join(root, '.hostinger-staging');
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  const copyRecursive = (src, dest) => {
    const base = path.basename(src);
    if (exclude.includes(base)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        copyRecursive(path.join(src, name), path.join(dest, name));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  };

  for (const name of fs.readdirSync(root)) {
    if (exclude.includes(name) || name === '.hostinger-staging') continue;
    copyRecursive(path.join(root, name), path.join(staging, name));
  }

  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${outZip}' -Force"`,
    { stdio: 'inherit' }
  );
  fs.rmSync(staging, { recursive: true, force: true });
} else {
  const excludes = exclude.map((e) => `--exclude=${e}`).join(' ');
  execSync(`cd "${root}" && zip -r "${outZip}" . ${excludes}`, { stdio: 'inherit' });
}

console.log('\nCreated:', outZip);
console.log('Upload this ZIP in Hostinger → Add Website → Node.js → Upload your files\n');
