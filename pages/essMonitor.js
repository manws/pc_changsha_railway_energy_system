// ESS Monitor Page
import { formatPower, formatPercent, getStatusText } from '../mockData.js';

export function renderESSMonitor(container, data) {
    const { essDevices, overview } = data;

    container.innerHTML = `
        <div class="grid grid-cols-4 gap-3 mb-4">
            ${kpi('ESS Total Power', formatPower(Math.abs(overview.essPower.value)), overview.essPower.trend, '#00FF79')}
            ${kpi('Average SOC', formatPercent(overview.essSoc.value), '', '#47DFED')}
            ${kpi('Total Capacity', '14.0 MWh', '', '#939CAC')}
            ${kpi('Online Devices', essDevices.filter(d=>d.status==='normal').length+'/'+essDevices.length, 'Online Rate '+(essDevices.filter(d=>d.status==='normal').length/essDevices.length*100).toFixed(0)+'%', '#47DFED')}
        </div>
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Station Overview</div>
                <div class="space-y-3">
                    ${stationCard('Station 1', 'Container', '10 MWh / 5 MW', essDevices.filter(d=>d.station==='Station 1'))}
                    ${stationCard('Station 2', 'Cabinet', '4 MWh / 2 MW', essDevices.filter(d=>d.station==='Station 2'))}
                </div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">SOC Trend</div>
                <div id="socTrendChart" class="chart-container" style="height:240px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Charge/Discharge Power</div>
                <div id="essPowerChart" class="chart-container" style="height:240px;"></div>
            </div>
        </div>
        <div class="card">
            <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">ESS Device List</div>
            <table class="data-table">
                <thead><tr><th>Device ID</th><th>Station</th><th>Type</th><th>Capacity(MWh)</th><th>Rated(MW)</th><th>SOC</th><th>SOH</th><th>Power(MW)</th><th>Temp(C)</th><th>Status</th></tr></thead>
                <tbody>${essDevices.map(d => `<tr>
                    <td class="text-[#47DFED] cursor-pointer hover:underline">${d.id}</td>
                    <td>${d.station}</td><td>${d.type}</td><td>${d.capacity}</td><td>${d.ratedPower}</td>
                    <td><div class="flex items-center gap-2"><div class="progress-bar flex-1" style="width:60px;"><div class="progress-fill ${d.soc>80?'accent':d.soc>50?'primary':d.soc>30?'warning':'danger'}" style="width:${d.soc}%"></div></div><span class="text-xs">${d.soc}%</span></div></td>
                    <td><span class="${d.soh>95?'text-[#00FF79]':d.soh>90?'text-[#FFD83C]':'text-[#F8473A]'}">${d.soh}%</span></td>
                    <td class="${d.chargePower>0?'text-[#00FF79]':d.dischargePower>0?'text-[#FFD83C]':'text-[#68707E]'}">${d.chargePower>0?'+'+d.chargePower:d.dischargePower>0?'-'+d.dischargePower:'0'}</td>
                    <td>${d.temp}</td>
                    <td><span class="badge badge-${d.status}">${getStatusText(d.status)}</span></td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    `;
    setTimeout(() => { renderSOCTrend(); renderESSPower(); }, 100);
}

function kpi(title, value, sub, color) {
    return `<div class="kpi-card"><div class="text-xs text-[#68707E] mb-1">${title}</div><div class="text-xl font-bold" style="color:${color}">${value}</div>${sub?`<div class="text-xs mt-1 text-[#68707E]">${sub}</div>`:''}</div>`;
}

function stationCard(name, type, spec, devices) {
    const avgSoc = devices.reduce((s,d)=>s+d.soc,0)/devices.length;
    const nc = devices.filter(d=>d.status==='normal').length;
    const wc = devices.filter(d=>d.status==='warning').length;
    return `<div class="p-3 bg-[#0a0e17] rounded">
        <div class="flex items-center justify-between mb-2"><span class="text-sm font-semibold text-[#C5CBCE]">${name}</span><span class="badge badge-normal">Running</span></div>
        <div class="text-xs text-[#68707E] mb-2">${type} | ${spec}</div>
        <div class="flex items-center gap-4 text-xs">
            <span class="text-[#47DFED]">SOC: ${avgSoc.toFixed(1)}%</span>
            <span class="text-[#00FF79]">Normal: ${nc}</span>
            ${wc>0?`<span class="text-[#FFD83C]">Warning: ${wc}</span>`:''}
        </div>
    </div>`;
}

function renderSOCTrend() {
    const chart = echarts.init(document.getElementById('socTrendChart'));
    const hours = []; const s1 = []; const s2 = [];
    for (let i = 0; i < 24; i++) {
        hours.push(i+':00');
        s1.push(parseFloat((60+Math.sin(i/4)*15+Math.random()*5).toFixed(1)));
        s2.push(parseFloat((50+Math.sin(i/4+1)*12+Math.random()*4).toFixed(1)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Station 1 SOC', 'Station 2 SOC'], bottom: 0, textStyle: { color: '#939CAC', fontSize: 10 } },
        grid: { top: 10, right: 20, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 9, interval: 3 } },
        yAxis: { type: 'value', name: '%', min: 0, max: 100, nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [
            { name: 'Station 1 SOC', type: 'line', data: s1, smooth: true, lineStyle: { color: '#47DFED', width: 2 }, itemStyle: { color: '#47DFED' }, symbol: 'none', areaStyle: { color: 'rgba(71,223,237,0.1)' } },
            { name: 'Station 2 SOC', type: 'line', data: s2, smooth: true, lineStyle: { color: '#00FF79', width: 2 }, itemStyle: { color: '#00FF79' }, symbol: 'none', areaStyle: { color: 'rgba(0,255,121,0.1)' } },
        ]
    });
}

function renderESSPower() {
    const chart = echarts.init(document.getElementById('essPowerChart'));
    const hours = []; const pw = [];
    for (let i = 0; i < 24; i++) {
        hours.push(i+':00');
        pw.push(parseFloat((Math.sin(i/4)*2-0.5+Math.random()*0.5).toFixed(2)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 10, right: 20, bottom: 20, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 9, interval: 3 } },
        yAxis: { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
        series: [{ type: 'bar', data: pw, itemStyle: { color: (p) => p.value >= 0 ? 'rgba(0,255,121,0.6)' : 'rgba(248,71,58,0.6)', borderRadius: [2,2,0,0] }, barWidth: '60%' }]
    });
}
