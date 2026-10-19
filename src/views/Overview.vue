<template>
  <div class="page">
    <div class="kpi-row">
      <KpiCard label="光伏功率" :value="num(snap.pv)" unit="MW" :sub="`直供 ${num(snap.pvSelf)}`" color="#47DFED" :tip="`数据时间 ${clock}`" />
      <KpiCard label="总负荷" :value="num(snap.load)" unit="MW" :sub="`峰值 ${num(snap.peakDemand)} / ${snap.peakDemandTime}`" color="#FFD83C" />
      <KpiCard label="储能功率" :value="signed(snap.essNet)" unit="" :sub="essDirection(snap.essNet)" color="#00FF79" tip="正值充电，负值放电" />
      <KpiCard label="电网交换" :value="signed(snap.gridExchange)" unit="" :sub="gridDirection(snap.gridExchange)" color="#C5CBCE" tip="正值购电，负值上网" />
      <KpiCard label="自用率" :value="num(snap.selfUseRate, 1)" unit="%" sub="截至回放时刻" color="#00FF79" :tip="TERMS.自用率" />
      <KpiCard label="全日节省" :value="money(snap.todaySaving)" unit="" sub="较无储能基准" color="#FFD83C" :tip="scene.constants.tariffNote" />
    </div>

    <div class="split main">
      <SectionCard title="实时能量流" :desc="scene.constants.signNote">
        <EnergyFlow class="grow" :flow="snap" :categories="scene.categories" :frozen="false" />
      </SectionCard>
      <SectionCard title="未来功率平衡">
        <template #extra>
          <el-radio-group v-model="hours" size="small">
            <el-radio-button :value="1">1 小时</el-radio-button>
            <el-radio-button :value="4">4 小时</el-radio-button>
          </el-radio-group>
        </template>
        <ChartBox class="grow" :option="futureOption" />
        <p class="muted">预计需量峰值 {{ num(futurePeak) }} MW，限额 {{ scene.constants.demandLimit.toFixed(2) }} MW</p>
      </SectionCard>
    </div>

    <div class="split even">
      <SectionCard title="今日关键指标" :desc="`排放因子 ${scene.constants.emissionFactor} tCO₂/MWh · ${scene.constants.emissionVersion}`">
        <div class="metric-list wide">
          <div class="metric-item"><span>发电量</span><strong class="num">{{ num(snap.todayGeneration) }}<em>MWh</em></strong></div>
          <div class="metric-item"><span>就地消纳</span><strong class="num">{{ num(snap.todaySelf) }}<em>MWh</em></strong></div>
          <div class="metric-item"><span>购电量</span><strong class="num">{{ num(snap.todayGridBuy) }}<em>MWh</em></strong></div>
          <div class="metric-item"><span>峰值负荷</span><strong class="num">{{ num(snap.peakDemand) }}<em>MW</em></strong></div>
          <div class="metric-item"><span>储能吞吐</span><strong class="num">{{ num(snap.todayEssThroughput) }}<em>MWh</em></strong></div>
          <div class="metric-item"><span>减碳</span><strong class="num">{{ num(snap.carbonTon) }}<em>t</em></strong></div>
        </div>
      </SectionCard>
      <SectionCard title="调度建议">
        <template #extra>
          <router-link class="link" to="/schedule">进入智能调度</router-link>
        </template>
        <div class="scroll-area">
          <div v-for="item in scene.suggestions" :key="item.action" class="plain-row">
            <div>
              <strong>{{ item.time }} {{ item.action }}</strong>
              <p class="muted">{{ item.reason }}</p>
            </div>
            <div>
              <b class="num">{{ signed(item.powerMw) }}</b>
              <p class="muted">{{ item.impact }}</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { currentScene } from '../data/store'
import { essDirection, formatDateTime, formatMoney, formatNumber, formatSignedMw, gridDirection, TERMS } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import EnergyFlow from '../components/EnergyFlow.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const hours = ref(4)
const snap = computed(() => scene.value.snapshot)
const clock = computed(() => formatDateTime(scene.value.pageClock))

const futurePoints = computed(() => {
  const count = hours.value === 1 ? 4 : 16
  return scene.value.forecast.dayAhead.slice(scene.value.nowIndex, scene.value.nowIndex + count + 1)
})

const futurePeak = computed(() => Math.max(...futurePoints.value.map((p) => p.loadP50)))

const futureOption = computed(() => lineOption({
  labels: futurePoints.value.map((p) => p.label),
  series: [
    { name: '光伏 P50', data: futurePoints.value.map((p) => p.p50), lineStyle: { type: 'dashed', color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
    { name: '负荷 P50', data: futurePoints.value.map((p) => p.loadP50), lineStyle: { type: 'dashed', color: '#FFD83C' }, itemStyle: { color: '#FFD83C' } },
    {
      name: '净负荷',
      data: futurePoints.value.map((p) => Number((p.loadP50 - p.p50).toFixed(2))),
      lineStyle: { color: '#9af6ff' },
      itemStyle: { color: '#9af6ff' },
      markLine: {
        symbol: 'none',
        data: [{ yAxis: scene.value.constants.demandLimit }],
        lineStyle: { color: '#F8473A', type: 'dashed' },
        label: { color: '#F8473A', formatter: '需量限额' },
      },
    },
  ],
}))

function num(value, digits = 2) { return formatNumber(value, digits) }
function signed(value) { return formatSignedMw(value) }
function money(value) { return formatMoney(value) }
</script>
