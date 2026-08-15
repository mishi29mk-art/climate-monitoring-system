/* ─── Time-Series Chart Helper ──────────────────────────────── */
let _tsData = null;

async function loadTimeSeriesData() {
    if (_tsData) return _tsData;
    try {
        const res = await fetch('/api/charts/timeseries');
        _tsData = await res.json();
        return _tsData;
    } catch(e) { console.error('TS data error:', e); return null; }
}

function renderTimeSeriesChart(canvasId, data, period, title, unit, colors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;
    
    const periodData = data[period] || {};
    const labels = data.labels?.[period] || [];
    const districtNames = Object.keys(periodData).slice(0, 5);
    
    const datasets = districtNames.map((name, i) => ({
        label: name,
        data: periodData[name] || [],
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + '20',
        borderWidth: 2,
        pointRadius: period === 'daily' ? 2 : 3,
        tension: 0.4,
        fill: false,
    }));
    
    // Destroy existing chart if any
    const existing = Chart.getChart(ctx.canvas);
    if (existing) existing.destroy();
    
    new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 12, padding: 8 } },
                title: { display: true, text: title, color: '#e2e8f0', font: { size: 13 } }
            },
            scales: {
                x: { ticks: { color: '#64748b', font: { size: 9 }, maxRotation: 45 }, grid: { color: 'rgba(59,130,246,0.08)' } },
                y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + unit }, grid: { color: 'rgba(59,130,246,0.08)' } }
            }
        }
    });
}

function createTimePeriodButtons(containerId, chartType) {
    return `
        <div style="display:flex;gap:6px;margin-bottom:12px">
            <button onclick="switchTimePeriod('${chartType}','daily','${containerId}')" class="ts-btn active" data-period="daily" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(59,130,246,0.3);background:rgba(59,130,246,0.15);color:#60a5fa;cursor:pointer;font-size:11px;font-weight:600">📅 Today</button>
            <button onclick="switchTimePeriod('${chartType}','weekly','${containerId}')" class="ts-btn" data-period="weekly" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(100,116,139,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">📅 This Week</button>
            <button onclick="switchTimePeriod('${chartType}','monthly','${containerId}')" class="ts-btn" data-period="monthly" style="padding:5px 12px;border-radius:16px;border:1px solid rgba(100,116,139,0.2);background:transparent;color:#94a3b8;cursor:pointer;font-size:11px">📅 This Month</button>
        </div>`;
}

async function switchTimePeriod(chartType, period, containerId) {
    // Update button states
    const container = document.getElementById(containerId);
    if (container) {
        container.querySelectorAll('.ts-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = '#94a3b8';
            b.style.borderColor = 'rgba(100,116,139,0.2)';
        });
        const activeBtn = container.querySelector(`[data-period="${period}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = 'rgba(59,130,246,0.15)';
            activeBtn.style.color = '#60a5fa';
            activeBtn.style.borderColor = 'rgba(59,130,246,0.3)';
        }
    }
    
    const data = await loadTimeSeriesData();
    if (!data) return;
    
    const colors = {
        temp: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
        rain: ['#3b82f6','#06b6d4','#8b5cf6','#a855f7','#6366f1'],
        aqi: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
    };
    
    if (chartType === 'temperature') {
        renderTimeSeriesChart('ts-temp-chart', data.temperature, period, 'Temperature Trends', '°C', colors.temp);
    } else if (chartType === 'rainfall') {
        renderTimeSeriesChart('ts-rain-chart', data.rainfall, period, 'Rainfall Patterns', 'mm', colors.rain);
    } else if (chartType === 'aqi') {
        renderTimeSeriesChart('ts-aqi-chart', data.aqi, period, 'Air Quality Index', ' AQI', colors.aqi);
    }
}

async function initTimeSeriesCharts() {
    const data = await loadTimeSeriesData();
    if (!data) return;
    
    const colors = {
        temp: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
        rain: ['#3b82f6','#06b6d4','#8b5cf6','#a855f7','#6366f1'],
        aqi: ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'],
    };
    
    renderTimeSeriesChart('ts-temp-chart', data.temperature, 'daily', 'Temperature Trends', '°C', colors.temp);
    renderTimeSeriesChart('ts-rain-chart', data.rainfall, 'daily', 'Rainfall Patterns', 'mm', colors.rain);
    renderTimeSeriesChart('ts-aqi-chart', data.aqi, 'daily', 'Air Quality Index', ' AQI', colors.aqi);
}
