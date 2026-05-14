// AlphaSignal Floating AI Assistant ("Ask Alpha")

document.addEventListener('DOMContentLoaded', () => {
    initFloatingAIChat();
});

// Fallback if already loaded
if (document.readyState === 'complete') {
    initFloatingAIChat();
}

function initFloatingAIChat() {
    if (document.getElementById('alpha-ai-chat-fab')) return; // Already initialized

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Floating Action Button */
        #alpha-ai-chat-fab {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent), #00a896);
            box-shadow: 0 4px 20px rgba(0, 242, 255, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9999;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
        }
        
        #alpha-ai-chat-fab:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(0, 242, 255, 0.6);
        }

        #alpha-ai-chat-fab .material-symbols-outlined {
            color: #000;
            font-size: 28px;
        }

        /* Pulse Ring */
        #alpha-ai-chat-fab::before {
            content: '';
            position: absolute;
            top: -4px; right: -4px; bottom: -4px; left: -4px;
            border-radius: 50%;
            border: 1px solid var(--accent);
            animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
            opacity: 0;
            pointer-events: none;
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            80%, 100% { transform: scale(1.4); opacity: 0; }
        }

        /* Chat Window */
        #alpha-ai-chat-window {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 360px;
            max-width: calc(100vw - 48px);
            height: 500px;
            max-height: calc(100vh - 120px);
            background: rgba(13, 17, 23, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 242, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 242, 255, 0.05);
            display: flex;
            flex-direction: column;
            z-index: 9998;
            opacity: 0;
            pointer-events: none;
            transform: translateY(20px) scale(0.95);
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            overflow: hidden;
        }

        #alpha-ai-chat-window.active {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0) scale(1);
        }

        /* Header */
        .ai-chat-header {
            padding: 16px;
            background: linear-gradient(90deg, rgba(0, 242, 255, 0.05), transparent);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .ai-chat-header-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 900;
            font-size: 0.9rem;
            color: white;
            letter-spacing: 1px;
        }

        .ai-status-dot {
            width: 8px;
            height: 8px;
            background: var(--risk-low, #22c55e);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--risk-low, #22c55e);
        }

        .close-chat-btn {
            background: none;
            border: none;
            color: var(--text-dim);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }
        .close-chat-btn:hover { color: white; }

        /* Messages Area */
        .ai-chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .chat-msg {
            max-width: 85%;
            font-size: 0.8rem;
            line-height: 1.5;
            padding: 12px 16px;
            border-radius: 12px;
            position: relative;
            animation: msg-in 0.3s ease-out;
        }

        @keyframes msg-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .chat-msg.bot {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top-left-radius: 4px;
            color: var(--text-main);
        }

        .chat-msg.user {
            align-self: flex-end;
            background: rgba(0, 242, 255, 0.1);
            border: 1px solid rgba(0, 242, 255, 0.3);
            border-top-right-radius: 4px;
            color: white;
        }

        /* Input Area */
        .ai-chat-input-area {
            padding: 12px 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            background: rgba(0, 0, 0, 0.2);
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .ai-chat-input {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 10px 16px;
            color: white;
            font-size: 0.8rem;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
        }

        .ai-chat-input:focus {
            border-color: rgba(0, 242, 255, 0.5);
        }

        .ai-chat-send-btn {
            background: var(--accent);
            color: #000;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
        }

        .ai-chat-send-btn:hover {
            transform: scale(1.05);
            background: #00e0ec;
        }

        .ai-chat-send-btn .material-symbols-outlined {
            font-size: 18px;
        }
        
        .chat-typing {
            display: flex;
            gap: 4px;
            padding: 4px 0;
        }
        .chat-typing-dot {
            width: 6px;
            height: 6px;
            background: var(--text-dim);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .chat-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .chat-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Inject HTML
    const fabHtml = `
        <div id="alpha-ai-chat-fab" title="Ask Alpha AI">
            <span class="material-symbols-outlined">smart_toy</span>
        </div>
        <div id="alpha-ai-chat-window">
            <div class="ai-chat-header">
                <div class="ai-chat-header-title">
                    <div class="ai-status-dot"></div>
                    ALPHA SIGNAL AI
                </div>
                <button class="close-chat-btn" id="close-chat-btn">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="ai-chat-messages" id="ai-chat-messages">
                <div class="chat-msg bot">
                    <div style="font-weight:900; color:var(--accent); margin-bottom:6px; font-size:0.7rem; letter-spacing:1px">SYSTEM READY</div>
                    How can I assist with your macro analysis or institutional flow tracking today?
                </div>
            </div>
            <div class="ai-chat-input-area">
                <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ask about BTC trend, macro..." />
                <button class="ai-chat-send-btn" id="ai-chat-send-btn">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    `;
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = fabHtml;
    document.body.appendChild(wrapper);

    // Logic
    const fab = document.getElementById('alpha-ai-chat-fab');
    const chatWindow = document.getElementById('alpha-ai-chat-window');
    const closeBtn = document.getElementById('close-chat-btn');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const inputField = document.getElementById('ai-chat-input');
    const messagesContainer = document.getElementById('ai-chat-messages');

    let isOpen = false;

    const toggleChat = () => {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.add('active');
            inputField.focus();
        } else {
            chatWindow.classList.remove('active');
        }
    };

    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    const appendMessage = (text, sender, isHtml = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        
        // Basic markdown bold parsing
        const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:white">$1</strong>');
        
        if (sender === 'bot') {
            const prefix = `<div style="font-weight:900; color:var(--accent); margin-bottom:6px; font-size:0.7rem; letter-spacing:1px">ALPHA AI</div>`;
            if (isHtml) msgDiv.innerHTML = prefix + parsedText;
            else msgDiv.innerHTML = prefix + parsedText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&lt;strong style="color:white"&gt;/g, '<strong style="color:white">').replace(/&lt;\/strong&gt;/g, '</strong>');
        } else {
            msgDiv.textContent = text;
        }
        
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const showTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'chat-msg bot';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="chat-typing">
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
                <div class="chat-typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const removeTypingIndicator = () => {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    };

    // --- Page Context Collector ---
    function gatherPageContext() {
        const ctx = {};

        // 1. Current view (from URL path)
        const path = window.location.pathname.replace('/', '') || 'home';
        ctx.current_view = path || 'home';

        // 2. Active ticker (command center stores in localStorage)
        ctx.active_ticker =
            localStorage.getItem('cmd_selected_asset') ||
            localStorage.getItem('cmd_radar_ticker') ||
            'BTC-USD';

        // 3. Live prices snapshot (if available)
        if (window.livePrices) {
            const priceSnap = {};
            ['BTC-USD','ETH-USD','SOL-USD'].forEach(t => {
                if (window.livePrices[t]) priceSnap[t] = window.livePrices[t];
            });
            if (Object.keys(priceSnap).length) ctx.live_prices = priceSnap;
        }

        // 4. Detect MOST VISIBLE chart in viewport
        // Maps canvas element ID -> chart description
        const chartRegistry = [
            {
                id: 'cmd-lob-heat-canvas',
                instance: () => window._cmdLobChartInst,
                chart: 'Limit Order Book (LOB) Depth Heatmap',
                getExtra: () => {
                    const sel = document.getElementById('cmd-lob-heat-interval');
                    return { interval: sel ? sel.value : '5m' };
                },
                description: 'Shows liquidity density across price levels over time. Bright yellow = heavy institutional walls, cyan = moderate, teal = thin/fast-moving zones.'
            },
            {
                id: 'cmd-gex-strike-canvas',
                instance: () => window._cmdGexStrikeInst,
                chart: 'Dealer Gamma Exposure (GEX) by Strike',
                description: 'Positive bars = long gamma (dealers stabilise price near these strikes). Negative bars = short gamma (dealers amplify moves, expect more volatile price action).'
            },
            {
                id: 'cmd-iv-surface-canvas',
                instance: () => window._cmdIvInst,
                chart: 'Implied Volatility (IV) Skew Curve',
                description: 'IV smile across strikes. Skew toward puts = fear/downside hedging by institutions. Skew toward calls = FOMO/upside bets building.'
            },
            {
                id: 'cmd-vol-profile-canvas',
                instance: () => window._cmdVolChartInst,
                chart: 'Volume Profile (TPO / Value Area)',
                description: 'Horizontal volume histogram. POC = highest volume node (strong price magnet). VAH/VAL = value area boundaries where 70% of trading occurs.'
            },
            {
                id: 'cmd-monte-canvas',
                instance: () => window._cmdMonteInst,
                chart: 'Monte Carlo Price Path Simulation',
                description: 'Simulates thousands of possible future price paths from current volatility inputs. Wide fan = high uncertainty. Tight convergence = low vol regime.'
            },
            {
                id: 'cmd-factor-canvas',
                instance: () => window._cmdFactorInst,
                chart: 'Multi-Factor Attribution Analysis',
                description: 'Decomposes return drivers across momentum, value, volatility, liquidity, and correlation factors. Longer bars = stronger factor influence.'
            },
            {
                id: 'cmd-radar-chart',
                instance: () => window._cmdRadarData,
                chart: 'Alpha Signal Radar',
                getExtra: () => ({ ticker: window._cmdRadarData?.ticker }),
                description: 'Multi-dimensional signal strength radar for the selected asset. Larger polygon area = stronger overall signal conviction.'
            },
            {
                id: 'cmd-btc-spark',
                instance: () => typeof _btcSparkChartInst !== 'undefined' ? _btcSparkChartInst : null,
                chart: 'BTC Live Price Sparkline',
                description: 'Real-time BTC price feed with trailing price history, live bid/ask overlay, and volume-weighted color coding.'
            },
            {
                id: 'cmd-asset-chart',
                instance: () => window._cmdAssetChartInst,
                chart: 'TradingView Candlestick Chart',
                description: 'Live OHLC candlestick chart for the currently selected asset with volume overlay.'
            }
        ];

        // Score each chart by how visible it is in the viewport
        const viewportMid = window.innerHeight / 2;
        let bestScore = -Infinity;
        let primaryChart = null;

        for (const entry of chartRegistry) {
            if (!entry.instance()) continue; // chart not loaded
            const el = document.getElementById(entry.id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            // Skip if not visible at all
            if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
            // Score: how much of the element is in the viewport, weighted toward center
            const visibleTop = Math.max(rect.top, 0);
            const visibleBottom = Math.min(rect.bottom, window.innerHeight);
            const visibleHeight = visibleBottom - visibleTop;
            const centerDist = Math.abs(((visibleTop + visibleBottom) / 2) - viewportMid);
            const score = visibleHeight - centerDist * 0.5;
            if (score > bestScore) {
                bestScore = score;
                primaryChart = entry;
            }
        }

        if (primaryChart) {
            ctx.primary_chart = {
                chart: primaryChart.chart,
                description: primaryChart.description,
                ...(primaryChart.getExtra ? primaryChart.getExtra() : {})
            };
        }

        // Still include radar data values if available (useful for AI analysis)
        if (window._cmdRadarData) {
            ctx.signal_radar_ticker = window._cmdRadarData.ticker;
        }

        return ctx;
    }

    const handleSend = async () => {
        const text = inputField.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        inputField.value = '';
        showTypingIndicator();

        try {
            const pageContext = gatherPageContext();
            const res = await fetchAPI('/ask-terminal', 'POST', { query: text, page_context: pageContext });
            removeTypingIndicator();
            
            if (res && res.answer) {
                appendMessage(res.answer, 'bot', true);
            } else if (res && res.error) {
                appendMessage(`[System Error] ${res.error}`, 'bot');
            } else {
                appendMessage("AI Engine is currently offline. Please try again later.", 'bot');
            }
        } catch (e) {
            removeTypingIndicator();
            appendMessage("Connection failed. Neural network unreachable.", 'bot');
        }
    };

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // We modified appendMessage above to support raw HTML (since backend might return markdown parsed to HTML or formatted strings)
    // Actually, let's redefine appendMessage here to ensure it uses innerHTML safely if we pass true for isHtml
    
    // Replace appendMessage logic globally for this scope
}
