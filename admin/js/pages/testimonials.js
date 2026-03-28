// ============================================================
// Testimonials Editor
// ============================================================

router.register('testimonials', loadTestimonialsPage);

async function loadTestimonialsPage() {
    const container = document.getElementById('testimonialsEditor');
    renderPageLoading(container);
    try {
        const items = await API.getTestimonials();
        renderTestimonialsList(items, container);
    } catch (err) { renderPageError(container, err); }
}

function renderTestimonialsList(items, container) {
    if (!items.length) {
        container.innerHTML = `
            <div class="help-banner"><i class="fas fa-info-circle"></i><div>
                <strong>Testimonials</strong> — Add reviews and quotes from clients, colleagues, or collaborators. Publish to show them on your portfolio.
            </div></div>
            <div class="empty-state"><i class="fas fa-comments"></i><p>No testimonials yet — click <strong>Add Testimonial</strong>.</p></div>`;
        bindTestimonialsAddBtn();
        return;
    }
    let html = `
        <div class="help-banner"><i class="fas fa-info-circle"></i><div>
            <strong>Testimonials</strong> — These appear in the Testimonials section of your portfolio. Hit <strong>Publish</strong> to go live.
        </div></div>
        <div class="data-grid">`;
    for (const t of items) {
        const stars = '★'.repeat(Math.min(5, Math.max(0, t.rating || 5)));
        html += `
            <div class="data-card">
                <div class="data-card-header">
                    <div>
                        <div class="data-card-title">${esc(t.name || 'Anonymous')}</div>
                        <div class="data-card-subtitle">${esc(t.role || '')}${t.company ? ` · ${esc(t.company)}` : ''}</div>
                    </div>
                    <span style="color:var(--accent1);font-size:0.9rem" title="${t.rating || 5}/5 stars">${stars}</span>
                </div>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:8px 0 4px;font-style:italic;line-height:1.5">"${esc(t.quote || '')}"</p>
                <div class="data-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editTestimonial(${t.id})"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteTestimonial(${t.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    bindTestimonialsAddBtn();
}

function bindTestimonialsAddBtn() {
    const btn = document.getElementById('addTestimonial');
    if (btn && !btn.dataset.bound) {
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => openTestimonialModal(null));
    }
}

async function openTestimonialModal(item) {
    const isEdit = !!item;
    const body = `
        <div class="form-row">
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-input" id="tName" value="${esc(item?.name || '')}" placeholder="John Smith">
            </div>
            <div class="form-group">
                <label>Role / Title</label>
                <input type="text" class="form-input" id="tRole" value="${esc(item?.role || '')}" placeholder="Senior Developer">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="form-input" id="tCompany" value="${esc(item?.company || '')}" placeholder="Acme Corp">
            </div>
            <div class="form-group">
                <label>Rating (1–5)</label>
                <input type="number" class="form-input" id="tRating" value="${item?.rating || 5}" min="1" max="5">
            </div>
        </div>
        <div class="form-group">
            <label>Avatar URL <span style="color:var(--muted);font-weight:400">(optional)</span></label>
            <input type="text" class="form-input" id="tAvatar" value="${esc(item?.avatar || '')}" placeholder="https://…">
        </div>
        <div class="form-group">
            <label>Quote</label>
            <textarea class="form-input" id="tQuote" rows="4" placeholder="Their testimonial quote…">${esc(item?.quote || '')}</textarea>
        </div>`;
    const ok = await showEditModal(isEdit ? 'Edit Testimonial' : 'Add Testimonial', body);
    if (!ok) return;

    const quote = document.getElementById('tQuote').value.trim();
    const name  = document.getElementById('tName').value.trim();
    if (!name || !quote) return showToast('Name and quote are required', 'error');

    const data = {
        name, quote,
        role:       document.getElementById('tRole').value,
        company:    document.getElementById('tCompany').value,
        avatar:     document.getElementById('tAvatar').value,
        rating:     parseInt(document.getElementById('tRating').value) || 5,
        sort_order: item?.sort_order || 0,
    };

    try {
        if (isEdit) await API.updateTestimonial(item.id, data);
        else await API.createTestimonial(data);
        showToast(isEdit ? 'Updated!' : 'Created!', 'success');
        loadTestimonialsPage();
    } catch (err) { showToast(err.message, 'error'); }
}

window.editTestimonial = async function(id) {
    const item = await API.request(`/api/testimonials/${id}`);
    await openTestimonialModal(item);
};

window.deleteTestimonial = async function(id) {
    const ok = await showConfirm('Delete Testimonial', 'This will permanently delete this testimonial.', 'warning');
    if (!ok) return;
    try {
        await API.deleteTestimonial(id);
        showToast('Deleted.', 'success');
        loadTestimonialsPage();
    } catch (err) { showToast(err.message, 'error'); }
};
