/* ============================================================
   CARLO PORTFOLIO — SCRIPT
   ============================================================ */
'use strict';

/* ── SITE CONFIG (loaded from R2) ────────────────────────── */
/* Fetches site-config.json published by the admin panel.
   On success, updates the DOM in-place so CSS structure stays intact.
   On failure, the hardcoded HTML shows — zero breakage. */
var SITE_CFG = null;
var SITE_CFG_READY = new Promise(function (resolve) {
    var CONFIG_URL = 'https://carlo-portfolio-api.johncarloebora.workers.dev/api/config';
    fetch(CONFIG_URL, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (cfg) {
        SITE_CFG = cfg;
        /* Apply config after DOM is ready */
        function doApply() {
            try { applySiteConfig(cfg); } catch (e) { console.warn('[config] apply error', e); }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doApply);
        } else {
            doApply();
        }
        resolve(cfg);
    }).catch(function () { resolve(null); });
});

function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

/* ── PAGE VIEW TRACKING ──────────────────────────────────── */
(function() {
    var API_BASE = 'https://carlo-portfolio-api.johncarloebora.workers.dev';
    try {
        fetch(API_BASE + '/api/page-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: window.location.pathname || '/' }),
            keepalive: true,
        }).catch(function() {});
    } catch(e) {}
})();

function applySiteConfig(cfg) {
    var s = cfg.settings || {};
    var r2 = cfg.r2Base || '';

    /* ── Theme accent colors ── */
    if (s.accent1) document.documentElement.style.setProperty('--accent1', s.accent1);
    if (s.accent2) document.documentElement.style.setProperty('--accent2', s.accent2);

    /* ── Hero ── */
    var eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow && s.heroEyebrow) eyebrow.textContent = s.heroEyebrow;

    var heroName = document.querySelector('.hero-name');
    if (heroName && s.heroName) {
        heroName.textContent = s.heroName;
        heroName.setAttribute('data-glitch', s.heroGlitchText || s.heroName);
    }

    var heroDesc = document.querySelector('.hero-desc');
    if (heroDesc && s.heroDesc) heroDesc.textContent = s.heroDesc;

    var ctaPrimary = document.querySelector('.hero-buttons .cta-button.primary');
    if (ctaPrimary) {
        if (s.ctaPrimaryText) ctaPrimary.textContent = s.ctaPrimaryText;
        if (s.ctaPrimaryLink) ctaPrimary.href = s.ctaPrimaryLink;
    }
    var ctaSecondary = document.querySelector('.hero-buttons .cta-button.secondary');
    if (ctaSecondary) {
        if (s.ctaSecondaryText) ctaSecondary.textContent = s.ctaSecondaryText;
        if (s.ctaSecondaryLink) ctaSecondary.href = s.ctaSecondaryLink;
    }

    /* ── Profile photo from R2 ── */
    if (cfg.media && cfg.media.profile && cfg.media.profile.length) {
        var profileUrl = cfg.media.profile[0].url;
        var heroPhoto = document.getElementById('heroPhoto');
        var avatarFrame = document.getElementById('avatarFrame');
        if (heroPhoto && profileUrl) {
            heroPhoto.src = profileUrl;
            heroPhoto.style.transition = 'opacity 0.6s ease';
            heroPhoto.style.opacity = '1';
            if (avatarFrame) {
                avatarFrame.classList.remove('avatar-loading', 'show-fallback', 'fallback-visible');
            }
            /* Mark that config already loaded the photo so the probe can skip */
            heroPhoto.dataset.cfgLoaded = '1';
        }
    }

    /* ── Profile shape ── */
    if (s.profileShape) {
        var frame  = document.getElementById('avatarFrame');
        var avatar = frame && frame.closest('.hero-avatar');
        // Remove any existing shape classes first
        if (frame) {
            ['hexagon','circle','square','rounded','diamond','shield'].forEach(function(sh) {
                frame.classList.remove('shape-' + sh);
            });
            if (s.profileShape !== 'hexagon') {
                frame.classList.add('shape-' + s.profileShape);
            }
        }
        // Set data attribute on wrapper for CSS :has() ring matching
        if (avatar) avatar.setAttribute('data-shape', s.profileShape);
    }

    /* ── Nav links ── */
    if (cfg.sections && cfg.sections.length) {
        var navLinksContainer = document.querySelector('.nav-links');
        if (navLinksContainer) {
            /* Remove existing nav links (keep drawer header) */
            navLinksContainer.querySelectorAll('.nav-link').forEach(function (l) { l.remove(); });
            var visibleSections = cfg.sections.filter(function (sec) { return sec.visible; })
                .sort(function (a, b) {
                    /* minigame always floats to the end of the nav */
                    if (a.id === 'minigame') return 1;
                    if (b.id === 'minigame') return -1;
                    return a.sort_order - b.sort_order;
                });
            visibleSections.forEach(function (sec) {
                var a = document.createElement('a');
                a.href = '#' + sec.id;
                a.className = 'nav-link' + (sec.id === 'home' ? ' active' : '');
                a.setAttribute('data-tooltip', sec.nav_label);
                a.innerHTML = '<i class="' + esc(sec.nav_icon) + '"></i><span>' + esc(sec.nav_label) + '</span>';
                navLinksContainer.appendChild(a);
            });
        }
    }

    /* ── Section DOM visibility + custom section injection ── */
    if (cfg.sections && cfg.sections.length) {
        /* Remove stale custom sections no longer in config */
        document.querySelectorAll('section[data-custom-section]').forEach(function(el) {
            var stillExists = cfg.sections.some(function(s) { return s.id === el.id && s.type === 'custom'; });
            if (!stillExists) el.remove();
        });

        cfg.sections.forEach(function(sec) {
            if (sec.id === 'home') return;

            if (sec.type === 'custom') {
                var config = sec.config || {};
                var html   = config.html || '';
                var existing = document.getElementById(sec.id);

                if (!sec.visible) {
                    if (existing) { existing.style.display = 'none'; existing.setAttribute('aria-hidden', 'true'); }
                    return;
                }
                var isNew = !existing;
                if (!existing) {
                    existing = document.createElement('section');
                    existing.id = sec.id;
                    existing.setAttribute('data-custom-section', '1');
                    var footer = document.querySelector('footer');
                    if (footer) footer.parentNode.insertBefore(existing, footer);
                }
                existing.style.display = '';
                existing.removeAttribute('aria-hidden');
                existing.innerHTML = '<div class="container">' +
                    '<h2 class="section-title" data-scramble="' + esc(sec.title) + '">' + esc(sec.title) + '</h2>' +
                    '<div class="custom-section-content">' + html + '</div>' +
                    '</div>';
                /* Register newly injected sections with the nav IntersectionObserver */
                if (isNew && window._ioNav) window._ioNav.observe(existing);
                return;
            }

            /* Built-in sections */
            var sectionEl = document.getElementById(sec.id);
            if (!sectionEl) return;
            if (!sec.visible) {
                sectionEl.style.display = 'none';
                sectionEl.setAttribute('aria-hidden', 'true');
            } else {
                sectionEl.style.display = '';
                sectionEl.removeAttribute('aria-hidden');
            }
            /* Animation control — sec.animate === 0 disables scroll-reveal for this section */
            if (sec.animate === 0) {
                sectionEl.setAttribute('data-no-animate', '');
            } else {
                sectionEl.removeAttribute('data-no-animate');
            }
        });
    }

    /* ── Section titles ── */
    if (cfg.sections) {
        cfg.sections.forEach(function (sec) {
            if (sec.id === 'home') return;
            var sectionEl = document.getElementById(sec.id);
            if (!sectionEl) return;
            var h2 = sectionEl.querySelector('.section-title');
            if (h2) {
                h2.textContent = sec.title;
                h2.setAttribute('data-scramble', sec.title);
            }
        });
    }

    /* ── About cards ── */
    if (cfg.about && cfg.about.cards) {
        var aboutGrid = document.getElementById('aboutCards');
        if (aboutGrid) {
            aboutGrid.innerHTML = cfg.about.cards.map(function (card) {
                var bodyHTML;
                if (card.type === 'info_list' && Array.isArray(card.content)) {
                    bodyHTML = '<div class="info-list">' +
                        card.content.map(function (item) {
                            return '<div class="info-item"><i class="' + esc(item.icon) + '"></i><span>' + esc(item.text) + '</span></div>';
                        }).join('') + '</div>';
                } else {
                    bodyHTML = '<p>' + esc(typeof card.content === 'string' ? card.content : '') + '</p>';
                }
                return '<div class="card about-card' + (card.expanded ? ' about-expanded' : '') + '">' +
                    '<div class="about-card-header">' +
                    '<h3>' + esc(card.title) + '</h3>' +
                    '<div class="about-card-toggle"><i class="fas fa-chevron-down"></i></div>' +
                    '</div>' +
                    '<div class="about-card-body">' + bodyHTML + '</div>' +
                    '</div>';
            }).join('');
            /* Re-attach about card toggle listeners */
            aboutGrid.querySelectorAll('.about-card-header').forEach(function (hdr) {
                hdr.dataset.toggleBound = '1';
                hdr.addEventListener('click', function () {
                    hdr.parentElement.classList.toggle('about-expanded');
                });
            });
        }
    }

    /* ── Stats ── */
    if (cfg.about && cfg.about.stats) {
        var statsRow = document.getElementById('statsRow');
        if (statsRow) {
            statsRow.innerHTML = cfg.about.stats.map(function (st) {
                var display = st.target + st.suffix;
                return '<div class="stat-card">' +
                    '<div class="stat-number" data-target="' + esc(st.target) + '" data-suffix="' + esc(st.suffix) + '">' + esc(display) + '</div>' +
                    '<div class="stat-label">' + esc(st.label) + '</div>' +
                    '</div>';
            }).join('');
        }
    }

    /* ── Skills ── */
    if (cfg.skills && cfg.skills.length) {
        var skillGrid = document.getElementById('skillCardGrid');
        if (skillGrid) {
            skillGrid.innerHTML = cfg.skills.map(function (card) {
                var categoriesHTML = (card.categories || []).map(function (cat) {
                    var skillsHTML = (cat.skills || []).map(function (sk) {
                        return '<div class="skill-item">' +
                            '<i class="' + esc(sk.icon) + ' skill-icon"></i>' +
                            '<div class="skill-content">' +
                            '<div class="skill-name">' + esc(sk.name) + '</div>' +
                            '<div class="skill-description">' + esc(sk.description) + '</div>' +
                            '<div class="proficiency-bar"><div class="proficiency-level" data-width="' + sk.proficiency + '"></div></div>' +
                            '</div></div>';
                    }).join('');
                    return '<div class="skill-category">' +
                        '<h4><i class="' + esc(cat.icon) + '"></i> ' + esc(cat.title) + '</h4>' +
                        skillsHTML + '</div>';
                }).join('');
                return '<div class="skill-card' + (card.expanded ? ' expanded' : '') + '">' +
                    '<div class="skill-card-header">' +
                    '<h3><i class="' + esc(card.icon) + ' skill-card-icon"></i>' + esc(card.title) + '</h3>' +
                    '<div class="skill-card-toggle"><i class="fas fa-chevron-down"></i></div>' +
                    '</div>' +
                    '<div class="skill-card-body">' + categoriesHTML + '</div>' +
                    '</div>';
            }).join('');
            /* Re-attach skill card toggle listeners */
            skillGrid.querySelectorAll('.skill-card-header').forEach(function (hdr) {
                hdr.dataset.toggleBound = '1';
                hdr.addEventListener('click', function () {
                    var card = hdr.parentElement;
                    var wasExpanded = card.classList.contains('expanded');
                    card.classList.toggle('expanded');
                    if (!wasExpanded) {
                        card.querySelectorAll('.proficiency-level[data-width]').forEach(function (bar) {
                            bar.style.width = '0';
                            requestAnimationFrame(function () {
                                requestAnimationFrame(function () {
                                    bar.style.width = bar.dataset.width + '%';
                                });
                            });
                        });
                    }
                });
            });
        }
    }

    /* ── Experience ── */
    if (cfg.experiences && cfg.experiences.length) {
        var timeline = document.getElementById('timeline');
        if (timeline) {
            timeline.innerHTML = cfg.experiences.map(function (exp) {
                var bulletsHTML = (exp.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
                var badgeHTML = exp.badge ? ' <span class="badge' + (exp.badge === 'Current' ? ' current' : '') + '">' + esc(exp.badge) + '</span>' : '';
                return '<div class="timeline-item' + (exp.expanded ? ' tl-open' : '') + '">' +
                    '<div class="timeline-marker"></div>' +
                    '<div class="timeline-content">' +
                    '<div class="timeline-header">' +
                    '<div class="timeline-header-info">' +
                    '<div class="timeline-date"><i class="fas fa-calendar-alt"></i> ' + esc(exp.date_range) + '</div>' +
                    '<h3>' + esc(exp.title) + badgeHTML + '</h3>' +
                    '<h4><i class="fas fa-building"></i> ' + esc(exp.company) + '</h4>' +
                    '</div>' +
                    '<div class="timeline-toggle"><i class="fas fa-chevron-down"></i></div>' +
                    '</div>' +
                    '<div class="timeline-body"><ul>' + bulletsHTML + '</ul></div>' +
                    '</div></div>';
            }).join('');
            /* Re-attach timeline toggle listeners */
            timeline.querySelectorAll('.timeline-header').forEach(function (hdr) {
                hdr.dataset.toggleBound = '1';
                hdr.addEventListener('click', function () {
                    hdr.closest('.timeline-item').classList.toggle('tl-open');
                });
            });
            timeline.querySelectorAll('.timeline-marker').forEach(function (mkr) {
                mkr.dataset.toggleBound = '1';
                mkr.addEventListener('click', function () {
                    mkr.closest('.timeline-item').classList.toggle('tl-open');
                });
            });
        }
    }

    /* ── Education ── */
    if (cfg.education && cfg.education.length) {
        var eduGrid = document.getElementById('educationCards');
        if (eduGrid) {
            eduGrid.innerHTML = cfg.education.map(function (card) {
                var entriesHTML = (card.entries || []).map(function (entry) {
                    var linesHTML = (entry.lines || []).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('');
                    var dateHTML = entry.date ? '<div class="date">' + esc(entry.date) + '</div>' : '';
                    return '<div class="experience-item">' +
                        '<h4>' + esc(entry.title) + '</h4>' +
                        dateHTML + linesHTML + '</div>';
                }).join('');
                return '<div class="card">' +
                    '<h3>' + esc(card.card_title) + '</h3>' +
                    entriesHTML + '</div>';
            }).join('');
        }
    }

    /* ── Projects ── */
    if (cfg.projects && cfg.projects.length) {
        /* Store projects data globally so filter system can access it */
        window._cfgProjects = cfg.projects;
        window._cfgR2       = r2;
        initProjectFilterSystem(cfg.projects, r2);
    }

    /* ── Socials ── */
    if (cfg.socials && cfg.socials.length) {
        var socialsGrid = document.getElementById('socialsGrid');
        if (socialsGrid) {
            socialsGrid.innerHTML = cfg.socials.map(function (soc) {
                return '<a href="' + esc(soc.url) + '" target="_blank" rel="noopener noreferrer" class="social-card">' +
                    '<i class="' + esc(soc.icon) + '"></i><span>' + esc(soc.label) + '</span></a>';
            }).join('');
        }
    }

    /* ── Footer ── */
    if (s.footerText) {
        var ft = document.getElementById('footerText');
        if (ft) ft.innerHTML = s.footerText;
    }

    /* ── Section subtitles ── */
    if (cfg.sections) {
        cfg.sections.forEach(function(sec) {
            if (!sec.subtitle) return;
            var sectionEl = document.getElementById(sec.id);
            if (!sectionEl) return;
            var sub = sectionEl.querySelector('.section-subtitle');
            if (!sub) {
                sub = document.createElement('p');
                sub.className = 'section-subtitle';
                var h2 = sectionEl.querySelector('.section-title');
                if (h2 && h2.parentNode) h2.parentNode.insertBefore(sub, h2.nextSibling);
            }
            sub.textContent = sec.subtitle;
        });
    }

    /* ── Typography & Spacing from settings ── */
    if (s.accent1) document.documentElement.style.setProperty('--accent1', s.accent1);
    if (s.accent2) document.documentElement.style.setProperty('--accent2', s.accent2);
    if (s.baseFontSize) document.documentElement.style.setProperty('--base-font-size', s.baseFontSize + 'px');
    if (s.lineHeight)   document.documentElement.style.setProperty('--line-height', s.lineHeight);
    if (s.sectionPadding) document.documentElement.style.setProperty('--section-padding', s.sectionPadding + 'px');
    if (s.cardBorderRadius) document.documentElement.style.setProperty('--radius', s.cardBorderRadius + 'px');
    if (s.animationSpeed) {
        var speedMap = { slow: '0.8s', normal: '0.5s', fast: '0.3s' };
        document.documentElement.style.setProperty('--anim-duration', speedMap[s.animationSpeed] || '0.5s');
    }
    /* Global animation toggle */
    if (s.animationsEnabled === false) {
        document.documentElement.setAttribute('data-no-animate-global', '');
    } else {
        document.documentElement.removeAttribute('data-no-animate-global');
    }
    /* Section animation presets */
    if (cfg.sections) {
        cfg.sections.forEach(function(sec) {
            var el = document.getElementById(sec.id);
            if (!el) return;
            if (sec.animation_preset && sec.animation_preset !== 'fade') {
                el.setAttribute('data-anim-preset', sec.animation_preset);
            } else {
                el.removeAttribute('data-anim-preset');
            }
            if (sec.layout_variant && sec.layout_variant !== 'standard') {
                el.setAttribute('data-layout', sec.layout_variant);
            } else {
                el.removeAttribute('data-layout');
            }
        });
    }

    /* ── Testimonials ── */
    if (cfg.testimonials && cfg.testimonials.length) {
        var testGrid = document.getElementById('testimonialsGrid');
        if (testGrid) {
            testGrid.innerHTML = cfg.testimonials.map(function(t) {
                var stars = '';
                for (var i = 0; i < Math.min(5, t.rating || 5); i++) stars += '★';
                return '<div class="testimonial-card" role="listitem">' +
                    '<div class="testimonial-stars">' + stars + '</div>' +
                    '<p class="testimonial-quote">"' + esc(t.quote || '') + '"</p>' +
                    '<div class="testimonial-author">' +
                    (t.avatar ? '<img src="' + esc(t.avatar) + '" alt="' + esc(t.name) + '" class="testimonial-avatar" loading="lazy">' : '') +
                    '<div class="testimonial-info">' +
                    '<strong>' + esc(t.name || '') + '</strong>' +
                    (t.role || t.company ? '<span>' + esc(t.role || '') + (t.company ? ' · ' + esc(t.company) : '') + '</span>' : '') +
                    '</div></div></div>';
            }).join('');
        }
    }

    /* ── Certifications ── */
    if (cfg.certifications && cfg.certifications.length) {
        var certGrid = document.getElementById('certificationsGrid');
        if (certGrid) {
            certGrid.innerHTML = cfg.certifications.map(function(c) {
                return '<div class="cert-card" role="listitem">' +
                    (c.badge_image ? '<img src="' + esc(c.badge_image) + '" alt="' + esc(c.title) + ' badge" class="cert-badge" loading="lazy">' : '<div class="cert-badge-placeholder"><i class="fas fa-certificate"></i></div>') +
                    '<div class="cert-info">' +
                    '<div class="cert-title">' + esc(c.title || '') + '</div>' +
                    '<div class="cert-issuer">' + esc(c.issuer || '') + (c.date ? ' · ' + esc(c.date) : '') + '</div>' +
                    (c.description ? '<p class="cert-desc">' + esc(c.description) + '</p>' : '') +
                    (c.credential_url ? '<a href="' + esc(c.credential_url) + '" target="_blank" rel="noopener" class="cert-link"><i class="fas fa-external-link-alt"></i> View Credential</a>' : '') +
                    '</div></div>';
            }).join('');
        }
    }

    /* ── Achievements ── */
    if (cfg.achievements && cfg.achievements.length) {
        var achGrid = document.getElementById('achievementsGrid');
        if (achGrid) {
            achGrid.innerHTML = cfg.achievements.map(function(a) {
                return '<div class="achievement-card" role="listitem">' +
                    '<div class="achievement-icon"><i class="' + esc(a.icon || 'fas fa-trophy') + '"></i></div>' +
                    '<div class="achievement-info">' +
                    '<div class="achievement-title">' + esc(a.title || '') + '</div>' +
                    (a.date ? '<div class="achievement-date">' + esc(a.date) + '</div>' : '') +
                    (a.description ? '<p class="achievement-desc">' + esc(a.description) + '</p>' : '') +
                    '</div></div>';
            }).join('');
        }
    }

    /* ── Blog ── */
    if (cfg.blog && cfg.blog.length) {
        var blogGrid = document.getElementById('blogGrid');
        if (blogGrid) {
            blogGrid.innerHTML = cfg.blog.map(function(p) {
                var tags = Array.isArray(p.tags) ? p.tags : [];
                return '<article class="blog-card" role="listitem">' +
                    (p.cover_image ? '<div class="blog-cover"><img src="' + esc(p.cover_image) + '" alt="' + esc(p.title) + '" loading="lazy"></div>' : '') +
                    '<div class="blog-content">' +
                    (tags.length ? '<div class="blog-tags">' + tags.map(function(t) { return '<span class="tag-chip">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
                    '<h3 class="blog-title">' + esc(p.title || '') + '</h3>' +
                    (p.excerpt ? '<p class="blog-excerpt">' + esc(p.excerpt) + '</p>' : '') +
                    '</div></article>';
            }).join('');
        }
    }

    /* ── Resume (from experiences + education) ── */
    var resumeContent = document.getElementById('resumeContent');
    if (resumeContent && (cfg.experiences && cfg.experiences.length || cfg.education && cfg.education.length)) {
        var resumeHTML = '';
        if (cfg.experiences && cfg.experiences.length) {
            resumeHTML += '<div class="resume-section"><h3 class="resume-section-title"><i class="fas fa-briefcase"></i> Experience</h3>';
            resumeHTML += cfg.experiences.map(function(exp) {
                var bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
                return '<div class="resume-item">' +
                    '<div class="resume-item-header">' +
                    '<div><strong>' + esc(exp.title || '') + '</strong>' +
                    (exp.company ? ' <span class="resume-company">@ ' + esc(exp.company) + '</span>' : '') + '</div>' +
                    '<span class="resume-date">' + esc(exp.date_range || '') + '</span>' +
                    '</div>' +
                    (exp.description ? '<p class="resume-desc">' + esc(exp.description) + '</p>' : '') +
                    (bullets.length ? '<ul>' + bullets.map(function(b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') +
                    '</div>';
            }).join('');
            resumeHTML += '</div>';
        }
        if (cfg.education && cfg.education.length) {
            resumeHTML += '<div class="resume-section"><h3 class="resume-section-title"><i class="fas fa-graduation-cap"></i> Education</h3>';
            resumeHTML += cfg.education.map(function(ed) {
                var entries = Array.isArray(ed.entries) ? ed.entries : [];
                return '<div class="resume-item">' +
                    '<strong>' + esc(ed.card_title || '') + '</strong>' +
                    (entries.length ? '<ul>' + entries.map(function(e) {
                        return '<li>' + esc(e.degree || e.school || e.title || JSON.stringify(e)) + '</li>';
                    }).join('') + '</ul>' : '') +
                    '</div>';
            }).join('');
            resumeHTML += '</div>';
        }
        resumeContent.innerHTML = resumeHTML;
    }

    /* ── Game settings (apply per-game visibility) ── */
    if (cfg.gameSettings) {
        var tabBar = document.getElementById('minigameTabs');
        if (tabBar) {
            tabBar.querySelectorAll('.minigame-tab').forEach(function(tab) {
                var gId = tab.dataset.game;
                var gs = cfg.gameSettings[gId];
                if (gs && gs.enabled === false) {
                    tab.style.display = 'none';
                } else {
                    tab.style.display = '';
                }
            });
        }
    }

    /* ── Auto-show content sections that have data but aren't yet in the
         sections registry (i.e. migration hasn't run yet).
         Sections already controlled by cfg.sections are skipped — their
         visibility was already set by the loop above. ── */
    (function() {
        var dataMap = {
            testimonials:   cfg.testimonials,
            certifications: cfg.certifications,
            achievements:   cfg.achievements,
            blog:           cfg.blog,
        };
        Object.keys(dataMap).forEach(function(id) {
            var data = dataMap[id];
            if (!data || !data.length) return;
            var el = document.getElementById(id);
            if (!el || el.style.display !== 'none') return;
            var controlled = cfg.sections && cfg.sections.some(function(s) { return s.id === id; });
            if (controlled) return;
            el.style.display = '';
            el.removeAttribute('aria-hidden');
        });
        /* Resume: auto-show if experiences or education data exists */
        var resumeEl = document.getElementById('resume');
        if (resumeEl && resumeEl.style.display === 'none') {
            var resumeControlled = cfg.sections && cfg.sections.some(function(s) { return s.id === 'resume'; });
            if (!resumeControlled) {
                var hasData = (cfg.experiences && cfg.experiences.length) || (cfg.education && cfg.education.length);
                if (hasData) {
                    resumeEl.style.display = '';
                    resumeEl.removeAttribute('aria-hidden');
                }
            }
        }
    })();

    /* Re-bind gallery/video/webpage click handlers after DOM replacement */
    if (typeof window._rebindGallery === 'function') window._rebindGallery();

    /* Re-init animations on new elements */
    reinitAfterConfig();
}

/* ── PROJECT FILTER SYSTEM ─────────────────────────────────── */
(function() {
    /* Filter state */
    var _activeFilters = { categories: [], search: '', sort: 'default' };
    var _allProjData   = [];
    var _r2            = '';

    window.initProjectFilterSystem = function(projects, r2Base) {
        _allProjData = projects;
        _r2          = r2Base;
        renderFilterBar(projects);
        renderProjectGrid(projects);
    };

    function getCategories(projects) {
        var cats = {};
        projects.forEach(function(p) {
            var c = (p.category || 'standard').toLowerCase();
            cats[c] = (cats[c] || 0) + 1;
        });
        return cats;
    }

    function renderFilterBar(projects) {
        var bar = document.getElementById('projectFilterBar');
        if (!bar) return;

        var cats    = getCategories(projects);
        var allCats = Object.keys(cats).sort();
        var hasFeatured = projects.some(function(p) { return p.featured; });

        var catBtns = ['<button class="pf-btn pf-btn--active" data-cat="all" onclick="pfToggleCat(this)">All <span class="pf-count">' + projects.length + '</span></button>'];
        if (hasFeatured) {
            catBtns.push('<button class="pf-btn" data-cat="__featured__" onclick="pfToggleCat(this)">★ Featured <span class="pf-count">' + projects.filter(function(p){return p.featured;}).length + '</span></button>');
        }
        allCats.forEach(function(c) {
            var label = c.charAt(0).toUpperCase() + c.slice(1);
            catBtns.push('<button class="pf-btn" data-cat="' + c + '" onclick="pfToggleCat(this)">' + label + ' <span class="pf-count">' + cats[c] + '</span></button>');
        });

        bar.innerHTML =
            '<div class="pf-cats" id="pfCats">' + catBtns.join('') + '</div>' +
            '<div class="pf-controls">' +
            '<div class="pf-search-wrap">' +
            '<i class="fas fa-search pf-search-icon"></i>' +
            '<input class="pf-search" id="pfSearch" type="text" placeholder="Search projects…" oninput="pfSearch(this.value)" autocomplete="off">' +
            '<button class="pf-clear-search" id="pfClearSearch" onclick="pfClearSearch()" style="display:none" aria-label="Clear search"><i class="fas fa-times"></i></button>' +
            '</div>' +
            '<select class="pf-sort" id="pfSort" onchange="pfSetSort(this.value)">' +
            '<option value="default">Default Order</option>' +
            '<option value="featured">Featured First</option>' +
            '<option value="az">Name A → Z</option>' +
            '<option value="za">Name Z → A</option>' +
            '</select>' +
            '</div>' +
            '<div class="pf-active-tags" id="pfActiveTags" style="display:none"></div>';
    }

    function applyFilters() {
        var results = _allProjData.filter(function(p) {
            /* category filter */
            if (_activeFilters.categories.length && !_activeFilters.categories.includes('all')) {
                var cat = (p.category || 'standard').toLowerCase();
                var matchCat = _activeFilters.categories.some(function(fc) {
                    return fc === '__featured__' ? !!p.featured : fc === cat;
                });
                if (!matchCat) return false;
            }
            /* text search */
            var q = _activeFilters.search.trim().toLowerCase();
            if (q) {
                var tags   = Array.isArray(p.tags)   ? p.tags   : [];
                var skills = Array.isArray(p.skills) ? p.skills : [];
                var haystack = [p.title, p.description].concat(tags).concat(skills).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });

        /* sort */
        if (_activeFilters.sort === 'featured') {
            results = results.slice().sort(function(a,b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
        } else if (_activeFilters.sort === 'az') {
            results = results.slice().sort(function(a,b) { return (a.title||'').localeCompare(b.title||''); });
        } else if (_activeFilters.sort === 'za') {
            results = results.slice().sort(function(a,b) { return (b.title||'').localeCompare(a.title||''); });
        }
        renderProjectGrid(results);
        updateActiveTags();
    }

    function updateActiveTags() {
        var tagsDiv = document.getElementById('pfActiveTags');
        if (!tagsDiv) return;
        var chips = [];
        _activeFilters.categories.forEach(function(c) {
            if (c === 'all') return;
            var label = c === '__featured__' ? '★ Featured' : c.charAt(0).toUpperCase() + c.slice(1);
            chips.push('<span class="pf-active-chip">' + label + '<button onclick="pfRemoveCat(\'' + c + '\')" aria-label="Remove filter"><i class="fas fa-times"></i></button></span>');
        });
        if (_activeFilters.search) {
            chips.push('<span class="pf-active-chip">Search: "' + _activeFilters.search + '"<button onclick="pfClearSearch()" aria-label="Clear search"><i class="fas fa-times"></i></button></span>');
        }
        if (chips.length) {
            tagsDiv.innerHTML = chips.join('') + '<button class="pf-clear-all" onclick="pfClearAll()">Clear All</button>';
            tagsDiv.style.display = 'flex';
        } else {
            tagsDiv.style.display = 'none';
        }
    }

    function renderProjectGrid(projects) {
        var projGrid = document.getElementById('projectGrid');
        if (!projGrid) return;

        if (!projects.length) {
            projGrid.innerHTML = '<div class="pf-empty"><i class="fas fa-search"></i><p>No projects match your filters. <button class="cta-button secondary" style="margin-top:12px;padding:8px 20px;font-size:0.85rem" onclick="pfClearAll()">Clear Filters</button></p></div>';
            return;
        }

        projGrid.innerHTML = projects.map(function(proj) {
            return buildProjectCardHTML(proj);
        }).join('');

        /* Re-bind interaction handlers */
        if (typeof window._rebindGallery === 'function') window._rebindGallery();
        reinitAfterConfig();
    }

    window.buildProjectCardHTML = function(proj) {
        var isVideo    = proj.gallery_type === 'video';
        var isWebpage  = proj.gallery_type === 'webpage';
        var hasGallery = proj.gallery_type === 'image';
        var thumbSrc   = proj.thumbnail_url || (proj.thumbnail_path ? _r2 + '/' + proj.thumbnail_path : 'thumbnail/Coming Soon.gif');
        var tagsHTML   = (proj.tags || []).map(function(t) { return '<span class="project-type">' + esc(t) + '</span>'; }).join('');
        var skillsHTML = (proj.skills || []).length
            ? '<div class="project-skills">' + (proj.skills || []).map(function(sk) {
                return '<span class="project-skill">' + esc(sk) + '</span>';
              }).join('') + '</div>' : '';
        var catLabel   = (proj.category && proj.category !== 'standard') ? proj.category : null;
        var catBadge   = catLabel ? '<span class="project-category-badge project-category-badge--' + catLabel.replace(/\s+/g,'-') + '">' + catLabel + '</span>' : '';
        var featBadge  = proj.featured ? '<span class="project-featured-badge">★ Featured</span>' : '';
        var overlayIcon, overlayText, dataAttr;
        if (isVideo) {
            overlayIcon = 'fas fa-play-circle'; overlayText = 'View Videos';
            dataAttr = 'data-video-folder="' + esc(proj.gallery_folder) + '" style="cursor:pointer"';
        } else if (isWebpage) {
            overlayIcon = proj.preview_mode === 'static' ? 'fas fa-image' : 'fas fa-globe';
            overlayText = proj.preview_mode === 'static' ? 'View Screenshot' : 'Live Preview';
            dataAttr = 'data-webpage-url="' + esc(proj.webpage_url || '') + '" data-webpage-title="' + esc(proj.title) + '" data-webpage-device="' + esc(proj.wp_device || 'full') + '" data-webpage-interaction="' + (proj.wp_allow_interaction !== 0 ? '1' : '0') + '" data-preview-mode="' + esc(proj.preview_mode || 'live') + '" style="cursor:pointer"';
        } else if (hasGallery) {
            overlayIcon = 'fas fa-images'; overlayText = 'View Gallery';
            dataAttr = 'data-gallery-folder="' + esc(proj.gallery_folder) + '"';
        } else {
            overlayIcon = 'fas fa-info-circle'; overlayText = 'View Project';
            dataAttr = '';
        }
        // No-gallery projects get advanced modal
        var noGalleryAttr = (!proj.gallery_type) ? ' data-proj-detail="' + esc(JSON.stringify({
            id: proj.id,
            title: proj.title,
            description: proj.description || '',
            tags: proj.tags || [],
            skills: proj.skills || [],
            category: proj.category || '',
            featured: proj.featured,
            thumbnail_url: thumbSrc,
        })) + '"' : '';

        // Category-driven layout class
        var catLayoutClass = proj.category ? ' project-card--cat-' + (proj.category || 'standard').replace(/\s+/g,'-') : '';

        return '<div class="project-card' + (proj.featured ? ' project-card--featured' : '') + catLayoutClass + '">' +
            '<div class="project-thumbnail" ' + dataAttr + noGalleryAttr + '>' +
            '<img src="' + esc(thumbSrc) + '" alt="' + esc(proj.title) + '" class="main-thumbnail" loading="lazy" ' +
            'onerror="this.src=\'thumbnail/Coming Soon.gif\'">' +
            '<div class="project-overlay"><span class="overlay-text"><i class="' + overlayIcon + '"></i> ' + overlayText + '</span></div>' +
            '</div>' +
            '<div class="project-content">' +
            '<div class="project-tags">' + tagsHTML + '</div>' +
            '<h3 class="project-title">' + esc(proj.title) + '</h3>' +
            '<p class="project-desc">' + esc(proj.description) + '</p>' +
            skillsHTML +
            (catBadge || featBadge ? '<div class="project-meta-badges">' + catBadge + featBadge + '</div>' : '') +
            '</div></div>';
    };

    /* ── Public API ── */
    window.pfToggleCat = function(btn) {
        var cat = btn.dataset.cat;
        if (cat === 'all') {
            _activeFilters.categories = ['all'];
        } else {
            _activeFilters.categories = _activeFilters.categories.filter(function(c) { return c !== 'all'; });
            var idx = _activeFilters.categories.indexOf(cat);
            if (idx >= 0) {
                _activeFilters.categories.splice(idx, 1);
                if (!_activeFilters.categories.length) _activeFilters.categories = ['all'];
            } else {
                _activeFilters.categories.push(cat);
            }
        }
        /* Update button states */
        document.querySelectorAll('#pfCats .pf-btn').forEach(function(b) {
            var bc = b.dataset.cat;
            var active = _activeFilters.categories.includes(bc) || (_activeFilters.categories.includes('all') && bc === 'all');
            b.classList.toggle('pf-btn--active', active);
        });
        applyFilters();
    };

    window.pfSearch = function(val) {
        _activeFilters.search = val;
        var clearBtn = document.getElementById('pfClearSearch');
        if (clearBtn) clearBtn.style.display = val ? '' : 'none';
        applyFilters();
    };

    window.pfClearSearch = function() {
        _activeFilters.search = '';
        var inp = document.getElementById('pfSearch');
        if (inp) inp.value = '';
        var clearBtn = document.getElementById('pfClearSearch');
        if (clearBtn) clearBtn.style.display = 'none';
        applyFilters();
    };

    window.pfSetSort = function(val) {
        _activeFilters.sort = val;
        applyFilters();
    };

    window.pfRemoveCat = function(cat) {
        _activeFilters.categories = _activeFilters.categories.filter(function(c) { return c !== cat; });
        if (!_activeFilters.categories.length) _activeFilters.categories = ['all'];
        document.querySelectorAll('#pfCats .pf-btn').forEach(function(b) {
            b.classList.toggle('pf-btn--active', _activeFilters.categories.includes(b.dataset.cat));
        });
        applyFilters();
    };

    window.pfClearAll = function() {
        _activeFilters = { categories: ['all'], search: '', sort: 'default' };
        var inp = document.getElementById('pfSearch');
        if (inp) inp.value = '';
        var clearBtn = document.getElementById('pfClearSearch');
        if (clearBtn) clearBtn.style.display = 'none';
        var sortSel = document.getElementById('pfSort');
        if (sortSel) sortSel.value = 'default';
        document.querySelectorAll('#pfCats .pf-btn').forEach(function(b) {
            b.classList.toggle('pf-btn--active', b.dataset.cat === 'all');
        });
        applyFilters();
    };

    /* Initialize on page load for hardcoded projects (if any) */
    document.addEventListener('DOMContentLoaded', function() {
        _activeFilters = { categories: ['all'], search: '', sort: 'default' };
    });
})();

function reinitAfterConfig() {
    /* Re-observe new elements for scroll reveal */
    var revealSelector = '.card, .skill-card, .project-card, .timeline-item, .social-card, .stat-card';
    var ioReveal = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry, i) {
            if (!entry.isIntersecting) return;
            setTimeout(function () { entry.target.classList.add('visible'); }, i * 80);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    document.querySelectorAll(revealSelector).forEach(function (el) {
        if (!el.classList.contains('visible')) ioReveal.observe(el);
    });

    /* Re-observe proficiency bars */
    var ioBars = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.style.width = entry.target.dataset.width + '%';
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('.proficiency-level[data-width]').forEach(function (bar) {
        bar.style.width = '0';
        ioBars.observe(bar);
    });

    /* Re-observe stat counters */
    var ioStats = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            var target = parseFloat(el.dataset.target);
            var suffix = el.dataset.suffix || '';
            var isDecimal = el.dataset.target.includes('.');
            var totalFrames = 60;
            var frame = 0;
            var interval = setInterval(function () {
                frame++;
                if (frame >= totalFrames) {
                    el.textContent = (isDecimal ? target.toFixed(2) : Math.floor(target)) + suffix;
                    clearInterval(interval);
                } else {
                    var current = (target * frame) / totalFrames;
                    el.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix;
                }
            }, 25);
            obs.unobserve(el);
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
        ioStats.observe(el);
    });

    /* Re-setup 3D tilt on new cards */
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.card, .skill-card, .project-card, .social-card, .stat-card').forEach(function (card) {
            if (card.dataset.tiltBound) return;
            card.dataset.tiltBound = '1';
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = 'perspective(600px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) scale(1.02)';
            });
            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    }

    /* Re-attach ripple to new social cards / buttons */
    document.querySelectorAll('.social-card, .cta-button').forEach(function (el) {
        if (el.dataset.rippleBound) return;
        el.dataset.rippleBound = '1';
        el.addEventListener('click', function (e) {
            var diameter = Math.max(el.clientWidth, el.clientHeight);
            var radius = diameter / 2;
            var rect = el.getBoundingClientRect();
            var circle = document.createElement('span');
            circle.className = 'ripple';
            circle.style.width = circle.style.height = diameter + 'px';
            circle.style.left = (e.clientX - rect.left - radius) + 'px';
            circle.style.top = (e.clientY - rect.top - radius) + 'px';
            var old = el.querySelector('.ripple');
            if (old) old.remove();
            el.appendChild(circle);
        });
    });

    /* Re-attach cursor hover to new elements */
    var ring = document.getElementById('cursor-ring');
    if (ring) {
        var hoverEls = 'a, button, .cta-button, .card, .skill-card, .project-card, .social-card, .gallery-item, .close-button, .preview-nav, .timeline-header, .skill-card-header';
        document.querySelectorAll(hoverEls).forEach(function (el) {
            if (el.dataset.cursorBound) return;
            el.dataset.cursorBound = '1';
            el.addEventListener('mouseenter', function () { ring.classList.add('cursor-hover'); });
            el.addEventListener('mouseleave', function () { ring.classList.remove('cursor-hover'); });
        });
    }
}

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
    toast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/* ── C. CUSTOM CURSOR ─────────────────────────────────────── */
(function initCursor() {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    /* start off-screen so cursor doesn't flash at top-left on load */
    let mx = -500, my = -500, rx = -500, ry = -500;
    let rafId;
    let hasMoved = false;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            dot.style.opacity  = '';   /* restore CSS-defined opacity */
            ring.style.opacity = '';   /* restore CSS 0.6 */
        }
    });

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
        rx = lerp(rx, mx, 0.18);
        ry = lerp(ry, my, 0.18);
        dot.style.left  = mx + 'px';
        dot.style.top   = my + 'px';
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        rafId = requestAnimationFrame(tick);
    }
    tick();

    const hoverEls = 'a, button, .cta-button, .card, .skill-card, .project-card, .social-card, .gallery-item, .close-button, .preview-nav, .timeline-header, .skill-card-header';
    document.querySelectorAll(hoverEls).forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => ring.classList.remove('cursor-hover'));
    });

    window.addEventListener('resize', () => {
        if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
            cancelAnimationFrame(rafId);
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        }
    });
})();

/* ── C.2 HERO PHOTO — AUTO-DETECT FROM /profile/ ─────────── */
(function initProfilePhoto() {
    const avatarFrame = document.getElementById('avatarFrame');
    const heroPhoto   = document.getElementById('heroPhoto');
    if (!avatarFrame || !heroPhoto) return;

    /* If config already loaded the photo from R2, skip probing */
    if (heroPhoto.dataset.cfgLoaded === '1') return;

    /* Supported extensions to probe in order */
    const EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'svg'];
    let probeIdx = 0;

    /* Start with loading state — show ring, hide image until found */
    heroPhoto.style.opacity = '0';
    avatarFrame.classList.add('avatar-loading');

    function probeNext() {
        if (probeIdx >= EXTS.length) {
            /* None found — fade in fallback SVG */
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
                heroPhoto.style.opacity    = '1';
            });
        };
        img.onerror = probeNext;
        img.src = `profile/profile.${ext}`;
    }

    probeNext();
})();

/* ── D. SCROLL PROGRESS BAR ───────────────────────────────── */
(function initScrollBar() {
    const bar = document.querySelector('.scroll-seekbar');
    if (!bar) return;
    function update() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
})();

/* ── E. NAVIGATION ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    /* Defer padding-left transition until after first paint to prevent
       layout shift when browser restores scroll position on reload */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.add('body-ready');
        });
    });

    const nav       = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.querySelector('.nav-links');
    /* Live query — re-evaluated every call so new links added by applySiteConfig are included */
    const allLinks  = () => document.querySelectorAll('.nav-link');
    const isMobile  = () => window.innerWidth <= 768;

    /* Mobile side nav expand/collapse */
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

    /* Desktop drawer (legacy, kept for >768px) */
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
        if (isMobile()) {
            collapseSideNav();
        } else {
            navLinks.classList.remove('open');
            document.body.classList.remove('nav-active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    }

    hamburger.addEventListener('click', openNav);

    const navDrawerClose = document.getElementById('navDrawerClose');
    if (navDrawerClose) navDrawerClose.addEventListener('click', closeNav);

    document.addEventListener('click', e => {
        if (isMobile()) {
            if (!nav.contains(e.target)) collapseSideNav();
        } else {
            if (!nav.contains(e.target)) closeNav();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeNav();
    });

    allLinks().forEach(link => link.addEventListener('click', () => {
        if (isMobile()) collapseSideNav();
        else closeNav();
    }));

    /* Track breakpoint crossings for morph animation */
    let wasMobile = window.innerWidth <= 768;

    window.addEventListener('resize', () => {
        const nowMobile = window.innerWidth <= 768;

        if (window.innerWidth > 768) {
            closeNav();
            collapseSideNav();
            document.body.style.paddingLeft = '';
        }

        /* Fire morph animation on breakpoint crossing */
        if (wasMobile !== nowMobile) {
            nav.classList.add('nav-morphing');
            document.body.classList.add('nav-morphing');
            setTimeout(() => {
                nav.classList.remove('nav-morphing');
                document.body.classList.remove('nav-morphing');
            }, 600);
        }
        wasMobile = nowMobile;
    });

    /* hide on scroll down, reveal on scroll up (desktop only) + hero parallax */
    let lastY = 0;
    const heroShapes = document.getElementById('shapes');
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (!isMobile()) {
            if (y > lastY && y > 200) nav.classList.add('hide');
            else nav.classList.remove('hide');
        }
        lastY = y;

        /* subtle hero parallax — desktop only, shapes only */
        if (!isMobile() && y < window.innerHeight) {
            if (heroShapes) heroShapes.style.transform = `translateY(${y * 0.35}px)`;
        } else if (heroShapes) {
            heroShapes.style.transform = '';
        }
    }, { passive: true });

    /* active link via IntersectionObserver */
    const sections = document.querySelectorAll('section, header');

    /* Track which sections are currently intersecting */
    const visibleSections = new Set();
    let navInitDone = false;

    function updateActiveNav() {
        const links = allLinks();
        /* At the very top of the page, always activate Home */
        if (window.scrollY < window.innerHeight * 0.25) {
            links.forEach(l => l.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) homeLink.classList.add('active');
            return;
        }

        /* Among visible sections, pick the one highest on screen (lowest top offset) */
        let topSection = null;
        let topOffset  = Infinity;
        visibleSections.forEach(s => {
            const rect = s.getBoundingClientRect();
            if (rect.top < topOffset) {
                topOffset  = rect.top;
                topSection = s;
            }
        });

        if (topSection) {
            links.forEach(l => l.classList.remove('active'));
            const t = document.querySelector(`.nav-link[href="#${topSection.id}"]`);
            if (t) t.classList.add('active');
        }
    }

    const ioNav = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visibleSections.add(entry.target);
            } else {
                visibleSections.delete(entry.target);
            }
        });
        /* Suppress initial batch fires on page load — let scroll handler manage first state */
        if (navInitDone) updateActiveNav();
    }, { rootMargin: `-${Math.round(window.innerHeight * 0.35)}px 0px -40%` });

    sections.forEach(s => ioNav.observe(s));

    /* Expose globally so applySiteConfig() can add newly-injected custom sections */
    window._ioNav = ioNav;

    /* Delay enabling intersection-based updates until after initial render */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            navInitDone = true;
            updateActiveNav();
        });
    });

    let navScrollRaf;
    window.addEventListener('scroll', () => {
        if (navScrollRaf) return;
        navScrollRaf = requestAnimationFrame(() => {
            updateActiveNav();
            navScrollRaf = null;
        });
    }, { passive: true });

    /* smooth scroll — set active immediately on click, don't wait for IntersectionObserver */
    document.addEventListener('click', function(e) {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const href = a.getAttribute('href');
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        /* Immediately update active link */
        allLinks().forEach(l => l.classList.remove('active'));
        const clicked = document.querySelector(`.nav-link[href="${href}"]`);
        if (clicked) clicked.classList.add('active');
        const navOffset = isMobile() ? 8 : (document.querySelector('.nav-header')?.offsetHeight || 0) + 8;
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});



/* ── E.5 AMBIENT BUBBLES ─────────────────────────────────── */
(function initBubbles() {
    /* Skip on mobile — blurred animated divs are expensive on phone GPUs */
    if (window.innerWidth <= 768) return;
    const container = document.getElementById('bgShapes');
    if (!container) return;
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 12; i++) {
        const el = document.createElement('div');
        el.className = 'bg-bubble';
        const size = rnd(120, 420);
        const opacity = rnd(0.04, 0.10);
        const color = Math.random() > 0.5
            ? `rgba(255,107,107,${opacity.toFixed(3)})`
            : `rgba(78,205,196,${opacity.toFixed(3)})`;
        el.style.cssText = `
            width:${size}px; height:${size}px;
            left:${rnd(-5, 95).toFixed(1)}%;
            top:${rnd(0, 100).toFixed(1)}%;
            background:${color};
            --dur:${rnd(18, 38).toFixed(1)}s;
            --delay:-${rnd(0, 20).toFixed(1)}s;
            --tx1:${rnd(-120, 120).toFixed(0)}px; --ty1:${rnd(-120, 120).toFixed(0)}px;
            --tx2:${rnd(-120, 120).toFixed(0)}px; --ty2:${rnd(-120, 120).toFixed(0)}px;
            --tx3:${rnd(-120, 120).toFixed(0)}px; --ty3:${rnd(-120, 120).toFixed(0)}px;
        `;
        container.appendChild(el);
    }
})();

/* ── F. FLOATING SHAPES ───────────────────────────────────── */
(function initShapes() {
    const container = document.getElementById('shapes');
    if (!container) return;
    const isMobile = window.innerWidth <= 768;
    /* 60 on desktop, 15 on mobile */
    const count = isMobile ? 15 : 60;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'shape';
        const size = Math.random() * 80 + 20;
        s.style.cssText = `
            width:${size}px; height:${size}px;
            left:${Math.random()*100}%; top:${Math.random()*100}%;
            animation-delay:${Math.random()*-25}s;
            animation-duration:${Math.random()*15+15}s;
        `;
        s.style.setProperty('--moveX', `${(Math.random()-.5)*250}px`);
        s.style.setProperty('--moveY', `${(Math.random()-.5)*250}px`);
        container.appendChild(s);
    }
})();

/* ── G. PARTICLE CONSTELLATION ──────────────────────────── */
(function initParticles() {
    /* Skip entirely on mobile — canvas animation is the biggest perf drain */
    if (window.innerWidth <= 768) return;
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    let mouse = { x: -999, y: -999 };

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x  = Math.random() * W;
            this.y  = Math.random() * H;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.r  = Math.random() * 2 + 1;
            this.alpha = Math.random() * 0.35 + 0.1;
        }
        update() {
            const dx = this.x - mouse.x, dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 100) {
                this.vx += (dx / dist) * 0.3;
                this.vy += (dy / dist) * 0.3;
            }
            const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            if (speed > 1.5) { this.vx *= 0.95; this.vy *= 0.95; }

            this.x += this.vx; this.y += this.vy;
            if (this.x < 0) this.x = W;
            if (this.x > W) this.x = 0;
            if (this.y < 0) this.y = H;
            if (this.y > H) this.y = 0;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(78,205,196,${this.alpha})`;
            ctx.fill();
        }
    }

    function init() {
        resize();
        particles = Array.from({ length: 70 }, () => new Particle());
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d  = Math.sqrt(dx*dx + dy*dy);
                if (d < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(78,205,196,${0.12 * (1 - d/120)})`;
                    ctx.lineWidth   = 0.8;
                    ctx.stroke();
                }
            }
        }
    }

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        drawLines();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(() => { init(); loop(); });

    window.addEventListener('resize', () => { resize(); particles.forEach(p => p.reset()); });

    /* Track mouse across entire page */
    document.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
})();

/* ── G.5 SKILL CARD DROPDOWN TOGGLE ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.skill-card-header').forEach(header => {
        if (header.dataset.toggleBound) return;
        header.dataset.toggleBound = '1';
        header.addEventListener('click', () => {
            const card = header.closest('.skill-card');
            const wasExpanded = card.classList.contains('expanded');
            card.classList.toggle('expanded');
            if (!wasExpanded) {
                card.querySelectorAll('.proficiency-level[data-width]').forEach(bar => {
                    bar.style.width = '0';
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            bar.style.width = bar.dataset.width + '%';
                        });
                    });
                });
            }
        });
    });
});

/* ── G.7 ABOUT CARD DROPDOWN TOGGLE ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.about-card-header').forEach(header => {
        if (header.dataset.toggleBound) return;
        header.dataset.toggleBound = '1';
        header.addEventListener('click', () => {
            header.closest('.about-card').classList.toggle('about-expanded');
        });
    });
});

/* ── G.6 TIMELINE DROPDOWN TOGGLE ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.timeline-header').forEach(header => {
        if (header.dataset.toggleBound) return;
        header.dataset.toggleBound = '1';
        header.addEventListener('click', () => {
            const item = header.closest('.timeline-item');
            item.classList.toggle('tl-open');
        });
    });

    document.querySelectorAll('.timeline-marker').forEach(marker => {
        if (marker.dataset.toggleBound) return;
        marker.dataset.toggleBound = '1';
        marker.addEventListener('click', () => {
            const item = marker.closest('.timeline-item');
            item.classList.toggle('tl-open');
        });
    });
});

/* ── H. HERO NAME GLITCH ──────────────────────────────────── */
(function initGlitch() {
    const el = document.querySelector('.hero-name.glitch');
    if (!el) return;
    function glitch() {
        el.classList.add('glitching');
        setTimeout(() => el.classList.remove('glitching'), 200);
        setTimeout(glitch, 1500 + Math.random() * 4000);
    }
    setTimeout(glitch, 2000);
})();

/* ── I. TYPEWRITER / ROTATING SUBTITLE ───────────────────── */
(function initTypewriter() {
    const el = document.getElementById('hero-subtitle');
    if (!el) return;

    const defaultLines = [
        'Computer Engineer',
        'Insurance Operations Analyst',
        'Creative Visual Designer',
        'VBA & Automation Specialist',
        'Full-Stack Problem Solver'
    ];
    const lines = (SITE_CFG && SITE_CFG.settings && SITE_CFG.settings.typewriterPhrases && SITE_CFG.settings.typewriterPhrases.length)
        ? SITE_CFG.settings.typewriterPhrases : defaultLines;

    let lineIdx = 0, charIdx = 0, deleting = false;
    let typingSpeed = 65, deletingSpeed = 35, pauseMs = 2400;

    function type() {
        const current = lines[lineIdx];
        if (!deleting) {
            el.textContent = current.slice(0, ++charIdx);
            if (charIdx === current.length) {
                deleting = true;
                setTimeout(type, pauseMs);
                return;
            }
        } else {
            el.textContent = current.slice(0, --charIdx);
            if (charIdx === 0) {
                deleting = false;
                lineIdx  = (lineIdx + 1) % lines.length;
            }
        }
        setTimeout(type, deleting ? deletingSpeed : typingSpeed);
    }
    setTimeout(type, 1200);
})();

/* ── J. SCROLL-TRIGGERED ANIMATIONS ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    /* general reveal */
    const revealEls = document.querySelectorAll(
        '.card, .skill-card, .project-card, .timeline-item, .social-card, .stat-card'
    );

    const ioReveal = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (!entry.isIntersecting) return;
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealEls.forEach(el => ioReveal.observe(el));

    /* proficiency bars */
    const bars = document.querySelectorAll('.proficiency-level[data-width]');
    const ioBars = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.width = entry.target.dataset.width + '%';
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.3 });

    bars.forEach(b => ioBars.observe(b));

    /* stat counters — frame-based to avoid float accumulation errors */
    const statEls = document.querySelectorAll('.stat-number[data-target]');
    const ioStats = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el        = entry.target;
            const target    = parseFloat(el.dataset.target);
            const suffix    = el.dataset.suffix || '';
            const isDecimal = el.dataset.target.includes('.');
            const totalFrames = 60;
            let frame = 0;
            const interval = setInterval(() => {
                frame++;
                if (frame >= totalFrames) {
                    el.textContent = (isDecimal ? target.toFixed(2) : Math.floor(target)) + suffix;
                    clearInterval(interval);
                } else {
                    const current = (target * frame) / totalFrames;
                    el.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix;
                }
            }, 25);
            obs.unobserve(el);
        });
    }, { threshold: 0.5 });

    statEls.forEach(el => ioStats.observe(el));
});

/* ── K. TEXT SCRAMBLE ON SECTION HEADINGS ─────────────────── */
(function initScramble() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

    function scramble(el) {
        const original = el.dataset.scramble || el.textContent;
        let frame = 0;
        const maxFrames = original.length * 3;
        const id = setInterval(() => {
            el.textContent = original.split('').map((ch, i) => {
                if (ch === ' ' || ch === '&' || ch === ';') return ch;
                const revealed = Math.floor(frame / 3);
                if (i < revealed) return original[i];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join('');
            if (frame++ >= maxFrames) {
                el.textContent = original;
                clearInterval(id);
            }
        }, 30);
    }

    const headings = document.querySelectorAll('.section-title[data-scramble]');
    const ioScramble = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            scramble(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    headings.forEach(h => ioScramble.observe(h));
})();

/* ── L. 3D CARD TILT ──────────────────────────────────────── */
(function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;

    const tiltEls = document.querySelectorAll('.card, .skill-card, .project-card, .stat-card');

    tiltEls.forEach(el => {
        el.addEventListener('mousemove', e => {
            const r  = el.getBoundingClientRect();
            const x  = ((e.clientX - r.left) / r.width  - 0.5) * 14;
            const y  = ((e.clientY - r.top)  / r.height - 0.5) * 14;
            el.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-4px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
})();

/* ── M. MAGNETIC BUTTONS ──────────────────────────────────── */
(function initMagnetic() {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    document.querySelectorAll('.cta-button, .theme-toggle-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r  = btn.getBoundingClientRect();
            const x  = (e.clientX - r.left - r.width  / 2) * 0.25;
            const y  = (e.clientY - r.top  - r.height / 2) * 0.25;
            btn.style.transform = `translate(${x}px, ${y}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
})();

/* ── N. GALLERY MODAL ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const galleryModal  = document.getElementById('galleryModal');
    const previewModal  = document.getElementById('previewModal');
    const galleryGrid   = document.getElementById('galleryGrid');
    const previewImage  = document.getElementById('previewImage');
    const previewCounter= document.getElementById('previewCounter');
    const galleryClose  = document.getElementById('galleryClose');
    const previewClose  = document.getElementById('previewClose');
    const prevBtn       = document.getElementById('prevBtn');
    const nextBtn       = document.getElementById('nextBtn');
    const hamburger     = document.getElementById('hamburger');
    const navHeader     = document.getElementById('navbar');

    if (!galleryModal) return;

    let currentImages = [], currentIndex = 0;
    let touchStartX = 0;

    /* scroll lock */
    function lockScroll() {
        const sw = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = sw + 'px';
        document.body.classList.add('modal-open');
    }
    function unlockScroll() {
        document.body.style.paddingRight = '';
        document.body.classList.remove('modal-open');
    }

    /* hide / restore nav when gallery is open */
    const isMobileGallery = () => window.innerWidth <= 768;
    function hideNav() {
        if (isMobileGallery()) {
            if (navHeader) navHeader.style.transform = 'translateX(-100%)';
        } else {
            if (navHeader) navHeader.style.transform = 'translateY(-100%)';
        }
        if (hamburger) hamburger.style.visibility = 'hidden';
    }
    function restoreNav() {
        if (navHeader) navHeader.style.transform = '';
        if (hamburger) hamburger.style.visibility = '';
    }

    function openGallery(images) {
        currentImages = images;
        /* use DOM creation to avoid any XSS risk from src/alt values */
        galleryGrid.innerHTML = '';
        images.forEach((imgData, i) => {
            const item  = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.index = i;
            const pic   = document.createElement('img');
            pic.src     = imgData.src;
            pic.alt     = imgData.alt;
            pic.loading = 'lazy';
            pic.addEventListener('error', () => { item.style.opacity = '0.3'; });
            item.appendChild(pic);
            galleryGrid.appendChild(item);
        });
        galleryModal.classList.add('active');
        lockScroll();
        hideNav();
    }

    function openPreview(index) {
        currentIndex = ((index % currentImages.length) + currentImages.length) % currentImages.length;
        const img = currentImages[currentIndex];
        previewImage.src  = img.src;
        previewImage.alt  = img.alt;
        if (previewCounter) previewCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
        galleryModal.classList.remove('active');
        previewModal.classList.add('active');
    }

    function closeAll() {
        galleryModal.classList.remove('active');
        previewModal.classList.remove('active');
        unlockScroll();
        restoreNav();
    }

    function backToGallery() {
        previewModal.classList.remove('active');
        galleryModal.classList.add('active');
    }

    function navigate(dir) {
        openPreview(currentIndex + dir);
    }

    /* ── Gallery scan ────────────────────────────────────────
       Always fetches real filenames from /api/gallery/:folder
       which reads directly from D1 (populated on every upload).
       URLs are already encoded by the Worker.
    ─────────────────────────────────────────────────────── */
    var WORKER_API = 'https://carlo-portfolio-api.johncarloebora.workers.dev';

    const IMAGE_EXTS = new Set([
        'jpg','jpeg','png','webp','avif','gif','bmp','svg','tiff','tif','heic','heif'
    ]);
    const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','mkv','ogv']);

    function fileToAlt(filename) {
        return filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    }

    async function scanFolder(folder, allowedExts) {
        try {
            var res = await fetch(WORKER_API + '/api/gallery/' + encodeURIComponent(folder), { cache: 'no-store' });
            if (!res.ok) return null;
            var items = await res.json();
            return items
                .filter(function (m) {
                    var ext = (m.name || '').split('.').pop().toLowerCase();
                    return allowedExts.has(ext);
                })
                .map(function (m) {
                    return { src: m.url, alt: m.alt || fileToAlt(m.name) };
                });
        } catch (e) {
            return null;
        }
    }

    /* Image gallery thumbnails */
    /* Expose rebind so applySiteConfig can re-attach after replacing project HTML */
    window._rebindGallery = function () { bindGalleryClicks(); bindVideoClicks(); bindWebpageClicks(); };

    function bindGalleryClicks() {
        document.querySelectorAll('.project-thumbnail[data-gallery-folder]').forEach(thumb => {
            thumb.addEventListener('click', async () => {
                const folder = thumb.dataset.galleryFolder;
                var imgs = await scanFolder(folder, IMAGE_EXTS);
                if (imgs && imgs.length) {
                    openGallery(imgs);
                } else {
                    showToast('No images found in this gallery.', 'error');
                }
            });
        });
    }
    bindGalleryClicks();

    /* gallery grid click */
    galleryGrid.addEventListener('click', e => {
        const item = e.target.closest('.gallery-item');
        if (item) openPreview(parseInt(item.dataset.index));
    });

    /* close buttons */
    galleryClose.addEventListener('click', closeAll);
    previewClose.addEventListener('click', backToGallery);

    /* nav buttons */
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    /* keyboard */
    document.addEventListener('keydown', e => {
        if (previewModal.classList.contains('active')) {
            if (e.key === 'Escape')     backToGallery();
            if (e.key === 'ArrowLeft')  navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        } else if (galleryModal.classList.contains('active')) {
            if (e.key === 'Escape') closeAll();
        }
    });

    /* touch swipe in preview */
    previewModal.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    previewModal.addEventListener('touchend',   e => {
        const delta = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(delta) > 50) navigate(delta < 0 ? 1 : -1);
    });

    /* backdrop click closes */
    galleryModal.addEventListener('click', e => { if (e.target === galleryModal) closeAll(); });
    previewModal.addEventListener('click', e => { if (e.target === previewModal) backToGallery(); });

    /* preview image error */
    previewImage.addEventListener('error', () => {
        previewImage.alt = 'Image failed to load';
    });

    /* ── video gallery / empty state modal ─── */
    const videoModal      = document.getElementById('videoModal');
    const videoModalClose = document.getElementById('videoModalClose');

    function showVideoEmpty() {
        if (!videoModal) return;
        videoModal.classList.add('active');
        lockScroll();
        hideNav();
    }

    function bindVideoClicks() {
        document.querySelectorAll('.project-thumbnail[data-video-folder]').forEach(thumb => {
            thumb.addEventListener('click', async () => {
                const folder = thumb.dataset.videoFolder;
                var files = await scanFolder(folder, VIDEO_EXTS);
                if (files && files.length) {
                    openGallery(files);
                } else {
                    showVideoEmpty();
                }
            });
        });
    }
    bindVideoClicks();

    /* ── Webpage preview modal ─── */
    var webpageModal     = document.getElementById('webpageModal');
    var webpageFrame     = document.getElementById('webpageFrame');
    var webpageFrameWrap = document.getElementById('webpageFrameWrap');
    var webpageModalClose= document.getElementById('webpageModalClose');
    var webpageOpenBtn   = document.getElementById('webpageOpenBtn');
    var webpageTitle     = document.getElementById('webpageModalTitle');
    var webpageLoading   = document.getElementById('webpageLoading');
    var webpageError     = document.getElementById('webpageError');
    var webpageErrorLink = document.getElementById('webpageErrorLink');

    /* Device simulation presets */
    var WP_DEVICES = {
        mobile:  { width: '390px',  label: '📱 Mobile',  icon: 'fas fa-mobile-alt' },
        tablet:  { width: '768px',  label: '⬛ Tablet',  icon: 'fas fa-tablet-alt' },
        desktop: { width: '1280px', label: '🖥 Desktop', icon: 'fas fa-desktop'    },
        full:    { width: '100%',   label: '⤢ Full',    icon: 'fas fa-expand'     },
    };
    var _wpActiveDevice = 'full';
    var _wpZoom         = 1;
    var _wpCurrentUrl   = '';
    var _wpLoadTimeout  = null;

    function applyDeviceSimulation() {
        if (!webpageFrameWrap) return;
        var preset = WP_DEVICES[_wpActiveDevice] || WP_DEVICES.full;
        var wrap   = document.getElementById('webpageFrameWrap');
        if (!wrap) return;
        if (_wpActiveDevice === 'full') {
            wrap.style.maxWidth = '';
            wrap.style.margin   = '';
            wrap.style.transition = 'max-width 0.3s ease';
        } else {
            wrap.style.maxWidth   = preset.width;
            wrap.style.margin     = '0 auto';
            wrap.style.transition = 'max-width 0.3s ease';
        }
        /* Update active state on toolbar buttons */
        document.querySelectorAll('.wp-device-btn').forEach(function(b) {
            b.classList.toggle('wp-device-btn--active', b.dataset.device === _wpActiveDevice);
        });
        /* Apply zoom */
        if (webpageFrame) {
            webpageFrame.style.transform      = _wpZoom !== 1 ? 'scale(' + _wpZoom + ')' : '';
            webpageFrame.style.transformOrigin = 'top left';
            webpageFrame.style.width          = _wpZoom !== 1 ? (100 / _wpZoom) + '%' : '';
            webpageFrame.style.height         = _wpZoom !== 1 ? (100 / _wpZoom) + '%' : '';
        }
        /* Update zoom display */
        var zoomDisplay = document.getElementById('wpZoomVal');
        if (zoomDisplay) zoomDisplay.textContent = Math.round(_wpZoom * 100) + '%';
    }

    window.wpSetDevice = function(device) {
        _wpActiveDevice = device;
        applyDeviceSimulation();
    };

    window.wpSetZoom = function(val) {
        _wpZoom = Math.max(0.25, Math.min(2, parseFloat(val)));
        applyDeviceSimulation();
    };

    window.wpReload = function() {
        if (!webpageFrame || !_wpCurrentUrl) return;
        webpageFrame.style.opacity = '0';
        if (webpageLoading) webpageLoading.style.display = '';
        if (webpageError)   webpageError.style.display   = 'none';
        webpageFrame.src = '';
        setTimeout(function() {
            if (webpageFrame) webpageFrame.src = _wpCurrentUrl;
        }, 100);
    };

    function openWebpageModal(url, title, projConfig) {
        if (!webpageModal || !webpageFrame) return;
        if (!url) { showToast('No URL configured for this project.', 'error'); return; }
        _wpCurrentUrl   = url;
        _wpActiveDevice = (projConfig && projConfig.wp_device) ? projConfig.wp_device : 'full';
        _wpZoom         = 1;
        /* Apply per-project interaction setting */
        var allowInteraction = !projConfig || projConfig.wp_allow_interaction !== false;
        if (allowInteraction) {
            webpageFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
        } else {
            webpageFrame.setAttribute('sandbox', 'allow-same-origin');
        }
        if (webpageTitle)   webpageTitle.textContent = title || 'Live Preview';
        if (webpageOpenBtn) webpageOpenBtn.href = url;
        if (webpageErrorLink) webpageErrorLink.href = url;
        /* Reset state */
        if (webpageLoading) webpageLoading.style.display = '';
        if (webpageError)   webpageError.style.display   = 'none';
        webpageFrame.style.opacity = '0';
        webpageFrame.src = '';
        webpageModal.classList.add('active');
        lockScroll();
        hideNav();
        applyDeviceSimulation();
        /* X-Frame timeout (8s) */
        if (_wpLoadTimeout) clearTimeout(_wpLoadTimeout);
        _wpLoadTimeout = setTimeout(function() {
            if (webpageFrame && webpageFrame.style.opacity === '0') {
                if (webpageLoading) webpageLoading.style.display = 'none';
                if (webpageError)   webpageError.style.display   = '';
            }
        }, 8000);
        webpageFrame.onload = function() {
            clearTimeout(_wpLoadTimeout);
            if (webpageLoading) webpageLoading.style.display = 'none';
            try { webpageFrame.style.opacity = '1'; } catch(e) {}
        };
        webpageFrame.src = url;
    }

    function closeWebpageModal() {
        if (!webpageModal) return;
        clearTimeout(_wpLoadTimeout);
        webpageModal.classList.remove('active');
        if (webpageFrame) {
            webpageFrame.src = '';
            webpageFrame.style.opacity = '';
            webpageFrame.style.transform = '';
            webpageFrame.style.width     = '';
            webpageFrame.style.height    = '';
        }
        var wrap = document.getElementById('webpageFrameWrap');
        if (wrap) { wrap.style.maxWidth = ''; wrap.style.margin = ''; }
        unlockScroll();
        restoreNav();
    }

    function bindWebpageClicks() {
        document.querySelectorAll('.project-thumbnail[data-webpage-url]').forEach(function(thumb) {
            if (thumb.dataset.webpageBound) return;
            thumb.dataset.webpageBound = '1';
            thumb.addEventListener('click', function() {
                openWebpageModal(thumb.dataset.webpageUrl, thumb.dataset.webpageTitle, {
                    wp_device:            thumb.dataset.webpageDevice || 'full',
                    wp_allow_interaction: thumb.dataset.webpageInteraction !== '0',
                });
            });
        });
    }
    bindWebpageClicks();

    if (webpageModalClose) webpageModalClose.addEventListener('click', closeWebpageModal);
    if (webpageModal) {
        webpageModal.addEventListener('click', function(e) {
            if (e.target === webpageModal) closeWebpageModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && webpageModal.classList.contains('active')) closeWebpageModal();
        });
    }

    /* ── Advanced Project Detail Modal (no-gallery projects) ── */
    var projDetailModal  = document.getElementById('projDetailModal');
    var projDetailContent = document.getElementById('projDetailContent');
    var projDetailClose  = document.getElementById('projDetailClose');

    function openProjDetail(projData) {
        if (!projDetailModal || !projDetailContent) return;
        var tagsHtml   = (projData.tags  || []).map(function(t) { return '<span class="project-type">' + esc(t) + '</span>'; }).join('');
        var skillsHtml = (projData.skills|| []).map(function(s) { return '<span class="project-skill">' + esc(s) + '</span>'; }).join('');
        projDetailContent.innerHTML =
            (projData.thumbnail_url ? '<img src="' + esc(projData.thumbnail_url) + '" alt="' + esc(projData.title) + '" style="width:100%;border-radius:8px;margin-bottom:20px;max-height:260px;object-fit:cover">' : '') +
            (projData.featured ? '<div class="project-featured-badge" style="margin-bottom:8px">★ Featured</div>' : '') +
            '<h2 style="font-size:1.5rem;margin:0 0 8px;color:var(--text-primary)">' + esc(projData.title) + '</h2>' +
            (projData.category && projData.category !== 'standard' ? '<span class="project-category-badge project-category-badge--' + esc(projData.category.replace(/\s+/g,'-')) + '" style="margin-bottom:12px;display:inline-block">' + esc(projData.category) + '</span>' : '') +
            '<p style="color:var(--text-secondary);line-height:1.7;margin:12px 0">' + esc(projData.description) + '</p>' +
            (tagsHtml ? '<div class="project-tags" style="margin:12px 0">' + tagsHtml + '</div>' : '') +
            (skillsHtml ? '<div class="project-skills" style="margin:12px 0">' + skillsHtml + '</div>' : '');
        projDetailModal.style.display = '';
        projDetailModal.classList.add('active');
        lockScroll();
        hideNav();
        if (projDetailClose) projDetailClose.focus();
    }

    function closeProjDetail() {
        if (!projDetailModal) return;
        projDetailModal.classList.remove('active');
        projDetailModal.style.display = 'none';
        unlockScroll();
        restoreNav();
    }

    document.querySelectorAll('.project-thumbnail[data-proj-detail]').forEach(function(thumb) {
        if (thumb.dataset.projDetailBound) return;
        thumb.dataset.projDetailBound = '1';
        thumb.style.cursor = 'pointer';
        thumb.addEventListener('click', function() {
            try { openProjDetail(JSON.parse(thumb.dataset.projDetail)); } catch {}
        });
    });

    if (projDetailClose) projDetailClose.addEventListener('click', closeProjDetail);
    if (projDetailModal) {
        projDetailModal.addEventListener('click', function(e) { if (e.target === projDetailModal) closeProjDetail(); });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && projDetailModal.classList.contains('active')) closeProjDetail();
        });
    }

    /* ── Static screenshot fallback for preview_mode=static ── */
    /* When a webpage project has preview_mode=static, show a screenshot image instead of iframe */
    document.querySelectorAll('.project-thumbnail[data-webpage-url]').forEach(function(thumb) {
        var previewMode = thumb.dataset.previewMode;
        if (previewMode !== 'static') return;
        // Override click to show screenshot image overlay instead of iframe
        thumb.dataset.webpageBound = '1'; // prevent bindWebpageClicks from re-binding
        thumb.addEventListener('click', function() {
            var url   = thumb.dataset.webpageUrl;
            var title = thumb.dataset.webpageTitle || 'Preview';
            var thumbImg = thumb.querySelector('.main-thumbnail');
            var imgSrc = thumbImg ? thumbImg.src : '';
            if (!projDetailModal) return;
            projDetailContent.innerHTML =
                '<h2 style="font-size:1.3rem;margin:0 0 12px">' + esc(title) + '</h2>' +
                (imgSrc ? '<img src="' + esc(imgSrc) + '" alt="' + esc(title) + '" style="width:100%;border-radius:8px;margin-bottom:16px">' : '') +
                '<p style="color:var(--muted);font-size:0.88rem;margin-bottom:16px">Live preview not available in embedded mode.</p>' +
                '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" class="cta-button primary" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;text-decoration:none"><i class="fas fa-external-link-alt"></i> Open Website</a>';
            projDetailModal.style.display = '';
            projDetailModal.classList.add('active');
            lockScroll(); hideNav();
        });
    });

    /* Legacy fallback */
    document.querySelectorAll('.project-thumbnail[data-video-empty]').forEach(thumb => {
        thumb.addEventListener('click', showVideoEmpty);
    });

    if (videoModalClose && videoModal) {
        const closeVideo = () => {
            videoModal.classList.remove('active');
            unlockScroll();
            restoreNav();
        };
        videoModalClose.addEventListener('click', closeVideo);
        videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideo(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && videoModal.classList.contains('active')) closeVideo();
        });
    }
});

/* ── O. EMAILJS CONTACT FORM ──────────────────────────────── */
(function initEmail() {
    if (typeof emailjs === 'undefined') return;
    emailjs.init('l9FengsYbeILidGxh');
})();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    let lastSubmitTime = 0;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        /* rate limit: 15-second cooldown between submissions */
        const now = Date.now();
        if (now - lastSubmitTime < 15000) {
            showToast('Please wait a moment before sending again.', 'error');
            return;
        }

        if (typeof grecaptcha !== 'undefined') {
            const token = grecaptcha.getResponse();
            if (!token) {
                showToast('Please complete the reCAPTCHA.', 'error');
                return;
            }
        }

        const btn = form.querySelector('button[type="submit"]');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>Sending…</span><i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            await emailjs.send('service_ansc2g4', 'template_g5u73sh', {
                from_name:             document.getElementById('name').value,
                to_email:              document.getElementById('email').value,
                message:               document.getElementById('message').value,
                'g-recaptcha-response': typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : ''
            });
            showToast('Message sent! I\'ll get back to you soon.', 'success');
            lastSubmitTime = Date.now();
            form.reset();
            if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
        } catch (err) {
            console.error(err);
            showToast('Failed to send. Please try again later.', 'error');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled  = false;
        }
    });
});

/* ── Q. BACK TO TOP ───────────────────────────────────────── */
(function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ── R. RIPPLE EFFECT ─────────────────────────────────────── */
(function initRipple() {
    function createRipple(e) {
        const el       = e.currentTarget;
        const diameter = Math.max(el.clientWidth, el.clientHeight);
        const radius   = diameter / 2;
        const rect     = el.getBoundingClientRect();
        const circle   = document.createElement('span');
        circle.className    = 'ripple';
        circle.style.width  = circle.style.height = diameter + 'px';
        circle.style.left   = (e.clientX - rect.left - radius) + 'px';
        circle.style.top    = (e.clientY - rect.top  - radius) + 'px';
        el.querySelector('.ripple')?.remove();
        el.appendChild(circle);
    }

    const rippleTargets = document.querySelectorAll(
        '.cta-button, .social-card, .close-button, .preview-nav, ' +
        '.mobile-nav-toggle, .theme-toggle-btn, .back-to-top'
    );
    rippleTargets.forEach(el => el.addEventListener('click', createRipple));
})();

/* ── S. MINI-GAME ─────────────────────────────────────────── */
(function initMiniGame() {
    var arena = document.getElementById('minigameArena');
    var tabs  = document.getElementById('minigameTabs');
    if (!arena || !tabs) return;

    var activeGame = 'reaction';

    /* ── LocalStorage helpers ── */
    function getHigh(key) {
        var v = localStorage.getItem('mg_best_' + key);
        return v ? parseFloat(v) : null;
    }
    function setHigh(key, val) {
        var current = getHigh(key);
        /* For reaction + typing: lower is better. For click: higher is better */
        var betterFn = (key === 'click_cps' || key === 'click_count')
            ? function(a, b) { return a > b; }
            : function(a, b) { return a < b; };
        if (current === null || betterFn(val, current)) {
            localStorage.setItem('mg_best_' + key, val);
            return true; /* New record */
        }
        return false;
    }

    /* ── Difficulty bar (shared) ── */
    function diffBar(id, levels, active) {
        return '<div class="mg-diff-bar" id="' + id + '">' +
            levels.map(function(l) {
                return '<button class="mg-diff-btn' + (l.key === active ? ' mg-diff-btn--active' : '') + '" data-diff="' + l.key + '">' + l.label + '</button>';
            }).join('') + '</div>';
    }

    /* ── REACTION TEST ── */
    var reactionGame = (function() {
        var state = 'start'; /* start | waiting | ready | done | tooearly */
        var startTime = 0, timer = null;
        var RESULTS_MAX = 5;
        var results = [];
        var difficulty = 'normal';
        var DELAYS = { easy: [1000, 5000], normal: [1500, 4500], hard: [500, 2000] };

        function avgMs(arr) { return arr.length ? Math.round(arr.reduce(function(a,b){return a+b;},0) / arr.length) : 0; }
        function best() { return getHigh('reaction'); }

        function render() {
            var high = best();
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + 'ms</span>' : '';
            if (state === 'start') {
                arena.innerHTML =
                    '<div class="mg-game-shell">' +
                    '<div class="mg-game-header"><h4>⚡ Reaction Test</h4>' + highStr + '</div>' +
                    '<div class="mg-instructions">When the pad turns <span style="color:#4ecdc4">green</span>, click it as fast as you can.<br>A random delay prevents anticipation.</div>' +
                    diffBar('rDiff', [{key:'easy',label:'Easy'},{key:'normal',label:'Normal'},{key:'hard',label:'Hard'}], difficulty) +
                    '<div class="mg-reaction"><div class="mg-pad mg-pad--idle" id="mgPad" tabindex="0" role="button" aria-label="Start reaction test"><div class="mg-pad-text">Click to Start</div></div></div>' +
                    '<div class="mg-results" id="mgResults"></div></div>';
            } else if (state === 'waiting') {
                arena.innerHTML =
                    '<div class="mg-game-shell">' +
                    '<div class="mg-game-header"><h4>⚡ Reaction Test</h4>' + highStr + '</div>' +
                    '<div class="mg-reaction"><div class="mg-pad mg-pad--wait" id="mgPad" tabindex="0" role="button" aria-label="Wait for green"><div class="mg-pad-text">Wait…</div></div></div>' +
                    '<div class="mg-results" id="mgResults">' + resultsHTML() + '</div></div>';
            } else if (state === 'ready') {
                arena.innerHTML =
                    '<div class="mg-game-shell">' +
                    '<div class="mg-game-header"><h4>⚡ Reaction Test</h4>' + highStr + '</div>' +
                    '<div class="mg-reaction"><div class="mg-pad mg-pad--go" id="mgPad" tabindex="0" role="button" aria-label="Click now!"><div class="mg-pad-text">CLICK!</div></div></div>' +
                    '<div class="mg-results" id="mgResults">' + resultsHTML() + '</div></div>';
            } else if (state === 'tooearly') {
                arena.innerHTML =
                    '<div class="mg-game-shell">' +
                    '<div class="mg-game-header"><h4>⚡ Reaction Test</h4>' + highStr + '</div>' +
                    '<div class="mg-reaction"><div class="mg-pad mg-pad--tooearly" id="mgPad" tabindex="0" role="button" aria-label="Too early, try again"><div class="mg-pad-text">⚠ Too Early!<br><small>Click to retry</small></div></div></div>' +
                    '<div class="mg-results" id="mgResults">' + resultsHTML() + '</div></div>';
            } else if (state === 'done') {
                var last = results[results.length - 1];
                var isRecord = setHigh('reaction', last);
                arena.innerHTML =
                    '<div class="mg-game-shell">' +
                    '<div class="mg-game-header"><h4>⚡ Reaction Test</h4>' + (isRecord ? '<span class="mg-new-record">🏆 New Record!</span>' : highStr) + '</div>' +
                    '<div class="mg-reaction"><div class="mg-pad mg-pad--result" id="mgPad" tabindex="0" role="button" aria-label="Try again">' +
                    '<div class="mg-pad-text"><span class="mg-ms">' + last + ' ms</span>' +
                    ratingLabel(last) +
                    '<small>Click to try again</small></div></div></div>' +
                    '<div class="mg-results" id="mgResults">' + resultsHTML() + '</div></div>';
            }
            bind();
        }

        function ratingLabel(ms) {
            if (ms < 180) return '<div class="mg-rating mg-rating--excellent">⚡ Superhuman!</div>';
            if (ms < 250) return '<div class="mg-rating mg-rating--great">🔥 Great!</div>';
            if (ms < 350) return '<div class="mg-rating mg-rating--good">👍 Good</div>';
            if (ms < 500) return '<div class="mg-rating mg-rating--ok">😐 Average</div>';
            return '<div class="mg-rating mg-rating--slow">🐢 Slow</div>';
        }

        function resultsHTML() {
            if (!results.length) return '';
            var avg = avgMs(results);
            return '<div class="mg-score-row">' +
                results.map(function(r,i){ return '<span class="mg-score-chip">#' + (i+1) + ': ' + r + 'ms</span>'; }).join('') +
                (results.length > 1 ? '<span class="mg-score-chip mg-score-avg">Avg: ' + avg + 'ms</span>' : '') +
                '</div>';
        }

        function bind() {
            var pad = document.getElementById('mgPad');
            if (!pad) return;
            pad.addEventListener('click', handleClick);
            pad.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') handleClick(); });
            /* Difficulty change */
            var diffDiv = document.getElementById('rDiff');
            if (diffDiv) {
                diffDiv.addEventListener('click', function(e) {
                    var btn = e.target.closest('.mg-diff-btn');
                    if (!btn) return;
                    difficulty = btn.dataset.diff;
                    diffDiv.querySelectorAll('.mg-diff-btn').forEach(function(b) {
                        b.classList.toggle('mg-diff-btn--active', b.dataset.diff === difficulty);
                    });
                });
            }
        }

        function handleClick() {
            if (state === 'start' || state === 'done' || state === 'tooearly') {
                startWaiting();
            } else if (state === 'waiting') {
                clearTimeout(timer);
                state = 'tooearly';
                render();
            } else if (state === 'ready') {
                var ms = Date.now() - startTime;
                results.push(ms);
                if (results.length > RESULTS_MAX) results.shift();
                state = 'done';
                render();
            }
        }

        function startWaiting() {
            state = 'waiting';
            render();
            var range = DELAYS[difficulty] || DELAYS.normal;
            var delay = range[0] + Math.random() * (range[1] - range[0]);
            timer = setTimeout(function() {
                state = 'ready';
                startTime = Date.now();
                render();
            }, delay);
        }

        return { init: function() { state = 'start'; render(); }, reset: function() { state = 'start'; results = []; clearTimeout(timer); render(); }, destroy: function() { clearTimeout(timer); timer = null; } };
    })();

    /* ── TYPING SPEED TEST ── */
    var typingGame = (function() {
        var SENTENCES = {
            easy: [
                'Type fast to win.',
                'The cat sat on the mat.',
                'Hello world, how are you.',
                'Speed is the name of the game.',
            ],
            normal: [
                'The quick brown fox jumps over the lazy dog.',
                'Computer engineering is the backbone of modern technology.',
                'Design, data, and automation define the future of work.',
                'Precision and creativity are two sides of the same coin.',
                'Every line of code is a step toward solving a real problem.',
            ],
            hard: [
                'Parallelism in distributed systems requires careful synchronization of shared mutable state.',
                'The asymptotic complexity of quicksort is O(n log n) on average, O(n²) in the worst case.',
                'Functional programming paradigms emphasize immutability, pure functions, and composability.',
                'Cryptographic hash functions are deterministic, collision-resistant, and one-directional.',
            ],
        };
        var sentence = '', started = false, startTime = 0, finished = false, difficulty = 'normal';

        function pickSentence() {
            var pool = SENTENCES[difficulty] || SENTENCES.normal;
            sentence = pool[Math.floor(Math.random() * pool.length)];
        }

        function render() {
            pickSentence();
            finished = false; started = false;
            var high = getHigh('typing_wpm');
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + ' WPM</span>' : '';
            arena.innerHTML =
                '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>⌨️ Typing Speed</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Type the sentence below exactly as shown. Timer starts on your first keystroke.</div>' +
                diffBar('tDiff', [{key:'easy',label:'Easy'},{key:'normal',label:'Normal'},{key:'hard',label:'Hard'}], difficulty) +
                '<div class="mg-typing">' +
                '<div class="mg-typing-target" id="mgTypingTarget" aria-live="polite">' + highlightTyping('') + '</div>' +
                '<input class="mg-typing-input" id="mgTypingInput" type="text" placeholder="Start typing here…" autocomplete="off" autocorrect="off" spellcheck="false" aria-label="Typing input">' +
                '<div class="mg-typing-meta"><span class="mg-typing-chars" id="mgTypingChars">0/' + sentence.length + ' chars</span><span class="mg-typing-timer" id="mgTypingTimer" style="display:none">⏱ 0s</span></div>' +
                '<div class="mg-typing-status" id="mgTypingStatus"></div>' +
                '</div></div>';
            var inp = document.getElementById('mgTypingInput');
            var timerInterval = null;
            if (inp) {
                inp.addEventListener('input', function() {
                    if (finished) return;
                    if (!started) {
                        started = true; startTime = Date.now();
                        var timerEl = document.getElementById('mgTypingTimer');
                        if (timerEl) timerEl.style.display = '';
                        timerInterval = setInterval(function() {
                            var el = document.getElementById('mgTypingTimer');
                            if (el) el.textContent = '⏱ ' + ((Date.now() - startTime) / 1000).toFixed(1) + 's';
                        }, 100);
                    }
                    var val = inp.value;
                    var charEl = document.getElementById('mgTypingChars');
                    if (charEl) charEl.textContent = val.length + '/' + sentence.length + ' chars';
                    document.getElementById('mgTypingTarget').innerHTML = highlightTyping(val);
                    if (val === sentence) {
                        finished = true;
                        clearInterval(timerInterval);
                        var elapsed  = ((Date.now() - startTime) / 1000).toFixed(2);
                        var words    = sentence.trim().split(/\s+/).length;
                        var wpm      = Math.round((words / parseFloat(elapsed)) * 60);
                        var accuracy = calcAccuracy(val, sentence);
                        var isRecord = setHigh('typing_wpm', wpm);
                        inp.disabled = true;
                        document.getElementById('mgTypingStatus').innerHTML =
                            '<div class="mg-result-summary">' +
                            '<div class="mg-result-stat"><span class="mg-result-big">' + wpm + '</span><span class="mg-result-unit">WPM</span></div>' +
                            '<div class="mg-result-stat"><span class="mg-result-big">' + elapsed + 's</span><span class="mg-result-unit">Time</span></div>' +
                            '<div class="mg-result-stat"><span class="mg-result-big">' + accuracy + '%</span><span class="mg-result-unit">Accuracy</span></div>' +
                            '</div>' +
                            (isRecord ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Personal Best!</div>' : '') +
                            '<div style="text-align:center"><button class="cta-button primary" onclick="typingGame_reset()" style="padding:8px 24px;font-size:0.85rem">Try Again</button></div>';
                    }
                });
                inp.focus();
                /* Difficulty */
                var diffDiv = document.getElementById('tDiff');
                if (diffDiv) {
                    diffDiv.addEventListener('click', function(e) {
                        var btn = e.target.closest('.mg-diff-btn');
                        if (!btn) return;
                        difficulty = btn.dataset.diff;
                        render();
                    });
                }
            }
        }

        function highlightTyping(val) {
            return sentence.split('').map(function(ch, i) {
                if (i >= val.length) return '<span class="mg-t-pending">' + esc(ch) + '</span>';
                if (val[i] === ch)   return '<span class="mg-t-correct">' + esc(ch) + '</span>';
                return '<span class="mg-t-wrong">' + esc(ch) + '</span>';
            }).join('');
        }

        function calcAccuracy(typed, target) {
            if (!typed.length) return 100;
            var correct = 0;
            for (var i = 0; i < Math.min(typed.length, target.length); i++) {
                if (typed[i] === target[i]) correct++;
            }
            return Math.round((correct / target.length) * 100);
        }

        window.typingGame_reset = render;
        return { init: render, reset: render };
    })();

    /* ── CLICK SPEED TEST ── */
    var clickGame = (function() {
        var DURATIONS = { easy: 10, normal: 5, hard: 3 };
        var difficulty = 'normal';
        var count = 0, running = false, timeLeft, timerInterval = null;

        function getDuration() { return DURATIONS[difficulty] || 5; }

        function render() {
            var dur = getDuration();
            count = 0; running = false; timeLeft = dur;
            clearInterval(timerInterval);
            var high = getHigh('click_count');
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + ' clicks</span>' : '';
            arena.innerHTML =
                '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>🖱 Click Speed</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Click the button as many times as possible in ' + dur + ' seconds. Timer starts on your first click.</div>' +
                diffBar('cDiff', [{key:'easy',label:'10s'},{key:'normal',label:'5s'},{key:'hard',label:'3s'}], difficulty) +
                '<div class="mg-click">' +
                '<div class="mg-click-info">' +
                '<span class="mg-click-count" id="mgClickCount">0</span>' +
                '<span class="mg-click-label">clicks</span>' +
                '<span class="mg-click-timer" id="mgClickTimer">' + dur + 's</span>' +
                '</div>' +
                '<button class="mg-click-btn" id="mgClickBtn" aria-label="Click here fast">Click Me!</button>' +
                '<div class="mg-click-status" id="mgClickStatus"></div>' +
                '</div></div>';
            var btn = document.getElementById('mgClickBtn');
            if (!btn) return;
            btn.addEventListener('click', function() {
                if (!running) {
                    running = true;
                    timerInterval = setInterval(function() {
                        timeLeft--;
                        var timerEl = document.getElementById('mgClickTimer');
                        if (timerEl) timerEl.textContent = timeLeft + 's';
                        if (timerEl && timeLeft <= 3) timerEl.style.color = 'var(--accent1)';
                        if (timeLeft <= 0) {
                            clearInterval(timerInterval);
                            running = false;
                            btn.disabled = true;
                            var dur2 = getDuration();
                            var cps  = (count / dur2).toFixed(1);
                            var isRecord = setHigh('click_count', count);
                            var status = document.getElementById('mgClickStatus');
                            if (status) status.innerHTML =
                                '<div class="mg-result-summary">' +
                                '<div class="mg-result-stat"><span class="mg-result-big">' + count + '</span><span class="mg-result-unit">Clicks</span></div>' +
                                '<div class="mg-result-stat"><span class="mg-result-big">' + cps + '</span><span class="mg-result-unit">CPS</span></div>' +
                                '</div>' +
                                (isRecord ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Record!</div>' : '') +
                                '<div style="text-align:center"><button class="cta-button primary" onclick="clickGame_reset()" style="padding:8px 24px;font-size:0.85rem">Play Again</button></div>';
                        }
                    }, 1000);
                }
                if (running) {
                    count++;
                    var el = document.getElementById('mgClickCount');
                    if (el) el.textContent = count;
                }
            });
            /* Difficulty */
            var diffDiv = document.getElementById('cDiff');
            if (diffDiv) {
                diffDiv.addEventListener('click', function(e) {
                    var b = e.target.closest('.mg-diff-btn');
                    if (!b) return;
                    difficulty = b.dataset.diff;
                    render();
                });
            }
        }

        window.clickGame_reset = render;
        return { init: render, reset: render, destroy: function() { clearInterval(timerInterval); running = false; } };
    })();

    /* ── MEMORY CARD GAME ── */
    var memoryGame = (function() {
        var GRID = { easy: { pairs: 8, cols: 4 }, normal: { pairs: 12, cols: 4 }, hard: { pairs: 18, cols: 6 } };
        var EMOJIS = ['🎯','🔥','⚡','🌟','🎮','🎵','🎨','🏆','🚀','🌈','💎','🦋','🌺','🎪','🎭','🎲','🍀','🌊'];
        var difficulty = 'normal';
        var cards = [], flipped = [], matched = 0, moves = 0, running = false, startTime = 0;
        var flipLock = false;

        function shuffle(arr) {
            var a = arr.slice();
            for (var i = a.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var t = a[i]; a[i] = a[j]; a[j] = t;
            }
            return a;
        }

        function render() {
            var g = GRID[difficulty] || GRID.normal;
            matched = 0; moves = 0; flipped = []; running = false; flipLock = false; startTime = 0;
            var pairs = EMOJIS.slice(0, g.pairs);
            cards = shuffle(pairs.concat(pairs));
            var high = getHigh('memory_' + difficulty);
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + ' moves</span>' : '';
            arena.innerHTML =
                '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>🃏 Memory Cards</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Flip cards to find all matching pairs. Fewer moves = better score.</div>' +
                diffBar('mDiff', [{key:'easy',label:'Easy'},{key:'normal',label:'Normal'},{key:'hard',label:'Hard'}], difficulty) +
                '<div class="mg-memory-info"><span id="mgMemMoves">Moves: 0</span><span id="mgMemMatched">Matched: 0/' + g.pairs + '</span></div>' +
                '<div class="mg-memory-grid mg-memory-cols-' + g.cols + '" id="mgMemGrid">' +
                cards.map(function(emoji, idx) {
                    return '<div class="mg-memory-card" data-idx="' + idx + '" tabindex="0" role="button" aria-label="Memory card">' +
                        '<div class="mg-memory-card-inner">' +
                        '<div class="mg-memory-front">?</div>' +
                        '<div class="mg-memory-back">' + emoji + '</div>' +
                        '</div></div>';
                }).join('') +
                '</div>' +
                '<div id="mgMemStatus"></div></div>';
            bindMemory();
        }

        function bindMemory() {
            var grid = document.getElementById('mgMemGrid');
            if (!grid) return;
            grid.addEventListener('click', function(e) {
                var card = e.target.closest('.mg-memory-card');
                if (!card || flipLock) return;
                var idx = parseInt(card.dataset.idx);
                if (isNaN(idx)) return;
                if (flipped.includes(idx) || card.classList.contains('mg-memory-matched')) return;
                if (flipped.length >= 2) return;
                if (!running) { running = true; startTime = Date.now(); }
                card.classList.add('mg-memory-flipped');
                flipped.push(idx);
                if (flipped.length === 2) {
                    moves++;
                    var moEl = document.getElementById('mgMemMoves');
                    if (moEl) moEl.textContent = 'Moves: ' + moves;
                    var a = flipped[0], b = flipped[1];
                    if (cards[a] === cards[b]) {
                        matched++;
                        var maEl = document.getElementById('mgMemMatched');
                        var g2 = GRID[difficulty] || GRID.normal;
                        if (maEl) maEl.textContent = 'Matched: ' + matched + '/' + g2.pairs;
                        grid.querySelectorAll('.mg-memory-card').forEach(function(c) {
                            if (parseInt(c.dataset.idx) === a || parseInt(c.dataset.idx) === b)
                                c.classList.add('mg-memory-matched');
                        });
                        flipped = [];
                        if (matched === g2.pairs) {
                            var elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                            var isRec = setHigh('memory_' + difficulty, moves);
                            document.getElementById('mgMemStatus').innerHTML =
                                '<div class="mg-result-summary" style="margin-top:16px">' +
                                '<div class="mg-result-stat"><span class="mg-result-big">' + moves + '</span><span class="mg-result-unit">Moves</span></div>' +
                                '<div class="mg-result-stat"><span class="mg-result-big">' + elapsed + 's</span><span class="mg-result-unit">Time</span></div>' +
                                '</div>' +
                                (isRec ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Best!</div>' : '') +
                                '<div style="text-align:center"><button class="cta-button primary" onclick="memoryGame_reset()" style="padding:8px 24px;font-size:0.85rem">Play Again</button></div>';
                        }
                    } else {
                        flipLock = true;
                        setTimeout(function() {
                            grid.querySelectorAll('.mg-memory-card').forEach(function(c) {
                                if (parseInt(c.dataset.idx) === a || parseInt(c.dataset.idx) === b)
                                    c.classList.remove('mg-memory-flipped');
                            });
                            flipped = [];
                            flipLock = false;
                        }, 900);
                    }
                }
            });
            var diffDiv = document.getElementById('mDiff');
            if (diffDiv) {
                diffDiv.addEventListener('click', function(e) {
                    var btn = e.target.closest('.mg-diff-btn');
                    if (!btn) return;
                    difficulty = btn.dataset.diff;
                    render();
                });
            }
        }

        window.memoryGame_reset = render;
        return { init: render, reset: render };
    })();

    /* ── AIM TRAINER GAME ── */
    var aimGame = (function() {
        var DIFF_SETTINGS = {
            easy:   { radius: 38, duration: 2500, total: 15 },
            normal: { radius: 26, duration: 1600, total: 20 },
            hard:   { radius: 16, duration: 1000, total: 25 },
        };
        var difficulty = 'normal';
        var score = 0, misses = 0, remaining = 0;
        var targetTimer = null, countdownInterval = null;
        var timeLeft = 30, running = false;

        function render() {
            score = 0; misses = 0; running = false;
            clearTimeout(targetTimer); clearInterval(countdownInterval);
            var d = DIFF_SETTINGS[difficulty] || DIFF_SETTINGS.normal;
            remaining = d.total;
            timeLeft = 30;
            var high = getHigh('aim_score');
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + ' hits</span>' : '';
            arena.innerHTML =
                '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>🎯 Aim Trainer</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Click targets as fast as you can. ' + d.total + ' targets — hit them all!</div>' +
                diffBar('aDiff', [{key:'easy',label:'Easy'},{key:'normal',label:'Normal'},{key:'hard',label:'Hard'}], difficulty) +
                '<div class="mg-aim-info"><span id="mgAimScore">Hits: 0</span><span id="mgAimMiss">Miss: 0</span><span class="mg-click-timer" id="mgAimTimer">30s</span></div>' +
                '<div class="mg-aim-arena" id="mgAimArena">' +
                '<div class="mg-aim-start" id="mgAimStart"><button class="cta-button primary" onclick="aimGame_start()" style="padding:10px 32px">Start!</button></div>' +
                '</div>' +
                '<div id="mgAimStatus"></div></div>';
            var diffDiv = document.getElementById('aDiff');
            if (diffDiv) {
                diffDiv.addEventListener('click', function(e) {
                    var btn = e.target.closest('.mg-diff-btn');
                    if (!btn) return;
                    difficulty = btn.dataset.diff;
                    render();
                });
            }
        }

        window.aimGame_start = function() {
            if (running) return;
            running = true;
            score = 0; misses = 0;
            var d = DIFF_SETTINGS[difficulty] || DIFF_SETTINGS.normal;
            remaining = d.total;
            timeLeft = 30;
            var startEl = document.getElementById('mgAimStart');
            if (startEl) startEl.style.display = 'none';
            countdownInterval = setInterval(function() {
                timeLeft--;
                var el = document.getElementById('mgAimTimer');
                if (el) {
                    el.textContent = timeLeft + 's';
                    if (timeLeft <= 5) el.style.color = 'var(--accent1)';
                }
                if (timeLeft <= 0) endGame();
            }, 1000);
            spawnTarget();
        };

        function spawnTarget() {
            if (!running) return;
            var arenaEl = document.getElementById('mgAimArena');
            if (!arenaEl) return;
            var old = arenaEl.querySelector('.mg-aim-target');
            if (old) { misses++; updateAimDisplay(); old.remove(); }
            var d = DIFF_SETTINGS[difficulty] || DIFF_SETTINGS.normal;
            var r = d.radius;
            var maxX = Math.max(0, arenaEl.clientWidth  - r * 2 - 4);
            var maxY = Math.max(0, arenaEl.clientHeight - r * 2 - 4);
            var x = Math.floor(Math.random() * maxX);
            var y = Math.floor(Math.random() * maxY);
            var target = document.createElement('div');
            target.className = 'mg-aim-target';
            target.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + (r * 2) + 'px;height:' + (r * 2) + 'px;';
            target.setAttribute('aria-label', 'Aim target');
            target.addEventListener('click', function() {
                if (!running) return;
                score++; remaining--;
                target.remove();
                updateAimDisplay();
                clearTimeout(targetTimer);
                if (remaining <= 0) { endGame(); } else { spawnTarget(); }
            });
            arenaEl.appendChild(target);
            targetTimer = setTimeout(function() {
                if (!running) return;
                if (document.contains(target)) { misses++; target.remove(); updateAimDisplay(); }
                if (remaining > 0) spawnTarget();
            }, d.duration);
        }

        function updateAimDisplay() {
            var sEl = document.getElementById('mgAimScore');
            var mEl = document.getElementById('mgAimMiss');
            if (sEl) sEl.textContent = 'Hits: ' + score;
            if (mEl) mEl.textContent = 'Miss: ' + misses;
        }

        function endGame() {
            running = false;
            clearInterval(countdownInterval); clearTimeout(targetTimer);
            var arenaEl = document.getElementById('mgAimArena');
            if (arenaEl) arenaEl.querySelectorAll('.mg-aim-target').forEach(function(t) { t.remove(); });
            var total   = score + misses;
            var accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
            var isRec = setHigh('aim_score', score);
            var statusEl = document.getElementById('mgAimStatus');
            if (statusEl) statusEl.innerHTML =
                '<div class="mg-result-summary" style="margin-top:16px">' +
                '<div class="mg-result-stat"><span class="mg-result-big">' + score + '</span><span class="mg-result-unit">Hits</span></div>' +
                '<div class="mg-result-stat"><span class="mg-result-big">' + misses + '</span><span class="mg-result-unit">Misses</span></div>' +
                '<div class="mg-result-stat"><span class="mg-result-big">' + accuracy + '%</span><span class="mg-result-unit">Accuracy</span></div>' +
                '</div>' +
                (isRec ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Record!</div>' : '') +
                '<div style="text-align:center"><button class="cta-button primary" onclick="aimGame_reset()" style="padding:8px 24px;font-size:0.85rem">Play Again</button></div>';
        }

        window.aimGame_reset = render;
        return { init: render, reset: render, destroy: function() { clearTimeout(targetTimer); clearInterval(countdownInterval); running = false; targetTimer = null; countdownInterval = null; } };
    })();

    /* ── Logic Puzzle Game ── */
    var logicGame = (function() {
        var PUZZLES = [
            { q: 'What comes next: 2, 4, 8, 16, ?', a: '32', hint: 'Each number doubles' },
            { q: 'What comes next: 1, 1, 2, 3, 5, 8, ?', a: '13', hint: 'Sum of the two previous' },
            { q: 'What comes next: 3, 6, 9, 12, ?', a: '15', hint: 'Add 3 each time' },
            { q: 'What comes next: 1, 4, 9, 16, 25, ?', a: '36', hint: 'Perfect squares' },
            { q: 'What comes next: 100, 50, 25, 12.5, ?', a: '6.25', hint: 'Divide by 2 each time' },
            { q: 'What comes next: 1, 3, 7, 15, 31, ?', a: '63', hint: '2n+1 pattern' },
            { q: 'What comes next: 2, 3, 5, 7, 11, ?', a: '13', hint: 'Prime numbers' },
            { q: 'What comes next: 0, 1, 4, 9, 16, ?', a: '25', hint: 'n squared (0-based)' },
        ];
        var DIFF_TOTALS = { easy: 3, normal: 5, hard: 8 };
        var difficulty = 'normal';
        var idx = 0, correct = 0, count = 0, total = 5;

        function render() {
            total = DIFF_TOTALS[difficulty] || 5;
            idx = Math.floor(Math.random() * PUZZLES.length);
            correct = 0;
            count = 0;
            var high = getHigh('logic_score');
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + '/' + total + '</span>' : '';
            arena.innerHTML =
                '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>🧩 Logic Puzzles</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Solve each number sequence. Type your answer and hit Submit.</div>' +
                diffBar('lDiff', [{key:'easy',label:'Easy (3)'},{key:'normal',label:'Normal (5)'},{key:'hard',label:'Hard (8)'}], difficulty) +
                '<div class="mg-logic-progress" id="mgLProgress">Question 1/' + total + '</div>' +
                '<div class="mg-logic-question" id="mgLQ"></div>' +
                '<input class="mg-logic-input" id="mgLAns" type="text" placeholder="Your answer…" autocomplete="off">' +
                '<button class="cta-button primary" onclick="logicSubmit()" style="margin-top:8px;padding:8px 24px">Submit</button>' +
                '<div class="mg-logic-feedback" id="mgLFb" aria-live="polite" style="min-height:24px;margin-top:8px"></div>' +
                '</div>';
            loadPuzzle();
            /* Difficulty listener */
            var diffDiv = document.getElementById('lDiff');
            if (diffDiv) {
                diffDiv.addEventListener('click', function(e) {
                    var btn = e.target.closest('.mg-diff-btn');
                    if (!btn) return;
                    difficulty = btn.dataset.diff;
                    render();
                });
            }
            /* Enter key submits */
            var inp = document.getElementById('mgLAns');
            if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') window.logicSubmit(); });
        }

        function loadPuzzle() {
            var p = PUZZLES[idx % PUZZLES.length];
            var qEl = document.getElementById('mgLQ');
            var aEl = document.getElementById('mgLAns');
            var prog = document.getElementById('mgLProgress');
            if (qEl) qEl.textContent = p.q;
            if (aEl) { aEl.value = ''; aEl.focus(); }
            if (prog) prog.textContent = 'Question ' + (count + 1) + '/' + total;
        }

        window.logicSubmit = function() {
            var aEl = document.getElementById('mgLAns');
            var fb  = document.getElementById('mgLFb');
            if (!aEl || !fb) return;
            var p   = PUZZLES[idx % PUZZLES.length];
            var ans = aEl.value.trim().replace(/\s/g,'');
            if (ans.toLowerCase() === p.a.toLowerCase()) {
                correct++;
                count++;
                fb.innerHTML = '<span style="color:var(--accent2)">✓ Correct!</span>';
            } else {
                count++;
                fb.innerHTML = '<span style="color:var(--accent1)">✗ Hint: ' + esc(p.hint) + '</span>';
            }
            if (count >= total) {
                var isRec = setHigh('logic_score', correct);
                arena.innerHTML = '<div class="mg-game-shell"><div class="mg-result-summary">' +
                    '<div class="mg-result-stat"><span class="mg-result-big">' + correct + '/' + total + '</span><span class="mg-result-unit">Correct</span></div>' +
                    '</div>' +
                    (isRec ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Record!</div>' : '') +
                    '<div style="text-align:center"><button class="cta-button primary" onclick="logicGame_reset()" style="padding:8px 24px;font-size:0.85rem">Play Again</button></div></div>';
            } else {
                idx = (idx + 1) % PUZZLES.length;
                setTimeout(loadPuzzle, 900);
            }
        };

        window.logicGame_reset = function() { render(); };
        return { init: render, reset: render };
    })();

    /* ── Tech Quiz Game ── */
    var quizGame = (function() {
        var QS = [
            { q: 'What does CSS stand for?', a: 1, opts: ['Computer Style Sheets','Cascading Style Sheets','Colorful Style Sheets','Coded Style Sheets'] },
            { q: 'Which language runs in the browser natively?', a: 2, opts: ['Python','Java','JavaScript','C++'] },
            { q: 'What does HTTP stand for?', a: 0, opts: ['HyperText Transfer Protocol','High Text Transfer Protocol','HyperText Transmission Process','Hyper Transfer Text Protocol'] },
            { q: 'What does SQL stand for?', a: 3, opts: ['Simple Query List','Structured Query List','Simple Query Language','Structured Query Language'] },
            { q: 'What is the time complexity of binary search?', a: 1, opts: ['O(n)','O(log n)','O(n²)','O(1)'] },
            { q: 'Which HTML tag is used for a hyperlink?', a: 2, opts: ['<link>','<url>','<a>','<href>'] },
            { q: 'What does API stand for?', a: 0, opts: ['Application Programming Interface','App Processing Interface','Automated Programming Interface','Application Process Integration'] },
            { q: 'Which protocol secures HTTPS?', a: 3, opts: ['FTP','SSH','HTTP','TLS/SSL'] },
            { q: 'What is a CDN?', a: 1, opts: ['Code Delivery Network','Content Delivery Network','Central Data Node','Coded Data Network'] },
            { q: 'What does DOM stand for?', a: 0, opts: ['Document Object Model','Data Object Module','Document Order Map','Dynamic Object Module'] },
        ];
        var DIFF_TOTALS = { easy: 3, normal: 5, hard: 10 };
        var difficulty = 'normal';
        var qi = 0, correct = 0, total = 5, shuffled = [];

        function render() {
            total = DIFF_TOTALS[difficulty] || 5;
            shuffled = QS.slice().sort(function() { return Math.random() - 0.5; }).slice(0, total);
            qi = 0; correct = 0;
            showQ();
        }

        function showQ() {
            var q = shuffled[qi];
            var high = getHigh('quiz_score');
            var highStr = high !== null ? '<span class="mg-best-label">Best: ' + high + '/' + total + '</span>' : '';
            arena.innerHTML = '<div class="mg-game-shell">' +
                '<div class="mg-game-header"><h4>💡 Tech Quiz</h4>' + highStr + '</div>' +
                '<div class="mg-instructions">Answer the tech question. Select the correct option.</div>' +
                diffBar('qDiff', [{key:'easy',label:'Easy (3)'},{key:'normal',label:'Normal (5)'},{key:'hard',label:'All (10)'}], difficulty) +
                '<div class="mg-quiz-progress">Question ' + (qi+1) + '/' + total + '</div>' +
                '<div class="mg-quiz-q">' + esc(q.q) + '</div>' +
                '<div class="mg-quiz-opts">' +
                q.opts.map(function(o, i) {
                    return '<button class="mg-quiz-opt" onclick="quizAnswer(' + i + ',' + q.a + ')">' + esc(o) + '</button>';
                }).join('') +
                '</div>' +
                '<div class="mg-quiz-fb" id="mgQFb" aria-live="polite" style="min-height:24px"></div>' +
                '</div>';
            /* Difficulty listener (only bind once — first question per render) */
            if (qi === 0) {
                var diffDiv = document.getElementById('qDiff');
                if (diffDiv) {
                    diffDiv.addEventListener('click', function(e) {
                        var btn = e.target.closest('.mg-diff-btn');
                        if (!btn) return;
                        difficulty = btn.dataset.diff;
                        render();
                    });
                }
            }
        }

        window.quizAnswer = function(chosen, correct_idx) {
            document.querySelectorAll('.mg-quiz-opt').forEach(function(b, i) {
                b.disabled = true;
                if (i === correct_idx) b.classList.add('mg-quiz-correct');
                else if (i === chosen)  b.classList.add('mg-quiz-wrong');
            });
            var fb = document.getElementById('mgQFb');
            if (chosen === correct_idx) {
                correct++;
                if (fb) fb.innerHTML = '<span style="color:var(--accent2)">✓ Correct!</span>';
            } else {
                if (fb) fb.innerHTML = '<span style="color:var(--accent1)">✗ The correct answer was: ' + esc(shuffled[qi].opts[correct_idx]) + '</span>';
            }
            qi++;
            if (qi >= total) {
                var isRec = setHigh('quiz_score', correct);
                setTimeout(function() {
                    arena.innerHTML = '<div class="mg-game-shell"><div class="mg-result-summary">' +
                        '<div class="mg-result-stat"><span class="mg-result-big">' + correct + '/' + total + '</span><span class="mg-result-unit">Correct</span></div>' +
                        '</div>' +
                        (isRec ? '<div class="mg-new-record" style="text-align:center;margin-bottom:12px">🏆 New Record!</div>' : '') +
                        '<div style="text-align:center"><button class="cta-button primary" onclick="quizGame_reset()" style="padding:8px 24px;font-size:0.85rem">Play Again</button></div></div>';
                }, 1200);
            } else {
                setTimeout(showQ, 1200);
            }
        };

        window.quizGame_reset = function() { render(); };
        return { init: render, reset: render };
    })();

    /* ── Tab switching ── */
    var games = { reaction: reactionGame, typing: typingGame, click: clickGame, memory: memoryGame, aim: aimGame, logic: logicGame, quiz: quizGame };

    function switchGame(name) {
        if (!games[name]) return;
        /* Destroy current game first — clears timers, prevents stale callbacks
           (e.g. reactionGame timer firing and overwriting arena mid-another-game) */
        if (activeGame && games[activeGame] && typeof games[activeGame].destroy === 'function') {
            games[activeGame].destroy();
        }
        activeGame = name;
        tabs.querySelectorAll('.minigame-tab').forEach(function(t) {
            var active = t.dataset.game === name;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        games[name].init();
    }

    tabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.minigame-tab');
        if (tab) switchGame(tab.dataset.game);
    });

    /* Only init when section becomes visible (IntersectionObserver lazy load) */
    var mgSection = document.getElementById('minigame');
    if (mgSection) {
        var mgInited = false;
        var mgObs = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting && !mgInited) {
                mgInited = true;
                switchGame('reaction');
                mgObs.disconnect();
            }
        }, { threshold: 0.1 });
        mgObs.observe(mgSection);
    }
})();

/* ── P. EASTER EGG — KONAMI CODE ─────────────────────────── */
(function initKonami() {
    const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;

    document.addEventListener('keydown', e => {
        if (e.key === SEQ[pos]) {
            pos++;
            if (pos === SEQ.length) {
                pos = 0;
                triggerKonami();
            }
        } else {
            pos = e.key === SEQ[0] ? 1 : 0;
        }
    });

    function triggerKonami() {
        showToast('🎉 You found the Easter egg! Nice moves 🕹️', 'success');
        /* burst particles from center */
        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            const hue = Math.random() * 360;
            const angle = Math.random() * Math.PI * 2;
            const dist  = Math.random() * 250 + 100;
            p.style.cssText = `
                position:fixed;
                left:50%; top:50%;
                width:8px; height:8px;
                border-radius:50%;
                background:hsl(${hue},90%,60%);
                pointer-events:none;
                z-index:99998;
                transition: transform 1s ease-out, opacity 1s ease-out;
                transform: translate(-50%,-50%);
                opacity: 1;
            `;
            document.body.appendChild(p);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    p.style.transform = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;
                    p.style.opacity   = '0';
                });
            });
            setTimeout(() => p.remove(), 1100);
        }
    }
})();
