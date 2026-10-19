<template>
  <div class="page">
    <div class="kpi-row">
      <KpiCard label="装机容量" :value="num(scene.constants.pvCapacity)" unit="MW" sub="5 个分区" />
      <KpiCard label="实时功率" :value="num(snap.pv)" unit="MW" color="#47DFED" />
      <KpiCard label="今日发电" :value="num(snap.todayGeneration)" unit="MWh" :sub="`月 ${num(snap.energyMonth, 1)} / 年 ${num(snap.energyYear, 1)}`" />
      <KpiCard label="等效小时" :value="num(snap.equivalentHours)" unit="h" sub="今日" />
      <KpiCard label="在网率" :value="num(snap.availability, 1)" unit="%" :sub="`${stats.online} 运行 / ${stats.offline} 离线`" color="#00FF79" />
      <KpiCard label="性能比 PR" :value="num(snap.pr, 1)" unit="%" :sub="snap.pr === null ? '辐照度缺失，未计算' : `GHI ${snap.ghi ?? '--'} W/m²`" :tip="TERMS.PR" color="#47DFED" />
    </div>
    <div class="split main">
      <SectionCard title="功率与辐照" :desc="`完整率 ${num(snap.completeness, 1)}%，无数据处断线`">
        <ChartBox class="grow" :option="chartOption" />
      </SectionCard>
      <div class="stack">
        <SectionCard title="分区" desc="无平面图时使用卡片">
          <div class="zone-grid scroll-area">
            <button v-for="zone in scene.zones" :key="zone.name" type="button" class="zone-card" @click="openZone(zone.name)">
              <div>
                <strong>{{ zone.name }}</strong>
                <p class="muted">{{ num(zone.capacityMw) }} MW · 告警 {{ zone.alarmCount }}</p>
              </div>
              <div>
                <b class="num">{{ num(zone.powerMw) }}</b>
                <StatusBadge :text="zone.status" />
              </div>
            </button>
          </div>
        </SectionCard>
        <SectionCard title="设备统计">
          <div class="metric-list">
            <div class="metric-item"><span>总数</span><strong class="num">{{ stats.total }}</strong></div>
            <div class="metric-item"><span>运行</span><strong class="num ok-text">{{ stats.online }}</strong></div>
            <div class="metric-item"><span>待机</span><strong class="num">{{ stats.standby }}</strong></div>
            <div class="metric-item"><span>故障</span><strong class="num alarm-text">{{ stats.fault }}</strong></div>
            <div class="metric-item"><span>通讯中断</span><strong class="num warn-text">{{ stats.offline }}</strong></div>
            <div class="metric-item"><span>列表一致</span><strong class="num">是</strong></div>
          </div>
        </SectionCard>
      </div>
    </div>
    <SectionCard title="告警摘要">
      <template #extra><router-link class="link" to="/alarms">告警列表</router-link></template>
      <p v-if="!scene.alarms.length" class="muted">当前无未恢复告警</p>
      <div v-for="alarm in scene.alarms" :key="alarm.id" class="plain-row">
        <StatusBadge :text="alarm.level" />
        <span>{{ alarm.deviceName }}</span>
        <span class="grow-text">{{ alarm.content }}</span>
        <span class="muted">{{ alarm.duration }}</span>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentScene } from '../data/store'
import { formatNumber, TERMS } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const router = useRouter()
const snap = computed(() => scene.value.snapshot)
const stats = computed(() => scene.value.deviceStats)

const chartOption = computed(() => {
  const points = scene.value.series.filter((p) => p.index >= scene.value.nowIndex - 32 && p.index <= scene.value.nowIndex)
  return lineOption({
    labels: points.map((p) => p.label),
    yName: 'MW',
    y2Name: 'W/m²',
    series: [
      { name: '实际功率', data: points.map((p) => p.pv), lineStyle: { color: '#47DFED', width: 2.5 }, itemStyle: { color: '#47DFED' } },
      { name: '辐照度', yAxisIndex: 1, data: points.map((p) => p.ghi), lineStyle: { color: '#FFD83C', width: 1.5 }, itemStyle: { color: '#FFD83C' } },
    ],
  })
})

function num(value, digits = 2) { return formatNumber(value, digits) }
function openZone(name) { router.push({ path: '/pv/devices', query: { zone: name } }) }
</script>

<style scoped>
.grow-text { flex: 1; }
.plain-row { margin-bottom: 6px; }
</style>
