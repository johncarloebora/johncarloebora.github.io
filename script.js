/* ============================================================
   CARLO PORTFOLIO — SCRIPT
   ============================================================ */
'use strict';

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
    if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768) return;

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
        if (window.innerWidth <= 768) cancelAnimationFrame(rafId);
    });
})();

/* ── C.2 HERO PHOTO — AUTO-DETECT FROM /profile/ ─────────── */
(function initProfilePhoto() {
    const avatarFrame = document.getElementById('avatarFrame');
    const heroPhoto   = document.getElementById('heroPhoto');
    if (!avatarFrame || !heroPhoto) return;

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
    /* Defer margin-left transition until after first paint to prevent
       layout shift when browser restores scroll position on reload */
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

    allLinks.forEach(link => link.addEventListener('click', () => {
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
            document.body.style.marginLeft = '';
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

        /* subtle hero parallax — shapes only */
        if (y < window.innerHeight) {
            if (heroShapes) heroShapes.style.transform = `translateY(${y * 0.35}px)`;
        }
    }, { passive: true });

    /* active link via IntersectionObserver */
    const sections = document.querySelectorAll('section, header');

    /* Track which sections are currently intersecting */
    const visibleSections = new Set();
    let navInitDone = false;

    function updateActiveNav() {
        /* At the very top of the page, always activate Home */
        if (window.scrollY < window.innerHeight * 0.25) {
            allLinks.forEach(l => l.classList.remove('active'));
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
            allLinks.forEach(l => l.classList.remove('active'));
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

    /* smooth scroll offset */
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
        header.addEventListener('click', () => {
            const card = header.closest('.skill-card');
            const wasExpanded = card.classList.contains('expanded');
            card.classList.toggle('expanded');
            /* Trigger proficiency bar animation when expanding */
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
        header.addEventListener('click', () => {
            header.closest('.about-card').classList.toggle('about-expanded');
        });
    });
});

/* ── G.6 TIMELINE DROPDOWN TOGGLE ───────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.timeline-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.timeline-item');
            item.classList.toggle('tl-open');
        });
    });

    /* Also toggle when clicking the marker */
    document.querySelectorAll('.timeline-marker').forEach(marker => {
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

    const lines = [
        'Computer Engineer',
        'Insurance Operations Analyst',
        'Creative Visual Designer',
        'VBA & Automation Specialist',
        'Full-Stack Problem Solver'
    ];

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
    if (window.matchMedia('(hover: none)').matches || window.innerWidth <= 768) return;

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

    /* ── Gallery auto-scan ───────────────────────────────────
       Strategy (tried in order):
       1. GitHub Contents API  — works on GitHub Pages (no manifest needed)
       2. manifest.json fetch  — works on local Live Server
       3. file:// toast        — informs user to use a server
    ─────────────────────────────────────────────────────── */
    const IMAGE_EXTS = new Set([
        'jpg','jpeg','png','webp','avif','gif','bmp','svg','tiff','tif','heic','heif'
    ]);
    const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','mkv','ogv']);

    function fileToAlt(filename) {
        return filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    }

    /* Build GitHub Contents API URL from the current page location */
    function getGithubApiUrl(folder) {
        const host = location.hostname;
        const ghMatch = host.match(/^([^.]+)\.github\.io$/);
        if (!ghMatch) return null;
        const owner = ghMatch[1];
        /* Path segments that are real sub-directories (not index.html / empty) */
        const pathParts = location.pathname.replace(/^\//, '').split('/')
            .filter(p => p && p !== 'index.html');
        /* Root deployment: username.github.io  → repo = owner.github.io
           Sub-path deployment: username.github.io/repo → repo = pathParts[0] */
        const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;
        return `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;
    }

    async function scanFolderGithubApi(folder, allowedExts) {
        const apiUrl = getGithubApiUrl(folder);
        if (!apiUrl) return null;
        const res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github.v3+json' } });
        if (!res.ok) return null;
        const items = await res.json();
        return items
            .filter(f => f.type === 'file' && allowedExts.has(f.name.split('.').pop().toLowerCase()))
            .map(f => ({ src: `${folder}/${f.name}`, alt: fileToAlt(f.name) }));
    }

    async function scanFolderManifest(folder, allowedExts) {
        const res = await fetch(`${folder}/manifest.json`);
        if (!res.ok) return null;
        const list = await res.json();
        return list
            .filter(e => allowedExts.has(e.file.split('.').pop().toLowerCase()))
            .map(e => ({ src: `${folder}/${e.file}`, alt: e.alt || fileToAlt(e.file) }));
    }

    async function scanFolder(folder, allowedExts) {
        if (location.protocol === 'file:') return null;
        /* Try GitHub API first, fall back to manifest */
        try {
            const via = await scanFolderGithubApi(folder, allowedExts);
            if (via) return via;
        } catch { /* not on GitHub Pages */ }
        try {
            const via = await scanFolderManifest(folder, allowedExts);
            if (via) return via;
        } catch { /* manifest missing */ }
        return null;
    }

    /* Image gallery thumbnails */
    document.querySelectorAll('.project-thumbnail[data-gallery-folder]').forEach(thumb => {
        thumb.addEventListener('click', async () => {
            const folder = thumb.dataset.galleryFolder;
            if (location.protocol === 'file:') {
                showToast('Open via Live Server or GitHub Pages to view the gallery.', 'error');
                return;
            }
            const imgs = await scanFolder(folder, IMAGE_EXTS);
            if (imgs && imgs.length) {
                openGallery(imgs);
            } else {
                showToast('No images found in gallery folder.', 'error');
            }
        });
    });

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

    document.querySelectorAll('.project-thumbnail[data-video-folder]').forEach(thumb => {
        thumb.addEventListener('click', async () => {
            const folder = thumb.dataset.videoFolder;
            if (location.protocol === 'file:') { showVideoEmpty(); return; }
            const files = await scanFolder(folder, VIDEO_EXTS);
            if (files && files.length) {
                openGallery(files);
            } else {
                showVideoEmpty();
            }
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
