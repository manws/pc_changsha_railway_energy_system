<template>
  <div class="page">
    <div class="kpi-row">
      <KpiCard label="额定容量 / 功率" :value="`${scene.constants.essCapacity.toFixed(0)} / ${scene.constants.essPower.toFixed(0)}`" unit="MWh / MW" />
      <KpiCard label="SOC" :value="num(snap.soc, 1)" unit="%" :tip="TERMS.SOC" color="#47DFED" />
      <KpiCard label="SOH" :value="num(snap.soh, 1)" unit="%" :tip="TERMS.SOH" color="#00FF79" />
      <KpiCard label="当前功率" :value="signed(snap.essNet)" :sub="scene.ess.status" color="#00FF79" tip="正值充电，负值放电" />
      <KpiCard label="可用电量" :value="available" unit="MWh" :sub="`循环 ${snap.cycleCount} 次`" />
      <KpiCard label="往返效率" :value="num(snap.roundTripEfficiency, 1)" unit="%" />
    </div>
    <div class="split three fill">
      <SectionCard title="运行状态" :desc="statusText">
        <p class="state-name"><StatusBadge :text="scene.ess.status" /> <span>{{ remain }}</span></p>
        <div v-for="item in scene.ess.comms" :key="item.name" class="plain-row">
          <span>{{ item.name }}</span>
          <StatusBadge :text="item.status" />
        </div>
      </SectionCard>
      <SectionCard title="SOC 与功率" desc="充电为绿色，放电为红色反向">
        <ChartBox class="grow" :option="chartOption" />
      </SectionCard>
      <SectionCard title="告警与维护">
        <div class="metric-list">
          <div class="metric-item"><span>压差</span><strong class="num" :class="{ 'warn-text': scene.ess.vDiff >= 45 }">{{ scene.ess.vDiff }}<em>mV</em></strong></div>
          <div class="metric-item"><span>温差</span><strong class="num">{{ scene.ess.tDiff }}<em>℃</em></strong></div>
          <div class="metric-item"><span>绝缘</span><strong class="num">{{ scene.ess.insulation }}<em>MΩ</em></strong></div>
          <div class="metric-item"><span>舱温</span><strong class="num">{{ scene.ess.temp }}<em>℃</em></strong></div>
        </div>
        <p class="muted">上次维护 {{ scene.ess.lastMaintenance }} · 下次 {{ scene.ess.nextMaintenance }}</p>
        <router-link class="link" to="/ess/CAB-01">查看舱 / PCS / BMS</router-link>
        <div v-for="alarm in essAlarms" :key="alarm.id" class="plain-row">
          <StatusBadge :text="alarm.level" />
          <span>{{ alarm.content }}</span>
        </div>
        <p v-if="!essAlarms.length" class="muted">储能当前无告警。压差接近阈值时只显示提醒，不停机。</p>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { currentScene } from '../data/store'
import { formatNumber, formatSignedMw, TERMS } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const snap = computed(() => scene.value.snapshot)
const available = computed(() => (scene.value.ess.status === '故障' ? '--' : formatNumber(snap.value.availableEnergy)))
const essAlarms = computed(() => scene.value.alarms.filter((item) => item.deviceId.startsWith('BMS') || item.deviceId.startsWith('ESS')))
const statusText = computed(() => ({
  充电: '绿色。能量流入，按当前功率估算充满到 90%。',
  放电: '青色。能量流出，故障时才停止展示可用功率。',
  待机: '灰蓝。死区内，能量流动画停止。',
}[scene.value.ess.status] || ''))
const remain = computed(() => {
  if (snap.value.essCharge > 0.05) {
    const hours = ((90 - snap.value.soc) / 100 * scene.value.constants.essCapacity) / snap.value.essCharge
    return `预计 ${hours.toFixed(1)} 小时至 90%`
  }
  if (snap.value.essDischarge > 0.05) {
    const hours = snap.value.availableEnergy / snap.value.essDischarge
    return `预计还可放电 ${hours.toFixed(1)} 小时`
  }
  return '功率在死区内'
})
const chartOption = computed(() => {
  const points = scene.value.balanceSeries.filter((item) => item.index >= scene.value.nowIndex - 24 && item.index <= scene.value.nowIndex)
  return lineOption({
    labels: points.map((item) => item.label),
    yName: 'MW',
    y2Name: 'SOC %',
    series: [
      { name: '储能功率', data: points.map((item) => item.essNet), lineStyle: { color: '#00FF79' }, itemStyle: { color: '#00FF79' } },
      { name: 'SOC', yAxisIndex: 1, data: points.map((item) => item.soc), lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
    ],
  })
})
function num(value, digits = 2) { return formatNumber(value, digits) }
function signed(value) { return formatSignedMw(value) }
</script>

<style scoped>
.state-name { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; color: var(--font-3); font-size: 12px; }
.plain-row { margin-top: 6px; }
</style>
