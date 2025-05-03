import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
  '../dist/public/index.html',
  '../dist/public/assets',
  '../dist/server/index.js'
];

console.log('Verifying production build...');

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file/directory: ${file}`);
    allFilesExist = false;
  } else {
    const stats = fs.statSync(filePath);
    if (file.endsWith('index.html')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes('<html') || !content.includes('<body')) {
        console.error(`${file} appears to be invalid HTML`);
        allFilesExist = false;
      }
    }
    console.log(`✓ Found ${file} (${stats.isDirectory() ? 'directory' : 'file'})`);
  }
}

if (!allFilesExist) {
  console.error('Production build verification failed!');
  process.exit(1);
}

console.log('Production build verification successful!');