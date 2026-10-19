// PV Forecast Page
export function renderPVForecast(container, data) {
    const { pvForecast, weather } = data;

    container.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
                <span class="text-sm font-semibold text-[#C5CBCE]">PV Generation Forecast</span>
                <div class="flex gap-1">
                    <button class="tab-item active">Intraday</button><button class="tab-item">Day-ahead</button>
                </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-[#68707E]">
                <span>Model: ${pvForecast.modelVersion}</span><span>|</span><span>Task: ${pvForecast.taskId}</span>
            </div>
        </div>
        <div class="grid grid-cols-4 gap-3 mb-4">
            ${fkpi('Peak Forecast', '7.82 MW', '13:30', '#FFD83C')}
            ${fkpi('Daily Generation', '48.5 MWh', '', '#47DFED')}
            ${fkpi('Confidence', 'P10-P90', 'Probabilistic', '#00FF79')}
            ${fkpi('Weather', weather.current.condition, weather.current.temp + 'C', '#939CAC')}
        </div>
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-[#C5CBCE]">Power Forecast Curve</span>
                    <div class="flex items-center gap-3 text-xs">
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#FFD83C] mr-1"></span>P50</span>
                        <span><span class="inline-block w-3 h-3 bg-[#47DFED]/20 rounded-sm mr-1"></span>P10-P90</span>
                        <span><span class="inline-block w-3 h-3 rounded-sm bg-[#00FF79] mr-1"></span>Actual</span>
                    </div>
                </div>
                <div id="forecastChart" class="chart-container" style="height:300px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Hourly Weather</div>
                <div class="space-y-2">
                    ${weather.forecast.map(w => `<div class="flex items-center justify-between p-2 bg-[#0a0e17] rounded text-xs">
                        <span class="text-[#C5CBCE] w-12">${w.hour}</span>
                        <span class="text-[#939CAC] w-12 text-center">${w.condition}</span>
                        <span class="text-[#47DFED] w-12 text-center">${w.temp}C</span>
                        <div class="w-20"><div class="progress-bar" style="height:4px;"><div class="progress-fill primary" style="width:${w.irradiance/10}%"></div></div><div class="text-[#68707E] mt-0.5">${w.irradiance} W/m2</div></div>
                    </div>`).join('')}
                </div>
            </div>
        </div>
        <div class="card">
            <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Error Assessment</div>
            <div class="grid grid-cols-4 gap-4">
                ${emetric('MAE', '0.32 MW', 'Mean Absolute Error')}
                ${emetric('RMSE', '0.45 MW', 'Root Mean Square Error')}
                ${emetric('nRMSE', '8.5%', 'Normalized RMSE')}
                ${emetric('R2', '0.92', 'Coefficient of Determination')}
            </div>
        </div>
    `;
    setTimeout(() => renderForecastChart(), 100);
}

function fkpi(title, value, sub, color) {
    return `<div class="kpi-card"><div class="text-xs text-[#68707E] mb-1">${title}</div><div class="text-xl font-bold" style="color:${color}">${value}</div>${sub?`<div class="text-xs mt-1 text-[#68707E]">${sub}</div>`:''}</div>`;
}

function emetric(label, value, desc) {
    return `<div class="text-center p-3 bg-[#0a0e17] rounded"><div class="text-xs text-[#68707E] mb-1">${label}</div><div class="text-lg font-bold text-[#47DFED]">${value}</div><div class="text-xs text-[#68707E]">${desc}</div></div>`;
}

function renderForecastChart() {
    const chart = echarts.init(document.getElementById('forecastChart'));
    const hours = []; const p50 = []; const p10 = []; const p90 = []; const actual = [];
    for (let i = 6; i <= 20; i++) {
        hours.push(i + ':00');
        const f = i < 8 ? (i-6)/2*0.3 : i < 12 ? 0.3+(i-8)/4*0.7 : i < 14 ? 1.0 : i < 17 ? 1.0-(i-14)/3*0.6 : 0.4-(i-17)/3*0.35;
        const b = 8.5 * Math.max(0.05, f);
        p50.push(parseFloat(b.toFixed(2)));
        p10.push(parseFloat((b*0.85).toFixed(2)));
        p90.push(parseFloat((b*1.12).toFixed(2)));
        actual.push(i <= 10 ? parseFloat((b*(0.92+Math.random()*0.16)).toFixed(2)) : null);
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['P50', 'P10-P90', 'Actual'], bottom: 0, textStyle: { color: '#939CAC', fontSize: 11 } },
        grid: { top: 10, right: 20, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 10 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [
            { name: 'P10-P90', type: 'line', data: p90, smooth: true, lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(71,223,237,0.1)' }, itemStyle: { opacity: 0 }, symbol: 'none', stack: 'ci' },
            { name: 'P10-P90', type: 'line', data: p10, smooth: true, lineStyle: { opacity: 0 }, areaStyle: { color: 'rgba(71,223,237,0.1)' }, itemStyle: { opacity: 0 }, symbol: 'none', stack: 'ci' },
            { name: 'P50', type: 'line', data: p50, smooth: true, lineStyle: { color: '#FFD83C', width: 2 }, itemStyle: { color: '#FFD83C' }, symbol: 'circle', symbolSize: 5 },
            { name: 'Actual', type: 'line', data: actual, smooth: true, lineStyle: { color: '#00FF79', width: 2.5 }, itemStyle: { color: '#00FF79' }, symbol: 'diamond', symbolSize: 6 },
        ]
    });
}
