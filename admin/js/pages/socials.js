// ============================================================
// Socials Editor — platform presets + icon picker
// ============================================================

router.register('socials', loadSocialsPage);

const SOCIAL_PRESETS = [
    { platform: 'LinkedIn',   label: 'LinkedIn',   icon: 'fab fa-linkedin' },
    { platform: 'GitHub',     label: 'GitHub',     icon: 'fab fa-github' },
    { platform: 'Facebook',   label: 'Facebook',   icon: 'fab fa-facebook' },
    { platform: 'Instagram',  label: 'Instagram',  icon: 'fab fa-instagram' },
    { platform: 'Twitter/X',  label: 'Twitter/X',  icon: 'fab fa-x-twitter' },
    { platform: 'YouTube',    label: 'YouTube',    icon: 'fab fa-youtube' },
    { platform: 'TikTok',     label: 'TikTok',     icon: 'fab fa-tiktok' },
    { platform: 'Discord',    label: 'Discord',    icon: 'fab fa-discord' },
    { platform: 'Telegram',   label: 'Telegram',   icon: 'fab fa-telegram' },
    { platform: 'Website',    label: 'Website',    icon: 'fas fa-globe' },
    { platform: 'Email',      label: 'Email',      icon: 'fas fa-envelope' },
    { platform: 'Behance',    label: 'Behance',    icon: 'fab fa-behance' },
    { platform: 'Dribbble',   label: 'Dribbble',   icon: 'fab fa-dribbble' },
    { platform: 'Fiverr',     label: 'Fiverr',     icon: 'fas fa-dollar-sign' },
    { platform: 'Upwork',     label: 'Upwork',     icon: 'fas fa-briefcase' },
    { platform: 'Other',      label: 'Other',      icon: 'fas fa-link' },
];

async function loadSocialsPage() {
    const container = document.getElementById('socialsEditor');
    renderPageLoading(container);

    try {
        const items = await API.getSocials();
        let html = `
            <div class="help-banner">
                <i class="fas fa-info-circle"></i>
                <div>
                    <strong>Social Links</strong> — These appear as clickable icon cards on your portfolio's Socials section.
                    Click <strong>Add Link</strong> and pick your platform from the presets.
                </div>
            </div>
            <div class="data-grid">`;

        for (const s of items) {
            html += `
                <div class="data-item">
                    <i class="${esc(s.icon)}" style="font-size:1.4rem;color:var(--accent2);width:32px;text-align:center;flex-shrink:0"></i>
                    <div class="data-item-content">
                        <div class="data-item-title">${esc(s.label)}</div>
                        <div class="data-item-subtitle" style="word-break:break-all">${esc(s.url)}</div>
                    </div>
                    <div class="data-item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editSocial(${s.id})"><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSocial(${s.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        }
        if (!items.length) html += '<div class="empty-state"><i class="fas fa-share-alt"></i><p>No social links yet — click <strong>Add Link</strong>.</p></div>';
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        renderPageError(container, err);
    }
}

document.getElementById('addSocial').addEventListener('click', () => openSocialModal());

async function openSocialModal(social = null) {
    const body = `
        <div class="form-group">
            <label>Platform</label>
            <div class="platform-grid" id="platformGrid">
                ${SOCIAL_PRESETS.map(p => `
                    <button type="button" class="platform-btn ${(social?.platform === p.platform) ? 'selected' : ''}"
                            data-platform="${esc(p.platform)}"
                            data-icon="${esc(p.icon)}"
                            data-label="${esc(p.label)}"
                            onclick="selectPlatformPreset(this)">
                        <i class="${esc(p.icon)}"></i>
                        <span>${esc(p.platform)}</span>
                    </button>`).join('')}
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label>Display Label</label>
                <input type="text" class="form-input" id="modalLabel" value="${esc(social?.label || '')}" placeholder="e.g. LinkedIn" maxlength="40">
                <div class="field-hint"><i class="fas fa-info-circle"></i>The text shown under the icon.</div>
            </div>
            <div class="form-group">
                <label>Icon <span style="font-size:0.72rem;color:var(--muted)">(Font Awesome class)</span></label>
                <div style="display:flex;gap:8px;align-items:center">
                    <input type="text" class="form-input" id="modalIcon" value="${esc(social?.icon || 'fab fa-link')}"
                           oninput="document.getElementById('socialIconPreview').className=this.value" style="flex:1">
                    <i id="socialIconPreview" class="${esc(social?.icon || 'fab fa-link')}" style="font-size:1.4rem;color:var(--accent2);width:28px;text-align:center"></i>
                </div>
            </div>
        </div>

        <div class="form-group">
            <label>URL / Link</label>
            <input type="url" class="form-input" id="modalUrl" value="${esc(social?.url || '')}" placeholder="https://linkedin.com/in/yourname">
            <div class="field-hint"><i class="fas fa-info-circle"></i>Full URL including https://. For Email use <code>mailto:you@email.com</code>.</div>
        </div>
    `;

    const ok = await showEditModal(social ? 'Edit Social Link' : 'Add Social Link', body);
    if (!ok) return;

    const selectedBtn = document.querySelector('.platform-btn.selected');
    const data = {
        platform:   selectedBtn?.dataset.platform || document.getElementById('modalLabel').value,
        label:      document.getElementById('modalLabel').value,
        url:        document.getElementById('modalUrl').value,
        icon:       document.getElementById('modalIcon').value,
        sort_order: social?.sort_order ?? 99,
    };

    try {
        if (social) {
            await API.updateSocial(social.id, data);
            showToast('Updated!', 'success');
        } else {
            await API.createSocial(data);
            showToast('Social link created!', 'success');
        }
        loadSocialsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.selectPlatformPreset = function(btn) {
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('modalLabel').value = btn.dataset.label;
    document.getElementById('modalIcon').value  = btn.dataset.icon;
    document.getElementById('socialIconPreview').className = btn.dataset.icon;
};

window.editSocial = async function(id) {
    const s = await API.request(`/api/socials/${id}`);
    openSocialModal(s);
};

window.deleteSocial = async function(id) {
    if (await showConfirm('Delete Social Link', 'Delete this social link permanently?', 'warning')) {
        try { await API.deleteSocial(id); showToast('Deleted', 'success'); loadSocialsPage(); }
        catch (err) { showToast(err.message, 'error'); }
    }
};
