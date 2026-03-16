/* ============================================================
   CARLO PORTFOLIO — DATA-DRIVEN SCRIPT
   Loads site-config.json from R2, renders sections dynamically,
   then initializes all animations and interactions.
   ============================================================ */
'use strict';

/* ── CONFIG ──────────────────────────────────────────────── */
// Replace these with your actual URLs after Cloudflare setup
const R2_BASE  = window.PORTFOLIO_R2_BASE  || '';
const API_BASE = window.PORTFOLIO_API_BASE || '';

/* ── A. THEME ─────────────────────────────────────────────── */
(function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
})();

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            setTheme(cur === 'dark' ? 'light' : 'dark');
        });
    }
});

/* ── B. TOAST ─────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ── HTML ESCAPE ──────────────────────────────────────────── */
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/* ── MEDIA URL HELPER ─────────────────────────────────────── */
function mediaUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return R2_BASE ? `${R2_BASE}/${path}` : path;
}

/* ============================================================
   DATA-DRIVEN RENDERING
   ============================================================ */

/* ── Load site config ─────────────────────────────────────── */
async function loadSiteConfig() {
    // Try R2 first
    if (R2_BASE) {
        try {
            const res = await fetch(`${R2_BASE}/site-config.json`);
            if (res.ok) return await res.json();
        } catch {}
    }
    // Try Worker API
    if (API_BASE) {
        try {
            const res = await fetch(`${API_BASE}/api/gallery/layout`);
            if (res.ok) return null; // Partial data only
        } catch {}
    }
    return null;
}

/* ── Render Navigation ────────────────────────────────────── */
function renderNav(config) {
    const container = document.getElementById('navLinksContainer');
    if (!container) return;

    const sections = config.sections.filter(s => s.visible);
    container.innerHTML = '';

    sections.forEach((s, i) => {
        const a = document.createElement('a');
        a.href = `#${s.id}`;
        a.className = `nav-link${i === 0 ? ' active' : ''}`;
        a.dataset.tooltip = s.nav_label;
        a.innerHTML = `<i class="${esc(s.nav_icon)}"></i><span>${esc(s.nav_label)}</span>`;
        container.appendChild(a);
    });

    // Update logo
    if (config.settings.navLogo) {
        const logo = document.getElementById('navLogo');
        const drawerBrand = document.getElementById('navDrawerBrand');
        if (logo) logo.innerHTML = `${esc(config.settings.navLogo)}<span>.</span>`;
        if (drawerBrand) drawerBrand.innerHTML = `${esc(config.settings.navLogo)}<span>.</span>`;
    }
}

/* ── Render Hero ──────────────────────────────────────────── */
function renderHero(config) {
    const s = config.settings;

    const eyebrow = document.getElementById('heroEyebrow');
    if (eyebrow && s.heroEyebrow) eyebrow.textContent = s.heroEyebrow;

    const name = document.getElementById('heroName');
    if (name && s.heroName) {
        name.textContent = s.heroName;
        name.dataset.glitch = s.heroGlitchText || s.heroName;
    }

    const subtitle = document.getElementById('hero-subtitle');
    if (subtitle && s.heroSubtitle) subtitle.textContent = s.heroSubtitle;

    const desc = document.getElementById('heroDesc');
    if (desc && s.heroDescription) desc.textContent = s.heroDescription;

    // Profile shape
    const avatarFrame = document.getElementById('avatarFrame');
    if (avatarFrame && s.profileShape) {
        avatarFrame.classList.remove('shape-hexagon', 'shape-circle', 'shape-square', 'shape-rounded');
        if (s.profileShape !== 'hexagon') {
            avatarFrame.classList.add(`shape-${s.profileShape}`);
        }
    }

    // CTA buttons
    const btnContainer = document.getElementById('heroButtons');
    if (btnContainer && s.ctaPrimaryText) {
        btnContainer.innerHTML = `
            <a href="${esc(s.ctaPrimaryLink || '#projects')}" class="cta-button primary">${esc(s.ctaPrimaryText)}</a>
            <a href="${esc(s.ctaSecondaryLink || '#about')}" class="cta-button secondary">${esc(s.ctaSecondaryText || 'About Me')}</a>
        `;
    }

    // Footer
    const footer = document.getElementById('footerText');
    if (footer && s.footerText) footer.textContent = s.footerText;
}

/* ── Render About ─────────────────────────────────────────── */
function renderAbout(config) {
    if (!config.about) return '';
    const cards = config.about.cards || [];
    const stats = config.about.stats || [];

    let html = '<div class="about-grid">';
    for (const card of cards) {
        const expanded = card.expanded ? ' about-expanded' : '';
        html += `<div class="about-card card${expanded}">
            <div class="about-card-header">
                <div class="about-card-title">
                    <i class="${esc(card.icon || 'fas fa-user')}"></i>
                    <h3>${esc(card.title)}</h3>
                </div>
                <span class="about-card-toggle"><i class="fas fa-chevron-down"></i></span>
            </div>
            <div class="about-card-body">`;

        if (card.type === 'info_list') {
            const items = typeof card.content === 'string' ? JSON.parse(card.content) : (card.content || []);
            html += '<ul class="info-list">';
            for (const item of items) {
                html += `<li><i class="${esc(item.icon || 'fas fa-info-circle')}"></i><div><strong>${esc(item.label)}</strong><span>${esc(item.value)}</span></div></li>`;
            }
            html += '</ul>';
        } else {
            html += `<p>${esc(typeof card.content === 'string' ? card.content : '')}</p>`;
        }
        html += '</div></div>';
    }
    html += '</div>';

    if (stats.length) {
        html += '<div class="stats-row">';
        for (const stat of stats) {
            html += `<div class="stat-card card"><span class="stat-number" data-target="${esc(String(stat.target))}" data-suffix="${esc(stat.suffix || '')}">0${esc(stat.suffix || '')}</span><span class="stat-label">${esc(stat.label)}</span></div>`;
        }
        html += '</div>';
    }
    return html;
}

/* ── Render Skills ────────────────────────────────────────── */
function renderSkills(config) {
    if (!config.skills) return '';
    let html = '';
    for (const card of config.skills) {
        const expanded = card.expanded ? ' expanded' : '';
        html += `<div class="skill-card card${expanded}">
            <div class="skill-card-header">
                <div class="skill-card-title"><i class="${esc(card.icon || 'fas fa-code')}"></i><h3>${esc(card.title)}</h3></div>
                <span class="skill-card-toggle"><i class="fas fa-chevron-down"></i></span>
            </div>
            <div class="skill-card-body">`;

        for (const cat of (card.categories || [])) {
            html += `<div class="skill-category"><h4><i class="${esc(cat.icon || 'fas fa-layer-group')}"></i> ${esc(cat.title)}</h4><div class="skills-list">`;
            for (const skill of (cat.skills || [])) {
                html += `<div class="skill-item"><div class="skill-info"><span class="skill-name"><i class="${esc(skill.icon || 'fas fa-circle')}"></i> ${esc(skill.name)}</span><span class="skill-percent">${skill.proficiency}%</span></div><div class="proficiency-bar"><div class="proficiency-level" data-width="${skill.proficiency}" style="width:0%"></div></div></div>`;
            }
            html += '</div></div>';
        }
        html += '</div></div>';
    }
    return html;
}

/* ── Render Experience ────────────────────────────────────── */
function renderExperience(config) {
    if (!config.experiences) return '';
    let html = '<div class="timeline">';
    for (const exp of config.experiences) {
        const open = exp.expanded ? ' tl-open' : '';
        const bullets = typeof exp.bullets === 'string' ? JSON.parse(exp.bullets) : (exp.bullets || []);
        html += `<div class="timeline-item${open}">
            <div class="timeline-marker"></div>
            <div class="timeline-content card">
                <div class="timeline-header">
                    <div><span class="date-range">${esc(exp.date_range)}</span><h3>${esc(exp.title)}</h3>
                    ${exp.badge ? `<span class="badge badge-current">${esc(exp.badge)}</span>` : ''}</div>
                    <span class="timeline-toggle"><i class="fas fa-chevron-down"></i></span>
                </div>
                <div class="timeline-body">
                    <p class="company">${esc(exp.company || '')}</p>
                    ${exp.description ? `<p>${esc(exp.description)}</p>` : ''}
                    <ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
                </div>
            </div>
        </div>`;
    }
    html += '</div>';
    return html;
}

/* ── Render Education ─────────────────────────────────────── */
function renderEducation(config) {
    if (!config.education) return '';
    let html = '<div class="education-grid">';
    for (const card of config.education) {
        const entries = typeof card.entries === 'string' ? JSON.parse(card.entries) : (card.entries || []);
        html += `<div class="card education-card"><h3><i class="${esc(card.card_icon || 'fas fa-graduation-cap')}"></i> ${esc(card.card_title)}</h3>`;
        for (const entry of entries) {
            html += `<div class="edu-entry"><h4>${esc(entry.title)}</h4><p class="edu-school">${esc(entry.school || '')}</p><p class="edu-year">${esc(entry.year || '')}</p>${entry.description ? `<p>${esc(entry.description)}</p>` : ''}</div>`;
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

/* ── Render Projects ──────────────────────────────────────── */
function renderProjects(config) {
    if (!config.projects) return '';
    let html = '<div class="projects-grid">';
    for (const proj of config.projects) {
        const tags = typeof proj.tags === 'string' ? JSON.parse(proj.tags) : (proj.tags || []);
        const thumbUrl = proj.thumbnail_url || mediaUrl(proj.thumbnail_path);

        let thumbAttr = '';
        if (proj.gallery_type === 'image' && proj.gallery_folder) {
            thumbAttr = `data-gallery-folder="${esc(proj.gallery_folder)}"`;
        } else if (proj.gallery_type === 'video') {
            thumbAttr = proj.gallery_folder
                ? `data-video-folder="${esc(proj.gallery_folder)}"`
                : 'data-video-empty';
        }

        html += `<div class="project-card card">
            <div class="project-thumbnail" ${thumbAttr} style="cursor:pointer">
                ${thumbUrl ? `<img src="${esc(thumbUrl)}" alt="${esc(proj.title)}" loading="lazy">` : '<div class="thumb-placeholder"><i class="fas fa-image"></i></div>'}
                <div class="project-overlay"><span>${proj.gallery_type === 'video' ? 'Watch Videos' : 'View Gallery'}</span></div>
            </div>
            <div class="project-info">
                <h3>${esc(proj.title)}</h3>
                <p>${esc(proj.description || '')}</p>
                <div class="project-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </div>
        </div>`;
    }
    html += '</div>';
    return html;
}

/* ── Render Socials ───────────────────────────────────────── */
function renderSocials(config) {
    if (!config.socials) return '';
    let html = '<div class="socials-grid">';
    for (const s of config.socials) {
        html += `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" class="social-card card"><i class="${esc(s.icon)}"></i><span>${esc(s.label || s.platform)}</span></a>`;
    }
    html += '</div>';
    return html;
}

/* ── Render Contact ───────────────────────────────────────── */
function renderContact(config) {
    const s = config.settings;
    const recaptchaKey = s.recaptchaSiteKey || '6Lf1x1wrAAAAAKbH9ESQXHFH_IFoY0AoeE3aBf8F';
    return `<div class="contact-container">
        <form id="contact-form" class="contact-form">
            <div class="form-group"><label for="name">Name</label><input type="text" id="name" name="from_name" required></div>
            <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="to_email" required></div>
            <div class="form-group"><label for="message">Message</label><textarea id="message" name="message" rows="5" required></textarea></div>
            <div class="g-recaptcha" data-sitekey="${esc(recaptchaKey)}" data-theme="dark"></div>
            <button type="submit" class="cta-button primary"><span>Send Message</span><i class="fas fa-paper-plane"></i></button>
        </form>
    </div>`;
}

/* ── Render Custom Sections ───────────────────────────────── */
function renderCustomSections(section) {
    const cfg = typeof section.config === 'string' ? JSON.parse(section.config) : (section.config || {});
    return cfg.html || '<p>Custom section content goes here.</p>';
}

/* ── Master Render ────────────────────────────────────────── */
function renderAll(config) {
    renderNav(config);
    renderHero(config);

    const container = document.getElementById('dynamicSections');
    if (!container) return;

    const renderers = {
        about: renderAbout,
        skills: renderSkills,
        experience: renderExperience,
        education: renderEducation,
        projects: renderProjects,
        socials: renderSocials,
        contact: renderContact,
    };

    let html = '';
    const visibleSections = config.sections.filter(s => s.visible);

    for (const section of visibleSections) {
        const sectionId = section.id || section.title.toLowerCase().replace(/\s+/g, '-');
        const renderer = renderers[sectionId];

        html += `<section id="${esc(sectionId)}">`;
        html += `<h2 class="section-title" data-scramble="${esc(section.title)}">${esc(section.title)}</h2>`;

        if (renderer) {
            html += renderer(config);
        } else if (section.type === 'custom') {
            html += renderCustomSections(section);
        }

        html += '</section>';
    }

    container.innerHTML = html;
}

/* ── Fallback Config ──────────────────────────────────────── */
function getFallbackConfig() {
    return {
        settings: {
            heroEyebrow: "Hello, I'm",
            heroName: 'Carlo',
            heroGlitchText: 'Carlo',
            heroSubtitle: 'Computer Engineer',
            heroDescription: 'Multidisciplinary Creative — Design, Data & Automation',
            typewriterPhrases: ['Computer Engineer','Insurance Operations Analyst','Creative Visual Designer','VBA & Automation Specialist','Full-Stack Problem Solver'],
            ctaPrimaryText: 'View My Work',
            ctaPrimaryLink: '#projects',
            ctaSecondaryText: 'About Me',
            ctaSecondaryLink: '#about',
            profileShape: 'hexagon',
            footerText: '© 2025 John Carlo Ebora. All rights reserved.',
            navLogo: 'CE',
            emailjsServiceId: 'service_ansc2g4',
            emailjsTemplateId: 'template_g5u73sh',
            emailjsPublicKey: 'l9FengsYbeILidGxh',
            recaptchaSiteKey: '6Lf1x1wrAAAAAKbH9ESQXHFH_IFoY0AoeE3aBf8F',
        },
        sections: [
            { id: 'about',      title: 'About Me',        nav_icon: 'fas fa-user',          nav_label: 'About',      sort_order: 0, visible: 1 },
            { id: 'skills',     title: 'Skills & Tools',   nav_icon: 'fas fa-wrench',        nav_label: 'Skills',     sort_order: 1, visible: 1 },
            { id: 'experience', title: 'Experience',       nav_icon: 'fas fa-briefcase',     nav_label: 'Experience', sort_order: 2, visible: 1 },
            { id: 'education',  title: 'Education',        nav_icon: 'fas fa-graduation-cap',nav_label: 'Education',  sort_order: 3, visible: 1 },
            { id: 'projects',   title: 'Projects',         nav_icon: 'fas fa-folder-open',   nav_label: 'Projects',   sort_order: 4, visible: 1 },
            { id: 'socials',    title: 'Socials',          nav_icon: 'fas fa-share-alt',     nav_label: 'Socials',    sort_order: 5, visible: 1 },
            { id: 'contact',    title: 'Get in Touch',     nav_icon: 'fas fa-envelope',      nav_label: 'Contact',    sort_order: 6, visible: 1 },
        ],
        about: {
            cards: [
                { title: 'Who I Am', icon: 'fas fa-user', type: 'text', expanded: 1, content: 'A Computer Engineering graduate with a passion for building elegant solutions to complex problems. From data pipelines to design systems, I enjoy turning messy processes into clean, automated workflows.' },
                { title: 'Quick Info', icon: 'fas fa-info-circle', type: 'info_list', expanded: 0, content: JSON.stringify([
                    { icon: 'fas fa-map-marker-alt', label: 'Location', value: 'Philippines' },
                    { icon: 'fas fa-language', label: 'Languages', value: 'English · Filipino' },
                    { icon: 'fas fa-briefcase', label: 'Status', value: 'Open to opportunities' },
                    { icon: 'fas fa-heart', label: 'Interests', value: 'Automation, Design, Music' },
                ]) },
            ],
            stats: [
                { target: 2, suffix: '+', label: 'Years Experience' },
                { target: 10, suffix: '+', label: 'Projects Completed' },
                { target: 4.86, suffix: '', label: 'GWA' },
            ],
        },
        skills: [
            { id: 1, title: 'Technical Skills', icon: 'fas fa-code', expanded: 1, categories: [
                { id: 1, title: 'Programming Languages', icon: 'fas fa-terminal', skills: [
                    { name: 'Python', icon: 'fab fa-python', proficiency: 85 },
                    { name: 'JavaScript', icon: 'fab fa-js', proficiency: 78 },
                    { name: 'HTML / CSS', icon: 'fab fa-html5', proficiency: 92 },
                    { name: 'VBA (Excel/Access)', icon: 'fas fa-file-excel', proficiency: 90 },
                    { name: 'SQL', icon: 'fas fa-database', proficiency: 80 },
                    { name: 'C / C++ / C#', icon: 'fas fa-microchip', proficiency: 65 },
                ]},
                { id: 2, title: 'Frameworks & Tools', icon: 'fas fa-layer-group', skills: [
                    { name: 'Microsoft Power Platform', icon: 'fas fa-bolt', proficiency: 82 },
                    { name: 'Git & GitHub', icon: 'fab fa-git-alt', proficiency: 80 },
                    { name: 'Cloudflare Workers', icon: 'fas fa-cloud', proficiency: 60 },
                ]},
            ]},
            { id: 2, title: 'Creative Skills', icon: 'fas fa-palette', expanded: 0, categories: [
                { id: 3, title: 'Design & Media', icon: 'fas fa-paint-brush', skills: [
                    { name: 'Adobe Photoshop', icon: 'fas fa-image', proficiency: 88 },
                    { name: 'Adobe Premiere Pro', icon: 'fas fa-film', proficiency: 82 },
                    { name: 'Adobe After Effects', icon: 'fas fa-magic', proficiency: 70 },
                    { name: 'Figma', icon: 'fab fa-figma', proficiency: 75 },
                ]},
            ]},
            { id: 3, title: 'Data & Analytics', icon: 'fas fa-chart-bar', expanded: 0, categories: [
                { id: 4, title: 'Data Tools', icon: 'fas fa-table', skills: [
                    { name: 'Advanced Excel', icon: 'fas fa-file-excel', proficiency: 95 },
                    { name: 'Power BI', icon: 'fas fa-chart-pie', proficiency: 78 },
                    { name: 'Pandas / NumPy', icon: 'fab fa-python', proficiency: 75 },
                ]},
            ]},
            { id: 4, title: 'Soft Skills', icon: 'fas fa-users', expanded: 0, categories: [
                { id: 5, title: 'Professional', icon: 'fas fa-handshake', skills: [
                    { name: 'Problem Solving', icon: 'fas fa-puzzle-piece', proficiency: 90 },
                    { name: 'Team Collaboration', icon: 'fas fa-people-carry', proficiency: 85 },
                    { name: 'Communication', icon: 'fas fa-comments', proficiency: 82 },
                ]},
            ]},
            { id: 5, title: 'Infrastructure', icon: 'fas fa-server', expanded: 0, categories: [
                { id: 6, title: 'DevOps & Cloud', icon: 'fas fa-cloud', skills: [
                    { name: 'Linux Administration', icon: 'fab fa-linux', proficiency: 70 },
                    { name: 'Docker', icon: 'fab fa-docker', proficiency: 55 },
                    { name: 'Cloudflare', icon: 'fas fa-shield-alt', proficiency: 65 },
                ]},
            ]},
        ],
        experiences: [
            { date_range: '2024 — Present', title: 'Insurance Operations Analyst', badge: 'Current', company: 'Manulife Business Processing Services', expanded: 1, bullets: ['Built VBA automation tools that cut manual processing time by 60%','Developed internal dashboards in Power BI for operational KPIs','Maintained Excel-based data pipelines processing 10K+ records daily','Collaborated with cross-functional teams to streamline workflows'] },
            { date_range: '2023 — 2024', title: 'IT Support Intern', badge: '', company: 'Provincial Government — IT Office', expanded: 0, bullets: ['Provided technical support for 50+ workstations','Assisted in network infrastructure maintenance','Created documentation for common troubleshooting procedures'] },
            { date_range: '2019 — 2024', title: 'Freelance Creative', badge: '', company: 'Self-Employed', expanded: 0, bullets: ['Designed logos, menus, and marketing materials for local businesses','Produced short-form video content and motion graphics','Built static websites for small business clients'] },
        ],
        education: [
            { card_title: 'Formal Education', card_icon: 'fas fa-graduation-cap', entries: [
                { title: 'BS Computer Engineering', school: 'Don Honorio Ventura State University', year: '2019 – 2024', description: 'GWA 4.86 / 5.00 · Dean\'s Lister' },
            ]},
            { card_title: 'Certifications & Training', card_icon: 'fas fa-certificate', entries: [
                { title: 'Microsoft Power Platform Fundamentals', school: 'Microsoft', year: '2024', description: '' },
                { title: 'Python for Data Science', school: 'Coursera', year: '2023', description: '' },
            ]},
        ],
        projects: [
            { title: 'Design Compositions', description: 'A curated collection of graphic design work — logos, posters, album art, and brand identity projects created for clients and personal exploration.', thumbnail_path: 'thumbnail/Coming Soon.gif', gallery_type: 'image', gallery_folder: 'layout', tags: ['Photoshop','Illustrator','Branding','Print'] },
            { title: 'Video Compositions', description: 'Short-form video edits, motion graphics, and visual effects — from event recaps to creative passion projects.', thumbnail_path: 'thumbnail/Coming Soon.gif', gallery_type: 'video', gallery_folder: 'videos', tags: ['Premiere Pro','After Effects','Motion','Editing'] },
        ],
        socials: [
            { platform: 'Facebook',  url: 'https://www.facebook.com/johncarlomendozaebora', icon: 'fab fa-facebook', label: 'Facebook' },
            { platform: 'Instagram', url: 'https://www.instagram.com/carlo.ebora',           icon: 'fab fa-instagram', label: 'Instagram' },
            { platform: 'GitHub',    url: 'https://github.com/johncarloebora',               icon: 'fab fa-github', label: 'GitHub' },
            { platform: 'X',         url: 'https://x.com/a_crl_o',                           icon: 'fab fa-twitter', label: 'X (Twitter)' },
            { platform: 'LinkedIn',  url: 'https://www.linkedin.com/in/john-carlo-ebora-370216232/', icon: 'fab fa-linkedin', label: 'LinkedIn' },
        ],
        media: {},
    };
}

/* ============================================================
   INITIALIZERS — called after rendering
   ============================================================ */

function initCursor() {
    if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768) return;
    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = -500, my = -500, rx = -500, ry = -500;
    let hasMoved = false;

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            dot.style.opacity = ''; ring.style.opacity = '';
        }
    });

    function lerp(a, b, t) { return a + (b - a) * t; }
    function tick() {
        rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
        dot.style.left = mx + 'px'; dot.style.top = my + 'px';
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(tick);
    }
    tick();

    const hoverEls = 'a, button, .cta-button, .card, .skill-card, .project-card, .social-card, .gallery-item, .close-button, .preview-nav, .timeline-header, .skill-card-header';
    document.querySelectorAll(hoverEls).forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
    });
}

function initProfilePhoto(config) {
    const avatarFrame = document.getElementById('avatarFrame');
    const heroPhoto   = document.getElementById('heroPhoto');
    if (!avatarFrame || !heroPhoto) return;

    // If config has a profile media URL, use it directly
    if (config && config.media && config.media.profile && config.media.profile.length > 0) {
        const profileUrl = config.media.profile[0].url;
        heroPhoto.style.opacity = '0';
        avatarFrame.classList.add('avatar-loading');
        const img = new Image();
        img.onload = () => {
            heroPhoto.src = img.src;
            avatarFrame.classList.remove('avatar-loading');
            requestAnimationFrame(() => {
                heroPhoto.style.transition = 'opacity 0.6s ease';
                heroPhoto.style.opacity = '1';
            });
        };
        img.onerror = () => {
            avatarFrame.classList.remove('avatar-loading');
            avatarFrame.classList.add('show-fallback', 'fallback-visible');
        };
        img.src = profileUrl;
        return;
    }

    // Fallback: probe local profile/ folder
    const EXTS = ['jpg','jpeg','png','webp','avif','gif','bmp','svg'];
    let probeIdx = 0;
    heroPhoto.style.opacity = '0';
    avatarFrame.classList.add('avatar-loading');

    function probeNext() {
        if (probeIdx >= EXTS.length) {
            avatarFrame.classList.remove('avatar-loading');
            avatarFrame.classList.add('show-fallback', 'fallback-visible');
            return;
        }
        const ext = EXTS[probeIdx++];
        const img = new Image();
        img.onload = () => {
            heroPhoto.src = img.src;
            avatarFrame.classList.remove('avatar-loading');
            requestAnimationFrame(() => {
                heroPhoto.style.transition = 'opacity 0.6s ease';
                heroPhoto.style.opacity = '1';
            });
        };
        img.onerror = probeNext;
        img.src = `profile/profile.${ext}`;
    }
    probeNext();
}

function initScrollBar() {
    const bar = document.querySelector('.scroll-seekbar');
    if (!bar) return;
    function update() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
}

function initNavigation() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add('body-ready');
        });
    });

    const nav       = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.querySelector('.nav-links');
    const allLinks  = document.querySelectorAll('.nav-link');
    const isMobile  = () => window.innerWidth <= 768;

    function expandSideNav() {
        nav.classList.add('side-expanded');
        document.body.classList.add('nav-active', 'side-expanded');
        hamburger.setAttribute('aria-expanded', 'true');
    }
    function collapseSideNav() {
        nav.classList.remove('side-expanded');
        document.body.classList.remove('nav-active', 'side-expanded');
        hamburger.setAttribute('aria-expanded', 'false');
    }
    function openNav() {
        if (isMobile()) {
            nav.classList.contains('side-expanded') ? collapseSideNav() : expandSideNav();
        } else {
            navLinks.classList.add('open');
            document.body.classList.add('nav-active');
            hamburger.setAttribute('aria-expanded', 'true');
        }
    }
    function closeNav() {
        if (isMobile()) { collapseSideNav(); }
        else {
            navLinks.classList.remove('open');
            document.body.classList.remove('nav-active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    }

    hamburger.addEventListener('click', openNav);
    const navDrawerClose = document.getElementById('navDrawerClose');
    if (navDrawerClose) navDrawerClose.addEventListener('click', closeNav);

    document.addEventListener('click', e => {
        if (isMobile()) { if (!nav.contains(e.target)) collapseSideNav(); }
        else { if (!nav.contains(e.target)) closeNav(); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
    allLinks.forEach(link => link.addEventListener('click', () => { isMobile() ? collapseSideNav() : closeNav(); }));

    let wasMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
        const nowMobile = window.innerWidth <= 768;
        if (window.innerWidth > 768) { closeNav(); collapseSideNav(); document.body.style.marginLeft = ''; }
        if (wasMobile !== nowMobile) {
            nav.classList.add('nav-morphing'); document.body.classList.add('nav-morphing');
            setTimeout(() => { nav.classList.remove('nav-morphing'); document.body.classList.remove('nav-morphing'); }, 600);
        }
        wasMobile = nowMobile;
    });

    let lastY = 0;
    const heroShapes = document.getElementById('shapes');
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (!isMobile()) { if (y > lastY && y > 200) nav.classList.add('hide'); else nav.classList.remove('hide'); }
        lastY = y;
        if (y < window.innerHeight && heroShapes) heroShapes.style.transform = `translateY(${y * 0.35}px)`;
    }, { passive: true });

    // Active link tracking
    const sections = document.querySelectorAll('section, header');
    const visibleSections = new Set();
    let navInitDone = false;

    function updateActiveNav() {
        if (window.scrollY < window.innerHeight * 0.25) {
            allLinks.forEach(l => l.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
            return;
        }
        let topSection = null, topOffset = Infinity;
        visibleSections.forEach(s => {
            const rect = s.getBoundingClientRect();
            if (rect.top < topOffset) { topOffset = rect.top; topSection = s; }
        });
        if (topSection) {
            allLinks.forEach(l => l.classList.remove('active'));
            const t = document.querySelector(`.nav-link[href="#${topSection.id}"]`);
            if (t) t.classList.add('active');
        }
    }

    const ioNav = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) visibleSections.add(entry.target);
            else visibleSections.delete(entry.target);
        });
        if (navInitDone) updateActiveNav();
    }, { rootMargin: `-${Math.round(window.innerHeight * 0.35)}px 0px -40%` });
    sections.forEach(s => ioNav.observe(s));

    requestAnimationFrame(() => { requestAnimationFrame(() => { navInitDone = true; updateActiveNav(); }); });
    let navScrollRaf;
    window.addEventListener('scroll', () => {
        if (navScrollRaf) return;
        navScrollRaf = requestAnimationFrame(() => { updateActiveNav(); navScrollRaf = null; });
    }, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const navOffset = isMobile() ? 8 : document.querySelector('.nav-header').offsetHeight + 8;
            const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

function initBubbles() {
    if (window.innerWidth <= 768) return;
    const container = document.getElementById('bgShapes');
    if (!container) return;
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 12; i++) {
        const el = document.createElement('div');
        el.className = 'bg-bubble';
        const size = rnd(120, 420), opacity = rnd(0.04, 0.10);
        const color = Math.random() > 0.5 ? `rgba(255,107,107,${opacity.toFixed(3)})` : `rgba(78,205,196,${opacity.toFixed(3)})`;
        el.style.cssText = `width:${size}px;height:${size}px;left:${rnd(-5,95).toFixed(1)}%;top:${rnd(0,100).toFixed(1)}%;background:${color};--dur:${rnd(18,38).toFixed(1)}s;--delay:-${rnd(0,20).toFixed(1)}s;--tx1:${rnd(-120,120).toFixed(0)}px;--ty1:${rnd(-120,120).toFixed(0)}px;--tx2:${rnd(-120,120).toFixed(0)}px;--ty2:${rnd(-120,120).toFixed(0)}px;--tx3:${rnd(-120,120).toFixed(0)}px;--ty3:${rnd(-120,120).toFixed(0)}px;`;
        container.appendChild(el);
    }
}

function initShapes() {
    const container = document.getElementById('shapes');
    if (!container) return;
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 15 : 60;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'shape';
        const size = Math.random() * 80 + 20;
        s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*-25}s;animation-duration:${Math.random()*15+15}s;`;
        s.style.setProperty('--moveX', `${(Math.random()-.5)*250}px`);
        s.style.setProperty('--moveY', `${(Math.random()-.5)*250}px`);
        container.appendChild(s);
    }
}

function initParticles() {
    if (window.innerWidth <= 768) return;
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    let mouse = { x: -999, y: -999 };

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    class Particle {
        constructor() { this.reset(); }
        reset() { this.x = Math.random()*W; this.y = Math.random()*H; this.vx = (Math.random()-0.5)*0.4; this.vy = (Math.random()-0.5)*0.4; this.r = Math.random()*2+1; this.alpha = Math.random()*0.35+0.1; }
        update() {
            const dx = this.x-mouse.x, dy = this.y-mouse.y, dist = Math.sqrt(dx*dx+dy*dy);
            if (dist < 100) { this.vx += (dx/dist)*0.3; this.vy += (dy/dist)*0.3; }
            const speed = Math.sqrt(this.vx*this.vx+this.vy*this.vy);
            if (speed > 1.5) { this.vx *= 0.95; this.vy *= 0.95; }
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0) this.x = W; if (this.x > W) this.x = 0;
            if (this.y < 0) this.y = H; if (this.y > H) this.y = 0;
        }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fillStyle = `rgba(78,205,196,${this.alpha})`; ctx.fill(); }
    }
    function init() { resize(); particles = Array.from({length:70}, () => new Particle()); }
    function drawLines() {
        for (let i = 0; i < particles.length; i++) for (let j = i+1; j < particles.length; j++) {
            const dx = particles[i].x-particles[j].x, dy = particles[i].y-particles[j].y, d = Math.sqrt(dx*dx+dy*dy);
            if (d < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle = `rgba(78,205,196,${0.12*(1-d/120)})`; ctx.lineWidth = 0.8; ctx.stroke(); }
        }
    }
    function loop() { ctx.clearRect(0,0,W,H); particles.forEach(p => { p.update(); p.draw(); }); drawLines(); requestAnimationFrame(loop); }
    requestAnimationFrame(() => { init(); loop(); });
    window.addEventListener('resize', () => { resize(); particles.forEach(p => p.reset()); });
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
}

function initSkillCardToggles() {
    document.querySelectorAll('.skill-card-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.closest('.skill-card');
            const wasExpanded = card.classList.contains('expanded');
            card.classList.toggle('expanded');
            if (!wasExpanded) {
                card.querySelectorAll('.proficiency-level[data-width]').forEach(bar => {
                    bar.style.width = '0';
                    requestAnimationFrame(() => { requestAnimationFrame(() => { bar.style.width = bar.dataset.width + '%'; }); });
                });
            }
        });
    });
}

function initAboutCardToggles() {
    document.querySelectorAll('.about-card-header').forEach(header => {
        header.addEventListener('click', () => {
            header.closest('.about-card').classList.toggle('about-expanded');
        });
    });
}

function initTimelineToggles() {
    document.querySelectorAll('.timeline-header').forEach(header => {
        header.addEventListener('click', () => { header.closest('.timeline-item').classList.toggle('tl-open'); });
    });
    document.querySelectorAll('.timeline-marker').forEach(marker => {
        marker.addEventListener('click', () => { marker.closest('.timeline-item').classList.toggle('tl-open'); });
    });
}

function initGlitch() {
    const el = document.querySelector('.hero-name.glitch');
    if (!el) return;
    function glitch() {
        el.classList.add('glitching');
        setTimeout(() => el.classList.remove('glitching'), 200);
        setTimeout(glitch, 1500 + Math.random() * 4000);
    }
    setTimeout(glitch, 2000);
}

function initTypewriter(config) {
    const el = document.getElementById('hero-subtitle');
    if (!el) return;
    const lines = (config && config.settings && config.settings.typewriterPhrases) || [
        'Computer Engineer','Insurance Operations Analyst','Creative Visual Designer','VBA & Automation Specialist','Full-Stack Problem Solver'
    ];
    let lineIdx = 0, charIdx = 0, deleting = false;
    function type() {
        const current = lines[lineIdx];
        if (!deleting) { el.textContent = current.slice(0, ++charIdx); if (charIdx === current.length) { deleting = true; setTimeout(type, 2400); return; } }
        else { el.textContent = current.slice(0, --charIdx); if (charIdx === 0) { deleting = false; lineIdx = (lineIdx+1) % lines.length; } }
        setTimeout(type, deleting ? 35 : 65);
    }
    setTimeout(type, 1200);
}

function initScrollAnimations() {
    const revealEls = document.querySelectorAll('.card, .skill-card, .project-card, .timeline-item, .social-card, .stat-card');
    const ioReveal = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => { if (!entry.isIntersecting) return; setTimeout(() => entry.target.classList.add('visible'), i * 80); obs.unobserve(entry.target); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => ioReveal.observe(el));

    const bars = document.querySelectorAll('.proficiency-level[data-width]');
    const ioBars = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => { if (!entry.isIntersecting) return; entry.target.style.width = entry.target.dataset.width + '%'; obs.unobserve(entry.target); });
    }, { threshold: 0.3 });
    bars.forEach(b => ioBars.observe(b));

    const statEls = document.querySelectorAll('.stat-number[data-target]');
    const ioStats = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target, target = parseFloat(el.dataset.target), suffix = el.dataset.suffix || '', isDecimal = el.dataset.target.includes('.');
            let frame = 0;
            const interval = setInterval(() => {
                frame++;
                if (frame >= 60) { el.textContent = (isDecimal ? target.toFixed(2) : Math.floor(target)) + suffix; clearInterval(interval); }
                else { const current = (target*frame)/60; el.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix; }
            }, 25);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });
    statEls.forEach(el => ioStats.observe(el));
}

function initScramble() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';
    function scramble(el) {
        const original = el.dataset.scramble || el.textContent;
        let frame = 0; const maxFrames = original.length * 3;
        const id = setInterval(() => {
            el.textContent = original.split('').map((ch, i) => {
                if (ch === ' ' || ch === '&' || ch === ';') return ch;
                if (i < Math.floor(frame/3)) return original[i];
                return chars[Math.floor(Math.random()*chars.length)];
            }).join('');
            if (frame++ >= maxFrames) { el.textContent = original; clearInterval(id); }
        }, 30);
    }
    const headings = document.querySelectorAll('.section-title[data-scramble]');
    const ioScramble = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => { if (!entry.isIntersecting) return; scramble(entry.target); obs.unobserve(entry.target); });
    }, { threshold: 0.5 });
    headings.forEach(h => ioScramble.observe(h));
}

function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.card, .skill-card, .project-card, .stat-card').forEach(el => {
        el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            const x = ((e.clientX-r.left)/r.width-0.5)*14, y = ((e.clientY-r.top)/r.height-0.5)*14;
            el.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
}

function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768) return;
    document.querySelectorAll('.cta-button, .theme-toggle-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const x = (e.clientX-r.left-r.width/2)*0.25, y = (e.clientY-r.top-r.height/2)*0.25;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

function initGallery(config) {
    const galleryModal = document.getElementById('galleryModal');
    const previewModal = document.getElementById('previewModal');
    const galleryGrid  = document.getElementById('galleryGrid');
    const previewImage = document.getElementById('previewImage');
    const previewCounter = document.getElementById('previewCounter');
    const galleryClose = document.getElementById('galleryClose');
    const previewClose = document.getElementById('previewClose');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const hamburger = document.getElementById('hamburger');
    const navHeader = document.getElementById('navbar');
    if (!galleryModal) return;

    let currentImages = [], currentIndex = 0, touchStartX = 0;

    function lockScroll() {
        const sw = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = sw + 'px';
        document.body.classList.add('modal-open');
    }
    function unlockScroll() { document.body.style.paddingRight = ''; document.body.classList.remove('modal-open'); }

    const isMobileGallery = () => window.innerWidth <= 768;
    function hideNav() {
        if (isMobileGallery()) { if (navHeader) navHeader.style.transform = 'translateX(-100%)'; }
        else { if (navHeader) navHeader.style.transform = 'translateY(-100%)'; }
        if (hamburger) hamburger.style.visibility = 'hidden';
    }
    function restoreNav() { if (navHeader) navHeader.style.transform = ''; if (hamburger) hamburger.style.visibility = ''; }

    function openGallery(images) {
        currentImages = images;
        galleryGrid.innerHTML = '';
        images.forEach((imgData, i) => {
            const item = document.createElement('div');
            item.className = 'gallery-item'; item.dataset.index = i;
            const pic = document.createElement('img');
            pic.src = imgData.src; pic.alt = imgData.alt; pic.loading = 'lazy';
            pic.addEventListener('error', () => { item.style.opacity = '0.3'; });
            item.appendChild(pic);
            galleryGrid.appendChild(item);
        });
        galleryModal.classList.add('active');
        lockScroll(); hideNav();
    }

    function openPreview(index) {
        currentIndex = ((index % currentImages.length) + currentImages.length) % currentImages.length;
        const img = currentImages[currentIndex];
        previewImage.src = img.src; previewImage.alt = img.alt;
        if (previewCounter) previewCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
        galleryModal.classList.remove('active');
        previewModal.classList.add('active');
    }

    function closeAll() { galleryModal.classList.remove('active'); previewModal.classList.remove('active'); unlockScroll(); restoreNav(); }
    function backToGallery() { previewModal.classList.remove('active'); galleryModal.classList.add('active'); }
    function navigate(dir) { openPreview(currentIndex + dir); }

    // Gallery scanning — config media → Worker API → GitHub API → manifest
    const IMAGE_EXTS = new Set(['jpg','jpeg','png','webp','avif','gif','bmp','svg','tiff','tif','heic','heif']);
    const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','mkv','ogv']);
    function fileToAlt(filename) { return filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '); }

    function getGithubApiUrl(folder) {
        const host = location.hostname;
        const ghMatch = host.match(/^([^.]+)\.github\.io$/);
        if (!ghMatch) return null;
        const owner = ghMatch[1];
        const pathParts = location.pathname.replace(/^\//, '').split('/').filter(p => p && p !== 'index.html');
        const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;
        return `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;
    }

    async function scanFolderFromConfig(folder, allowedExts) {
        if (!config || !config.media || !config.media[folder]) return null;
        return config.media[folder]
            .filter(f => allowedExts.has(f.filename.split('.').pop().toLowerCase()))
            .map(f => ({ src: f.url, alt: f.alt || fileToAlt(f.filename) }));
    }

    async function scanFolderWorkerApi(folder, allowedExts) {
        if (!API_BASE) return null;
        try {
            const res = await fetch(`${API_BASE}/api/gallery/${folder}`);
            if (!res.ok) return null;
            const items = await res.json();
            return items.filter(f => allowedExts.has(f.name.split('.').pop().toLowerCase())).map(f => ({ src: f.url, alt: f.alt }));
        } catch { return null; }
    }

    async function scanFolderGithubApi(folder, allowedExts) {
        const apiUrl = getGithubApiUrl(folder);
        if (!apiUrl) return null;
        const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!res.ok) return null;
        const items = await res.json();
        return items.filter(f => f.type === 'file' && allowedExts.has(f.name.split('.').pop().toLowerCase())).map(f => ({ src: `${folder}/${f.name}`, alt: fileToAlt(f.name) }));
    }

    async function scanFolderManifest(folder, allowedExts) {
        const res = await fetch(`${folder}/manifest.json`);
        if (!res.ok) return null;
        const list = await res.json();
        return list.filter(e => allowedExts.has(e.file.split('.').pop().toLowerCase())).map(e => ({ src: `${folder}/${e.file}`, alt: e.alt || fileToAlt(e.file) }));
    }

    async function scanFolder(folder, allowedExts) {
        if (location.protocol === 'file:') return null;
        // Try config media first
        try { const via = await scanFolderFromConfig(folder, allowedExts); if (via && via.length) return via; } catch {}
        // Try Worker API
        try { const via = await scanFolderWorkerApi(folder, allowedExts); if (via && via.length) return via; } catch {}
        // Try GitHub API
        try { const via = await scanFolderGithubApi(folder, allowedExts); if (via) return via; } catch {}
        // Try manifest
        try { const via = await scanFolderManifest(folder, allowedExts); if (via) return via; } catch {}
        return null;
    }

    // Image gallery thumbnails
    document.querySelectorAll('.project-thumbnail[data-gallery-folder]').forEach(thumb => {
        thumb.addEventListener('click', async () => {
            const folder = thumb.dataset.galleryFolder;
            if (location.protocol === 'file:') { showToast('Open via Live Server or GitHub Pages to view the gallery.', 'error'); return; }
            const imgs = await scanFolder(folder, IMAGE_EXTS);
            if (imgs && imgs.length) openGallery(imgs);
            else showToast('No images found in gallery folder.', 'error');
        });
    });

    galleryGrid.addEventListener('click', e => { const item = e.target.closest('.gallery-item'); if (item) openPreview(parseInt(item.dataset.index)); });
    galleryClose.addEventListener('click', closeAll);
    previewClose.addEventListener('click', backToGallery);
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    document.addEventListener('keydown', e => {
        if (previewModal.classList.contains('active')) {
            if (e.key === 'Escape') backToGallery();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        } else if (galleryModal.classList.contains('active')) { if (e.key === 'Escape') closeAll(); }
    });

    previewModal.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    previewModal.addEventListener('touchend', e => { const delta = e.changedTouches[0].screenX - touchStartX; if (Math.abs(delta) > 50) navigate(delta < 0 ? 1 : -1); });
    galleryModal.addEventListener('click', e => { if (e.target === galleryModal) closeAll(); });
    previewModal.addEventListener('click', e => { if (e.target === previewModal) backToGallery(); });
    previewImage.addEventListener('error', () => { previewImage.alt = 'Image failed to load'; });

    // Video modal
    const videoModal = document.getElementById('videoModal');
    const videoModalClose = document.getElementById('videoModalClose');
    function showVideoEmpty() { if (!videoModal) return; videoModal.classList.add('active'); lockScroll(); hideNav(); }

    document.querySelectorAll('.project-thumbnail[data-video-folder]').forEach(thumb => {
        thumb.addEventListener('click', async () => {
            const folder = thumb.dataset.videoFolder;
            if (location.protocol === 'file:') { showVideoEmpty(); return; }
            const files = await scanFolder(folder, VIDEO_EXTS);
            if (files && files.length) openGallery(files);
            else showVideoEmpty();
        });
    });

    document.querySelectorAll('.project-thumbnail[data-video-empty]').forEach(thumb => {
        thumb.addEventListener('click', showVideoEmpty);
    });

    if (videoModalClose && videoModal) {
        const closeVideo = () => { videoModal.classList.remove('active'); unlockScroll(); restoreNav(); };
        videoModalClose.addEventListener('click', closeVideo);
        videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideo(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && videoModal.classList.contains('active')) closeVideo(); });
    }
}

function initEmailJS(config) {
    const s = config ? config.settings : {};
    if (typeof emailjs !== 'undefined') {
        emailjs.init(s.emailjsPublicKey || 'l9FengsYbeILidGxh');
    }

    const form = document.getElementById('contact-form');
    if (!form) return;

    let lastSubmitTime = 0;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const now = Date.now();
        if (now - lastSubmitTime < 15000) { showToast('Please wait a moment before sending again.', 'error'); return; }
        if (typeof grecaptcha !== 'undefined') { const token = grecaptcha.getResponse(); if (!token) { showToast('Please complete the reCAPTCHA.', 'error'); return; } }

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Sending…</span><i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;

        try {
            await emailjs.send(s.emailjsServiceId || 'service_ansc2g4', s.emailjsTemplateId || 'template_g5u73sh', {
                from_name: document.getElementById('name').value,
                to_email: document.getElementById('email').value,
                message: document.getElementById('message').value,
                'g-recaptcha-response': typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : ''
            });
            showToast("Message sent! I'll get back to you soon.", 'success');
            lastSubmitTime = Date.now(); form.reset();
            if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
        } catch (err) { console.error(err); showToast('Failed to send. Please try again later.', 'error'); }
        finally { btn.innerHTML = originalHTML; btn.disabled = false; }
    });
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => { btn.classList.toggle('show', window.scrollY > 400); }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initRipple() {
    function createRipple(e) {
        const el = e.currentTarget, diameter = Math.max(el.clientWidth, el.clientHeight), radius = diameter/2, rect = el.getBoundingClientRect();
        const circle = document.createElement('span');
        circle.className = 'ripple';
        circle.style.width = circle.style.height = diameter + 'px';
        circle.style.left = (e.clientX-rect.left-radius) + 'px';
        circle.style.top = (e.clientY-rect.top-radius) + 'px';
        el.querySelector('.ripple')?.remove();
        el.appendChild(circle);
    }
    document.querySelectorAll('.cta-button, .social-card, .close-button, .preview-nav, .mobile-nav-toggle, .theme-toggle-btn, .back-to-top').forEach(el => el.addEventListener('click', createRipple));
}

function initKonami() {
    const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
        if (e.key === SEQ[pos]) { pos++; if (pos === SEQ.length) { pos = 0; triggerKonami(); } }
        else { pos = e.key === SEQ[0] ? 1 : 0; }
    });
    function triggerKonami() {
        showToast('🎉 You found the Easter egg! Nice moves 🕹️', 'success');
        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            const hue = Math.random()*360, angle = Math.random()*Math.PI*2, dist = Math.random()*250+100;
            p.style.cssText = `position:fixed;left:50%;top:50%;width:8px;height:8px;border-radius:50%;background:hsl(${hue},90%,60%);pointer-events:none;z-index:99998;transition:transform 1s ease-out,opacity 1s ease-out;transform:translate(-50%,-50%);opacity:1;`;
            document.body.appendChild(p);
            requestAnimationFrame(() => { requestAnimationFrame(() => {
                p.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;
                p.style.opacity = '0';
            }); });
            setTimeout(() => p.remove(), 1100);
        }
    }
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    let config = await loadSiteConfig();
    if (!config) config = getFallbackConfig();

    renderAll(config);

    // Init all interactions
    initCursor();
    initProfilePhoto(config);
    initScrollBar();
    initNavigation();
    initBubbles();
    initShapes();
    initParticles();
    initSkillCardToggles();
    initAboutCardToggles();
    initTimelineToggles();
    initGlitch();
    initTypewriter(config);
    initScrollAnimations();
    initScramble();
    initTilt();
    initMagnetic();
    initGallery(config);
    initEmailJS(config);
    initBackToTop();
    initRipple();
    initKonami();
});
