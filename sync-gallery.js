/**
 * sync-gallery.js
 * Auto-scans /layout/, /videos/, and /profile/ folders
 * and regenerates their manifest.json files.
 *
 * Usage:
 *   node sync-gallery.js          — run once
 *   node sync-gallery.js --watch  — watch for changes and auto-update
 */

const fs   = require('fs');
const path = require('path');

const IMAGE_EXTS = new Set([
    '.jpg', '.jpeg', '.png', '.webp', '.avif',
    '.gif', '.bmp', '.svg', '.tiff', '.tif', '.heic', '.heif'
]);
const VIDEO_EXTS = new Set([
    '.mp4', '.webm', '.mov', '.avi', '.mkv', '.ogv'
]);

const FOLDERS = [
    { dir: 'layout',  exts: IMAGE_EXTS },
    { dir: 'videos',  exts: VIDEO_EXTS  },
];

function toAlt(filename) {
    return path.parse(filename).name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function scanFolder({ dir, exts }) {
    const dirPath      = path.join(__dirname, dir);
    const manifestPath = path.join(dirPath, 'manifest.json');

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created: ${dir}/`);
    }

    const files = fs.readdirSync(dirPath)
        .filter(f => {
            if (f === 'manifest.json') return false;
            const ext = path.extname(f).toLowerCase();
            return exts.has(ext);
        })
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    /* Read existing manifest to preserve custom alt text */
    let existing = {};
    if (fs.existsSync(manifestPath)) {
        try {
            const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            prev.forEach(e => { existing[e.file] = e.alt; });
        } catch { /* ignore parse errors */ }
    }

    const manifest = files.map(file => ({
        file,
        alt: existing[file] || toAlt(file)
    }));

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`✓ ${dir}/manifest.json — ${manifest.length} file(s)`);
    if (manifest.length > 0) {
        manifest.forEach(e => console.log(`    ${e.file}`));
    }
}

function runAll() {
    console.log('\n── Syncing gallery manifests ──');
    FOLDERS.forEach(scanFolder);
    console.log('── Done ──\n');
}

runAll();

/* ── Watch mode ──────────────────────────────────────────── */
if (process.argv.includes('--watch')) {
    console.log('Watching for changes… (Ctrl+C to stop)\n');
    FOLDERS.forEach(({ dir }) => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) return;

        let debounce;
        fs.watch(dirPath, () => {
            clearTimeout(debounce);
            debounce = setTimeout(runAll, 300);
        });
        console.log(`Watching: ${dir}/`);
    });
}
