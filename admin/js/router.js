// ============================================================
// Admin Router — Tab-based SPA navigation
// ============================================================

const router = {
    currentPage: 'overview',
    pageHandlers: {},

    init() {
        // Check auth
        if (!sessionStorage.getItem('admin_token')) {
            window.location.href = 'index.html';
            return;
        }

        // Bind sidebar links
        document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.page);
                // Close mobile sidebar
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebarOverlay').classList.remove('open');
            });
        });

        // Mobile sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('open');
        });

        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebarOverlay').classList.remove('open');
        });

        // Navigate based on hash
        const hash = window.location.hash.replace('#', '') || 'overview';
        this.navigate(hash);

        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '') || 'overview';
            if (h !== this.currentPage) this.navigate(h);
        });
    },

    navigate(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

        // Show target page
        const pageEl = document.getElementById(`page-${page}`);
        if (pageEl) {
            pageEl.classList.add('active');
        } else {
            document.getElementById('page-overview').classList.add('active');
            page = 'overview';
        }

        // Highlight sidebar link
        const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
        if (link) link.classList.add('active');

        // Update title
        const titles = {
            overview: 'Overview', hero: 'Hero Section', about: 'About Section',
            skills: 'Skills', experience: 'Experience', education: 'Education',
            projects: 'Projects', socials: 'Social Links', contact: 'Contact Settings',
            sections: 'Section Manager', media: 'Media Library',
            settings: 'Settings', password: 'Change Password',
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;

        // Update hash
        window.location.hash = page;
        this.currentPage = page;

        // Call page handler if registered
        if (this.pageHandlers[page]) {
            this.pageHandlers[page]();
        }
    },

    register(page, handler) {
        this.pageHandlers[page] = handler;
    },
};
