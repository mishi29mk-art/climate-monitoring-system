/* ─── AI Analyst — Chat Interface ───────────────────────────── */
function render_ai_analyst(el) {
    const prompts = [
        { icon: '🌡', label: 'Heatwave Analysis', prompt: 'Analyze current heatwave conditions across Pakistan. Which districts are most at risk and what are the projected temperatures?' },
        { icon: '🌧', label: 'Flood Risk', prompt: 'Assess flood risk based on current rainfall and river discharge levels. Which areas need immediate attention?' },
        { icon: '💨', label: 'Air Quality', prompt: 'Evaluate air quality conditions. Which cities have hazardous AQI levels and what are the health implications?' },
        { icon: '🏜', label: 'Drought Assessment', prompt: 'Analyze drought conditions using SPI values. Which provinces are facing water stress?' },
        { icon: '🌾', label: 'Agriculture Impact', prompt: 'Assess the impact of current weather conditions on agriculture. Which crops are most at risk?' },
        { icon: '🌊', label: 'River Levels', prompt: 'Review river discharge levels across monitoring stations. Are any rivers approaching flood stage?' },
        { icon: '📊', label: 'Province Comparison', prompt: 'Compare climate conditions across all provinces. Which province is facing the most severe conditions?' },
        { icon: '🏥', label: 'Health Advisory', prompt: 'Generate a health advisory based on current weather, AQI, and UV conditions. What precautions should be taken?' },
        { icon: '📈', label: 'Trend Analysis', prompt: 'Analyze 7-day temperature and rainfall trends. Are conditions improving or worsening?' },
        { icon: '🛰', label: 'Situation Report', prompt: 'Generate a comprehensive national climate situation report for today.' },
        { icon: '⚡', label: 'Extreme Events', prompt: 'Identify all extreme weather events currently active. What is the severity and expected duration?' },
        { icon: '🔮', label: 'Forecast Summary', prompt: 'Summarize the 7-day forecast for all major cities. Highlight any significant changes expected.' }
    ];

    const chatHistory = [];

    function addMessage(role, content) {
        chatHistory.push({ role, content, time: new Date().toLocaleTimeString() });
    }

    function renderChat() {
        const chatEl = document.getElementById('ai-chat-messages');
        if (!chatEl) return;
        chatEl.innerHTML = chatHistory.map(msg => `
            <div class="chat-msg ${msg.role}">
                <div class="chat-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
                <div class="chat-bubble">
                    <div class="chat-text">${msg.content}</div>
                    <div class="chat-time">${msg.time}</div>
                </div>
            </div>
        `).join('');
        chatEl.scrollTop = chatEl.scrollHeight;
    }

    function generateResponse(query) {
        const q = query.toLowerCase();
        let response = '';

        if (q.includes('heatwave') || q.includes('heat')) {
            const hotCities = Object.entries(weatherData)
                .filter(([, d]) => (d.stats?.temp_max_7d || 0) >= 40)
                .sort((a, b) => (b[1].stats?.temp_max_7d || 0) - (a[1].stats?.temp_max_7d || 0));
            response = `<b>🌡 Heatwave Analysis</b><br><br>`;
            response += `Current heatwave conditions across Pakistan:<br><br>`;
            response += `<b>Districts with temperatures ≥40°C:</b> ${hotCities.length}<br>`;
            if (hotCities.length > 0) {
                response += `<b>Hottest:</b> ${hotCities[0][0]} at ${fmtC(hotCities[0][1].stats?.temp_max_7d)}<br><br>`;
                response += `<b>Top 10 Hottest Districts:</b><br>`;
                hotCities.slice(0, 10).forEach(([name, d], i) => {
                    const pop = d.population || 0;
                    const popStr = pop > 1000000 ? `Pop: ${fmtK(pop)} (millions affected)` : `Pop: ${fmtK(pop)}`;
                    response += `${i + 1}. <b>${name}</b> (${d.province}) — ${fmtC(d.stats?.temp_max_7d)} — ${popStr}<br>`;
                });
                const totalHeatPop = hotCities.reduce((s, [, d]) => s + (d.population || 0), 0);
                response += `<br>⚠️ <b>${fmtK(totalHeatPop)}</b> people are currently exposed to extreme heat conditions.`;
            } else {
                response += '✅ No districts currently above 40°C threshold.';
            }
        } else if (q.includes('flood') || q.includes('rain')) {
            const floodAlerts = (alertsData || []).filter(a => a.type.includes('flood') || a.type.includes('river'));
            const rainAlerts = (alertsData || []).filter(a => a.type.includes('rain'));
            const highRain = Object.entries(weatherData)
                .filter(([, d]) => (d.stats?.rain_total_7d || 0) > 50)
                .sort((a, b) => (b[1].stats?.rain_total_7d || 0) - (a[1].stats?.rain_total_7d || 0));
            response = `<b>🌊 Flood Risk Assessment</b><br><br>`;
            response += `Active flood-related alerts: <b>${floodAlerts.length}</b><br>`;
            response += `Rain warnings: <b>${rainAlerts.length}</b><br><br>`;
            if (highRain.length > 0) {
                response += `<b>Districts with significant rainfall (7d > 50mm):</b><br>`;
                highRain.slice(0, 10).forEach(([name, d]) => {
                    response += `• <b>${name}</b> (${d.province}) — ${fmtMm(d.stats?.rain_total_7d)}<br>`;
                });
            }
            if (riverData?.stations) {
                const highRiver = riverData.stations.filter(s => s.category === 'Extreme' || s.category === 'Very High');
                if (highRiver.length > 0) {
                    response += `<br><b>River Stations at High/Extreme Levels:</b><br>`;
                    highRiver.forEach(s => {
                        response += `• <b>${s.name}</b> (${s.river}) — ${fmtCusecs(s.discharge)} — ${categoryBadge(s.category)}<br>`;
                    });
                }
            }
        } else if (q.includes('aqi') || q.includes('air quality') || q.includes('pollution')) {
            const badAqi = Object.entries(aqiData)
                .filter(([, d]) => (d.stats?.aqi_max || 0) > 100)
                .sort((a, b) => (b[1].stats?.aqi_max || 0) - (a[1].stats?.aqi_max || 0));
            response = `<b>💨 Air Quality Report</b><br><br>`;
            response += `Districts with Poor or worse AQI (>100): <b>${badAqi.length}</b><br><br>`;
            if (badAqi.length > 0) {
                response += `<b>Most Polluted Districts:</b><br>`;
                badAqi.slice(0, 10).forEach(([name, d]) => {
                    const s = d.stats;
                    response += `• <b>${name}</b> — AQI ${Math.round(s.aqi_max)} (${aqiLabel(s.aqi_max)})<br>`;
                    response += `  PM2.5: ${fmt(s.pm25_max, 1)} · PM10: ${fmt(s.pm10_max, 1)} · O₃: ${fmt(s.o3_max, 1)}<br>`;
                });
                const totalAqiPop = badAqi.reduce((s, [n]) => s + (weatherData[n]?.population || 0), 0);
                response += `<br>⚠️ <b>${fmtK(totalAqiPop)}</b> people exposed to poor air quality.`;
            } else {
                response += '✅ Air quality is generally acceptable across monitored districts.';
            }
        } else if (q.includes('drought') || q.includes('spi')) {
            response = `<b>🏜 Drought Assessment</b><br><br>`;
            response += `Analyzing precipitation deficit (SPI) across districts:<br><br>`;
            const dryCities = Object.entries(weatherData)
                .filter(([, d]) => (d.stats?.rain_total_7d || 0) < 5)
                .sort((a, b) => (a[1].stats?.rain_total_7d || 0) - (b[1].stats?.rain_total_7d || 0));
            const wetCities = Object.entries(weatherData)
                .filter(([, d]) => (d.stats?.rain_total_7d || 0) > 50)
                .sort((a, b) => (b[1].stats?.rain_total_7d || 0) - (a[1].stats?.rain_total_7d || 0));
            response += `<b>Dry Districts (7d rain < 5mm):</b> ${dryCities.length}<br>`;
            response += `<b>Wet Districts (7d rain > 50mm):</b> ${wetCities.length}<br><br>`;
            if (dryCities.length > 0) {
                response += `<b>Most Dry Districts:</b><br>`;
                dryCities.slice(0, 8).forEach(([name, d]) => {
                    response += `• <b>${name}</b> (${d.province}) — ${fmtMm(d.stats?.rain_total_7d)}<br>`;
                });
            }
        } else if (q.includes('river') || q.includes('discharge')) {
            response = `<b>🌊 River Discharge Report</b><br><br>`;
            if (riverData?.stations) {
                const stations = riverData.stations;
                response += `Total monitoring stations: <b>${stations.length}</b><br><br>`;
                const byCategory = {};
                stations.forEach(s => { byCategory[s.category] = (byCategory[s.category] || 0) + 1; });
                response += `<b>Status Distribution:</b><br>`;
                Object.entries(byCategory).forEach(([cat, count]) => {
                    response += `• ${cat}: ${count} stations<br>`;
                });
                const extreme = stations.filter(s => s.category === 'Extreme');
                if (extreme.length > 0) {
                    response += `<br><b>⚠️ Extreme Level Stations:</b><br>`;
                    extreme.forEach(s => {
                        response += `• <b>${s.name}</b> (${s.river}) — ${fmtCusecs(s.discharge)}<br>`;
                    });
                }
                const rivers = [...new Set(stations.map(s => s.river))];
                response += `<br><b>Rivers Monitored:</b> ${rivers.join(', ')}`;
            }
        } else if (q.includes('province') || q.includes('compare')) {
            const provinces = [...new Set(Object.values(weatherData).map(d => d.province).filter(Boolean))].sort();
            response = `<b>📊 Province Comparison</b><br><br>`;
            provinces.forEach(p => {
                const cities = Object.entries(weatherData).filter(([, d]) => d.province === p);
                const avgTemp = cities.reduce((s, [, d]) => s + (d.stats?.temp_max_7d || 0), 0) / (cities.length || 1);
                const totalRain = cities.reduce((s, [, d]) => s + (d.stats?.rain_total_7d || 0), 0);
                const maxAqi = Math.max(...cities.map(([n]) => aqiData[n]?.stats?.aqi_max || 0));
                const alerts = (alertsData || []).filter(a => cities.some(([n]) => n === a.district));
                response += `<b>${p}</b><br>`;
                response += `  🌡 Avg Max: ${fmtC(avgTemp)} | 🌧 Total Rain: ${fmtMm(totalRain)} | 💨 AQI: ${Math.round(maxAqi)} | 🚨 Alerts: ${alerts.length}<br><br>`;
            });
        } else if (q.includes('health') || q.includes('advisory')) {
            const hotCities = Object.entries(weatherData).filter(([, d]) => (d.stats?.temp_max_7d || 0) >= 40);
            const badAqi = Object.entries(aqiData).filter(([, d]) => (d.stats?.aqi_max || 0) > 150);
            const highUv = Object.entries(weatherData).filter(([, d]) => (d.stats?.uv_max_7d || 0) >= 8);
            response = `<b>🏥 Health Advisory</b><br><br>`;
            response += `<b>🌡 Heat Risk:</b><br>`;
            response += hotCities.length > 0 ? `⚠️ ${hotCities.length} districts with extreme heat (≥40°C). Vulnerable populations should stay indoors, hydrate frequently, and avoid outdoor activities during peak hours (11am-3pm).` : '✅ Heat conditions are within safe ranges.';
            response += `<br><br><b>💨 Air Quality:</b><br>`;
            response += badAqi.length > 0 ? `⚠️ ${badAqi.length} districts with hazardous air quality (AQI >150). Sensitive groups should limit outdoor exposure. Use masks in affected areas.` : '✅ Air quality is acceptable.';
            response += `<br><br><b>☀ UV Exposure:</b><br>`;
            response += highUv.length > 0 ? `⚠️ ${highUv.length} districts with very high UV index (≥8). Use sunscreen, protective clothing, and seek shade during midday hours.` : '✅ UV levels are moderate.';
        } else if (q.includes('trend') || q.includes('7-day')) {
            const improving = Object.entries(weatherData).filter(([, d]) => {
                const f = d.forecast || [];
                return f.length >= 3 && f[f.length - 1].temp_max < f[0].temp_max;
            });
            const worsening = Object.entries(weatherData).filter(([, d]) => {
                const f = d.forecast || [];
                return f.length >= 3 && f[f.length - 1].temp_max > f[0].temp_max;
            });
            response = `<b>📈 7-Day Trend Analysis</b><br><br>`;
            response += `<b>Improving conditions:</b> ${improving.length} districts<br>`;
            response += `<b>Worsening conditions:</b> ${worsening.length} districts<br><br>`;
            if (worsening.length > 0) {
                response += `<b>⚠️ Districts with worsening trends:</b><br>`;
                worsening.slice(0, 8).forEach(([name, d]) => {
                    const f = d.forecast || [];
                    const change = f[f.length - 1].temp_max - f[0].temp_max;
                    response += `• <b>${name}</b> — +${fmt(change, 1)}°C over 7 days<br>`;
                });
            }
        } else if (q.includes('extreme') || q.includes('event')) {
            const extremeAlerts = (alertsData || []).filter(a => a.severity === 'extreme');
            response = `<b>⚡ Extreme Weather Events</b><br><br>`;
            response += `Active extreme-level alerts: <b>${extremeAlerts.length}</b><br><br>`;
            if (extremeAlerts.length > 0) {
                extremeAlerts.forEach(a => {
                    const prov = weatherData[a.district]?.province || 'Unknown';
                    response += `${a.icon || '⚠'} <b>${a.type.replace(/_/g, ' ').toUpperCase()}</b><br>`;
                    response += `  District: ${a.district} (${prov})<br>`;
                    response += `  Value: ${fmt(a.value, 0)}<br>`;
                    response += `  ${a.message || 'No additional details'}<br><br>`;
                });
            } else {
                response += '✅ No extreme-level alerts currently active.';
            }
        } else if (q.includes('situation') || q.includes('report') || q.includes('summary')) {
            const s = summaryData || {};
            const alerts = alertsData || [];
            response = `<b>🛰 National Climate Situation Report</b><br>`;
            response += `<i>${new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</i><br><br>`;
            response += `<b>Key Metrics:</b><br>`;
            response += `• Districts Monitored: ${s.districts_monitored || Object.keys(weatherData).length}<br>`;
            response += `• Peak Temperature: ${fmtC(s.hottest?.temp)} at ${s.hottest?.district || 'N/A'}<br>`;
            response += `• Most Rainfall (7d): ${fmtMm(s.wettest?.rain)} at ${s.wettest?.district || 'N/A'}<br>`;
            response += `• Worst AQI: ${s.worst_aqi?.aqi ? Math.round(s.worst_aqi.aqi) : 'N/A'} at ${s.worst_aqi?.district || 'N/A'}<br>`;
            response += `• Peak River Flow: ${s.highest_river?.discharge ? fmtCusecs(s.highest_river.discharge) : 'N/A'} at ${s.highest_river?.station || 'N/A'}<br>`;
            response += `• Active Alerts: ${alerts.length} (${alerts.filter(a => a.severity === 'extreme').length} extreme)<br><br>`;
            response += `<b>Advisory:</b> `;
            if (alerts.filter(a => a.severity === 'extreme').length > 0) {
                response += '⚠️ EXTREME conditions detected in multiple districts. Emergency protocols should be activated.';
            } else if (alerts.length > 5) {
                response += '🟠 Multiple warnings active. Enhanced monitoring recommended.';
            } else {
                response += '✅ Conditions are generally within normal ranges. Routine monitoring sufficient.';
            }
        } else {
            response = `<b>✨ AI Climate Analyst</b><br><br>`;
            response += `I can help you analyze climate data across Pakistan. Try asking about:<br><br>`;
            response += `• <b>Heatwave conditions</b> — temperature analysis and heat exposure<br>`;
            response += `• <b>Flood risk</b> — rainfall and river discharge assessment<br>`;
            response += `• <b>Air quality</b> — AQI levels and health implications<br>`;
            response += `• <b>Drought</b> — precipitation deficit analysis<br>`;
            response += `• <b>Province comparison</b> — cross-province climate metrics<br>`;
            response += `• <b>Health advisory</b> — health risk assessment<br>`;
            response += `• <b>River levels</b> — discharge monitoring<br>`;
            response += `• <b>Situation report</b> — comprehensive daily briefing<br><br>`;
            response += `<i>Or use one of the quick-prompt buttons below!</i>`;
        }
        return response;
    }

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>✨ AI Climate Analyst</h2>
        <p>Ask questions about Pakistan's climate conditions — powered by real-time data analysis</p>
    </div>
    <div class="card mb-3">
        <div class="card-header"><h3>🚀 Quick Prompts</h3></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px">
            ${prompts.map(p => `
                <button class="quick-prompt" style="background:var(--bg-card);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:8px 14px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;transition:all .2s"
                    onmouseover="this.style.borderColor='${C.accent}';this.style.background='${C.accent}22'"
                    onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--bg-card)'"
                    data-prompt="${p.prompt.replace(/"/g, '&quot;')}">
                    <span>${p.icon}</span><span>${p.label}</span>
                </button>
            `).join('')}
        </div>
    </div>
    <div class="card-grid g3 mb-3">
        <div class="stat-card s-red"><div class="stat-icon">🌡</div><div class="stat-value">${Object.entries(weatherData).filter(([, d]) => (d.stats?.temp_max_7d || 0) >= 40).length}</div><div class="stat-label">Heatwave Districts</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">💨</div><div class="stat-value">${Object.entries(aqiData).filter(([, d]) => (d.stats?.aqi_max || 0) > 150).length}</div><div class="stat-label">Poor AQI Districts</div></div>
        <div class="stat-card s-cyan"><div class="stat-icon">🌊</div><div class="stat-value">${(riverData?.stations || []).filter(s => s.category === 'Extreme' || s.category === 'Very High').length}</div><div class="stat-label">High River Levels</div></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
        <div style="display:flex;flex-direction:column;height:500px">
            <div id="ai-chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px">
                <div class="chat-msg assistant">
                    <div class="chat-avatar">🤖</div>
                    <div class="chat-bubble">
                        <div class="chat-text">Welcome to the AI Climate Analyst! I have access to real-time weather data for <b>${Object.keys(weatherData).length}</b> districts, AQI data for <b>${Object.keys(aqiData).length}</b> stations, river discharge for <b>${(riverData?.stations || []).length}</b> stations, and <b>${(alertsData || []).length}</b> active alerts.<br><br>Ask me anything about Pakistan's climate conditions, or use the quick prompts above!</div>
                        <div class="chat-time">${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>
            <div style="border-top:1px solid var(--border);padding:12px;display:flex;gap:10px;align-items:center">
                <input id="ai-chat-input" type="text" placeholder="Ask about climate conditions..."
                    style="flex:1;background:var(--bg-input);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-size:13px">
                <button id="ai-send" style="background:${C.accent};color:#fff;border:none;border-radius:8px;padding:10px 20px;cursor:pointer;font-weight:600">Send</button>
            </div>
        </div>
    </div>`;

    // Style chat messages
    const style = document.createElement('style');
    style.textContent = `
        .chat-msg { display: flex; gap: 10px; align-items: flex-start; }
        .chat-msg.user { flex-direction: row-reverse; }
        .chat-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .chat-bubble { max-width: 75%; padding: 12px 16px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
        .chat-msg.user .chat-bubble { background: ${C.accent}22; border: 1px solid ${C.accent}44; color: var(--text-primary); }
        .chat-msg.assistant .chat-bubble { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); }
        .chat-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; }
    `;
    el.appendChild(style);

    setTimeout(() => {
        // Quick prompt buttons
        $$('.quick-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                addMessage('user', prompt);
                renderChat();
                setTimeout(() => {
                    const response = generateResponse(prompt);
                    addMessage('assistant', response);
                    renderChat();
                }, 300);
            });
        });

        // Chat input
        const input = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-send');
        function sendMessage() {
            const msg = input?.value?.trim();
            if (!msg) return;
            addMessage('user', msg);
            renderChat();
            input.value = '';
            setTimeout(() => {
                const response = generateResponse(msg);
                addMessage('assistant', response);
                renderChat();
            }, 300);
        }
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
    }, 100);
}
