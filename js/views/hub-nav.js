function renderHubTabs(activeTab, tabs) {
    if (!tabs) return '';
    return `
        <div class="hub-tabs" style="display:flex; gap:8px; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:10px; overflow-x:auto; overflow-y:visible; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding-right:1rem">
            <style>.hub-tabs::-webkit-scrollbar{display:none}</style>
            ${tabs.map(t => `
                <button class="intel-action-btn mini ${activeTab === t.id ? '' : 'outline'}" 
                        onclick="switchView('${t.view}')" 
                        style="white-space:nowrap; flex-shrink:0; padding:6px 10px; font-size:0.62rem">
                    <span class="material-symbols-outlined" style="font-size:13px; vertical-align:middle; margin-right:3px">${t.icon}</span> 
                    ${t.label}
                </button>
            `).join('')}
        </div>
    `;
}

// ============= Macro Intelligence Hub =============
const macroHubTabs = [
    { id: 'macro', label: 'MACRO COMPASS', view: 'macro-hub', icon: 'public' },
    { id: 'briefing', label: 'MARKET BRIEFING', view: 'briefing', icon: 'description' },
    { id: 'flow', label: 'CAPITAL FLOWS', view: 'flow', icon: 'swap_horiz' },
    { id: 'rotation', label: 'SECTOR ROTATION', view: 'rotation', icon: 'rotate_right' },
    { id: 'capital-rotation', label: 'CAPITAL ROTATION', view: 'capital-rotation', icon: 'donut_large' },
    { id: 'correlation', label: 'CORREL MATRIX', view: 'correlation-matrix', icon: 'grid_4x4' },
    { id: 'calendar', label: 'MACRO CALENDAR', view: 'macro-calendar', icon: 'event' },
    { id: 'regime', label: 'MARKET REGIME', view: 'regime', icon: 'layers' },
    { id: 'lob', label: 'LOB HEATMAP', view: 'lob-heatmap', icon: 'blur_on' },
    { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
    { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
    { id: 'oi', label: 'OI MATRIX', view: 'oi-radar', icon: 'track_changes' },
    { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' },
    { id: 'overview', label: 'HUB OVERVIEW', view: 'docs-hub-macro', icon: 'menu_book' }
];

async function renderMacroHub() {
    renderMacroSync(macroHubTabs); 
}

// ============= Alpha Strategy Hub =============
const alphaHubTabs = [
    { id: 'signals',      label: 'LIVE SIGNALS',    view: 'signals',        icon: 'radar' },
    { id: 'score',        label: 'ALPHA SCORE',      view: 'alpha-score',    icon: 'bolt' },
    { id: 'profile',      label: 'MARKET PROFILE',   view: 'volume-profile', icon: 'leaderboard' },
    { id: 'lab',          label: 'STRATEGY LAB',     view: 'strategy-lab',   icon: 'science' },
    { id: 'backtester',   label: 'BACKTESTER V2',    view: 'backtester-v2',  icon: 'analytics' },
    { id: 'archive',      label: 'SIGNAL ARCHIVE',   view: 'signal-archive', icon: 'archive' },
    { id: 'narrative',    label: 'NARRATIVE GALAXY',  view: 'narrative',      icon: 'hub' },
    { id: 'overview',     label: 'HUB OVERVIEW',     view: 'docs-hub-alpha', icon: 'menu_book' }
];

async function renderAlphaHub() {
    renderSignals('ALL', alphaHubTabs);
}

// ============= Portfolio & Risk Lab =============
const institutionalHubTabs = [
    { id: 'optimizer', label: 'PORTFOLIO OPTIMIZER', view: 'portfolio-optimizer', icon: 'auto_mode' },
    { id: 'risk', label: 'RISK MATRIX', view: 'risk', icon: 'grid_on' },
    { id: 'stress', label: 'STRESS LAB', view: 'stress', icon: 'warning_amber' },
    { id: 'tradelab', label: 'TRADE IDEA LAB', view: 'tradelab', icon: 'experiment' },
    { id: 'unlocks', label: 'TOKEN UNLOCKS', view: 'token-unlocks', icon: 'key' },
    { id: 'yield', label: 'YIELD LAB', view: 'yield-lab', icon: 'biotech' },
    { id: 'rebalancer', label: 'AI REBALANCER', view: 'ai-rebalancer', icon: 'smart_toy' },
    { id: 'overview', label: 'HUB OVERVIEW', view: 'docs-hub-portfolio', icon: 'menu_book' }
];

async function renderInstitutionalHub() {
    renderPortfolioOptimizer(institutionalHubTabs);
}

// ============= Analytics Hub =============
const analyticsHubTabs = [
    { id: 'options',       label: 'OPTIONS FLOW',   view: 'options-flow',      icon: 'ssid_chart' },
    { id: 'gex',           label: 'GAMMA EXPOSURE', view: 'gex-profile',       icon: 'bar_chart' },
    { id: 'whales',        label: 'WHALE PULSE',    view: 'whales',            icon: 'waves' },
    { id: 'velocity',      label: 'CHAIN VELOCITY', view: 'velocity',          icon: 'speed' },
    { id: 'onchain',       label: 'ON-CHAIN STATS', view: 'onchain',           icon: 'link' },
    { id: 'mindshare',     label: 'MINDSHARE',      view: 'mindshare',         icon: 'psychology' },
    { id: 'newsroom',      label: 'NEWSROOM',       view: 'newsroom',          icon: 'newspaper' },
    { id: 'custom',        label: 'CUSTOM CHARTS',  view: 'custom-analytics',  icon: 'bar_chart' },
    { id: 'advanced-charting', label: 'ADVANCED CHARTING', view: 'advanced-charting', icon: 'candlestick_chart' },
    { id: 'overview',      label: 'HUB OVERVIEW',   view: 'docs-hub-analytics', icon: 'menu_book' }
];

async function renderAnalyticsHub() {
    renderWhales(analyticsHubTabs);
}

// ============= Audit & Performance Hub =============
const auditHubTabs = [
    { id: 'performance',      label: 'PERFORMANCE',     view: 'performance-dashboard', icon: 'trending_up' },
    { id: 'ledger',           label: 'TRADE LEDGER',    view: 'trade-ledger',          icon: 'list_alt' },
    { id: 'strategy-report',  label: 'STRATEGY REPORT', view: 'strategy-report',       icon: 'insert_chart' },
    { id: 'overview',         label: 'HUB OVERVIEW',    view: 'docs-hub-audit',        icon: 'menu_book' }
];

async function renderAuditHub() {
    renderPerformanceDashboard(auditHubTabs);
}

// ============= Alerts & Webhooks Hub =============
const alertsHubTabs = [
    { id: 'alerts',            label: 'LIVE ALERTS',    view: 'alerts-hub',        icon: 'notifications' },
    { id: 'price-alerts',      label: 'PRICE ALERTS',   view: 'price-alerts-hub',  icon: 'add_alert' },
    { id: 'signal-leaderboard',label: 'LEADERBOARD',    view: 'leaderboard-hub',   icon: 'leaderboard' },
    { id: 'market-brief',      label: 'MARKET BRIEF',   view: 'market-brief-hub',  icon: 'article' },
    { id: 'signal-archive',    label: 'SIGNAL ARCHIVE', view: 'signal-archive',    icon: 'archive' },
    { id: 'webhooks',          label: 'WEBHOOKS',       view: 'webhooks',          icon: 'webhook' },
    { id: 'overview',          label: 'HUB OVERVIEW',   view: 'docs-hub-alerts',   icon: 'menu_book' }
];

// Hub-aware wrappers - each view shows the shared tab bar
async function renderAlertsHub()    { window._alertsHubTabs = alertsHubTabs; renderAlerts(alertsHubTabs); }
async function renderPriceAlertsHub()     { renderPriceAlerts(alertsHubTabs); }
async function renderLeaderboardHub()     { renderSignalLeaderboard(alertsHubTabs); }
async function renderMarketBriefHub()     { renderMarketBrief(alertsHubTabs); }

// ============= Update existing renderers to support tabs =============
