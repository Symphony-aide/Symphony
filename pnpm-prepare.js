import os from 'os';
import fs from 'fs';
import path from 'path';

const username = os.userInfo().username;
const isWindows = process.platform === 'win32';

const customStorePath = isWindows
  ? `C:\\Users\\${username}\\.symphony\\.pnpm-store`
  : `/home/${username}/.symphony/.pnpm-store`;

const npmrcPath = path.resolve(process.cwd(), '.npmrc');

// Ensure the directory exists
fs.mkdirSync(customStorePath, { recursive: true });

// Write or update the `.npmrc` file
let content = '';
if (fs.existsSync(npmrcPath)) {
  content = fs.readFileSync(npmrcPath, 'utf8');
  // Replace existing store-dir line if it exists
  if (content.includes('store-dir=')) {
    content = content.replace(/store-dir=.*/g, `store-dir=${customStorePath}`);
  } else {
    content += `\nstore-dir=${customStorePath}`;
  }
} else {
  content = `store-dir=${customStorePath}`;
}

fs.writeFileSync(npmrcPath, content.trim() + '\n', 'utf8');
console.log(`[pnpm-preinstall] Set store-dir to: ${customStorePath}`);
