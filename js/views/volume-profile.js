/**
 * AlphaSignal Institutional Hub - Volume Profile (TPO) View
 * Market Profile and Value Area analysis anchored to historical volume.
 */

window.renderVolumeProfile = async function(tabs = null) {
    // Determine active hub for navigation highlight
    const activeHub = window.location.pathname.includes('alpha-hub') ? 'alpha' : 'analytics';
    const hubTabs = activeHub === 'alpha' ? window.alphaHubTabs : window.analyticsHubTabs;

    const headerHtml = `
        <div class="view-header">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Strategy Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">leaderboard</span>Volume Profile (TPO) <span class="premium-badge">PRO</span></h1>
                <p>Identifying structural value areas and Point of Control (POC) via 60-day volume distributions.</p>
            </div>
            <div style="display:flex;gap:10px;align-items:center">
                <select id="vol-ticker-select" onchange="renderVolumeProfile()" style="background:var(--bg-input);border:1px solid var(--border);color:white;padding:6px 12px;border-radius:8px;font-family:var(--font-mono);font-size:0.75rem">
                    <option value="BTC">BTC-USD</option>
                    <option value="ETH">ETH-USD</option>
                    <option value="SOL">SOL-USD</option>
                </select>
                <button onclick="document.getElementById('vol-video-modal').style.display='flex'" style="background:rgba(0, 242, 255, 0.1);border:1px solid var(--accent);color:var(--accent);padding:6px 12px;border-radius:4px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all 0.2s">
                    <span class="material-symbols-outlined" style="font-size:16px">smart_display</span> HOW TO READ
                </button>
            </div>
        </div>
        ${renderHubTabs('profile', hubTabs)}
    `;

    appEl.innerHTML = headerHtml + `<div id="vol-loading" style="padding:4rem;text-align:center"><div class="loader"></div></div><div id="vol-content" style="display:none"></div>`;
    
    const ticker = document.getElementById('vol-ticker-select')?.value || 'BTC';
    
    try {
        const data = await fetchAPI(`/volume-profile?ticker=${ticker}`);
        document.getElementById('vol-loading').style.display = 'none';
        const content = document.getElementById('vol-content');
        content.style.display = 'block';

        if (data.error) throw new Error(data.error);

        const labels = data.profile.map(p => p.price);
        const volumes = data.profile.map(p => p.volume);
        
        content.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.5rem">
                <div class="glass-card" style="padding:1.2rem; border-bottom:3px solid var(--accent)">
                    <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:1px">POINT OF CONTROL (POC)</div>
                    <div style="font-size:1.5rem; font-weight:800; color:var(--accent)">$${data.poc.toLocaleString()}</div>
                </div>
                <div class="glass-card" style="padding:1.2rem">
                    <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:1px">VALUE AREA HIGH (VAH)</div>
                    <div style="font-size:1.5rem; font-weight:800">$${data.vah.toLocaleString()}</div>
                </div>
                <div class="glass-card" style="padding:1.2rem">
                    <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:1px">VALUE AREA LOW (VAL)</div>
                    <div style="font-size:1.5rem; font-weight:800">$${data.val.toLocaleString()}</div>
                </div>
                <div class="glass-card" style="padding:1.2rem">
                    <div style="font-size:0.6rem; color:var(--text-dim); letter-spacing:1px">CURRENT SPOT</div>
                    <div style="font-size:1.5rem; font-weight:800; color:#ffd700">$${data.spot.toLocaleString()}</div>
                </div>
            </div>

            <div class="glass-card" style="padding:1.5rem; position:relative">
                <div style="height:600px"><canvas id="volChart"></canvas></div>
            </div>

            <!-- Video Modal -->
            <div id="vol-video-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;justify-content:center;align-items:center;backdrop-filter:blur(5px);">
                <div style="background:var(--bg-dark);border:1px solid var(--accent);border-radius:8px;width:90%;max-width:800px;overflow:hidden;box-shadow:0 0 30px rgba(0,242,255,0.2);">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid rgba(0,242,255,0.1);">
                        <h3 style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px">
                            <span class="material-symbols-outlined" style="color:var(--accent)">school</span> Educational Guide
                        </h3>
                        <button onclick="document.getElementById('vol-video-modal').style.display='none'; document.getElementById('vol-iframe').src = document.getElementById('vol-iframe').src;" style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:4px">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
                        <iframe id="vol-iframe" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;" 
                            src="https://www.youtube-nocookie.com/embed/Xe30nXrRxYg?rel=0" 
                            title="YouTube video player" frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div style="padding:15px 20px;font-size:0.8rem;color:var(--text-dim);">
                        Master Volume Profile (TPO) to identify Value Area Highs, Value Area Lows, and the Point of Control (POC).
                    </div>
                </div>
            </div>
        `;
        
        new Chart(document.getElementById('volChart'), {
            type: 'bar',
            data: {
                labels: labels.map(p => '$' + p.toLocaleString()),
                datasets: [{
                    label: 'Volume Profile',
                    data: volumes,
                    backgroundColor: labels.map(p => (p >= data.val && p <= data.vah) ? 'rgba(125, 211, 242, 0.4)' : 'rgba(255,255,255,0.1)'),
                    borderColor: labels.map(p => p === data.poc ? '#00d4aa' : 'transparent'),
                    borderWidth: labels.map(p => p === data.poc ? 2 : 0),
                    borderRadius: 2
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal Bar Chart
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.03)' }, 
                        ticks: { color: 'rgba(255,255,255,0.3)', font: { family: 'JetBrains Mono', size: 9 } } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(13,17,23,0.95)',
                        titleFont: { family: 'JetBrains Mono' },
                        bodyFont: { family: 'JetBrains Mono' },
                        borderColor: 'rgba(125,211,242,0.3)',
                        borderWidth: 1
                    }
                }
            }
        });

    } catch (e) {
        document.getElementById('vol-loading').innerHTML = `<div class="error-msg">Volume Profile Load Failed: ${e.message}</div>`;
    }
};
