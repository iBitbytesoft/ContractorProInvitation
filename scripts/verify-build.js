import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredFiles = [
  '../dist/public/index.html',
  '../dist/server/index.js'
];

console.log('Verifying build output...');

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing required file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✓ Found ${file}`);
  }
}

if (!allFilesExist) {
  console.error('Build verification failed!');
  process.exit(1);
}

console.log('Build verification successful!');