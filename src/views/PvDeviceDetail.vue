<template>
  <div v-if="device" class="page scroll">
    <div class="kpi-row cols-4">
      <KpiCard label="有功功率" :value="num(device.activePowerKw, 1)" unit="kW" :sub="device.status" color="#47DFED" />
      <KpiCard label="效率" :value="num(device.efficiency, 1)" unit="%" :sub="device.efficiencyLow ? '低于 96%' : '正常'" />
      <KpiCard label="温度" :value="num(device.temp, 1)" unit="℃" />
      <KpiCard label="今日发电" :value="num(device.energyTodayMwh)" unit="MWh" />
    </div>
    <div class="split even">
      <SectionCard title="设备档案">
        <div class="metric-list">
          <div class="metric-item"><span>编号</span><strong>{{ device.id }}</strong></div>
          <div class="metric-item"><span>分区</span><strong>{{ device.zone }}</strong></div>
          <div class="metric-item"><span>型号</span><strong>{{ device.model }}</strong></div>
          <div class="metric-item"><span>额定功率</span><strong class="num">{{ device.ratedKw }}<em>kW</em></strong></div>
          <div class="metric-item"><span>投运时间</span><strong>{{ device.commissioned }}</strong></div>
          <div class="metric-item"><span>通信地址</span><strong>{{ device.commAddr }}</strong></div>
          <div class="metric-item"><span>固件</span><strong>{{ device.firmware }}</strong></div>
          <div class="metric-item"><span>更新时间</span><strong :class="{ 'warn-text': device.stale }">{{ formatDateTime(device.updatedAt) }}</strong></div>
        </div>
      </SectionCard>
      <SectionCard title="实时量">
        <div class="metric-list">
          <div class="metric-item"><span>直流电压</span><strong class="num">{{ num(device.dcVoltage, 1) }}<em>V</em></strong></div>
          <div class="metric-item"><span>直流电流</span><strong class="num">{{ num(device.dcCurrent, 1) }}<em>A</em></strong></div>
          <div class="metric-item"><span>交流频率</span><strong class="num" :class="{ 'alarm-text': device.freqOver }">{{ num(device.acFrequency, 2) }}<em>Hz</em></strong></div>
          <div class="metric-item"><span>运行状态</span><strong><StatusBadge :text="device.status" /></strong></div>
        </div>
        <p class="muted">组串页签在接口具备后补充，不阻塞逆变器详情。</p>
      </SectionCard>
    </div>
    <SectionCard title="趋势">
      <template #extra>
        <el-radio-group v-model="range" size="small">
          <el-radio-button value="1H">1 小时</el-radio-button>
          <el-radio-button value="24H">24 小时</el-radio-button>
          <el-radio-button value="7D">7 天</el-radio-button>
          <el-radio-button value="30D">30 天</el-radio-button>
        </el-radio-group>
      </template>
      <ChartBox :option="chartOption" height="280px" />
      <p v-if="range !== '24H' && range !== '1H'" class="muted">7 天和 30 天为示意日电量，不是现场历史库。</p>
    </SectionCard>
    <SectionCard title="相关告警">
      <p v-if="!alarms.length" class="muted">该设备当前无告警</p>
      <div v-for="alarm in alarms" :key="alarm.id" class="plain-row">
        <StatusBadge :text="alarm.level" />
        <span>{{ alarm.code }}</span>
        <span>{{ alarm.content }}</span>
        <span class="muted">{{ alarm.status }} · {{ alarm.duration }}</span>
      </div>
    </SectionCard>
  </div>
  <div v-else class="state-panel"><p>未找到该逆变器</p></div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { currentScene } from '../data/store'
import { formatDateTime, formatNumber } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const route = useRoute()
const scene = currentScene
const range = ref('24H')
const device = computed(() => scene.value.inverters.find((item) => item.id === route.params.id))
const alarms = computed(() => scene.value.alarms.filter((item) => item.deviceId === route.params.id))

const chartOption = computed(() => {
  if (!device.value) return lineOption({ labels: [], series: [] })
  const scale = device.value.ratedKw / 6580
  if (range.value === '7D' || range.value === '30D') {
    const days = range.value === '7D' ? 7 : 30
    const labels = Array.from({ length: days }, (_, i) => `${i + 1}日`)
    const data = labels.map((_, i) => Number((device.value.ratedKw * 4.1 * (0.82 + 0.08 * Math.sin(i)) / 1000).toFixed(2)))
    return lineOption({ labels, yName: 'MWh', series: [{ name: '日发电量', data, lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } }] })
  }
  const points = scene.value.balanceSeries.filter((p) => (range.value === '1H' ? p.index > scene.value.nowIndex - 4 && p.index <= scene.value.nowIndex : p.index <= scene.value.nowIndex))
  return lineOption({
    labels: points.map((p) => p.label),
    yName: 'kW',
    series: [{ name: '实际功率', data: points.map((p) => (p.pv === null ? null : Number((p.pv * 1000 * scale).toFixed(1)))), lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } }],
  })
})

function num(value, digits = 2) { return formatNumber(value, digits) }
</script>
