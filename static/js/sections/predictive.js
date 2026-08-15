/* ─── Predictive Analytics (ML Models) ─────────────────────── */
async function render_predictive(el) {
    el.innerHTML = '<div class="loading">Loading predictive models…</div>';
    try {
        const [tempRes, rainRes, floodRes, droughtRes] = await Promise.all([
            fetch('/api/predict/temperature').then(r=>r.json()),
            fetch('/api/predict/rainfall').then(r=>r.json()),
            fetch('/api/predict/flood').then(r=>r.json()),
            fetch('/api/predict/drought').then(r=>r.json()),
        ]);

        const preds = tempRes.predictions || {};
        const rainPreds = rainRes.predictions || {};
        const floodPreds = floodRes.predictions || [];
        const droughtPreds = droughtRes.predictions || [];

        // Compute stats
        const rising = Object.values(preds).filter(p=>p.direction==='rising').length;
        const falling = Object.values(preds).filter(p=>p.direction==='falling').length;
        const highFlood = floodPreds.filter(f=>f.risk_level==='High'||f.risk_level==='Extreme').length;
        const droughtAffected = droughtRes.affected || 0;
        const avgConfidence = Math.round(Object.values(preds).reduce((s,p)=>s+p.confidence,0)/Math.max(1,Object.keys(preds).length));

        el.innerHTML = `
        <div class="sec-hdr"><h2>🤖 Predictive Analytics</h2><p>ML-powered climate forecasting — temperature trends, rainfall probability, flood prediction, drought early warning</p>
        <div class="hdr-meta"><span>🧠 ${tempRes.model}</span><span>📅 ${tempRes.horizon} horizon</span><span>📊 ${avgConfidence}% avg confidence</span></div></div>

        <div class="card-grid g4">
            <div class="stat-card s-orange"><div class="stat-icon">🌡</div><div class="stat-value" style="color:${C.orange}">${rising}</div><div class="stat-label">Rising Temps</div><div class="stat-sub">${falling} falling</div></div>
            <div class="stat-card s-blue"><div class="stat-icon">🌧</div><div class="stat-value" style="color:${C.info}">${Object.keys(rainPreds).length}</div><div class="stat-label">Rain Forecasts</div><div class="stat-sub">${rainRes.model}</div></div>
            <div class="stat-card s-red"><div class="stat-icon">🌊</div><div class="stat-value" style="color:${C.danger}">${highFlood}</div><div class="stat-label">High Flood Risk</div><div class="stat-sub">${floodRes.model}</div></div>
            <div class="stat-card s-yellow"><div class="stat-icon">🏜</div><div class="stat-value" style="color:${C.warning}">${droughtAffected}</div><div class="stat-label">Drought Affected</div><div class="stat-sub">${droughtRes.model}</div></div>
        </div>

        <!-- Temperature Predictions -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🌡 Temperature Forecast (3-Day)</h3><span class="badge b-info">ML Model</span></div>
                <div class="tbl-scroll" style="max-height:350px"><table class="tbl"><thead><tr><th>District</th><th>Current</th><th>Predicted</th><th>Trend</th><th>Confidence</th></tr></thead><tbody>
                ${Object.entries(preds).sort((a,b)=>b[1].predicted_3d-a[1].predicted_3d).slice(0,15).map(([name,p])=>`
                    <tr><td><b>${name}</b><br><span style="font-size:10px;color:var(--text-muted)">${p.province}</span></td>
                    <td style="color:${tempColor(p.current)};font-weight:600">${fmtC(p.current)}</td>
                    <td style="color:${tempColor(p.predicted_3d)};font-weight:600">${fmtC(p.predicted_3d)}</td>
                    <td><span class="badge ${p.direction==='rising'?'b-danger':p.direction==='falling'?'b-success':'b-info'}">${p.direction==='rising'?'↑ Rising':p.direction==='falling'?'↓ Falling':'→ Stable'}</span></td>
                    <td><div class="progress" style="width:80px"><div class="fill" style="width:${p.confidence}%;background:${p.confidence>80?C.success:p.confidence>60?C.warning:C.danger}"></div></div><span style="font-size:10px">${p.confidence}%</span></td>
                </tr>`).join('')}
                </tbody></table></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🌊 Flood Risk Prediction</h3><span class="badge b-danger">${highFlood} High Risk</span></div>
                <div class="tbl-scroll" style="max-height:350px"><table class="tbl"><thead><tr><th>District</th><th>Risk Score</th><th>Probability</th><th>Lead Time</th><th>Level</th></tr></thead><tbody>
                ${floodPreds.slice(0,15).map(f=>`
                    <tr><td><b>${f.district}</b><br><span style="font-size:10px;color:var(--text-muted)">${f.province}</span></td>
                    <td><div class="progress" style="width:80px"><div class="fill" style="width:${f.risk_score}%;background:${f.risk_score>60?C.danger:f.risk_score>30?C.warning:C.success}"></div></div><span style="font-size:10px">${f.risk_score}</span></td>
                    <td style="font-weight:600;color:${f.probability>60?C.danger:C.warning}">${f.probability}%</td>
                    <td style="font-size:12px">${f.lead_time}</td>
                    <td><span class="badge ${f.risk_level==='Extreme'?'b-danger':f.risk_level==='High'?'b-warning':f.risk_level==='Moderate'?'b-orange':'b-success'}">${f.risk_level}</span></td>
                </tr>`).join('')}
                </tbody></table></div>
            </div>
        </div>

        <!-- Rainfall & Drought -->
        <div class="card-grid g2 mt-3">
            <div class="card">
                <div class="card-header"><h3>🌧 Rainfall Probability</h3><span class="badge b-info">${rainRes.model}</span></div>
                <div class="tbl-scroll" style="max-height:300px"><table class="tbl"><thead><tr><th>District</th><th>Current 7d</th><th>Predicted</th><th>Probability</th><th>Risk</th></tr></thead><tbody>
                ${Object.entries(rainPreds).sort((a,b)=>b[1].predicted_next-a[1].predicted_next).slice(0,12).map(([name,p])=>`
                    <tr><td><b>${name}</b></td><td>${fmtMm(p.current_7d)}</td><td style="color:${C.info};font-weight:600">${fmtMm(p.predicted_next)}</td>
                    <td><div class="progress" style="width:60px"><div class="fill" style="width:${p.probability}%;background:${C.info}"></div></div>${p.probability}%</td>
                    <td><span class="badge ${p.risk==='High'?'b-danger':p.risk==='Moderate'?'b-warning':'b-success'}">${p.risk}</span></td>
                </tr>`).join('')}
                </tbody></table></div>
            </div>
            <div class="card">
                <div class="card-header"><h3>🏜 Drought Early Warning</h3><span class="badge b-warning">${droughtAffected} affected</span></div>
                <div class="tbl-scroll" style="max-height:300px"><table class="tbl"><thead><tr><th>District</th><th>SPI</th><th>Severity</th><th>Water Stress</th><th>Trend</th></tr></thead><tbody>
                ${droughtPreds.slice(0,12).map(d=>`
                    <tr><td><b>${d.district}</b></td>
                    <td style="color:${d.spi<-1.5?C.danger:d.spi<-1?C.warning:C.success};font-weight:600">${d.spi}</td>
                    <td><span class="badge ${d.severity==='Extreme'?'b-danger':d.severity==='Severe'?'b-warning':d.severity==='Moderate'?'b-orange':'b-success'}">${d.severity}</span></td>
                    <td style="font-size:12px">${d.water_stress}</td>
                    <td style="font-size:12px;color:${d.trend==='worsening'?C.danger:C.success}">${d.trend}</td>
                </tr>`).join('')}
                </tbody></table></div>
            </div>
        </div>

        <!-- Model Info -->
        <div class="card mt-3">
            <div class="card-header"><h3>🧠 ML Models Used</h3></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:8px 0">
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center">
                    <div style="font-size:20px;margin-bottom:4px">🌡</div>
                    <div style="font-weight:600;font-size:12px">Temperature</div>
                    <div style="font-size:11px;color:var(--text-muted)">${tempRes.model}</div>
                    <div style="font-size:10px;color:${C.info}">${tempRes.horizon}</div>
                </div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center">
                    <div style="font-size:20px;margin-bottom:4px">🌧</div>
                    <div style="font-weight:600;font-size:12px">Rainfall</div>
                    <div style="font-size:11px;color:var(--text-muted)">${rainRes.model}</div>
                    <div style="font-size:10px;color:${C.info}">${rainRes.horizon}</div>
                </div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center">
                    <div style="font-size:20px;margin-bottom:4px">🌊</div>
                    <div style="font-weight:600;font-size:12px">Flood</div>
                    <div style="font-size:11px;color:var(--text-muted)">${floodRes.model}</div>
                    <div style="font-size:10px;color:${C.info}">${floodRes.stations} stations</div>
                </div>
                <div style="padding:12px;background:var(--bg-secondary);border-radius:var(--r-md);border:1px solid var(--border);text-align:center">
                    <div style="font-size:20px;margin-bottom:4px">🏜</div>
                    <div style="font-weight:600;font-size:12px">Drought</div>
                    <div style="font-size:11px;color:var(--text-muted)">${droughtRes.model}</div>
                    <div style="font-size:10px;color:${C.info}">${droughtRes.affected} affected</div>
                </div>
            </div>
        </div>`;
    } catch(e) { el.innerHTML = '<div class="loading">Error: '+e.message+'</div>'; }
}
