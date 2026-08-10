import fs from 'fs';
import path from 'path';
import { fleetPath } from '../seeders/seed.js';
import { getUploadsRoot, localPathFromPublic } from '../utils/paths.js';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function folderIdFromUrl(url) {
  const m = String(url || '').match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m?.[1] || null;
}

async function httpGet(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function listFolderImages(folderId) {
  const html = (await httpGet(`https://drive.google.com/drive/folders/${folderId}`)).toString(
    'utf8',
  );
  const m = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'((?:\\'|[^'])*)'/);
  if (!m) return [];
  const raw = m[1];
  const pattern =
    /\\x22(1[a-zA-Z0-9_-]{20,})\\x22.{0,160}\\x22([^\\]+?\.(?:jpg|jpeg|png|webp))\\x22/gi;
  const found = [];
  const seen = new Set();
  let match;
  while ((match = pattern.exec(raw))) {
    const fileId = match[1];
    if (fileId === folderId || seen.has(fileId)) continue;
    seen.add(fileId);
    found.push({ fileId, name: match[2] });
  }
  return found;
}

async function downloadFile(fileId, dest) {
  const urls = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1600`,
  ];
  for (const url of urls) {
    try {
      const data = await httpGet(url);
      if (data.length < 2000 && data.slice(0, 200).toString().toLowerCase().includes('<html')) {
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, data);
      return true;
    } catch {
      // try next mirror
    }
  }
  return false;
}

/**
 * Download missing fleet photos from Google Drive into uploads/fleet.
 * Safe to call on every boot — only fetches absent files.
 */
export async function ensureFleetAssets() {
  const uploadsRoot = getUploadsRoot();
  fs.mkdirSync(uploadsRoot, { recursive: true });

  if (!fs.existsSync(fleetPath)) {
    console.warn('[fleet-assets] fleetFromPdf.json missing — cannot restore photos');
    return { downloaded: 0, failed: 0 };
  }

  const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf8'));
  let missingCount = 0;
  let presentCount = 0;

  for (const car of fleet) {
    const paths = [car.image, ...(Array.isArray(car.gallery) ? car.gallery : [])].filter(Boolean);
    for (const p of paths) {
      if (!String(p).startsWith('/uploads/')) continue;
      if (fs.existsSync(localPathFromPublic(p))) presentCount += 1;
      else missingCount += 1;
    }
  }

  if (missingCount === 0) {
    console.log(`[fleet-assets] OK (${presentCount} files on disk)`);
    return { downloaded: 0, failed: 0 };
  }

  console.log(`[fleet-assets] Restoring ${missingCount} missing photos (${presentCount} already present)…`);

  let downloaded = 0;
  let failed = 0;

  for (const car of fleet) {
    const folderId = folderIdFromUrl(car.driveFolder);
    if (!folderId) continue;

    const gallery =
      Array.isArray(car.gallery) && car.gallery.length > 0
        ? car.gallery
        : car.image
          ? [car.image]
          : [];

    const needsDownload = gallery.some(
      (p) => p && String(p).startsWith('/uploads/') && !fs.existsSync(localPathFromPublic(p)),
    );
    if (!needsDownload) continue;

    let files = [];
    try {
      files = await listFolderImages(folderId);
    } catch (err) {
      console.warn(`[fleet-assets] list failed for ${car.name}: ${err.message}`);
      failed += 1;
      continue;
    }

    if (!files.length) {
      console.warn(`[fleet-assets] no drive files for ${car.name}`);
      failed += 1;
      continue;
    }

    for (let i = 0; i < gallery.length && i < files.length; i += 1) {
      const targetPublic = gallery[i];
      const dest = localPathFromPublic(targetPublic);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) continue;

      const ok = await downloadFile(files[i].fileId, dest);
      if (ok) {
        downloaded += 1;
        console.log(`[fleet-assets] + ${targetPublic}`);
      } else {
        failed += 1;
        console.warn(`[fleet-assets] x failed ${targetPublic}`);
      }
    }
  }

  console.log(`[fleet-assets] done — downloaded ${downloaded}, failed ${failed}`);
  return { downloaded, failed };
}

export { getUploadsRoot };
