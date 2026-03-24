// ============================================================
// Media Library — Upload, Browse, Delete (folder-grouped view)
// ============================================================

router.register('media', loadMediaPage);

const FOLDER_ICONS = {
    layout:    'fas fa-images',
    profile:   'fas fa-user-circle',
    thumbnail: 'fas fa-th-large',
    videos:    'fas fa-film',
};
const FOLDER_LABELS = {
    layout:    'Layout',
    profile:   'Profile',
    thumbnail: 'Thumbnails',
    videos:    'Videos',
};

async function loadMediaPage() {
    const container = document.getElementById('mediaEditor');
    renderPageLoading(container);

    const filterFolder = document.getElementById('mediaFolderFilter').value;

    try {
        const items = await API.getMedia(filterFolder);

        // Group by folder
        const byFolder = {};
        for (const m of items) {
            if (!byFolder[m.folder]) byFolder[m.folder] = [];
            byFolder[m.folder].push(m);
        }

        let html = `
            <div class="upload-zone" id="uploadZone">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag &amp; drop files here or click to upload</p>
                <input type="file" id="fileInput" multiple accept="image/*,video/*" style="display:none">
            </div>
            <div id="uploadFolderSelect" style="display:none;margin-bottom:16px">
                <div class="form-row">
                    <div class="form-group">
                        <label>Upload to folder</label>
                        <select class="form-input" id="uploadFolder">
                            <option value="layout">Layout</option>
                            <option value="profile">Profile</option>
                            <option value="thumbnail">Thumbnail</option>
                            <option value="videos">Videos</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Alt Text (optional)</label>
                        <input type="text" class="form-input" id="uploadAlt" placeholder="Image description">
                    </div>
                </div>
                <button class="btn btn-primary" id="uploadConfirm"><i class="fas fa-upload"></i> Upload</button>
            </div>
        `;

        if (!items.length) {
            html += '<div class="empty-state"><i class="fas fa-images"></i><p>No media files' + (filterFolder ? ' in this folder' : '') + '</p></div>';
        } else {
            const folders = Object.keys(byFolder).sort();
            for (const folder of folders) {
                const folderItems = byFolder[folder];
                const icon = FOLDER_ICONS[folder] || 'fas fa-folder';
                const label = FOLDER_LABELS[folder] || folder;
                html += `
                    <div class="media-folder-section" style="margin-bottom:28px">
                        <div class="media-folder-header" style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                            <i class="${icon}" style="color:var(--accent2);font-size:1.1rem"></i>
                            <h3 style="margin:0;font-size:1rem;font-weight:600">${label}</h3>
                            <span style="color:var(--muted);font-size:0.8rem">${folderItems.length} file(s)</span>
                        </div>
                        <div class="media-grid">`;
                for (const m of folderItems) {
                    const isImage = (m.mime_type || '').startsWith('image/');
                    const isVideo = (m.mime_type || '').startsWith('video/');
                    html += `<div class="media-item" onclick="previewMedia(${m.id}, '${esc(m.url)}', '${esc(m.alt_text || m.filename)}', '${esc(m.mime_type || '')}')">
                        ${isImage
                            ? `<img src="${esc(m.url)}" alt="${esc(m.alt_text || m.filename)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                            : ''}
                        ${isImage
                            ? `<div style="display:none;align-items:center;justify-content:center;height:100%;color:var(--muted);flex-direction:column;gap:6px"><i class="fas fa-image-slash" style="font-size:1.5rem"></i><span style="font-size:0.7rem">Load failed</span></div>`
                            : isVideo
                                ? `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--accent2)"><i class="fas fa-play-circle" style="font-size:2.5rem"></i></div>`
                                : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)"><i class="fas fa-file" style="font-size:2rem"></i></div>`}
                        <div class="media-item-overlay">${esc(m.filename)}</div>
                        <div class="media-item-actions">
                            <button class="btn btn-danger btn-icon btn-sm" aria-label="Delete" onclick="event.stopPropagation();deleteMediaItem(${m.id})" title="Delete">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>`;
                }
                html += `</div></div>`;
            }
            html += `<p style="color:var(--muted);font-size:0.8rem;margin-top:8px">${items.length} total file(s)</p>`;
        }

        container.innerHTML = html;

        // Upload zone handlers
        const zone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        let pendingFiles = [];

        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            pendingFiles = Array.from(e.dataTransfer.files);
            showUploadConfirm(pendingFiles);
        });

        fileInput.addEventListener('change', () => {
            pendingFiles = Array.from(fileInput.files);
            showUploadConfirm(pendingFiles);
        });

        function showUploadConfirm(files) {
            document.getElementById('uploadFolderSelect').style.display = 'block';
            // Pre-select filter folder if one is active
            if (filterFolder) document.getElementById('uploadFolder').value = filterFolder;
            zone.innerHTML = `<i class="fas fa-check-circle" style="color:var(--accent2)"></i><p>${files.length} file(s) selected</p>`;
        }

        document.getElementById('uploadConfirm')?.addEventListener('click', async () => {
            const uploadFolder = document.getElementById('uploadFolder').value;
            const altText = document.getElementById('uploadAlt').value;
            const btn = document.getElementById('uploadConfirm');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Uploading...';

            let uploaded = 0;
            for (const file of pendingFiles) {
                try {
                    await API.uploadMedia(file, uploadFolder, altText);
                    uploaded++;
                } catch (err) {
                    showToast(`Failed: ${file.name} — ${err.message}`, 'error');
                }
            }

            showToast(`${uploaded} file(s) uploaded!`, 'success');
            loadMediaPage();
        });

    } catch (err) {
        renderPageError(container, err);
    }
}

// Folder filter
document.getElementById('mediaFolderFilter').addEventListener('change', loadMediaPage);

// Rescan bucket — syncs D1 from actual R2 object keys
document.getElementById('rescanBtn').addEventListener('click', async () => {
    const btn = document.getElementById('rescanBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Scanning...';
    try {
        const res = await API.post('/api/media/rescan', {});
        showToast(`Rescan complete — ${res.synced} file(s) synced, ${res.removed} removed`, 'success');
        loadMediaPage();
    } catch (err) {
        showToast('Rescan failed: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> Rescan Bucket';
    }
});

window.deleteMediaItem = async function(id) {
    if (await showConfirm('Delete Media', 'This will permanently delete this file from R2.')) {
        try { await API.deleteMedia(id); showToast('Deleted', 'success'); loadMediaPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

window.previewMedia = async function(id, url, alt, mimeType) {
    const isVideo = (mimeType || '').startsWith('video/');
    const mediaEl = isVideo
        ? `<video src="${esc(url)}" controls style="max-width:100%;max-height:50vh;border-radius:8px"></video>`
        : `<img src="${esc(url)}" alt="${esc(alt)}" style="max-width:100%;max-height:50vh;border-radius:8px" onerror="this.outerHTML='<div style=\\'padding:40px;color:var(--muted);text-align:center\\'>Preview unavailable</div>'">`;

    const body = `
        <div style="text-align:center;margin-bottom:16px">${mediaEl}</div>
        <div class="form-group">
            <label>File URL</label>
            <input type="text" class="form-input" value="${esc(url)}" readonly onclick="this.select()" style="font-size:0.75rem;color:var(--muted)">
        </div>
        <div class="form-group">
            <label>Alt Text</label>
            <input type="text" class="form-input" id="modalAlt" value="${esc(alt)}">
        </div>
    `;
    const ok = await showEditModal('Media Details', body);
    if (!ok) return;

    try {
        await API.updateMedia(id, document.getElementById('modalAlt').value);
        showToast('Alt text updated!', 'success');
        loadMediaPage();
    } catch (err) { showToast(err.message, 'error'); }
};
