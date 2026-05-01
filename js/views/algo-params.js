async function renderAlgoParams(tabs) {
    if (!tabs) tabs = alphaHubTabs;

    if (!sessionStorage.getItem('algo_warned')) {
        const modal = document.createElement('div');
        modal.className = 'overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal" style="max-width:450px; padding:2.5rem 2rem; text-align:center; border-top:4px solid var(--risk-high)">
                <span class="material-symbols-outlined" style="font-size:3rem; color:var(--risk-high); margin-bottom:1rem">warning</span>
                <h2 style="margin-bottom:1rem; font-size:1.2rem; color:white; letter-spacing:1px">ENGINE CALIBRATION WARNING</h2>
                <p style="color:var(--text-dim); font-size:0.85rem; line-height:1.6; margin-bottom:2rem">
                    Modifying these parameters directly alters the Core Engine's signal generation thresholds. 
                    Incorrect tuning can have adverse effects, resulting in excessive market noise or missing critical Alpha signals.<br><br>
                    <strong>Proceed only if you understand statistical thresholding.</strong>
                </p>
                <div style="display:flex; gap:1rem; justify-content:center">
                    <button class="intel-action-btn outline" id="algo-warn-cancel" style="flex:1">CANCEL</button>
                    <button class="intel-action-btn" id="algo-warn-proceed" style="flex:1; background:var(--risk-high); color:#fff; border:none">I UNDERSTAND</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        return new Promise((resolve) => {
            document.getElementById('algo-warn-cancel').onclick = () => {
                modal.remove();
                switchView('signals'); // Redirect back
                resolve();
            };
            document.getElementById('algo-warn-proceed').onclick = () => {
                modal.remove();
                sessionStorage.setItem('algo_warned', 'true');
                _renderAlgoParamsContent(tabs);
                resolve();
            };
        });
    }

    _renderAlgoParamsContent(tabs);
}

async function _renderAlgoParamsContent(tabs) {
    // Fetch current algo params
    let params = { algo_z_threshold: 2.0, algo_whale_threshold: 5.0, algo_depeg_threshold: 1.0, algo_vol_spike_threshold: 2.0, algo_cme_gap_threshold: 1.0, algo_rsi_oversold: 25.0, algo_rsi_overbought: 75.0, enable_ml_alpha: true, enable_vol_spike: true, enable_rsi: true, enable_macd: true };
    try {
        const res = await fetchAPI('/user/algo-params');
        if (res && !res.error) {
            params = Object.assign(params, res);
        }
    } catch(e) {
        console.warn("Failed to fetch algo params", e);
    }

    const html = `
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <h2 style="font-size:0.65rem;font-weight:900;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin:0 0 4px">Alpha Strategy Hub</h2>
                <h1><span class="material-symbols-outlined" style="vertical-align:middle;margin-right:8px;color:var(--accent)">tune</span>Algorithm Tuning <span class="premium-badge">PRO</span></h1>
                <p style="margin-top:4px;color:var(--text-dim);font-size:0.8rem">Fine-tune the Core Engine's signal generation thresholds.</p>
            </div>
            <button class="intel-action-btn mini outline" style="width:auto;padding:4px 10px;font-size:0.6rem;display:flex;align-items:center;gap:4px;flex-shrink:0" onclick="switchView('signals')"><span class="material-symbols-outlined" style="font-size:13px">arrow_back</span> LIVE SIGNALS</button>
        </div>

        ${renderHubTabs('algo-params', tabs)}

        <div class="dashboard-grid" style="grid-template-columns: 1fr; gap: 1rem; max-width: 800px; margin: 0 auto;">
            <div class="intel-card" style="padding: 2rem; border-top: 2px solid var(--accent);">
                <div style="margin-bottom: 2rem;">
                    <h3 style="display: flex; align-items: center; gap: 8px; margin: 0 0 10px 0;">
                        <span class="material-symbols-outlined" style="color: var(--accent);">psychology</span>
                        Core Engine Sensitivity
                    </h3>
                    <p style="color: var(--text-dim); font-size: 0.85rem; line-height: 1.5; margin: 0;">
                        These parameters directly control the <strong>Alpha Signal Generation Engine</strong>. Signals that do not meet these thresholds will be completely discarded by the system and will not appear in your Signal Archive. 
                        <br/><br/>
                        <em>Note: Notification thresholds (Discord/Telegram) are managed separately in your <a href="javascript:void(0)" onclick="switchView('alerts-hub')" style="color: var(--accent); text-decoration: underline;">Notification Settings</a>.</em>
                    </p>
                </div>

                <div style="display:flex; flex-direction:column; gap: 1.5rem;">
                    <!-- ML Z-Score Threshold -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px;">MINIMUM ML Z-SCORE</label>
                            <span id="algo-z-val" style="font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem;">${params.algo_z_threshold.toFixed(1)}&sigma;</span>
                        </div>
                        <input type="range" id="algo-z-slider" min="0.5" max="5.0" step="0.1" value="${params.algo_z_threshold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-z-val').textContent = parseFloat(this.value).toFixed(1) + 'σ'">
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 6px 0 0 0;">Threshold for Machine Learning Alpha predictions to be recorded.</p>
                    </div>

                    <!-- Whale Txn Threshold -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px;">WHALE TXN MINIMUM</label>
                            <span id="algo-whale-val" style="font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem;">$${params.algo_whale_threshold.toFixed(1)}M</span>
                        </div>
                        <input type="range" id="algo-whale-slider" min="1.0" max="25.0" step="0.5" value="${params.algo_whale_threshold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-whale-val').textContent = '$' + parseFloat(this.value).toFixed(1) + 'M'">
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 6px 0 0 0;">Minimum nominal value for on-chain whale transaction detection.</p>
                    </div>

                    <!-- Volume Spike Threshold -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px;">VOLUME SPIKE SENSITIVITY</label>
                            <span id="algo-vol-val" style="font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem;">${params.algo_vol_spike_threshold.toFixed(1)}x StdDev</span>
                        </div>
                        <input type="range" id="algo-vol-slider" min="1.0" max="10.0" step="0.5" value="${params.algo_vol_spike_threshold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-vol-val').textContent = parseFloat(this.value).toFixed(1) + 'x StdDev'">
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 6px 0 0 0;">Multiplier over the rolling 30-period average volume required to flag a spike.</p>
                    </div>

                    <!-- Momentum Reversal (RSI) -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px; display:block; margin-bottom: 15px;">MOMENTUM REVERSAL (RSI)</label>
                        
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <label style="font-size: 0.7rem; font-weight: 700; color: var(--text-dim);">OVERSOLD BOUNDARY (LONG)</label>
                                <span id="algo-rsi-os-val" style="font-family: var(--font-mono); color: var(--risk-low); font-size: 0.85rem;">${params.algo_rsi_oversold.toFixed(0)}</span>
                            </div>
                            <input type="range" id="algo-rsi-os-slider" min="15" max="35" step="5" value="${params.algo_rsi_oversold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-rsi-os-val').textContent = parseFloat(this.value).toFixed(0)">
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <label style="font-size: 0.7rem; font-weight: 700; color: var(--text-dim);">OVERBOUGHT BOUNDARY (SHORT)</label>
                                <span id="algo-rsi-ob-val" style="font-family: var(--font-mono); color: var(--risk-high); font-size: 0.85rem;">${params.algo_rsi_overbought.toFixed(0)}</span>
                            </div>
                            <input type="range" id="algo-rsi-ob-slider" min="65" max="85" step="5" value="${params.algo_rsi_overbought}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-rsi-ob-val').textContent = parseFloat(this.value).toFixed(0)">
                        </div>
                        
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 12px 0 0 0;">Thresholds for RSI-14 mean-reversion signals to trigger. Stricter bounds (e.g. 20/80) yield fewer but higher probability setups.</p>
                    </div>

                    <!-- Stablecoin De-Peg Threshold -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px;">STABLECOIN DE-PEG TOLERANCE</label>
                            <span id="algo-depeg-val" style="font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem;">${params.algo_depeg_threshold.toFixed(1)}%</span>
                        </div>
                        <input type="range" id="algo-depeg-slider" min="0.1" max="5.0" step="0.1" value="${params.algo_depeg_threshold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-depeg-val').textContent = parseFloat(this.value).toFixed(1) + '%'">
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 6px 0 0 0;">Percentage deviation from $1.00 required to flag a de-peg event.</p>
                    </div>

                    <!-- CME Gap Threshold -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px;">CME GAP MINIMUM</label>
                            <span id="algo-cme-val" style="font-family: var(--font-mono); color: var(--accent); font-size: 0.85rem;">${params.algo_cme_gap_threshold.toFixed(1)}%</span>
                        </div>
                        <input type="range" id="algo-cme-slider" min="0.5" max="5.0" step="0.1" value="${params.algo_cme_gap_threshold}" style="width: 100%; cursor: pointer;" oninput="document.getElementById('algo-cme-val').textContent = parseFloat(this.value).toFixed(1) + '%'">
                        <p style="font-size: 0.7rem; color: var(--text-dim); margin: 6px 0 0 0;">Minimum percentage gap between Friday close and Monday open on CME futures.</p>
                    </div>
                    <!-- Signal Toggles -->
                    <div style="background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                        <label style="font-size: 0.8rem; font-weight: 700; color: var(--text); letter-spacing: 1px; display:block; margin-bottom: 15px;">ACTIVE SIGNAL MODULES</label>
                        
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--text);">ML Alpha Prediction</div>
                                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">Neural network confidence scoring. Highly profitable.</div>
                            </div>
                            <input type="checkbox" id="algo-enable-ml" ${params.enable_ml_alpha ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:var(--accent);">
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--text);">Volume Spikes</div>
                                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">Momentum confirmation via unexpected volume.</div>
                            </div>
                            <input type="checkbox" id="algo-enable-vol" ${params.enable_vol_spike ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:var(--accent);">
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: #22c55e;">RSI Oversold (Bullish)</div>
                                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">Standard mean-reversion signal for potential bottoms.</div>
                            </div>
                            <input type="checkbox" id="algo-enable-rsi-oversold" ${params.enable_rsi_oversold ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#22c55e;">
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: #ef4444;">RSI Overbought (Bearish)</div>
                                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">Legacy technical indicator. Often fails in strong bull markets.</div>
                            </div>
                            <input type="checkbox" id="algo-enable-rsi-overbought" ${params.enable_rsi_overbought ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#ef4444;">
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                <div style="font-size: 0.8rem; font-weight: 700; color: var(--risk-high);">MACD Crossovers</div>
                                <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 2px;">Legacy momentum oscillator. High false-positive rate.</div>
                            </div>
                            <input type="checkbox" id="algo-enable-macd" ${params.enable_macd ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:var(--risk-high);">
                        </div>
                    </div>
                </div>

                <div style="margin-top: 2rem; display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                    <span id="algo-save-status" style="font-size: 0.75rem; font-weight: 700; color: var(--risk-low); display: none;">SETTINGS SAVED</span>
                    <button class="intel-action-btn outline" onclick="resetAlgoParamsToDefault()" style="font-weight: 700; padding: 10px 18px; font-size: 0.75rem; display: flex; align-items: center;">
                        <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px;">settings_backup_restore</span> DEFAULT
                    </button>
                    <button class="intel-action-btn primary" onclick="saveAlgoParams()" style="font-weight: 900; padding: 10px 24px; font-size: 0.8rem;">
                        UPDATE ENGINE
                    </button>
                </div>
            </div>
        </div>
    `;

    appEl.innerHTML = html;
}

window.resetAlgoParamsToDefault = function() {
    const defaults = {
        'algo-z': { val: 2.0, suffix: 'σ', precision: 1 },
        'algo-whale': { val: 5.0, prefix: '$', suffix: 'M', precision: 1 },
        'algo-vol': { val: 2.0, suffix: 'x StdDev', precision: 1 },
        'algo-rsi-os': { val: 25.0, suffix: '', precision: 0 },
        'algo-rsi-ob': { val: 75.0, suffix: '', precision: 0 },
        'algo-depeg': { val: 1.0, suffix: '%', precision: 1 },
        'algo-cme': { val: 1.0, suffix: '%', precision: 1 }
    };
    
    for (const [key, cfg] of Object.entries(defaults)) {
        const slider = document.getElementById(`${key}-slider`);
        const label = document.getElementById(`${key}-val`);
        if (slider && label) {
            slider.value = cfg.val;
            label.textContent = (cfg.prefix || '') + cfg.val.toFixed(cfg.precision) + cfg.suffix;
        }
    }
    
    // Reset Checkboxes
    if(document.getElementById('algo-enable-ml')) document.getElementById('algo-enable-ml').checked = true;
    if(document.getElementById('algo-enable-vol')) document.getElementById('algo-enable-vol').checked = true;
    if(document.getElementById('algo-enable-rsi-oversold')) document.getElementById('algo-enable-rsi-oversold').checked = false;
    if(document.getElementById('algo-enable-rsi-overbought')) document.getElementById('algo-enable-rsi-overbought').checked = false;
    if(document.getElementById('algo-enable-macd')) document.getElementById('algo-enable-macd').checked = false;

    showToast("DEFAULTS RESTORED", "Legacy signals disabled. Click 'Update Engine' to save.", "info");
};

async function saveAlgoParams() {
    const btn = event.currentTarget;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s linear infinite; font-size: 16px; vertical-align: middle;">sync</span> UPDATING...`;
    
    const payload = {
        algo_z_threshold: parseFloat(document.getElementById('algo-z-slider').value),
        algo_whale_threshold: parseFloat(document.getElementById('algo-whale-slider').value),
        algo_vol_spike_threshold: parseFloat(document.getElementById('algo-vol-slider').value),
        algo_depeg_threshold: parseFloat(document.getElementById('algo-depeg-slider').value),
        algo_cme_gap_threshold: parseFloat(document.getElementById('algo-cme-slider').value),
        algo_rsi_oversold: parseFloat(document.getElementById('algo-rsi-os-slider').value),
        algo_rsi_overbought: parseFloat(document.getElementById('algo-rsi-ob-slider').value),
        enable_ml_alpha: document.getElementById('algo-enable-ml').checked,
        enable_vol_spike: document.getElementById('algo-enable-vol').checked,
        enable_rsi_oversold: document.getElementById('algo-enable-rsi-oversold').checked,
        enable_rsi_overbought: document.getElementById('algo-enable-rsi-overbought').checked,
        enable_macd: document.getElementById('algo-enable-macd').checked
    };

    try {
        const res = await fetchAPI('/user/algo-params', 'POST', payload);
        if (res && res.success) {
            btn.innerHTML = `UPDATE ENGINE`;
            const status = document.getElementById('algo-save-status');
            status.style.display = 'inline-block';
            setTimeout(() => status.style.display = 'none', 3000);
            showToast("ENGINE RECALIBRATED", "Alpha generation thresholds updated successfully.", "success");
        } else {
            throw new Error(res.error || "Failed to update settings");
        }
    } catch(e) {
        console.error(e);
        btn.innerHTML = `UPDATE ENGINE`;
        showToast("UPDATE FAILED", e.message, "alert");
    }
}

window.renderAlgoParams = renderAlgoParams;
window.saveAlgoParams = saveAlgoParams;
