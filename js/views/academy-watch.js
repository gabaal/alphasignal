/**
 * ACADEMY CINEMA VIEW
 * Immersive video-first instructional portal
 */

// Use extracted data if available, fallback to hardcoded masterclasses
const ACADEMY_VIDEOS = (typeof ACADEMY_VIDEOS_EXTRACTED !== 'undefined') ? ACADEMY_VIDEOS_EXTRACTED : [
    {
        id: 'statistical-mean-reversion-z-scores',
        title: 'Institutional Mean Reversion & Z-Scores Masterclass',
        youtubeId: 'c2j-zs8YN3c',
        thumb: 'https://img.youtube.com/vi/c2j-zs8YN3c/hqdefault.jpg',
        desc: 'Advanced guide to trading statistical mean reversion using Z-Scores and standard deviation.',
        route: 'academy/statistical-mean-reversion-z-scores.html',
        category: 'Strategy',
        duration: '12:45'
    }
];

function renderAcademyWatch() {
    const view = document.getElementById('app-view');
    if (!view) return;

    // Extract unique categories
    const categories = ['All', ...new Set(ACADEMY_VIDEOS.map(v => v.category))];
    let currentCategory = 'All';

    const renderGrid = (filter = 'All') => {
        const filtered = filter === 'All' ? ACADEMY_VIDEOS : ACADEMY_VIDEOS.filter(v => v.category === filter);
        return filtered.map(video => `
            <div class="video-card" onclick="openCinema('${video.youtubeId}', '${video.title}', '${video.route}')">
                <div class="video-thumb" style="background-image: url('${video.thumb}')">
                    <div class="video-duration">${video.duration || '10:00'}</div>
                    <div class="play-overlay">
                        <span class="material-symbols-outlined">play_circle</span>
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-category">${video.category.toUpperCase()}</div>
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-desc">${video.desc}</p>
                </div>
            </div>
        `).join('');
    };

    view.innerHTML = `
        <div class="cinema-hub">
            <header class="cinema-hero">
                <div class="hero-content">
                    <div class="badge">QUANT ACADEMY</div>
                    <h1>Cinema Hub</h1>
                    <p>Institutional masterclasses on quantitative strategy, order flow, and risk management.</p>
                </div>
            </header>

            <div class="cinema-nav">
                <div class="category-tabs">
                    ${categories.map(cat => `
                        <button class="cat-tab ${cat === currentCategory ? 'active' : ''}" onclick="filterCinema('${cat}', this); event.stopPropagation();">${cat.toUpperCase()}</button>
                    `).join('')}
                </div>
                <div class="video-count">Showing <span id="visible-count">${ACADEMY_VIDEOS.length}</span> Masterclasses</div>
            </div>

            <div class="video-grid" id="cinema-grid">
                ${renderGrid()}
            </div>
        </div>
    `;

    // Global filter function
    window.filterCinema = (cat, btn) => {
        const grid = document.getElementById('cinema-grid');
        const count = document.getElementById('visible-count');
        
        // UI Sync
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        // Render
        grid.innerHTML = renderGrid(cat);
        count.textContent = (cat === 'All' ? ACADEMY_VIDEOS : ACADEMY_VIDEOS.filter(v => v.category === cat)).length;
    };
}

function openCinema(ytId, title, route) {
    // PREVENT DUPLICATES (FIX FOR MULTIPLE AUDIO)
    if (document.getElementById('cinema-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'cinema-modal';
    modal.id = 'cinema-modal';
    
    modal.innerHTML = `
        <div class="cinema-backdrop" onclick="closeCinema()"></div>
        <div class="cinema-container">
            <header class="cinema-header">
                <h2>${title}</h2>
                <button class="close-cinema" onclick="closeCinema()">&times;</button>
            </header>
            <div class="cinema-player">
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
            <footer class="cinema-footer">
                <button class="action-btn-styled primary" onclick="window.location.href='/${route}'">
                    <span class="material-symbols-outlined">description</span> READ THE FULL THESIS
                </button>
                <div class="cinema-hint">Press ESC to exit cinema mode</div>
            </footer>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Force reflow and transition
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
    });

    // ESC to close
    const escHandler = (e) => {
        if (e.key === 'Escape') closeCinema();
    };
    window.addEventListener('keydown', escHandler);
    window._cinemaEscHandler = escHandler;
}

function closeCinema() {
    const modal = document.getElementById('cinema-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
        window.removeEventListener('keydown', window._cinemaEscHandler);
    }
}
