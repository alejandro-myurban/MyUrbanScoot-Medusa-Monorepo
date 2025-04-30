const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// Copy pnpm-lock.yaml
fs.copyFileSync(
  path.join(process.cwd(), 'pnpm-lock.yaml'),
  path.join(MEDUSA_SERVER_PATH, 'pnpm-lock.yaml')
);

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// 4. **Copia tu patch** a .medusa/server/patches
const patchSrc = path.join(
  ROOT,
  'patches',
  '@lambdacurry_medusa-product-reviews.patch' // tu parche raíz
)
const serverPatchesDir = path.join(MEDUSA_SERVER_PATH, 'patches')
const patchDest = path.join(
  serverPatchesDir,
  '@lambdacurry__medusa-product-reviews.patch'  // Medusa espera dobles guiones bajos
)

if (!fs.existsSync(serverPatchesDir)) {
  fs.mkdirSync(serverPatchesDir, { recursive: true })
}
fs.copyFileSync(patchSrc, patchDest)
console.log('➜ Patch copied to .medusa/server/patches')

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
execSync('pnpm i --prod --frozen-lockfile', { 
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});
