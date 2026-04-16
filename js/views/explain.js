function renderSystemGauge(canvasId, value, colorLow, colorHigh) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    let primaryColor = value > 50 ? colorHigh : colorLow;
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Value', 'Remaining'],
            datasets: [{ data: [value, 100 - value], backgroundColor: [primaryColor, window.alphaColor(0.05)], borderWidth: 0, circumference: 180, rotation: 270 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '80%',
            layout: { padding: { bottom: 30 } },
            plugins: { legend: { display: false }, tooltip: { enabled: false }, datalabels: { display: false } }
        },
        plugins: [{ id: 'gaugeCenterText', afterDraw(chart) {
            const {ctx, data} = chart;
            const val = data.datasets[0].data[0];
            const meta = chart.getDatasetMeta(0).data[0];
            if (!meta) return;
            ctx.save();
            ctx.font = 'bold 36px JetBrains Mono'; ctx.fillStyle = 'white';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(val), meta.x, meta.y - 20);
            ctx.font = '600 12px Inter'; ctx.fillStyle = 'var(--text-dim)';
            ctx.fillText('INDEX SCORE', meta.x, meta.y + 15);
            ctx.restore();
        }}]
    });
}

// ============= Legacy Doc Template (kept for compatibility) =============
function renderExplainPage(title, subtitle, detailedDesc, sections, caseStudies = [], dataSources = "", targetView = null) {
    appEl.innerHTML = `
        <div class="view-header"><h1>${title} — Terminal Documentation</h1></div>
        <div class="doc-container" style="max-width:900px;margin:0 auto;padding-top:2rem;padding-bottom:5rem">
            <p style="font-size:1.25rem;color:var(--text-dim);margin-bottom:1.5rem;line-height:1.6;font-weight:500">${subtitle}</p>
            <div style="background:rgba(0,242,255,0.03);border-left:2px solid var(--accent);padding:1.5rem;margin-bottom:2.5rem;color:var(--text-main);line-height:1.7;font-size:1.25rem;border-radius:0 8px 8px 0">
                <h4 style="color:var(--accent);margin-bottom:0.5rem;font-size:0.9rem;text-transform:uppercase;letter-spacing:1px">Institutional Overview</h4>
                ${detailedDesc}
            </div>
            <div class="doc-features" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-bottom:3rem">
                ${sections.map(s => `<div style="background:${window.alphaColor(0.02)};padding:1.5rem;border-radius:8px;border:1px solid ${window.alphaColor(0.05)}"><h3 style="color:var(--accent);margin-bottom:0.75rem;display:flex;align-items:center;font-size:1.2rem"><span class="material-symbols-outlined" style="margin-right:8px;font-size:22px">${s.icon}</span>${s.title}</h3><p style="color:var(--text-dim);line-height:1.5;font-size:1.0rem">${s.desc}</p></div>`).join('')}
            </div>
            ${caseStudies.length > 0 ? `<div style="margin-bottom:3rem"><h3 style="color:var(--text-main);margin-bottom:1.5rem;border-bottom:1px solid ${window.alphaColor(0.1)};padding-bottom:0.5rem;display:flex;align-items:center"><span class="material-symbols-outlined" style="margin-right:8px;color:var(--accent)">experiment</span>Practical Case Studies</h3><div style="display:grid;gap:1rem">${caseStudies.map(cs => `<div style="background:rgba(255,165,0,0.03);padding:1.5rem;border-radius:8px;border:1px dotted rgba(255,165,0,0.2)"><h4 style="color:#ffa500;margin-bottom:0.5rem;font-size:1.1rem;display:flex;align-items:center"><span class="material-symbols-outlined" style="margin-right:8px;font-size:20px">lightbulb</span>${cs.title}</h4><p style="color:var(--text-main);line-height:1.6;font-size:1.0rem">${cs.text}</p></div>`).join('')}</div></div>` : ''}
            ${dataSources ? `<div style="background:${window.alphaColor(0.03)};padding:1.2rem;border-radius:8px;margin-bottom:2rem;border:1px solid ${window.alphaColor(0.05)};font-size:0.95rem;color:var(--text-dim)"><div style="display:flex;align-items:center;margin-bottom:0.5rem;color:var(--accent);font-weight:600;text-transform:uppercase;letter-spacing:0.5px"><span class="material-symbols-outlined" style="margin-right:6px;font-size:18px">source</span>Data Provenance &amp; Sources</div>${dataSources}</div>` : ''}
            <div style="display:flex;gap:1rem;flex-wrap:wrap">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px;border:1px solid var(--text-dim) !important;border-radius:8px;"><span class="material-symbols-outlined" style="font-size:20px">arrow_back</span> RETURN TO HELP HUB</button>
                ${targetView ? `<button class="intel-action-btn" onclick="switchView('${targetView}')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:var(--text-main);font-weight:800;border:1px solid var(--text-dim) !important;border-radius:8px;"><span class="material-symbols-outlined" style="font-size:20px;color:var(--text-main)">open_in_new</span> OPEN VIEW</button>` : ''}
            </div>
        </div>
    `;
}

// ============= New Per-Chart Doc Template =============
function renderViewDocPage({ hub, hubIcon, hubColor = 'var(--accent)', title, viewId, summary, components, relatedDocs = [] }) {
    const typeStyles = {
        'CHART':  { bg: 'rgba(0,242,255,0.08)',    color: '#7dd3fc',  border: 'rgba(0,242,255,0.2)'    },
        'TABLE':  { bg: 'rgba(139,92,246,0.08)',   color: '#8b5cf6',  border: 'rgba(139,92,246,0.2)'   },
        'WIDGET': { bg: 'rgba(250,204,21,0.08)',   color: '#facc15',  border: 'rgba(250,204,21,0.2)'   },
        'GAUGE':  { bg: 'rgba(34,197,94,0.08)',    color: '#22c55e',  border: 'rgba(34,197,94,0.2)'    },
        'STAT':   { bg: 'rgba(251,146,60,0.08)',   color: '#fb923c',  border: 'rgba(251,146,60,0.2)'   },
        'FEED':   { bg: 'rgba(96,165,250,0.08)',   color: '#60a5fa',  border: 'rgba(96,165,250,0.2)'   },
        'AI':     { bg: 'rgba(139,92,246,0.08)',   color: '#8b5cf6',  border: 'rgba(139,92,246,0.2)'   },
        'FORM':   { bg: 'rgba(251,146,60,0.08)',   color: '#fb923c',  border: 'rgba(251,146,60,0.2)'   },
        'MAP':    { bg: 'rgba(16,185,129,0.08)',   color: '#10b981',  border: 'rgba(16,185,129,0.2)'   },
    };

    appEl.innerHTML = `
        <div class="view-header" style="padding-bottom:1rem">
            <div style="display:flex;align-items:center;gap:6px;font-size:0.7rem;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:1rem">
                <span class="material-symbols-outlined" style="font-size:14px;cursor:pointer;color:var(--text-dim)" onclick="switchView('help')">home</span>
                <span>›</span>
                <span style="cursor:pointer;color:${hubColor}" onclick="switchView('help')">${hub}</span>
                <span>›</span>
                <span style="color:var(--text)">${title}</span>
            </div>
            <h2 style="display:flex;align-items:center;flex-wrap:wrap;gap:12px">
                <span class="material-symbols-outlined" style="vertical-align:middle;color:${hubColor};font-size:1.6rem">${hubIcon}</span>
                ${title}
                <span style="font-size:0.6rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;background:${window.alphaColor(0.05)};color:var(--text-dim);border:1px solid ${window.alphaColor(0.08)}">VIEW REFERENCE</span>
            </h2>
            <p style="color:var(--text-dim);line-height:1.7;max-width:700px;margin-top:0.5rem;font-size:1.0rem">${summary}</p>
        </div>

        <div style="max-width:920px;display:flex;flex-direction:column;gap:1.5rem;padding-bottom:5rem">
            ${components.map((c, i) => {
                const ts = typeStyles[c.type] || typeStyles['CHART'];
                return `
                <div style="background:${window.alphaColor(0.015)};border:1px solid ${window.alphaColor(0.07)};border-radius:12px;overflow:hidden;transition:border-color 0.2s" onmouseover="this.style.borderColor=window.alphaColor(0.15)" onmouseout="this.style.borderColor=window.alphaColor(0.07)">
                    <div style="padding:1.1rem 1.4rem;background:${window.alphaColor(0.02)};border-bottom:1px solid ${window.alphaColor(0.05)};display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap">
                        <div style="display:flex;align-items:center;gap:12px">
                            <div style="width:36px;height:36px;border-radius:8px;background:${ts.bg};border:1px solid ${ts.border};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                                <span class="material-symbols-outlined" style="font-size:20px;color:${ts.color}">${c.icon}</span>
                            </div>
                            <div>
                                <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:2px">COMPONENT ${String(i + 1).padStart(2, '0')} / ${String(components.length).padStart(2, '0')}</div>
                                <div style="font-size:1.3rem;font-weight:700;color:var(--text)">${c.name}</div>
                            </div>
                        </div>
                        <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;padding:4px 12px;border-radius:100px;background:${ts.bg};color:${ts.color};border:1px solid ${ts.border};white-space:nowrap">${c.type}</span>
                    </div>
                    <div style="padding:1.4rem">
                        <p style="font-size:0.98rem;line-height:1.75;color:var(--text);margin-bottom:1.2rem">${c.description}</p>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                            <div style="background:rgba(0,242,255,0.03);border:1px solid rgba(0,242,255,0.1);border-radius:8px;padding:1rem">
                                <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--accent);margin-bottom:0.6rem;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:13px">menu_book</span>HOW TO READ IT</div>
                                <p style="font-size:0.9rem;line-height:1.6;color:var(--text-dim);margin:0">${c.howToRead}</p>
                            </div>
                            <div style="background:rgba(139,92,246,0.03);border:1px solid rgba(139,92,246,0.1);border-radius:8px;padding:1rem">
                                <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:#8b5cf6;margin-bottom:0.6rem;display:flex;align-items:center;gap:5px"><span class="material-symbols-outlined" style="font-size:13px">tips_and_updates</span>KEY SIGNALS</div>
                                <ul style="margin:0;padding-left:1.1rem;display:flex;flex-direction:column;gap:3px">
                                    ${c.signals.map(s => `<li style="font-size:0.88rem;line-height:1.55;color:var(--text-dim)">${s}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}

            ${relatedDocs.length ? `
            <div style="padding-top:1.2rem;border-top:1px solid ${window.alphaColor(0.06)}">
                <div style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);margin-bottom:0.8rem;display:flex;align-items:center;gap:6px">
                    <span class="material-symbols-outlined" style="font-size:14px">link</span>RELATED GUIDES
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
                    ${relatedDocs.map(r => `<button onclick="switchView('${r.route}')" style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:100px;background:${window.alphaColor(0.04)};border:1px solid ${window.alphaColor(0.1)};color:var(--text-dim);font-size:0.82rem;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all 0.2s;font-family:inherit" onmouseover="this.style.borderColor=window.alphaColor(0.3);this.style.color='var(--text)'" onmouseout="this.style.borderColor=window.alphaColor(0.1);this.style.color='var(--text-dim)'">
                        <span class="material-symbols-outlined" style="font-size:14px">${r.icon || 'article'}</span>${r.name}
                    </button>`).join('')}
                </div>
            </div>` : ''}

            <div style="display:flex;gap:1rem;flex-wrap:wrap;padding-top:1rem;border-top:1px solid ${window.alphaColor(0.06)}">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px;width:auto;border:1px solid var(--text-dim) !important;border-radius:8px;">
                    <span class="material-symbols-outlined" style="font-size:16px">arrow_back</span> HELP HUB
                </button>
                ${viewId ? `<button class="intel-action-btn" onclick="switchView('${viewId}')" style="display:flex;align-items:center;gap:8px;width:auto;background:${hubColor};color:var(--text-main);font-weight:800;border:1px solid var(--text-dim) !important;border-radius:8px;">
                    <span class="material-symbols-outlined" style="font-size:16px;color:var(--text-main)">open_in_new</span> OPEN VIEW IN TERMINAL
                </button>` : ''}
            </div>
        </div>
    `;
}
