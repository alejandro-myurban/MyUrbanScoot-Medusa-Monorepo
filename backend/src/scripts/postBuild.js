const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = process.cwd()
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

// Crear directorio de patches si no existe
const serverPatchesDir = path.join(MEDUSA_SERVER_PATH, 'patches')
if (!fs.existsSync(serverPatchesDir)) {
  fs.mkdirSync(serverPatchesDir, { recursive: true })
}

// ✅ Copiar patch de @lambdacurry/medusa-product-reviews
const patchSrc1 = path.join(
  ROOT,
  'patches',
  '@lambdacurry__medusa-product-reviews.patch'
)
const patchDest1 = path.join(
  serverPatchesDir,
  '@lambdacurry__medusa-product-reviews.patch'
)
fs.copyFileSync(patchSrc1, patchDest1)
console.log('➜ @lambdacurry/medusa-product-reviews patch copied to .medusa/server/patches')

// ✅ Copiar patch de medusa-plugin-tolgee
const patchSrc2 = path.join(
  ROOT,
  'patches',
  'medusa-plugin-tolgee@1.4.5.patch'
)
const patchDest2 = path.join(
  serverPatchesDir,
  'medusa-plugin-tolgee@1.4.5.patch'
)
fs.copyFileSync(patchSrc2, patchDest2)
console.log('➜ medusa-plugin-tolgee patch copied to .medusa/server/patches')

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
execSync('pnpm i --prod --frozen-lockfile', {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});