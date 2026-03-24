// ============================================================
// Admin API Wrapper — All fetch calls with auth headers
// ============================================================

const API = {
    base: window.ADMIN_API_BASE || 'https://carlo-portfolio-api.johncarloebora.workers.dev',

    // Default request timeout in milliseconds
    TIMEOUT_MS: 15000,

    // Maximum retry attempts for transient network errors (not for 4xx responses)
    MAX_RETRIES: 2,

    getToken() {
        return sessionStorage.getItem('admin_token');
    },

    async request(path, options = {}, _retryCount = 0) {
        const token = this.getToken();
        if (!token && !options.noAuth) {
            window.location.href = 'index.html';
            throw new Error('Not authenticated');
        }

        const headers = { ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Attach an AbortController so requests time out cleanly
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        let res;
        try {
            res = await fetch(`${this.base}${path}`, {
                ...options,
                headers,
                signal: controller.signal,
            });
        } catch (err) {
            clearTimeout(timeoutId);
            // Retry on network failures (not aborts caused by the user navigating away)
            if (err.name !== 'AbortError' && _retryCount < this.MAX_RETRIES) {
                const delay = 300 * Math.pow(2, _retryCount); // 300 ms, 600 ms
                await new Promise(r => setTimeout(r, delay));
                return this.request(path, options, _retryCount + 1);
            }
            const msg = err.name === 'AbortError'
                ? `Request timed out after ${this.TIMEOUT_MS / 1000}s`
                : 'Network error — check your connection';
            throw new Error(msg);
        } finally {
            clearTimeout(timeoutId);
        }

        if (res.status === 401) {
            sessionStorage.removeItem('admin_token');
            window.location.href = 'index.html';
            throw new Error('Session expired');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    },

    get(path) { return this.request(path); },

    post(path, body) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(path, body) {
        return this.request(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete(path) {
        return this.request(path, { method: 'DELETE' });
    },

    upload(path, formData) {
        return this.request(path, {
            method: 'POST',
            body: formData,
        });
    },

    // ── Auth ──
    me() { return this.get('/api/auth/me'); },
    changePassword(currentPassword, newPassword) {
        return this.post('/api/auth/change-password', { currentPassword, newPassword });
    },

    // ── Settings ──
    getSettings() { return this.get('/api/settings'); },
    updateSettings(settings) { return this.put('/api/settings', settings); },
    updateSetting(key, value) { return this.put(`/api/settings/${key}`, { value }); },

    // ── Sections ──
    getSections() { return this.get('/api/sections'); },
    createSection(data) { return this.post('/api/sections', data); },
    updateSection(id, data) { return this.put(`/api/sections/${id}`, data); },
    deleteSection(id) { return this.delete(`/api/sections/${id}`); },
    reorderSections(items) { return this.put('/api/sections/reorder', { items }); },

    // ── About Cards ──
    getAboutCards() { return this.get('/api/about-cards'); },
    createAboutCard(data) { return this.post('/api/about-cards', data); },
    updateAboutCard(id, data) { return this.put(`/api/about-cards/${id}`, data); },
    deleteAboutCard(id) { return this.delete(`/api/about-cards/${id}`); },

    // ── Stats ──
    getStats() { return this.get('/api/stats'); },
    createStat(data) { return this.post('/api/stats', data); },
    updateStat(id, data) { return this.put(`/api/stats/${id}`, data); },
    deleteStat(id) { return this.delete(`/api/stats/${id}`); },

    // ── Skill Cards ──
    getSkillCards() { return this.get('/api/skill-cards'); },
    createSkillCard(data) { return this.post('/api/skill-cards', data); },
    updateSkillCard(id, data) { return this.put(`/api/skill-cards/${id}`, data); },
    deleteSkillCard(id) { return this.delete(`/api/skill-cards/${id}`); },

    // ── Skill Categories ──
    getSkillCategories(cardId) { return this.get(`/api/skill-categories?skill_card_id=${cardId}`); },
    createSkillCategory(data) { return this.post('/api/skill-categories', data); },
    updateSkillCategory(id, data) { return this.put(`/api/skill-categories/${id}`, data); },
    deleteSkillCategory(id) { return this.delete(`/api/skill-categories/${id}`); },

    // ── Skills ──
    getSkills(categoryId) { return this.get(`/api/skills?category_id=${categoryId}`); },
    createSkill(data) { return this.post('/api/skills', data); },
    updateSkill(id, data) { return this.put(`/api/skills/${id}`, data); },
    deleteSkill(id) { return this.delete(`/api/skills/${id}`); },

    // ── Experiences ──
    getExperiences() { return this.get('/api/experiences'); },
    createExperience(data) { return this.post('/api/experiences', data); },
    updateExperience(id, data) { return this.put(`/api/experiences/${id}`, data); },
    deleteExperience(id) { return this.delete(`/api/experiences/${id}`); },

    // ── Education ──
    getEducation() { return this.get('/api/education'); },
    createEducation(data) { return this.post('/api/education', data); },
    updateEducation(id, data) { return this.put(`/api/education/${id}`, data); },
    deleteEducation(id) { return this.delete(`/api/education/${id}`); },

    // ── Projects ──
    getProjects() { return this.get('/api/projects'); },
    createProject(data) { return this.post('/api/projects', data); },
    updateProject(id, data) { return this.put(`/api/projects/${id}`, data); },
    deleteProject(id) { return this.delete(`/api/projects/${id}`); },

    // ── Socials ──
    getSocials() { return this.get('/api/socials'); },
    createSocial(data) { return this.post('/api/socials', data); },
    updateSocial(id, data) { return this.put(`/api/socials/${id}`, data); },
    deleteSocial(id) { return this.delete(`/api/socials/${id}`); },

    // ── Media ──
    getMedia(folder) {
        const q = folder ? `?folder=${folder}` : '';
        return this.get(`/api/media${q}`);
    },
    uploadMedia(file, folder, altText) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        fd.append('alt_text', altText || '');
        return this.upload('/api/media/upload', fd);
    },
    updateMedia(id, altText) { return this.put(`/api/media/${id}`, { alt_text: altText }); },
    deleteMedia(id) { return this.delete(`/api/media/${id}`); },

    // ── Publish ──
    publish() { return this.post('/api/publish', {}); },
};
