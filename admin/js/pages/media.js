// ============================================================
// Media Library — Upload, Browse, Delete
// ============================================================

router.register('media', loadMediaPage);

async function loadMediaPage() {
    const container = document.getElementById('mediaEditor');
    container.innerHTML = '<p style="color:var(--muted)">Loading...</p>';

    const folder = document.getElementById('mediaFolderFilter').value;

    try {
        const items = await API.getMedia(folder);

        let html = `
            <div class="upload-zone" id="uploadZone">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drag & drop files here or click to upload</p>
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

        html += '<div class="media-grid">';
        for (const m of items) {
            const isImage = (m.mime_type || '').startsWith('image/');
            html += `<div class="media-item" onclick="previewMedia(${m.id}, '${esc(m.url)}', '${esc(m.alt_text || m.filename)}')">
                ${isImage ? `<img src="${esc(m.url)}" alt="${esc(m.alt_text || m.filename)}" loading="lazy">` :
                `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--muted)"><i class="fas fa-video" style="font-size:2rem"></i></div>`}
                <div class="media-item-overlay">${esc(m.filename)}</div>
                <div class="media-item-actions">
                    <button class="btn btn-danger btn-icon btn-sm" onclick="event.stopPropagation();deleteMediaItem(${m.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }
        if (!items.length) html += '</div><div class="empty-state"><i class="fas fa-images"></i><p>No media files' + (folder ? ' in this folder' : '') + '</p></div>';
        else html += '</div>';

        html += `<p style="color:var(--muted);font-size:0.8rem;margin-top:16px">${items.length} file(s)</p>`;

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
        container.innerHTML = `<p style="color:var(--accent1)">Error: ${err.message}</p>`;
    }
}

// Folder filter
document.getElementById('mediaFolderFilter').addEventListener('change', loadMediaPage);

window.deleteMediaItem = async function(id) {
    if (await showConfirm('Delete Media', 'This will permanently delete this file from R2.')) {
        try { await API.deleteMedia(id); showToast('Deleted', 'success'); loadMediaPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};

window.previewMedia = async function(id, url, alt) {
    const body = `
        <div style="text-align:center;margin-bottom:16px">
            <img src="${esc(url)}" alt="${esc(alt)}" style="max-width:100%;max-height:50vh;border-radius:8px" onerror="this.outerHTML='<div style=\\'padding:40px;color:var(--muted)\\'>Preview unavailable</div>'">
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
