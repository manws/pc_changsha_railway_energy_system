// PV Monitor Page
import { formatPower, getStatusText } from '../mockData.js';

export function renderPVMonitor(container, data) {
    const { pvDevices, overview } = data;

    container.innerHTML = `
        <div class="grid grid-cols-4 gap-3 mb-4">
            ${kpi('Installed Capacity', overview.pvCapacity.value + ' ' + overview.pvCapacity.unit, 'fa-solar-panel')}
            ${kpi('Current Power', formatPower(overview.pvPower.value), 'fa-bolt')}
            ${kpi('Today Generation', overview.todayGeneration.value + ' ' + overview.todayGeneration.unit, 'fa-sun')}
            ${kpi('Overall Efficiency', '97.8%', 'fa-gauge-high')}
        </div>
        <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="card col-span-2">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-semibold text-[#C5CBCE]">Generation Power Curve</span>
                    <div class="flex gap-2">
                        <button class="tab-item active">1H</button><button class="tab-item">24H</button><button class="tab-item">7D</button>
                    </div>
                </div>
                <div id="pvPowerChart" class="chart-container" style="height:260px;"></div>
            </div>
            <div class="card">
                <div class="text-sm font-semibold mb-3 text-[#C5CBCE]">Zone Statistics</div>
                <div class="space-y-3">
                    ${zoneCard('Roof A', 2.47, 1.25, 'normal')}
                    ${zoneCard('Roof B', 1.80, 0.89, 'warning')}
                    ${zoneCard('Carport C', 1.20, 0.52, 'alarm')}
                    ${zoneCard('Ground D', 2.87, 1.42, 'normal')}
                </div>
            </div>
        </div>
        <div class="card">
            <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-semibold text-[#C5CBCE]">Inverter Device List</span>
                <div class="flex gap-2">
                    <select class="bg-[#0a0e17] border border-[#1a2332] rounded px-2 py-1 text-xs text-[#C5CBCE]">
                        <option>All Zones</option><option>Roof A</option><option>Roof B</option><option>Carport C</option><option>Ground D</option>
                    </select>
                    <input type="text" placeholder="Search device..." class="bg-[#0a0e17] border border-[#1a2332] rounded px-2 py-1 text-xs text-[#C5CBCE] w-40">
                </div>
            </div>
            <table class="data-table">
                <thead><tr><th>Device ID</th><th>Zone</th><th>Model</th><th>Rated(kW)</th><th>Efficiency</th><th>Temp(C)</th><th>Daily(MWh)</th><th>Status</th></tr></thead>
                <tbody>${pvDevices.map(d => `<tr>
                    <td class="text-[#47DFED] cursor-pointer hover:underline">${d.id}</td>
                    <td>${d.zone}</td><td>${d.model}</td><td>${d.power}</td>
                    <td><span class="${d.efficiency < 90 ? 'text-[#F8473A]' : d.efficiency < 96 ? 'text-[#FFD83C]' : 'text-[#00FF79]'}">${d.efficiency}%</span></td>
                    <td><span class="${d.temp > 50 ? 'text-[#F8473A]' : d.temp > 45 ? 'text-[#FFD83C]' : 'text-[#C5CBCE]'}">${d.temp}</span></td>
                    <td>${d.dailyGen}</td>
                    <td><span class="badge badge-${d.status}">${getStatusText(d.status)}</span></td>
                </tr>`).join('')}</tbody>
            </table>
            <div class="flex items-center justify-between mt-3 text-xs text-[#68707E]">
                <span>Total ${pvDevices.length} devices</span>
                <div class="flex gap-2"><button class="btn btn-secondary text-xs" disabled>Prev</button><span class="px-2">1/1</span><button class="btn btn-secondary text-xs" disabled>Next</button></div>
            </div>
        </div>
    `;
    setTimeout(() => renderPVChart(), 100);
}

function kpi(title, value, icon) {
    return `<div class="kpi-card"><div class="flex items-center justify-between mb-1"><span class="text-xs text-[#68707E]">${title}</span><i class="fa-solid ${icon} text-[#47DFED]"></i></div><div class="text-xl font-bold text-[#47DFED]">${value}</div></div>`;
}

function zoneCard(name, power, daily, status) {
    const c = status === 'alarm' ? 'text-[#F8473A]' : status === 'warning' ? 'text-[#FFD83C]' : 'text-[#00FF79]';
    return `<div class="flex items-center justify-between p-2 bg-[#0a0e17] rounded"><div><div class="text-sm text-[#C5CBCE]">${name}</div><div class="text-xs text-[#68707E]">Today ${daily} MWh</div></div><div class="text-right"><div class="text-lg font-bold ${c}">${power} <span class="text-xs">MW</span></div><span class="badge badge-${status}">${getStatusText(status)}</span></div></div>`;
}

function renderPVChart() {
    const chart = echarts.init(document.getElementById('pvPowerChart'));
    const hours = []; const actual = []; const theory = [];
    for (let i = 6; i <= 18; i++) {
        hours.push(i + ':00');
        const f = i < 8 ? (i-6)/2*0.3 : i < 12 ? 0.3+(i-8)/4*0.7 : i < 14 ? 1.0 : i < 17 ? 1.0-(i-14)/3*0.6 : 0.4-(i-17)/2*0.35;
        actual.push(parseFloat((8.5*Math.max(0.05,f)*(0.9+Math.random()*0.2)).toFixed(2)));
        theory.push(parseFloat((8.5*Math.max(0.05,f)).toFixed(2)));
    }
    chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['Actual', 'Theory', 'Irradiance'], bottom: 0, textStyle: { color: '#939CAC', fontSize: 11 } },
        grid: { top: 10, right: 50, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E', fontSize: 10 } },
        yAxis: [
            { type: 'value', name: 'MW', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { lineStyle: { color: '#1a2332' } }, axisLabel: { color: '#68707E' } },
            { type: 'value', name: 'W/m2', nameTextStyle: { color: '#68707E' }, axisLine: { lineStyle: { color: '#1a2332' } }, splitLine: { show: false }, axisLabel: { color: '#68707E' } }
        ],
        series: [
            { name: 'Actual', type: 'line', data: actual, smooth: true, lineStyle: { color: '#FFD83C', width: 2 }, itemStyle: { color: '#FFD83C' }, symbol: 'circle', symbolSize: 4 },
            { name: 'Theory', type: 'line', data: theory, smooth: true, lineStyle: { color: '#47DFED', width: 1.5, type: 'dashed' }, itemStyle: { color: '#47DFED' }, symbol: 'none' },
            { name: 'Irradiance', type: 'bar', yAxisIndex: 1, data: theory.map(v => Math.round(v/8.5*1000)), itemStyle: { color: 'rgba(71,223,237,0.15)' }, barWidth: '60%' },
        ]
    });
}
