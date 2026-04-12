
// ============= Initialization =============
const viewMap = {
    'onchain': renderOnChain,
    'tradingview-hub': renderTradingViewHub,
    'custom-analytics': renderCustomAnalytics,
    'advanced-charting': renderAdvancedChart,
    signals: renderSignals,
    briefing: renderBriefing,
    mindshare: renderMindshare,
    flow: renderFlows,
    heatmap: renderHeatmap,
    catalysts: renderCatalysts,
    'macro-calendar': renderMacroCalendar,
    'algo-hub': renderAlgoHub,
    'whales': renderWhales,
    regime: renderRegime,
    'global-hub': renderGlobalHub,
    'macro-hub': renderMacroHub,
    'alpha-hub': renderAlphaHub,
    'institutional-hub': renderInstitutionalHub,
    'analytics-hub': renderAnalyticsHub,
    'audit-hub': renderAuditHub,
    'risk-hub': renderRiskHub,
    macro: renderMacroSync,
    'token-unlocks': renderTokenUnlocks,
    'yield-lab': renderYieldLab,
    rotation: renderRotation,
    'capital-rotation': renderCapitalRotation,
    velocity: renderChainVelocity,
    portfolio: renderPortfolioLab,
    'portfolio-optimizer': renderPortfolioOptimizer,
    'strategy-lab': renderStrategyLab,
    'backtester-v2': renderBacktesterV2,
    'options-flow': renderOptionsFlow,
    'ai-rebalancer': renderAIRebalancerView,
    risk: renderRiskMatrix,
    stress: renderStressHub,
    narrative: renderNarrativeGalaxy,
    newsroom: renderNewsroom,
    alerts: renderAlerts,
    tradelab: renderTradeLab,
    liquidity: renderLiquidityView,
    home: renderHome,
    // Legacy explain-* routes — redirect to new docs-* equivalents
    'explain-signals': () => switchView('docs-signals'),
    'explain-briefing': () => switchView('docs-briefing'),
    'explain-liquidity': () => switchView('docs-order-flow'),
    'explain-whales': () => switchView('docs-whale-pulse'),
    'explain-ml-engine': () => switchView('docs-ml-engine'),
    'explain-mindshare': () => switchView('docs-narrative'),
    'explain-benchmark': () => switchView('docs-performance'),
    'explain-alerts': () => switchView('docs-alerts'),
    'explain-zscore': () => switchView('docs-signals'),
    'explain-alpha': () => switchView('docs-alpha-score'),
    'explain-correlation': () => switchView('docs-onchain'),
    'explain-sentiment': () => switchView('docs-newsroom'),
    'explain-risk': () => switchView('docs-risk-matrix'),
    'explain-playbook': () => switchView('docs-strategy-lab'),
    'explain-regimes': () => switchView('docs-regime'),
    'explain-advanced-charting': () => switchView('docs-charting-suite'),
    'explain-onchain': () => switchView('docs-onchain'),
    'explain-api': renderHelp,
    'explain-glossary': renderHelp,
    'explain-signal-archive': () => switchView('docs-signal-archive'),
    'explain-performance': () => switchView('docs-performance'),
    'explain-alpha-score': () => switchView('docs-alpha-score'),
    'signal-archive': renderSignalArchive,
    'correlation-matrix': renderCorrelationMatrix,
    'alpha-score': renderAlphaScore,
    'performance-dashboard': renderPerformanceDashboard,
    'explain-velocity': () => switchView('help'),
    'explain-telegram': renderHelp,
    'explain-pwa': renderHelp,
    'explain-topologies': renderDocsTopologies,
    'explain-portfolio-lab': () => switchView('docs-portfolio-optimizer'),
    'etf-flows': renderETFFlows,
    'liquidations': renderLiquidations,
    'cme-gaps': renderCMEGaps,
    'oi-radar': renderOIRadar,
    'command-center': renderCommandCenter,
    'trade-ledger': renderTradeLedger,
    'strategy-report': renderStrategyReport,
    'ask-terminal': renderAskTerminal,
    'explain-ai-engine': renderDocsAIEngine,
    'explain-strategy-lab': () => switchView('docs-strategy-lab'),
    'explain-backtester-v2': () => switchView('docs-backtester'),
    'explain-tradingview': () => switchView('docs-tradingview'),
    help: renderHelp,
    'explain-etf-flows': () => switchView('docs-etf-flows'),
    'explain-liquidations': () => switchView('docs-liquidations'),
    'explain-oi-radar': () => switchView('docs-oi-radar'),
    'explain-cme-gaps': () => switchView('docs-cme-gaps'),
    'explain-flow': () => switchView('docs-order-flow'),
    'explain-rotation': () => switchView('docs-rotation'),
    'explain-macro-compass': () => switchView('docs-macro-compass'),
    'explain-macro-calendar': () => switchView('docs-macro-calendar'),
    'explain-narrative': () => switchView('docs-narrative'),
    'explain-token-unlocks': () => switchView('docs-token-unlocks'),
    'explain-yield-lab': () => switchView('docs-yield-lab'),
    'explain-tradelab': () => switchView('docs-tradelab'),
    'explain-options-flow': () => switchView('docs-options-flow'),
    'explain-newsroom': () => switchView('docs-newsroom'),
    'explain-trade-ledger': () => switchView('docs-trade-ledger'),
    'explain-heatmap': renderHelp,
    'explain-command-center': () => switchView('docs-command-center'),
    'explain-ask-terminal': () => switchView('docs-ask-terminal'),
    'explain-my-terminal': () => switchView('docs-my-terminal'),
    'my-terminal': renderMyTerminal,
    'exchange-keys': renderExchangeKeys,
    'webhooks': renderWebhooks,
    'price-alerts': renderPriceAlerts,
    'signal-leaderboard': renderSignalLeaderboard,
    'market-brief': renderMarketBrief,
    'alerts-hub': renderAlertsHub,
    'price-alerts-hub': renderPriceAlertsHub,
    'leaderboard-hub':  renderLeaderboardHub,
    'market-brief-hub': renderMarketBriefHub,
    // ---- docs-* per-view documentation routes (docs-a.js) ----
    'docs-etf-flows': renderDocsViewETFFlows,
    'docs-liquidations': renderDocsViewLiquidations,
    'docs-oi-radar': renderDocsViewOIRadar,
    'docs-cme-gaps': renderDocsViewCMEGaps,
    'docs-briefing': renderDocsViewBriefing,
    'docs-rotation': renderDocsViewSectorRotation,
    'docs-macro-compass': renderDocsViewMacroCompass,
    'docs-macro-calendar': renderDocsViewMacroCalendar,
    'docs-regime': renderDocsViewRegime,
    'docs-signals': renderDocsViewSignals,
    'docs-ml-engine': renderDocsViewMLEngine,
    'docs-alpha-score': renderDocsViewAlphaScore,
    'docs-strategy-lab': renderDocsViewStrategyLab,
    'docs-backtester': renderDocsViewBacktester,
    'docs-signal-archive': renderDocsViewSignalArchive,
    'docs-narrative': renderDocsViewNarrative,
    'docs-token-unlocks': renderDocsViewTokenUnlocks,
    'docs-yield-lab': renderDocsViewYieldLab,
    'docs-portfolio-optimizer': renderDocsViewPortfolioOptimizer,
    'docs-tradelab': renderDocsViewTradeLab,
    'docs-whale-pulse': renderDocsViewWhalePulse,
    'docs-chain-velocity': renderDocsViewChainVelocity,
    'docs-onchain': renderDocsViewOnchain,
    'docs-tradingview-hub': renderDocsViewTradingViewHub,
    'docs-custom-charts': renderDocsViewCustomCharts,
    'docs-options-flow': renderDocsViewOptionsFlow,
    'docs-newsroom': renderDocsViewNewsroom,
    'docs-trade-ledger': renderDocsViewTradeLedger,
    'docs-performance': renderDocsViewPerformance,
    'docs-risk-matrix': renderDocsViewRiskMatrix,
    'docs-stress-lab': renderDocsViewStressLab,
    'docs-charting-suite': renderDocsViewChartingSuite,
    'docs-tradingview': renderDocsViewTradingViewWidget,
    'docs-order-flow': renderDocsViewOrderFlow,
    'docs-alerts': renderDocsViewAlerts,
    'docs-price-alerts': renderDocsViewPriceAlerts,
    'docs-signal-leaderboard': renderDocsViewSignalLeaderboard,
    'docs-market-brief': renderDocsViewMarketBrief,
    'docs-my-terminal': renderDocsViewMyTerminal,
    'docs-ask-terminal': renderDocsViewAskTerminal,
    'docs-command-center': renderDocsViewCommandCenter,
    'docs-daily-workflow': renderDocsViewDailyWorkflow,
    'docs-how-signals-work': renderDocsViewHowSignalsWork,
    'docs-integrations': renderDocsViewIntegrations,
    'docs-plain-english': renderDocsViewPlainEnglish,
    'docs-conceptual-framework': typeof renderDocsViewConceptualFramework !== 'undefined' ? renderDocsViewConceptualFramework : () => {},
    'docs-lob-heatmap': typeof renderDocsViewLOBHeatmap !== 'undefined' ? renderDocsViewLOBHeatmap : () => {},
    'docs-gex': typeof renderDocsViewGEX !== 'undefined' ? renderDocsViewGEX : () => {},
    'docs-volume-profile': typeof renderDocsViewVolumeProfile !== 'undefined' ? renderDocsViewVolumeProfile : () => {},
    'gex-profile': typeof renderGexProfile !== 'undefined' ? renderGexProfile : () => {},
    'volume-profile': typeof renderVolumeProfile !== 'undefined' ? renderVolumeProfile : () => {},
    'lob-heatmap': typeof renderLobHeatmap !== 'undefined' ? renderLobHeatmap : () => {},
    'signal': () => {
        const params = new URLSearchParams(window.location.search);
        const ticker = params.get('ticker') || params.get('id');
        renderSignalPermalink(ticker);
    },
    'reset-password': renderResetPassword,
};



// renderCommandCenter, initBTCSparkline, initCommandGauges, renderCommandETF -> views/command-center.js
// renderHome -> views/home.js
// renderSystemGauge, renderExplainPage -> views/explain.js
// renderHelp, renderDocs* (first block) -> js/docs-a.js

// switchView() -> js/router.js

function shareSignal(ticker, alpha, sentiment, zScore) {
    const sentimentLabel = sentiment > 0.1 ? 'BULLISH' : (sentiment < -0.1 ? 'BEARISH' : 'NEUTRAL');
    const text = `🚨 AlphaSignal Terminal Update: $${ticker}\n\n` +
                 `📈 Relative Alpha: ${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%\n` +
                 `🧠 Sentiment Synthesis: ${sentimentLabel}\n` +
                 `⚡ Z-Score Intensity: ${zScore.toFixed(2)}\n\n` +
                 `Institutional intelligence detected. View the full terminal:\n`;
    
    // Construct sharing URL
    const url = `https://alphasignal.digital/?view=signals&ticker=${ticker}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    console.log("Sharing signal:", ticker);
    window.open(twitterUrl, '_blank');
}
// ============= Inline Signal Thesis (Phase 18) =============
window._thesisCache = window._thesisCache || {};

async function toggleInlineThesis(ticker, dir, zscore, cardId) {
    const bodyEl    = document.getElementById(`${cardId}-thesis`);
    const chevronEl = document.getElementById(`${cardId}-chevron`);
    if (!bodyEl) return;

    const isOpen = bodyEl.style.display !== 'none';
    if (isOpen) {
        bodyEl.style.display = 'none';
        if (chevronEl) { chevronEl.textContent = 'expand_more'; chevronEl.style.transform = ''; }
        return;
    }

    // Open
    bodyEl.style.display = 'block';
    if (chevronEl) { chevronEl.textContent = 'expand_less'; chevronEl.style.transform = 'rotate(180deg)'; }

    const cacheKey = `${ticker}-${dir}`;
    if (window._thesisCache[cacheKey]) {
        bodyEl.innerHTML = window._thesisCache[cacheKey];
        return;
    }

    // Show spinner
    bodyEl.innerHTML = `<span style="display:flex;align-items:center;gap:6px;color:rgba(188,19,254,0.6)">
        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:14px">sync</span>
        <span style="font-size:0.7rem;letter-spacing:1px">GENERATING THESIS...</span>
    </span>`;

    try {
        const data = await fetchAPI(`/signal-thesis?ticker=${ticker}&signal=${dir}&zscore=${zscore}`);
        const text = data?.thesis || 'Analysis unavailable.';
        const html = `<span style="color:rgba(188,19,254,0.7);font-size:0.72rem;font-weight:900;letter-spacing:1px;display:block;margin-bottom:6px">
            ${ticker} · ${dir} · Z: ${zscore}σ</span>${text}`;
        window._thesisCache[cacheKey] = html;
        bodyEl.innerHTML = html;
    } catch (e) {
        bodyEl.innerHTML = `<span style="color:#ef4444;font-size:0.85rem">Thesis unavailable</span>`;
    }
}

// ============= Notification & Alert Hooks (Phase 8) =============
async function showNotificationSettings(visible) {
    console.log(`[AlphaSignal] Notification Settings Modal: ${visible ? 'OPEN' : 'CLOSE'}`);
    const modal = document.getElementById('notification-modal');
    const layout = document.querySelector('.layout');
    
    if (!modal) {
        console.error('[AlphaSignal] ERROR: #notification-modal not found in DOM.');
        return;
    }
    
    if (visible) {
        // Fetch settings and bot info in parallel
        const [settings, botInfo] = await Promise.all([
            fetchAPI('/user/settings').catch(() => null),
            fetch('/api/telegram/link').then(r => r.json()).catch(() => ({ bot_url: 'https://t.me/alphasignalbot_bot', bot_name: 'alphasignalbot_bot', active: false }))
        ]);

        // Populate Discord webhook
        if (document.getElementById('discord-webhook'))
            document.getElementById('discord-webhook').value = settings?.discord_webhook || '';

        // Populate hidden chat_id field (for save)
        const chatId = settings?.telegram_chat_id || '';
        if (document.getElementById('telegram-chat-id'))
            document.getElementById('telegram-chat-id').value = chatId;

        // Update bot link href dynamically
        const botLink = document.getElementById('tg-bot-link');
        if (botLink && botInfo.bot_url) botLink.href = botInfo.bot_url;
        if (botLink && botInfo.bot_name)
            botLink.innerHTML = `<span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span> CONNECT VIA @${botInfo.bot_name}`;

        // Show connected vs unlinked state
        const connectedEl = document.getElementById('tg-status-connected');
        const unlinkedEl  = document.getElementById('tg-status-unlinked');
        const emailEl     = document.getElementById('tg-linked-email');

        if (chatId) {
            if (connectedEl) connectedEl.style.display = 'flex';
            if (unlinkedEl)  unlinkedEl.style.display  = 'none';
            if (emailEl)     emailEl.textContent = settings?.user_email
                ? `Linked to ${settings.user_email} \u00b7 chat_id ${chatId}`
                : `chat_id ${chatId}`;
        } else {
            if (connectedEl) connectedEl.style.display = 'none';
            if (unlinkedEl)  unlinkedEl.style.display  = 'flex';
        }

        if (document.getElementById('alerts-enabled'))
            document.getElementById('alerts-enabled').checked = settings?.alerts_enabled !== false;

        modal.classList.remove('hidden');
        if (layout) layout.style.filter = 'blur(10px)';
    } else {
        modal.classList.add('hidden');
        if (layout) layout.style.filter = 'none';
    }
}

async function testTelegramConnection() {
    const chatID = document.getElementById('telegram-chat-id')?.value.trim();
    if (!chatID) {
        showToast("NOT LINKED: Open the bot and send /start to connect your account.");
        return;
    }
    showToast("TESTING_CONNECTION: Dispatching signal to Telegram...");
    try {
        const res = await fetchAPI('/settings/test-telegram', 'POST', { chat_id: chatID });
        if (res && res.success) {
            showToast("CONNECTION_SUCCESS: Check your Telegram for the AlphaSignal probe.");
        } else {
            showToast(`CONNECTION_FAIL: ${res.error || 'Check bot token in environment vars'}`);
        }
    } catch (err) {
        showToast("CONNECTION_ERROR: Institutional node unreachable.");
    }
}

async function saveNotificationSettings() {
    console.log('[AlphaSignal] Persisting Alert Configuration...');
    const discord = document.getElementById('discord-webhook').value.trim();
    const telegram = document.getElementById('telegram-chat-id').value.trim();
    const enabled    = document.getElementById('alerts-enabled').checked;
    const digestOn   = document.getElementById('digest-enabled')?.checked ?? true;
    const errorEl = document.getElementById('notif-error');
    
    if (errorEl) errorEl.classList.add('hidden');
    
    // Basic validation for Discord
    if (discord && !discord.startsWith('https://discord.com/api/webhooks/')) {
        if (errorEl) {
            errorEl.textContent = "INVALID_HOOK: Discord webhook must start with https://discord.com/api/webhooks/";
            errorEl.classList.remove('hidden');
        }
        console.warn('[AlphaSignal] Invalid Discord Webhook format.');
        return;
    }
    
    try {
        const z = parseFloat(document.getElementById('z-threshold-slider')?.value || 2.0);
        const res = await fetchAPI('/user/settings', 'POST', {
            discord_webhook: discord,
            telegram_chat_id: telegram,
            alerts_enabled: enabled,
            digest_enabled: digestOn
        });
        // Also persist z_threshold via Phase 17-A endpoint
        await fetchAPI('/alert-settings', 'POST', { z_threshold: z });
        
        if (res && res.success) {
            console.log('[AlphaSignal] Settings Sync Complete.');
            showToast("ALERTS_CONFIGURED: Advanced intelligence hooks updated successfully.");
            showNotificationSettings(false);
        } else {
            throw new Error('Sync failed response');
        }
    } catch (err) {
        console.error('[AlphaSignal] Sync Failure:', err);
        if (errorEl) {
            errorEl.textContent = "SYNC_FAILED: Could not persist alert configuration.";
            errorEl.classList.remove('hidden');
        }
    }
}
function renderRegimeHeatmap(containerId, history) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 200;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    
    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const xScale = d3.scaleBand()
        .domain(history.map(d => d.date))
        .range([0, width - margin.left - margin.right])
        .padding(0.1);
        
    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.top - margin.bottom, 0]);
        
    const colorScale = d3.scaleOrdinal()
        .domain(["High-Vol Expansion", "Low-Vol Compression", "Neutral / Accumulation"])
        .range(["#ef5350", "#26a69a", "#ffa726"]);

    // Floating tooltip (replaces the erroneous showToast calls)
    const tooltip = d3.select('body').append('div')
        .style('position', 'fixed')
        .style('background', 'rgba(13,17,23,0.95)')
        .style('border', '1px solid ${alphaColor(0.1)}')
        .style('border-radius', '8px')
        .style('padding', '6px 12px')
        .style('font-size', '0.7rem')
        .style('font-family', 'JetBrains Mono, monospace')
        .style('color', '#fff')
        .style('pointer-events', 'none')
        .style('z-index', '9999')
        .style('display', 'none');
        
    svg.selectAll("rect")
        .data(history)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.date))
        .attr("y", 0)
        .attr("width", xScale.bandwidth())
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", d => colorScale(d.regime))
        .attr("opacity", 0.6)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("opacity", 1);
            tooltip.style('display', 'block')
                .html(`<span style="color:var(--accent,#00f2ff);font-weight:900">${d.date}</span><br/>${d.regime}`);
        })
        .on("mousemove", function(event) {
            tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 10) + 'px');
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 0.6);
            tooltip.style('display', 'none');
        });
        
    // Abstract Axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickValues(xScale.domain().filter((d,i) => !(i%10))))
        .style("font-size", "8px")
        .style("color", alphaColor(0.3));
}

function renderCorrelationHeatmap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container || !data) return;
    
    // Normalize data structure (Handle both Portfolio and Macro formats)
    const labels = data.tickers || data.assets || [];
    if (!labels.length) return;
    
    const matrix = data.matrix || [];
    const n = labels.length;
    
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    
    container.innerHTML = matrix.map(cell => {
        // v = correlation value
        const v = cell.v !== undefined ? cell.v : cell.correlation;
        const xLabel = cell.x || cell.assetA;
        const yLabel = cell.y || cell.assetB;
        
        const opacity = Math.abs(v);
        const color = v > 0 ? `rgba(0, 242, 255, ${opacity})` : `rgba(255, 62, 62, ${opacity})`;
        return `<div style="aspect-ratio:1; background:${color}; display:flex; align-items:center; justify-content:center; font-size:0.4rem; font-weight:900; color:white; border:1px solid rgba(0,0,0,0.1)" title="${xLabel} vs ${yLabel}: ${v}">
            ${xLabel === yLabel ? xLabel : ''}
        </div>`;
    }).join('');
}

// Ensure Live Streams connect on load
document.addEventListener('DOMContentLoaded', () => {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    setTimeout(initBTCSparkline, 300); // slight delay ensures Chart.js is ready
    // updateInstitutionalPulse();
});

// Backup: if script loads after DOM is already ready (rare, e.g. deferred)
if (document.readyState === 'complete') {
    initLivePriceStream();
    initLiveAlphaScroller();
    initFearGreedGauge();
    setTimeout(initBTCSparkline, 300);
}

async function initFearGreedGauge() {
    const canvas = document.getElementById('fearGreedGauge');
    const valLayer = document.getElementById('fearGreedValue');
    if (!canvas || !valLayer) return;

    try {
        const d = await fetchAPI('/fear-greed');
        if (!d) return;

        valLayer.textContent = d.score;
        let color = '#facc15';
        if (d.score < 25) color = '#ef4444';
        else if (d.score < 45) color = '#fb923c';
        else if (d.score > 75) color = '#22c55e';
        else if (d.score > 55) color = '#86efac';

        valLayer.style.color = color;
        valLayer.title = d.label;

        new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [d.score, 100 - d.score],
                    backgroundColor: [color, alphaColor(0.05)],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { tooltip: { enabled: false }, legend: { display: false } },
                animation: { animateRotate: true, animateScale: false }
            }
        });
    } catch(e) {}
}

function renderDocsTopologies() {
    renderExplainPage(
        "Institutional Topologies & Geometries",
        "A breakdown of the institutional charting variables and dynamic plotting mechanics integrated in Phases 19-21.",
        "Professional traders rely on more than just candlesticks. The latest framework deployment saturated AlphaSignal with cutting-edge dimensionality, allowing instantaneous quantitative recognition through structural geometric arrays rather than raw numbers.",
        [
            { title: "Quantitative Factor Web (Radar Chart)", icon: "radar", desc: "Located in the Asset Deep Dive popup. It plots 6 statistical vectors (Momentum, Volatility, Network Activity, Liquidity, Social Hype, Dev Commits) on a 6-axis polygon. A glance reveals if an asset is fundamentally 'lopsided' or well-rounded." },
            { title: "Guppy Trend Mechanics (EMA Density Ribbon)", icon: "waves", desc: "Found in the Strategy Lab, the Guppy Multiple Moving Average draws 15 overlapping Exponential Moving Averages. When the fast (cyan) and slow (red) ribbons compress, explosive volatility is imminent. When they expand, the trend is locked." },
            { title: "Execution Time Topography (Polar Area Chart)", icon: "data_usage", desc: "Found in the Whale Pulse tracker. This 24-period radial chart maps heavy institutional on-chain volume to physical hours. If the geometry skews heavily towards 01:00-06:00 UTC, it indicates the Asian session is heavily trading the asset. A skew at 14:00+ indicates Wall Street hours." },
            { title: "Ecosystem Capital Flow (Sankey Diagram)", icon: "moving", desc: "Found in the Cross-Chain Velocity hub. It utilizes D3 fluid mapping to literally draw pipelines of fiat entering the system, bridging into core L1 layers (Ethereum, Solana), and draining into specific DeFi products. Line thickness correlates directly to 24H volume limits." },
            { title: "Spot ETF Net Flows Tracker", icon: "account_balance", desc: "A dual-axis visualization tracking daily net institutional capital movement across all major Bitcoin Spot ETFs (IBIT, FBTC, etc.), providing a leading indicator of Wall Street accumulation." },
            { title: "Market Liquidation Heatmap", icon: "local_fire_department", desc: "Visualizes forced Long vs Short liquidations across major exchanges. High liquidation clusters often mark local trend reversals and liquidity exhaustion points." },
            { title: "CME Bitcoin Gaps Tracker", icon: "candlestick_chart", desc: "Identifies unfilled 'magnetic' price levels in the CME Futures market. Institutions often trade towards these gaps to fill structural liquidity voids." },
            { title: "Open Interest Radar (Spider Chart)", icon: "track_changes", desc: "A 4-axis comparison of capital commitment across major derivatives exchanges, highlighting where leverage is building most aggressively." },
            { title: "NxN Correlation Matrix (Heatmap)", icon: "grid_on", desc: "Inside Macro Sync. This is a 10x10 HTML/CSS grid visualizing Pearson's correlation coefficient. Dark cyan means two assets move in perfect tandem (+1.0), while bright red flags assets moving completely inversely (-1.0)." },
            { title: "System Conviction Dials (Analog Gauges)", icon: "speed", desc: "Positioned on the main dashboard. They utilize 180-degree Chart.js doughnuts overlayed with programmatic text to create analog speedometers representing overall market fear, network bloat, and retail FOMO parameters." },
            { title: "Asset Risk Profile (Scatter Plot)", icon: "scatter_plot", desc: "Located in the Correlation & Risk Matrix. Graphs 30D Volatility against Cumulative Return to instantly spot assets operating along the optimal risk-adjusted efficient frontier." },
            { title: "Cumulative Depth Profile (Stepped Area)", icon: "water_drop", desc: "Located in the Order Flow hub. Maps raw aggregate institutional bid and ask liquidity levels as a stepped histogram to expose structural market gravity." },
            { title: "Portfolio Web (Mathematical Radar)", icon: "account_tree", desc: "Located in the Portfolio Simulation Lab. Radially visualizes specific asset capital weightings dynamically optimized by the statistical ML backend." },
            { title: "Conviction Scatter Matrix (Bubble Chart)", icon: "bubble_chart", desc: "Located in the Whale Pulse dashboard. Multi-dimensional graph charting thousands of on-chain executions across Time Decay (X), Transaction Size (Y), and Volume Intensity (Radius)." }
        ],
        [],
        "AlphaSignal proprietary charting engine built on TradingView Lightweight Charts, D3.js v7, Chart.js, and Canvas API.",
        'advanced-charting'
    );
}

// Global Live Alpha Ticker (WebSocket Driven)
function initLiveAlphaScroller() {
    const scroller = document.getElementById('alpha-scroller');
    if (!scroller) return;

    window.updateLiveAlphaScroller = function(topSignals) {
        if (!scroller) return;
        if (Array.isArray(topSignals) && topSignals.length > 0) {
            const html = topSignals.map(s => {
                const color = s.alpha >= 0 ? 'var(--risk-low)' : 'var(--risk-high)';
                const dir = s.alpha >= 0 ? 'LONG' : 'SHORT';
                return `<span style="margin-right:4rem; white-space:nowrap"><strong style="color:var(--text); letter-spacing:1px">${s.ticker}</strong> <span style="color:${color}; font-weight:900">[${dir} ${Math.abs(s.alpha).toFixed(2)}% ALPHA]</span> <span style="color:var(--text-dim)">@ ${formatPrice(s.price)}</span></span>`;
            }).join('');
            scroller.innerHTML = html + html; 
        } else {
            scroller.innerHTML = '<span style="color:var(--text-dim); letter-spacing:1px">MONITORING INSTITUTIONAL STREAMS... NO IMMEDIATE ALPHA DETECTED.</span>';
        }
    };
    
    // Initial state until WebSocket pushes first chunk
    scroller.innerHTML = '<span style="color:var(--text-dim); letter-spacing:1px">SYNCING LIVE ALPHA STREAM...</span>';
}

function initLivePriceStream() {
    if (window.liveWS) return; // Prevent multiple connections
    let retryDelay = 2000;
    window.wsFailCount = 0;

    function handlePriceData(p) {
        if (!window.livePrices) window.livePrices = {};
        Object.assign(window.livePrices, p); // BTC, ETH, SOL from WS

        // ── Watchlist Target Price Alerts ──────────────────────
        if (typeof checkWatchlistAlerts === 'function' && window.isAuthenticatedUser) checkWatchlistAlerts(p);

        if (p.BTC) {
            window.currentBTCPrice = p.BTC;
            if (typeof pushSparklinePrice === 'function') pushSparklinePrice(p.BTC);
            const btcText = `$${p.BTC.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            const elLanding = document.getElementById('btc-price-landing');
            if (elLanding) elLanding.textContent = `BTC: ${btcText}`;

            const dot = document.getElementById('live-dot');
            if (dot) { dot.style.opacity = '1'; setTimeout(() => { dot.style.opacity = '0.4'; }, 300); }
        }
        ['ETH', 'SOL'].forEach(sym => {
            if (p[sym]) {
                const els = document.querySelectorAll(`[data-live-price="${sym}"]`);
                els.forEach(e => e.textContent = `$${p[sym].toLocaleString('en-US', {minimumFractionDigits: 2})}`);
            }
        });
    }

    function initHttpFallback() {
        if (window.priceFallbackInterval) return;
        console.warn("[Matrix] Firewall detected. Downgrading to HTTP Long-Polling Fallback.");
        window.priceFallbackInterval = setInterval(async () => {
            try {
                const p = await fetchAPI('/prices');
                if (p) handlePriceData(p);
            } catch (e) {}
        }, 5000);
        
        // Ensure signals still poll locally if WS is explicitly dead
        if (typeof startSignalPoller === 'function') {
            window.signalFallbackInterval = setInterval(startSignalPoller, 60000);
        }
    }

    function connect() {
        try {
            if (window.wsFailCount >= 5) {
                initHttpFallback();
                return;
            }

            const hostname = window.location.hostname;
            const useLocalPort = (hostname === 'localhost' || hostname === '127.0.0.1');
            const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
            
            // Route through /ws in production to bypass corporate firewalls (only standard 443 open)
            const wsUrl = useLocalPort 
                ? `${wsProtocol}${hostname}:8007` 
                : `${wsProtocol}${window.location.host}/ws`;

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => { 
                window.wsFailCount = 0; 
                if (window.priceFallbackInterval) {
                    clearInterval(window.priceFallbackInterval);
                    window.priceFallbackInterval = null;
                }
                if (window.signalFallbackInterval) {
                    clearInterval(window.signalFallbackInterval);
                    window.signalFallbackInterval = null;
                }
                console.log("[Matrix] Upgraded to Secure WebSocket stream. Polling suspended.");
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'prices') {
                        handlePriceData(msg.data);
                        if (msg.top_alpha && window.updateLiveAlphaScroller) {
                            window.updateLiveAlphaScroller(msg.top_alpha);
                        }
                    } else if (msg.type === 'new_alert' || msg.type === 'alert') {
                        const d = msg.data;
                        const alertsOn = typeof _pollerSettings !== 'undefined' ? _pollerSettings.alerts_enabled : true;
                        if (alertsOn && window.isPremiumUser) {
                            const predReturn = d.predicted_return != null
                                ? Math.abs(parseFloat(d.predicted_return)) * 100
                                : Math.abs(parseFloat(d.z_score ?? 0));
                            const userThresh = typeof _pollerSettings !== 'undefined' ? _pollerSettings.z_threshold : 2.0;
                            if (predReturn >= userThresh || d.severity === 'critical' || d.severity === 'high') {
                                showSignalToast({
                                    ticker: d.ticker || d.signal_type || 'SIGNAL',
                                    direction: d.type && d.type.includes('BULL') ? 'LONG' :
                                               d.type && d.type.includes('BEAR') ? 'SHORT' : 'ALERT',
                                    z_score: d.z_score ?? null,
                                    predicted_return: d.predicted_return ?? null
                                });
                            }
                        } else if (!window.isPremiumUser) {
                            const ticker = d.ticker || d.signal_type || 'SIGNAL';
                            showToast('\uD83D\uDD14 ' + ticker, d.content || d.message || '', 'alert');
                        }

                        const alertBadge = document.getElementById('alerts-badge-count');
                        if (alertBadge) {
                            const cur = parseInt(alertBadge.textContent || '0', 10);
                            alertBadge.textContent = cur + 1;
                            alertBadge.style.display = 'inline-flex';
                        }

                        if (msg.type === 'new_alert') {
                            const alertList = document.getElementById('live-alert-list');
                            if (alertList) {
                                const sevColor = d.severity === 'high' || d.severity === 'critical' ? 'var(--risk-high)' : d.severity === 'medium' ? 'var(--accent)' : 'var(--text-dim)';
                                const ts = new Date(d.timestamp);
                                const tsDisplay = ts.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
                                const entryPrice = d.price && parseFloat(d.price) > 0 ? parseFloat(d.price) : null;
                                const card = document.createElement('div');
                                card.className = 'alert-card ' + (d.severity || 'medium');
                                card.style.cssText = 'background:var(--bg-card);border:1px solid var(--border);border-left:4px solid ' + sevColor + ';border-radius:12px;padding:1.5rem;margin-bottom:1rem;animation:dropdownFadeIn 0.3s ease';
                                const priceHtml = entryPrice ? '<span style="font-family:var(--font-mono);font-weight:700">ENTRY $' + entryPrice.toLocaleString('en-US',{maximumFractionDigits:4}) + '</span>' : '';
                                card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;flex-wrap:wrap;gap:8px"><span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;padding:3px 10px;border-radius:100px;background:rgba(0,242,255,0.08);color:var(--accent);border:1px solid rgba(0,242,255,0.2)">' + (d.type||'').replace(/_/g,' ') + '</span><span style="font-size:0.7rem;color:var(--accent);font-weight:900">' + (d.ticker||'') + '</span><div style="display:flex;align-items:center;gap:8px"><span style="font-size:0.65rem;color:var(--text-dim);font-family:var(--font-mono)">' + tsDisplay + '</span><span style="font-size:0.6rem;color:var(--accent);font-weight:700;padding:2px 8px;border:1px solid rgba(0,242,255,0.3);border-radius:100px;background:rgba(0,242,255,0.06)">LIVE</span></div></div><p style="font-size:0.8rem;color:var(--text-dim);line-height:1.6;margin:0 0 10px">' + (d.content||'') + '</p>' + priceHtml;
                                alertList.prepend(card);
                            }
                        }
                    } else if (msg.type === 'regime_shift') {
                        showToast('\u26A0\uFE0F REGIME SHIFT', 'Market shifted from ' + msg.data.old + ' to ' + msg.data.new + '.', 'regime');
                    }
                } catch(e) {}
            };

            ws.onclose = () => {
                window.wsFailCount++;
                retryDelay = Math.min(retryDelay * 1.5, 30000);
                setTimeout(connect, retryDelay);
            };

            ws.onerror = () => ws.close();

            window.liveWS = ws;
        } catch(e) {
            window.wsFailCount++;
            setTimeout(connect, retryDelay);
        }
    }

    connect();
}

function toggleOverlay(type) {
    window.activeOverlays[type] = !window.activeOverlays[type];
    const btn = event.target;
    btn.classList.toggle('active');
    renderChart(window.currentHistory);
}

// ============= Phase 15-B: AI Engine =============

function formatMemoMarkdown(text) {
    // Convert **bold** headers and newlines to HTML
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#bc13fe;letter-spacing:0.5px">$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin-top:0.8rem">')
        .replace(/\n/g, '<br>');
}

async function loadAIMemo() {
    const body = document.getElementById('ai-memo-body');
    const meta = document.getElementById('ai-memo-meta');
    if (!body) return;
    try {
        const data = await fetchAPI('/ai-memo');
        if (data && data.memo) {
            const html = formatMemoMarkdown(data.memo);
            body.innerHTML = `<p>${html}</p>`;
            if (meta) meta.innerHTML = `Generated ${data.generated_at} &bull; <span style="color:${data.source === 'gpt-4o-mini' ? '#bc13fe' : '#888'}">${data.source === 'gpt-4o-mini' ? 'GPT-4o-mini' : 'Static Template'}</span>`;
        } else {
            body.innerHTML = '<p style="color:var(--text-dim)">Memo unavailable -- check API key configuration.</p>';
        }
    } catch(e) {
        body.innerHTML = '<p style="color:var(--text-dim)">Failed to load AI memo.</p>';
    }
}

async function refreshAIMemo() {
    const body = document.getElementById('ai-memo-body');
    if (!body) return;
    body.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--text-dim)"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Refreshing...</div>`;
    await loadAIMemo();
}

async function renderAskTerminal() {
    appEl.innerHTML = `
        <div class="view-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
            <div>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">smart_toy</span>Ask the Terminal <span class="premium-badge" style="background:#bc13fe;color:black">AI</span></h1> <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;margin-left:auto;flex-shrink:0" onclick="switchView('explain-ask-terminal')"><span class="material-symbols-outlined" style="font-size:13px">help</span> DOCS</button>
                <p>Natural language queries answered with institutional terminal context. Powered by GPT-4o-mini.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 8px;font-size:0.6rem;display:flex;align-items:center;gap:4px" onclick="switchView('explain-ai-engine')">
                <span class="material-symbols-outlined" style="font-size:14px">help</span> DOCS
            </button>
        </div>

        <div style="max-width:780px;margin:0 auto">
            <!-- Suggested queries -->
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:1.5rem">
                ${['What is the current Bitcoin regime?','Which strategy has the best Sharpe ratio?','Explain funding rate heatmap signals','What does a negative Z-Score mean?','Compare BTC vs ETH momentum'].map(q => `
                    <button onclick="submitAIQuery('${q}')" style="background:rgba(188,19,254,0.08);border:1px solid rgba(188,19,254,0.2);color:#bc13fe;padding:6px 14px;border-radius:20px;font-size:0.7rem;cursor:pointer;transition:all 0.2s ease" onmouseover="this.style.background='rgba(188,19,254,0.18)'" onmouseout="this.style.background='rgba(188,19,254,0.08)'">${q}</button>
                `).join('')}
            </div>

            <!-- Chat history -->
            <div id="ask-terminal-history" style="min-height:200px;max-height:60vh;overflow-y:auto;margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1rem"></div>

            <!-- Input bar -->
            <div style="display:flex;gap:12px;align-items:flex-end;border:1px solid rgba(188,19,254,0.4);border-radius:12px;padding:12px;position:sticky;bottom:0">
                <span class="material-symbols-outlined" style="color:#bc13fe;font-size:22px;padding-top:2px">terminal</span>
                <textarea id="ask-terminal-input" placeholder="Ask anything about markets, strategies, signals, or on-chain data..." 
                    style="flex:1;min-height:44px;max-height:120px;background:none;border:none;color:white;font-family:'Outfit';font-size:0.9rem;resize:none;outline:none;line-height:1.5"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitAIQuery()}"></textarea>
                <button id="ask-terminal-send" onclick="submitAIQuery()" style="background:#bc13fe;border:none;color:white;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:0.75rem;font-weight:700;letter-spacing:1px;white-space:nowrap">
                    ASK →
                </button>
            </div>
            <div style="font-size:0.65rem;color:var(--text-dim);margin-top:8px;text-align:center">Press Enter to send &bull; Shift+Enter for new line &bull; Powered by GPT-4o-mini</div>
        </div>
    `;
}

async function submitAIQuery(prefill) {
    const input = document.getElementById('ask-terminal-input');
    const history = document.getElementById('ask-terminal-history');
    const btn = document.getElementById('ask-terminal-send');
    if (!input || !history) return;

    const query = prefill || input.value.trim();
    if (!query) return;

    // Add user message
    history.innerHTML += `
        <div style="display:flex;gap:12px;justify-content:flex-end">
            <div style="max-width:75%;background:rgba(188,19,254,0.15);border:1px solid rgba(188,19,254,0.2);border-radius:12px 12px 4px 12px;padding:12px 16px;font-size:0.85rem;line-height:1.6">${query}</div>
        </div>`;
    history.scrollTop = history.scrollHeight;
    input.value = '';
    if (btn) { btn.disabled = true; btn.textContent = '...'; }

    // Add loading AI response
    const respId = `ai-resp-${Date.now()}`;
    history.innerHTML += `
        <div style="display:flex;gap:12px" id="${respId}-wrap">
            <div style="width:32px;height:32px;border-radius:50%;background:rgba(188,19,254,0.2);border:1px solid rgba(188,19,254,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span class="material-symbols-outlined" style="font-size:16px;color:#bc13fe">smart_toy</span>
            </div>
            <div style="max-width:85%;background:${alphaColor(0.03)};border:1px solid ${alphaColor(0.06)};border-radius:12px 12px 12px 4px;padding:12px 16px;font-size:0.85rem;line-height:1.6" id="${respId}">
                <span style="animation:pulse 1s infinite;color:var(--text-dim)">Thinking...</span>
            </div>
        </div>`;
    history.scrollTop = history.scrollHeight;

    try {
        const resp = await fetch('/api/ask-terminal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await resp.json();
        const el = document.getElementById(respId);
        if (el && data.answer) {
            el.innerHTML = formatMemoMarkdown(data.answer);
        } else if (el) {
            el.innerHTML = '<span style="color:#ef4444">No response</span>';
        }
    } catch(e) {
        const el = document.getElementById(respId);
        if (el) el.innerHTML = `<span style="color:#ef4444">Error: ${e.message}</span>`;
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'ASK →'; }
        history.scrollTop = history.scrollHeight;
    }
}

async function openSignalThesisModal(ticker, signal, zscore) {
    // Create modal if not exists
    let modal = document.getElementById('thesis-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'thesis-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
        modal.innerHTML = `
            <div style="background:var(--bg-card);border:1px solid rgba(188,19,254,0.4);border-radius:16px;padding:2rem;max-width:520px;width:100%;position:relative">
                <button onclick="document.getElementById('thesis-modal').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1.2rem">&times;</button>
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem">
                    <span class="material-symbols-outlined" style="color:#bc13fe">psychology</span>
                    <span style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:#bc13fe">AI TRADE THESIS</span>
                </div>
                <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem">${ticker} &bull; <span style="color:${signal === 'LONG' ? '#22c55e' : signal === 'SHORT' ? '#ef4444' : '#facc15'}">${signal}</span> &bull; Z-Score: ${zscore}Ïƒ</div>
                <div id="thesis-body" style="font-size:0.9rem;line-height:1.7;color:var(--text);min-height:80px;margin-top:1rem">
                    <div style="display:flex;align-items:center;gap:8px;color:var(--text-dim)">
                        <span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:18px">sync</span>Generating thesis...
                    </div>
                </div>
                <div id="thesis-meta" style="font-size:0.6rem;color:var(--text-dim);margin-top:1rem;text-align:right"></div>
            </div>`;
        document.body.appendChild(modal);
    }

    try {
        const data = await fetchAPI(`/signal-thesis?ticker=${ticker}&signal=${signal}&zscore=${zscore}`);
        const el = document.getElementById('thesis-body');
        const meta = document.getElementById('thesis-meta');
        if (el && data.thesis) {
            el.innerHTML = `<p>${formatMemoMarkdown(data.thesis)}</p>`;
            if (meta) meta.textContent = `Source: ${data.source === 'gpt-4o-mini' ? 'GPT-4o-mini' : 'Template'}`;
        }
    } catch(e) {
        const el = document.getElementById('thesis-body');
        if (el) el.innerHTML = `<span style="color:#ef4444">Failed: ${e.message}</span>`;
    }
}

function renderDocsAIEngine() {
    appEl.innerHTML = `
        <div class="view-header">
            <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:#bc13fe">smart_toy</span>AI Narrative Engine</h1>
            <p>Phase 15-B documentation -- GPT-4o-mini powered institutional intelligence layer.</p>
        </div>
        <div style="max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:1.5rem">
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">AI Daily Memo</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">The AI Institutional Memo appears at the top of the Alpha Strategy Briefing. It is generated by GPT-4o-mini with live market context (BTC price, regime, fear/greed) and structured as three paragraphs: <strong>Macro Context</strong>, <strong>Key Opportunities</strong>, and <strong>Risk Warnings</strong>. Cached for 15 minutes to reduce API usage.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">Ask the Terminal</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Natural language query interface. Ask anything about markets, strategies, signals, or analytical concepts. The AI has context about AlphaSignal's capabilities and uses GPT-4o-mini for concise, actionable responses. Accessible via the <strong>Command Center</strong> sidebar item.</p>
            </div>
            <div class="glass-card" style="padding:1.5rem">
                <h3 style="color:#bc13fe;margin-bottom:1rem">Signal Thesis Generator</h3>
                <p style="color:var(--text-dim);line-height:1.7;font-size:0.9rem">Each signal card has a <strong>THESIS</strong> button that generates a 2-sentence GPT-powered trade rationale specific to that ticker, signal direction, and Z-Score deviation. Used to rapidly synthesise the technical and fundamental case for entering or avoiding a trade.</p>
            </div>

            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:2rem">
                <button class="intel-action-btn outline" onclick="switchView('help')" style="display:flex;align-items:center;gap:8px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> RETURN TO HELP HUB</button>
                <button class="intel-action-btn" onclick="switchView('ask-terminal')" style="display:flex;align-items:center;gap:8px;background:var(--accent);color:#000;font-weight:800"><span class="material-symbols-outlined" style="font-size:18px">open_in_new</span> OPEN VIEW</button>
            </div>
        </div>`;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Phase 15-C: Export / Sharing Engine
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * Export any canvas element as a timestamped PNG download.
 * @param {HTMLCanvasElement|string} canvasOrId - Canvas element or its ID
 * @param {string} filename - Base filename (timestamp appended automatically)
 */

// exportChartPNG, exportResearchReport, exportViewPDF, showExportMenu -> js/export.js
// renderDocs* (second block) -> js/docs-b.js

// ════════════════════════════════════════════════════════════════
// v1.56 Feature: Live Signal Poller — ambient toast notifications
// PRO-gated. Polls /api/signals every 60s. Fires showSignalToast()
// when a new signal ID appears vs localStorage._lastSignalId.
// Respects the Alerts Hub sensitivity slider (z_threshold) and
// the alerts_enabled toggle — both set via /alert-settings API.
// ════════════════════════════════════════════════════════════════
var _signalPollerInterval = null;
var _pollerSettings = { z_threshold: 2.0, alerts_enabled: true }; // live cache from /alert-settings


async function _loadPollerSettings() {
    try {
        const s = await fetchAPI('/alert-settings');
        if (s && !s.error) {
            _pollerSettings.z_threshold    = parseFloat(s.z_threshold  ?? 2.0);
            _pollerSettings.alerts_enabled = s.alerts_enabled !== false;
        }
    } catch (e) { /* silent — keep defaults */ }
}

function startSignalPoller() {
    // Gate: PRO only. Clear any existing poller first.
    if (!isPremiumUser) return;
    if (_signalPollerInterval) clearInterval(_signalPollerInterval);

    // Show LIVE dot in top-bar
    const liveDot = document.getElementById('signal-poller-dot');
    if (liveDot) liveDot.style.display = 'inline-block';

    // Load sensitivity settings from Alerts Hub before first poll
    _loadPollerSettings();

    const poll = async () => {
        // Respect alerts_enabled toggle from Alerts Hub
        if (!_pollerSettings.alerts_enabled) return;

        try {
            const data = await fetchAPI('/signals?limit=1');
            if (!data || !data.signals || data.signals.length === 0) return;

            const latest = data.signals[0];
            const latestId = String(latest.id || latest.signal_id || '');
            const lastSeen = localStorage.getItem('_lastSignalId');

            if (latestId && latestId !== lastSeen) {
                // New signal found — check against sensitivity threshold
                if (lastSeen !== null) {
                    // B14 fix: z_threshold is stored as % predicted alpha (e.g. 2.0 = 2%).
                    // Compare predicted_return * 100 (primary) or z_score as a % fallback.
                    // Do NOT compare z_score (σ) directly — unit mismatch with z_threshold (%).
                    const predReturn = latest.predicted_return != null
                        ? Math.abs(parseFloat(latest.predicted_return)) * 100   // decimal → %
                        : Math.abs(parseFloat(latest.z_score ?? 0));            // σ fallback (approx)
                    if (predReturn >= _pollerSettings.z_threshold) {
                        showSignalToast(latest);
                    }
                }
                localStorage.setItem('_lastSignalId', latestId);
            }
        } catch (e) {
            // Silent fail — poller must not break the terminal
        }
    };

    // Run once on start to cache the latest state, WebSocket handles all future alerts
    poll();
}

function stopSignalPoller() {
    if (_signalPollerInterval) {
        clearInterval(_signalPollerInterval);
        _signalPollerInterval = null;
    }
    const liveDot = document.getElementById('signal-poller-dot');
    if (liveDot) liveDot.style.display = 'none';
}

