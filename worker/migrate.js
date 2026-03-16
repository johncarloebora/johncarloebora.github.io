#!/usr/bin/env node
// ============================================================
// Media Migration Script
// Uploads local media files to Cloudflare R2 and populates D1
// ============================================================
//
// Usage:
//   cd worker
//   npm run migrate
//
// Prerequisites:
//   1. wrangler.toml configured with real D1 database_id and R2 bucket name
//   2. D1 schema applied:  npx wrangler d1 execute carlo-portfolio-db --file=schema.sql
//   3. D1 seeded:          npx wrangler d1 execute carlo-portfolio-db --file=seed.sql
//   4. Logged into wrangler: npx wrangler login
//
// What this script does:
//   - Scans ../layout/, ../profile/, ../thumbnail/ for media files
//   - Uploads each file to R2 under the same folder structure
//   - Inserts a row into the D1 `media` table for each file
//   - Skips manifest.json and other non-media files

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ------- Configuration -------
const PORTFOLIO_ROOT = path.resolve(__dirname, '..');
const DB_NAME = 'carlo-portfolio-db';
const R2_BUCKET = 'carlo-portfolio-media';

const FOLDERS = ['layout', 'profile', 'thumbnail'];

const MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
};

const SKIP_FILES = ['manifest.json', '.DS_Store', 'Thumbs.db', 'desktop.ini'];

// ------- Helpers -------

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || null;
}

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err) {
        console.error(`  Command failed: ${cmd}`);
        console.error(`  ${err.stderr || err.message}`);
        return null;
    }
}

function escapeSQL(str) {
    return str.replace(/'/g, "''");
}

// ------- Main -------

async function migrate() {
    console.log('=== Carlo Portfolio — Media Migration ===\n');

    let totalFiles = 0;
    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const folder of FOLDERS) {
        const folderPath = path.join(PORTFOLIO_ROOT, folder);

        if (!fs.existsSync(folderPath)) {
            console.log(`[skip] Folder not found: ${folder}/`);
            continue;
        }

        const files = fs.readdirSync(folderPath);
        console.log(`\n--- ${folder}/ (${files.length} files) ---`);

        for (const filename of files) {
            totalFiles++;
            const filePath = path.join(folderPath, filename);

            // Skip directories
            if (fs.statSync(filePath).isDirectory()) {
                console.log(`  [skip] ${filename} (directory)`);
                skipped++;
                continue;
            }

            // Skip non-media files
            if (SKIP_FILES.includes(filename)) {
                console.log(`  [skip] ${filename} (excluded)`);
                skipped++;
                continue;
            }

            const mimeType = getMimeType(filePath);
            if (!mimeType) {
                console.log(`  [skip] ${filename} (unknown type)`);
                skipped++;
                continue;
            }

            const r2Key = `${folder}/${filename}`;
            const fileSize = fs.statSync(filePath).size;
            const altText = path.basename(filename, path.extname(filename))
                .replace(/[-_]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // Upload to R2
            console.log(`  [upload] ${r2Key} (${(fileSize / 1024).toFixed(1)} KB)`);
            const uploadResult = run(
                `npx wrangler r2 object put "${R2_BUCKET}/${r2Key}" --file="${filePath}" --content-type="${mimeType}"`
            );

            if (uploadResult === null) {
                console.log(`  [FAIL] Could not upload ${r2Key}`);
                failed++;
                continue;
            }

            // Insert into D1 media table
            const sql = `INSERT OR IGNORE INTO media (folder, filename, alt_text, mime_type, size_bytes) VALUES ('${escapeSQL(folder)}', '${escapeSQL(filename)}', '${escapeSQL(altText)}', '${mimeType}', ${fileSize});`;

            const dbResult = run(
                `npx wrangler d1 execute ${DB_NAME} --command="${sql.replace(/"/g, '\\"')}"`
            );

            if (dbResult === null) {
                console.log(`  [WARN] Uploaded to R2 but D1 insert failed for ${filename}`);
            }

            uploaded++;
        }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`  Total files scanned: ${totalFiles}`);
    console.log(`  Uploaded to R2:      ${uploaded}`);
    console.log(`  Skipped:             ${skipped}`);
    console.log(`  Failed:              ${failed}`);
    console.log('\nDone! Run "npx wrangler d1 execute ' + DB_NAME + ' --command=\\"SELECT * FROM media\\"" to verify.\n');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
