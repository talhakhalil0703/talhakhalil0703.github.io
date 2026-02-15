// ── Mobile Menu Toggle ──────────────────────────────────────
const menuBtn = document.querySelector('.navbar-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
}

// ── Sidebar Toggle (collapse/expand sections) ──────────────
document.querySelectorAll('.sidebar-section-header').forEach((header) => {
    header.addEventListener('click', () => {
        const section = header.parentElement;
        if (section) {
            section.classList.toggle('collapsed');
            const toggle = header.querySelector('.sidebar-toggle');
            if (toggle) {
                toggle.textContent = section.classList.contains('collapsed') ? '+' : '−';
            }
        }
    });
});

// ── Mobile Sidebar Toggle ──────────────────────────────────
const sidebar = document.querySelector('.sidebar');
if (sidebar && window.innerWidth <= 768) {
    // Create a toggle button for mobile
    const sidebarToggle = document.createElement('button');
    sidebarToggle.className = 'sidebar-mobile-toggle';
    sidebarToggle.innerHTML = '☰ Topics';
    sidebarToggle.style.cssText = `
    position: fixed; bottom: 24px; left: 24px; z-index: 99;
    padding: 12px 20px; background: var(--accent); color: #0a0a0f;
    border: none; border-radius: 24px; font-weight: 600; font-size: 14px;
    cursor: pointer; box-shadow: 0 8px 30px rgba(74,222,128,0.3);
    font-family: var(--font-sans);
  `;
    document.body.appendChild(sidebarToggle);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    });
}

// ── Table of Contents Scroll Spy ───────────────────────────
const tocLinks = document.querySelectorAll('.toc-link');
const headings = [];

tocLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
        const id = href.replace('#', '');
        const el = document.getElementById(id);
        if (el) headings.push({ el, link });
    }
});

if (headings.length > 0) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    tocLinks.forEach((l) => l.classList.remove('active'));
                    const match = headings.find((h) => h.el === entry.target);
                    if (match) match.link.classList.add('active');
                }
            });
        },
        {
            rootMargin: '-80px 0px -70% 0px',
            threshold: 0,
        }
    );

    headings.forEach((h) => observer.observe(h.el));
}

// ── Smooth scroll for anchor links ─────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});
