import sys

with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\js\views\onchain.js', 'r', encoding='utf-8') as f:
    text = f.read()

target = """        // Trigger AI Synthesis
        const aiBox = document.getElementById('opts-ai-synthesis');
        if (aiBox) {
            aiBox.innerHTML = '<div class="ai-typing" style="height:40px"></div>';
            fetchAPI('/options-synthesis', 'POST', {
                ticker: currency,
                pcr: d.pcr,
                max_pain: d.max_pain,
                atm_iv: d.atm_iv,
                iv_rank: d.iv_pct_rank,
                skew: d.skew,
                exp_move: d.exp_move,
                zero_gamma: d.zero_gamma,
                anomalies: d.top_strikes ? d.top_strikes.filter(s => s.anomalous).length : 0
            }).then(resp => {
                if (resp && resp.explanation) {
                    aiBox.innerHTML = `
                        <div style="margin-bottom:8px">${resp.explanation.split('\\n\\n')[0] || resp.explanation}</div>
                        ${resp.explanation.split('\\n\\n')[1] ? `<div>${resp.explanation.split('\\n\\n')[1]}</div>` : ''}
                        <div style="margin-top:12px;font-size:0.6rem;color:var(--text-dim);font-family:monospace;display:flex;align-items:center;gap:4px">
                            <span class="material-symbols-outlined" style="font-size:11px">verified</span> Verified by DeepMind Option Synthesis
                        </div>
                    `;
                } else {
                    aiBox.innerHTML = '<span style="color:var(--text-dim)">AI synthesis unavailable.</span>';
                }
            }).catch(() => aiBox.innerHTML = '<span style="color:var(--text-dim)">AI synthesis unavailable.</span>');
        }"""

replacement = """        // Trigger AI Synthesis (Streamed SSE)
        const aiBox = document.getElementById('opts-ai-synthesis');
        if (aiBox) {
            aiBox.innerHTML = '<div class="ai-typing" style="height:40px"></div>';
            
            const bodyPayload = {
                ticker: currency,
                pcr: d.pcr,
                max_pain: d.max_pain,
                atm_iv: d.atm_iv,
                iv_rank: d.iv_pct_rank,
                skew: d.skew,
                exp_move: d.exp_move,
                zero_gamma: d.zero_gamma,
                anomalies: d.top_strikes ? d.top_strikes.filter(s => s.anomalous).length : 0
            };
            
            fetch(`${window.API_BASE || '/api'}/options-synthesis?stream=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
                credentials: 'include'
            }).then(async res => {
                if (res.status === 401) { throw new Error('Unauthorized'); }
                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                aiBox.innerHTML = '';
                let accumulatedText = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.error) throw new Error(data.error);
                                
                                if (data.text) {
                                    accumulatedText += data.text;
                                    const paragraphs = accumulatedText.split('\\n\\n').filter(p => p.trim());
                                    const htmlContent = paragraphs.map(p => `<div style="margin-bottom:8px">${p.replace(/\\n/g, '<br>')}</div>`).join('');
                                    aiBox.innerHTML = htmlContent + `<div style="margin-top:12px;font-size:0.6rem;color:var(--text-dim);font-family:monospace;display:flex;align-items:center;gap:4px">
                                        <div class="pulse-dot" style="width:6px;height:6px;background:var(--accent);border-radius:50%;animation:pulse 1s infinite"></div>
                                        <span class="material-symbols-outlined" style="font-size:11px">verified</span> DeepMind Option Synthesis (Live Stream)
                                    </div>`;
                                }
                            } catch(e) {}
                        }
                    }
                }
                
                // Done playing out stream, freeze cursor
                const footer = aiBox.querySelector('.pulse-dot');
                if (footer) footer.style.display = 'none';
                
            }).catch(() => aiBox.innerHTML = '<span style="color:var(--text-dim)">AI synthesis unavailable.</span>');
        }"""

if "aiBox.innerHTML = '<div class=\"ai-typing\"" in text:
    text = text.replace(target, replacement)
    with open(r'c:\Users\geral\.gemini\antigravity\scratch\alphasignal\js\views\onchain.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Frontend SSE logic updated!")
else:
    print("Failed to pinpoint frontend hook")
