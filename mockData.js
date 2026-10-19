// Mock Data Layer - Unified scenario data for all pages

const BASE_TIME = new Date('2026-10-14T10:30:00+08:00');

function generateTimeSeries(hours, intervalMin, baseValue, noise) {
    const points = [];
    const totalPoints = (hours * 60) / intervalMin;
    for (let i = 0; i < totalPoints; i++) {
        const t = new Date(BASE_TIME.getTime() - (totalPoints - i) * intervalMin * 60000);
        const hour = t.getHours();
        let factor = 0;
        if (hour < 6) factor = 0.05;
        else if (hour < 9) factor = (hour - 6) / 3 * 0.6;
        else if (hour < 12) factor = 0.6 + (hour - 9) / 3 * 0.4;
        else if (hour < 14) factor = 1.0;
        else if (hour < 17) factor = 1.0 - (hour - 14) / 3 * 0.6;
        else if (hour < 19) factor = 0.4 - (hour - 17) / 2 * 0.35;
        else factor = 0.05;
        const val = baseValue * factor + (Math.random() - 0.5) * noise;
        points.push({ time: t.toISOString(), value: Math.max(0, parseFloat(val.toFixed(2))) });
    }
    return points;
}

function generateSchedule96() {
    const points = [];
    const startTime = new Date(BASE_TIME);
    startTime.setHours(0, 0, 0, 0);
    for (let i = 0; i < 96; i++) {
        const t = new Date(startTime.getTime() + i * 15 * 60000);
        const hour = t.getHours();
        let pvF = 0, ldF = 0;
        if (hour < 6) { pvF = 0.02; ldF = 0.5; }
        else if (hour < 9) { pvF = 0.15 + (hour - 6) * 0.2; ldF = 0.7; }
        else if (hour < 12) { pvF = 0.5 + (hour - 9) * 0.15; ldF = 0.85; }
        else if (hour < 14) { pvF = 0.95; ldF = 0.9; }
        else if (hour < 17) { pvF = 0.95 - (hour - 14) * 0.2; ldF = 0.85; }
        else if (hour < 20) { pvF = 0.35 - (hour - 17) * 0.1; ldF = 0.75; }
        else { pvF = 0.02; ldF = 0.5; }
        const pv = parseFloat((8.5 * pvF).toFixed(2));
        const ld = parseFloat((12.0 * ldF + Math.random() * 0.5).toFixed(2));
        const ess = pv > ld ? parseFloat((-(pv - ld) * 0.7).toFixed(2)) : parseFloat(((ld - pv) * 0.4).toFixed(2));
        const grid = parseFloat((ld - pv - ess).toFixed(2));
        points.push({
            targetTime: t.toISOString(), pvPower: pv, loadPower: ld,
            essPowerPlan: ess, gridPowerPlan: grid,
            socPlan: parseFloat((55 + (i > 30 ? (i - 30) * 0.3 : 0)).toFixed(1)),
            reasonCode: hour < 8 ? 'LOW_TARIFF_CHARGE' : hour < 17 ? 'PV_SELF_USE' : 'PEAK_SHAVING'
        });
    }
    return points;
}

export const mockData = {
    overview: {
        pvPower: { value: 6.82, unit: 'MW', trend: '+12.5%' },
        pvCapacity: { value: 8.5, unit: 'MWp' },
        loadPower: { value: 9.34, unit: 'MW', trend: '+3.2%' },
        essPower: { value: -2.15, unit: 'MW', trend: 'Discharging' },
        essSoc: { value: 68.5, unit: '%' },
        gridPower: { value: 4.67, unit: 'MW', trend: 'Buying' },
        selfUseRate: { value: 72.3, unit: '%', trend: '+5.1%' },
        todayGeneration: { value: 42.8, unit: 'MWh' },
        todayConsumption: { value: 58.6, unit: 'MWh' },
        todaySaving: { value: 1.86, unit: '万元' },
    },
    energyFlow: {
        pv: { gen: 6.82, selfUse: 4.92, toGrid: 1.10, toEss: 0.80 },
        load: { total: 9.34, fromPv: 4.92, fromEss: 2.15, fromGrid: 2.27 },
        ess: { charge: 0.80, discharge: 2.15, soc: 68.5 },
        grid: { buy: 2.27, sell: 1.10 },
    },
    pvDevices: [
        { id: 'PV-INV-001', zone: 'Roof A', model: 'SUN2000-100KTL', power: 100, status: 'normal', efficiency: 98.2, temp: 42.5, dailyGen: 1.25 },
        { id: 'PV-INV-002', zone: 'Roof A', model: 'SUN2000-100KTL', power: 100, status: 'normal', efficiency: 97.8, temp: 43.1, dailyGen: 1.22 },
        { id: 'PV-INV-003', zone: 'Roof B', model: 'SUN2000-80KTL', power: 80, status: 'warning', efficiency: 95.1, temp: 48.3, dailyGen: 0.89 },
        { id: 'PV-INV-004', zone: 'Roof B', model: 'SUN2000-80KTL', power: 80, status: 'normal', efficiency: 97.5, temp: 44.0, dailyGen: 0.91 },
        { id: 'PV-INV-005', zone: 'Carport C', model: 'SUN2000-60KTL', power: 60, status: 'normal', efficiency: 98.0, temp: 41.8, dailyGen: 0.68 },
        { id: 'PV-INV-006', zone: 'Carport C', model: 'SUN2000-60KTL', power: 60, status: 'alarm', efficiency: 88.5, temp: 55.2, dailyGen: 0.52 },
        { id: 'PV-INV-007', zone: 'Ground D', model: 'SUN2000-120KTL', power: 120, status: 'normal', efficiency: 98.5, temp: 40.2, dailyGen: 1.45 },
        { id: 'PV-INV-008', zone: 'Ground D', model: 'SUN2000-120KTL', power: 120, status: 'normal', efficiency: 98.1, temp: 41.0, dailyGen: 1.42 },
    ],
    pvForecast: {
        taskId: 'PVFC-20261014-1000', forecastType: 'INTRADAY', modelVersion: 'PV-FC-V2',
        weather: 'Partly Cloudy', temperature: 26, irradiance: 780,
        points: generateTimeSeries(24, 15, 8.5, 0.3).map(p => ({
            ...p, p10: parseFloat((p.value * 0.85).toFixed(2)), p50: p.value, p90: parseFloat((p.value * 1.12).toFixed(2))
        })),
    },
    loadData: {
        totalLoad: 9.34,
        subLoads: [
            { name: 'Warehouse HVAC', value: 2.85, unit: 'MW', source: 'Measured' },
            { name: 'Loading Machinery', value: 1.92, unit: 'MW', source: 'Measured' },
            { name: 'Cold Chain', value: 1.56, unit: 'MW', source: 'Measured' },
            { name: 'EV Charging', value: 1.08, unit: 'MW', source: 'Measured' },
            { name: 'Railway Ops', value: 0.75, unit: 'MW', source: 'Estimated' },
            { name: 'Office Lighting', value: 0.68, unit: 'MW', source: 'Measured' },
            { name: 'Other Loads', value: 0.50, unit: 'MW', source: 'Estimated' },
        ],
        demand: { current: 9.34, monthMax: 11.2, limit: 15.0, margin: 5.66 },
        powerFactor: 0.94, frequency: 50.02,
    },
    essDevices: [
        { id: 'ESS-01', station: 'Station 1', type: 'Container', capacity: 5.0, ratedPower: 2.5, soc: 72.3, soh: 96.5, status: 'normal', chargePower: 0, dischargePower: 1.25, temp: 28.5 },
        { id: 'ESS-02', station: 'Station 1', type: 'Container', capacity: 5.0, ratedPower: 2.5, soc: 64.8, soh: 95.8, status: 'normal', chargePower: 0, dischargePower: 0.90, temp: 29.1 },
        { id: 'ESS-03', station: 'Station 2', type: 'Cabinet', capacity: 2.0, ratedPower: 1.0, soc: 55.3, soh: 93.2, status: 'warning', chargePower: 0.5, dischargePower: 0, temp: 33.8 },
        { id: 'ESS-04', station: 'Station 2', type: 'Cabinet', capacity: 2.0, ratedPower: 1.0, soc: 58.2, soh: 94.1, status: 'normal', chargePower: 0.3, dischargePower: 0, temp: 30.2 },
    ],
    schedule: {
        planId: 'SCH-20261014-001', planStatus: 'PENDING', mode: 'SIMULATION', resolutionMinutes: 15,
        points: generateSchedule96(),
        summary: { estimatedSaving: 1.86, selfUseRateImprovement: 12.5, peakShaving: 2.15, co2Reduction: 8.3 }
    },
    alarms: [
        { id: 'ALM-001', time: '2026-10-14T10:15:00', level: 'warning', device: 'PV-INV-003', content: 'Inverter efficiency below threshold (95.1%)', duration: '15min', status: 'Unresolved' },
        { id: 'ALM-002', time: '2026-10-14T09:48:00', level: 'alarm', device: 'PV-INV-006', content: 'Inverter over-temperature (55.2C)', duration: '42min', status: 'Processing' },
        { id: 'ALM-003', time: '2026-10-14T08:30:00', level: 'warning', device: 'ESS-03', content: 'SOC below 60% threshold', duration: '2h', status: 'Resolved' },
        { id: 'ALM-004', time: '2026-10-13T22:10:00', level: 'info', device: 'EMS', content: 'Day-ahead schedule generated', duration: '-', status: 'Resolved' },
    ],
    weather: {
        current: { temp: 26, humidity: 58, windSpeed: 3.2, irradiance: 780, condition: 'Partly Cloudy' },
        forecast: [
            { hour: '11:00', temp: 27, irradiance: 850, condition: 'Sunny' },
            { hour: '12:00', temp: 28, irradiance: 920, condition: 'Sunny' },
            { hour: '13:00', temp: 28, irradiance: 880, condition: 'Cloudy' },
            { hour: '14:00', temp: 27, irradiance: 750, condition: 'Cloudy' },
            { hour: '15:00', temp: 26, irradiance: 620, condition: 'Overcast' },
            { hour: '16:00', temp: 25, irradiance: 450, condition: 'Overcast' },
        ]
    }
};

export function formatPower(val, unit = 'MW') {
    if (val === null || val === undefined) return '--';
    return val.toFixed(2) + ' ' + unit;
}

export function formatPercent(val) {
    if (val === null || val === undefined) return '--';
    return val.toFixed(1) + '%';
}

export function formatTime(isoStr) {
    if (!isoStr) return '--';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function getStatusClass(status) {
    const map = { normal: 'status-normal', warning: 'status-warning', alarm: 'status-alarm', offline: 'status-offline' };
    return map[status] || 'status-normal';
}

export function getStatusText(status) {
    const map = { normal: 'Normal', warning: 'Warning', alarm: 'Alarm', offline: 'Offline' };
    return map[status] || status;
}
