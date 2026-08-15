/* ─── Drought Monitor Section ──────────────────────────────── */
function render_drought(el) {
    const w = weatherData || {};
    const entries = Object.entries(w);

    // Compute drought metrics using SPI
    const droughtData = entries.map(([n, d]) => {
        const rain = d.stats?.rain_total_7d || 0;
        const temp = d.stats?.temp_max_7d || 0;
        const normal = 25; // approximate 7-day normal for Pakistan
        const spiVal = spi(rain, normal);
        let severity = 'Normal';
        if (spiVal < -2) severity = 'Extreme';
        else if (spiVal < -1.5) severity = 'Severe';
        else if (spiVal < -1) severity = 'Moderate';
        else if (spiVal < 0) severity = 'Mild';
        return { name: n, province: d.province, rain, temp, spi: spiVal, severity, stats: d.stats };
    });

    const sorted = droughtData.sort((a, b) => a.spi - b.spi);
    const extremeDrought = sorted.filter(d => d.spi < -2).length;
    const severeDrought = sorted.filter(d => d.spi >= -2 && d.spi < -1.5).length;
    const moderateDrought = sorted.filter(d => d.spi >= -1.5 && d.spi < -1).length;
    const mildDrought = sorted.filter(d => d.spi >= -1 && d.spi < 0).length;
    const normalAreas = sorted.filter(d => d.spi >= 0).length;
    const avgSpi = sorted.length ? sorted.reduce((a, b) => a + b.spi, 0) / sorted.length : 0;

    // Province averages
    const provMap = {};
    sorted.forEach(d => {
        if (!provMap[d.province]) provMap[d.province] = [];
        provMap[d.province].push(d.spi);
    });
    const provSpi = Object.entries(provMap).map(([p, vals]) => ({
        name: p, avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length
    })).sort((a, b) => a.avg - b.avg);

    el.innerHTML = `
    <div class="sec-hdr">
        <h2>🏜 Drought Monitor</h2>
        <p>Standardized Precipitation Index (SPI) — drought severity classification across Pakistan</p>
        <div class="hdr-meta">
            <span>📊 ${entries.length} districts analyzed</span>
            <span>🔴 ${extremeDrought} extreme drought</span>
            <span>🟠 ${severeDrought} severe drought</span>
        </div>
    </div>
    <div class="card-grid g4">
        <div class="stat-card s-red"><div class="stat-icon">🏜</div>
            <div class="stat-value" style="color:${C.danger}">${extremeDrought}</div>
            <div class="stat-label">Extreme Drought</div><div class="stat-sub">SPI &lt; -2.0</div></div>
        <div class="stat-card s-orange"><div class="stat-icon">⚠</div>
            <div class="stat-value" style="color:${C.orange}">${severeDrought}</div>
            <div class="stat-label">Severe Drought</div><div class="stat-sub">SPI -2.0 to -1.5</div></div>
        <div class="stat-card s-yellow"><div class="stat-icon">📊</div>
            <div class="stat-value">${fmt(avgSpi, 2)}</div>
            <div class="stat-label">Average SPI</div>
            <div class="stat-sub">${avgSpi < -1 ? 'Widespread deficit' : avgSpi < 0 ? 'Below normal' : 'Normal range'}</div></div>
        <div class="stat-card s-green"><div class="stat-icon">✅</div>
            <div class="stat-value" style="color:${C.success}">${normalAreas}</div>
            <div class="stat-label">Normal Areas</div><div class="stat-sub">SPI ≥ 0</div></div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">🗺 Drought Severity Map</h3>
            <div id="drought-map" class="map-container"></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📊 Drought Severity Distribution</h3>
            <div class="chart-wrap"><canvas id="drought-doughnut"></canvas></div>
            <h3 style="margin:14px 0 8px">📊 Province SPI Comparison</h3>
            <div class="chart-wrap" style="height:180px"><canvas id="drought-prov-bar"></canvas></div>
        </div>
    </div>
    <div class="card-grid g2 mt-3">
        <div class="card">
            <h3 style="margin-bottom:10px">📈 SPI by Province (Radar)</h3>
            <div class="chart-wrap"><canvas id="drought-radar"></canvas></div>
        </div>
        <div class="card">
            <h3 style="margin-bottom:10px">📉 Worst 15 Drought Districts</h3>
            <div class="chart-wrap"><canvas id="drought-worst-bar"></canvas></div>
        </div>
    </div>
    <div class="card mt-3">
        <div class="card-header"><h3>📋 Full Drought Data (${entries.length} districts)</h3></div>
        <div class="tbl-scroll" style="max-height:500px">
            <table class="tbl">
                <thead><tr><th>#</th><th>District</th><th>Province</th><th>7d Rain</th><th>SPI</th><th>Severity</th><th>Temp</th></tr></thead>
                <tbody>
                ${sorted.map((d, i) => `<tr>
                    <td>${i + 1}</td><td><b>${d.name}</b></td><td>${d.province}</td>
                    <td style="color:${rainColor(d.rain)}">${fmtMm(d.rain)}</td>
                    <td style="color:${d.spi < -1.5 ? C.danger : d.spi < 0 ? C.warning : C.success}"><b>${fmt(d.spi, 2)}</b></td>
                    <td>${severityBadge(d.severity.toLowerCase())}</td>
                    <td style="color:${tempColor(d.temp)}">${fmtC(d.temp)}</td>
                </tr>`).join('')}
                </tbody>
            </table>
        </div>
    </div>`;

    setTimeout(() => {
        // Drought map
        const map = initFloodReplayMap('drought-map', { zoom: 6 });
        addDistrictMarkers(map, w,
            (n, d) => {
                const rain = d.stats?.rain_total_7d || 0;
                const s = spi(rain, 25);
                return s < -2 ? C.danger : s < -1.5 ? C.orange : s < -1 ? C.warning : s < 0 ? C.yellow : C.success;
            },
            (n, d) => {
                const rain = d.stats?.rain_total_7d || 0;
                const s = spi(rain, 25);
                return `<b>${n}</b><br>${d.province}<br>SPI: ${fmt(s, 2)}<br>Rain: ${fmtMm(rain)}`;
            }
        );
        // Doughnut
        const dc = document.getElementById('drought-doughnut');
        if (dc) makeDoughnut(dc.getContext('2d'),
            ['Extreme', 'Severe', 'Moderate', 'Mild', 'Normal'],
            [extremeDrought, severeDrought, moderateDrought, mildDrought, normalAreas],
            [C.danger, C.orange, C.warning, C.yellow, C.success]
        );
        // Province bar
        const pb = document.getElementById('drought-prov-bar');
        if (pb) makeBar(pb.getContext('2d'),
            provSpi.map(p => p.name), provSpi.map(p => p.avg),
            provSpi.map(p => p.avg < -1.5 ? C.danger : p.avg < -0.5 ? C.warning : C.success),
            { barThickness: 20 }
        );
        // Radar
        const rd = document.getElementById('drought-radar');
        if (rd) makeRadar(rd.getContext('2d'),
            provSpi.map(p => p.name),
            [{ label: 'Avg SPI', data: provSpi.map(p => p.avg), borderColor: C.warning, backgroundColor: 'rgba(210,153,34,.15)' }]
        );
        // Worst bar
        const wb = document.getElementById('drought-worst-bar');
        if (wb) makeHBar(wb.getContext('2d'),
            sorted.slice(0, 15).map(d => d.name), sorted.slice(0, 15).map(d => d.spi),
            sorted.slice(0, 15).map(d => d.spi < -2 ? C.danger : d.spi < -1 ? C.warning : C.yellow)
        );
    }, 150);
}
