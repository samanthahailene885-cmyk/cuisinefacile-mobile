import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const srcImagesDir = path.join(repoRoot, 'public', 'recipes');
const srcImagesBackupDir = path.join(repoRoot, 'public', 'recipes_backup');
const mobileRoot = process.cwd();
const dstImagesDir = path.join(mobileRoot, 'assets', 'recipes');
const outJson = path.join(mobileRoot, 'src', 'offlineRecipes.json');
const outMap = path.join(mobileRoot, 'src', 'recipeImages.ts');

const API_BASE = process.env.OFFLINE_API_BASE || 'http://localhost/cuisinefacile/php-api/api';

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const safeStat = async (p) => {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
};

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
};

const getFilenameFromImageUrl = (imageUrl) => {
  const raw = String(imageUrl || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : null;
  } catch {
    const q = raw.split('?')[0];
    const parts = q.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last ? last : null;
  }
};

const findSourceImagePath = async (args) => {
  const candidates = [];

  if (args.filename) {
    candidates.push(path.join(srcImagesDir, args.filename));
    candidates.push(path.join(srcImagesBackupDir, args.filename));
  }

  if (args.recipeId) {
    candidates.push(path.join(srcImagesDir, `${args.recipeId}.jpg`));
    candidates.push(path.join(srcImagesDir, `${args.recipeId}.png`));
    candidates.push(path.join(srcImagesBackupDir, `${args.recipeId}.jpg`));
    candidates.push(path.join(srcImagesBackupDir, `${args.recipeId}.png`));
  }

  for (const p of candidates) {
    const st = await safeStat(p);
    if (st && st.isFile()) return p;
  }

  return null;
};

const main = async () => {
  console.log('== CuisineFacile mobile offline sync ==');

  await ensureDir(dstImagesDir);

  const srcStat = await safeStat(srcImagesDir);
  if (!srcStat || !srcStat.isDirectory()) {
    throw new Error(`Source images folder not found: ${srcImagesDir}`);
  }

  console.log('1) Fetching recipes from API:', API_BASE);
  const envelope = await fetchJson(`${API_BASE}/mobile/recipes`);
  if (!envelope || envelope.ok !== true) {
    throw new Error(`Unexpected API response for /mobile/recipes: ${JSON.stringify(envelope)?.slice(0, 200)}`);
  }
  const recipes = Array.isArray(envelope.data) ? envelope.data : [];
  console.log(`   -> ${recipes.length} recipes`);

  console.log('2) Writing offline recipes JSON:', outJson);
  await fs.writeFile(outJson, JSON.stringify(recipes, null, 2) + '\n', 'utf8');

  console.log('3) Copying recipe images into:', dstImagesDir);
  const mapEntries = [];

  for (const r of recipes) {
    const id = String(r?.id ?? '').trim();
    if (!id) continue;

    const filename = getFilenameFromImageUrl(r?.image);
    const src = await findSourceImagePath({ recipeId: id, filename });
    if (!src) continue;

    const ext = path.extname(src).toLowerCase() || '.jpg';
    const dst = path.join(dstImagesDir, `${id}${ext}`);
    await fs.copyFile(src, dst);

    const rel = `../assets/recipes/${id}${ext}`;
    mapEntries.push({ id, rel });
  }

  console.log(`   -> copied ${mapEntries.length} images`);

  console.log('4) Generating recipeImages.ts mapping:', outMap);
  const lines = [];
  lines.push('export const RECIPE_IMAGES: Record<string, any> = {');
  for (const e of mapEntries) {
    lines.push(`  ${JSON.stringify(e.id)}: require(${JSON.stringify(e.rel)}),`);
  }
  lines.push('};');
  lines.push('');
  await fs.writeFile(outMap, lines.join('\n'), 'utf8');

  console.log('Done. Restart Expo with -c after running this.');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
