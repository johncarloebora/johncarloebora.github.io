// ============================================================
// Admin API Wrapper — All fetch calls with auth headers
// ============================================================

const API = {
    base: window.ADMIN_API_BASE || '',

    getToken() {
        return sessionStorage.getItem('admin_token');
    },

    async request(path, options = {}) {
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

        const res = await fetch(`${this.base}${path}`, { ...options, headers });

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
