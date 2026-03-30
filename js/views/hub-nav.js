function renderHubTabs(activeTab, tabs) {
    if (!tabs) return '';
    return `
        <div class="hub-tabs" style="display:flex; gap:10px; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:10px; overflow-x:auto">
            ${tabs.map(t => `
                <button class="intel-action-btn mini ${activeTab === t.id ? '' : 'outline'}" 
                        onclick="switchView('${t.view}')" 
                        style="white-space:nowrap; padding:6px 12px; font-size:0.65rem">
                    <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:4px">${t.icon}</span> 
                    ${t.label}
                </button>
            `).join('')}
        </div>
    `;
}

// ============= Global Markets Hub =============
const globalHubTabs = [
    { id: 'etf', label: 'ETF FLOWS', view: 'etf-flows', icon: 'account_balance' },
    { id: 'liquidations', label: 'LIQUIDATIONS', view: 'liquidations', icon: 'local_fire_department' },
    { id: 'oi', label: 'OI RADAR', view: 'oi-radar', icon: 'track_changes' },
    { id: 'gaps', label: 'CME GAPS', view: 'cme-gaps', icon: 'pivot_table_chart' }
];

async function renderGlobalHub() {
    renderETFFlows(globalHubTabs);
}

// ============= Macro Intelligence Hub =============
const macroHubTabs = [
    { id: 'briefing', label: 'MARKET BRIEFING', view: 'briefing', icon: 'description' },
    { id: 'flow', label: 'CAPITAL FLOWS', view: 'flow', icon: 'swap_horiz' },
    { id: 'rotation', label: 'SECTOR ROTATION', view: 'rotation', icon: 'rotate_right' },
    { id: 'macro', label: 'MACRO COMPASS', view: 'macro-hub', icon: 'public' },
    { id: 'correlation', label: 'CORRELATION Matrix', view: 'correlation-matrix', icon: 'grid_4x4' },
    { id: 'calendar', label: 'MACRO CALENDAR', view: 'macro-calendar', icon: 'event' },
    { id: 'regime', label: 'MARKET REGIME', view: 'regime', icon: 'layers' }
];

async function renderMacroHub() {
    renderBriefing(macroHubTabs); 
}

// ============= Alpha Strategy Hub =============
const alphaHubTabs = [
    { id: 'signals',      label: 'LIVE SIGNALS',    view: 'signals',        icon: 'radar' },
    { id: 'score',        label: 'ALPHA SCORE',      view: 'alpha-score',    icon: 'bolt' },
    { id: 'lab',          label: 'STRATEGY LAB',     view: 'strategy-lab',   icon: 'science' },
    { id: 'backtester',   label: 'BACKTESTER V2',    view: 'backtester-v2',  icon: 'analytics' },
    { id: 'archive',      label: 'SIGNAL ARCHIVE',   view: 'signal-archive', icon: 'archive' },
    { id: 'narrative',    label: 'NARRATIVE GALAXY',  view: 'narrative',      icon: 'hub' }
];

async function renderAlphaHub() {
    renderSignals('ALL', alphaHubTabs);
}

// ============= Institutional Hub =============
const institutionalHubTabs = [
    { id: 'unlocks', label: 'TOKEN UNLOCKS', view: 'token-unlocks', icon: 'key' },
    { id: 'yield', label: 'YIELD LAB', view: 'yield-lab', icon: 'biotech' },
    { id: 'optimizer', label: 'PORTFOLIO OPTIMIZER', view: 'portfolio-optimizer', icon: 'auto_mode' },
    { id: 'portfolio', label: 'PORTFOLIO SIM', view: 'portfolio', icon: 'pie_chart' },
    { id: 'tradelab', label: 'TRADE IDEA LAB', view: 'tradelab', icon: 'experiment' },
    { id: 'rebalancer', label: 'AI REBALANCER', view: 'ai-rebalancer', icon: 'smart_toy' }
];

async function renderInstitutionalHub() {
    renderTokenUnlocks(institutionalHubTabs);
}

// ============= Analytics Hub =============
const analyticsHubTabs = [
    { id: 'whales', label: 'WHALE PULSE', view: 'whales', icon: 'waves' },
    { id: 'velocity', label: 'CHAIN VELOCITY', view: 'velocity', icon: 'speed' },
    { id: 'onchain', label: 'ON-CHAIN STATS', view: 'onchain', icon: 'link' },
    { id: 'options', label: 'OPTIONS FLOW', view: 'options-flow', icon: 'ssid_chart' },
    { id: 'newsroom', label: 'NEWSROOM', view: 'newsroom', icon: 'newspaper' }
];

async function renderAnalyticsHub() {
    renderWhales(analyticsHubTabs);
}

// ============= Audit & Performance Hub =============
const auditHubTabs = [
    { id: 'performance', label: 'PERFORMANCE', view: 'performance-dashboard', icon: 'trending_up' },
    { id: 'ledger', label: 'TRADE LEDGER', view: 'trade-ledger', icon: 'list_alt' }
];

async function renderAuditHub() {
    renderPerformanceDashboard(auditHubTabs);
}

// ============= Risk & Stress Lab Hub =============
const riskHubTabs = [
    { id: 'risk', label: 'RISK MATRIX', view: 'risk', icon: 'grid_on' },
    { id: 'stress', label: 'STRESS LAB', view: 'stress', icon: 'warning_amber' }
];

async function renderRiskHub() {
    renderRiskMatrix(riskHubTabs);
}

// ============= Update existing renderers to support tabs =============
