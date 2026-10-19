<template>
  <div class="page">
    <div v-if="snap.demandRisk" class="banner warn">预计负荷接近需量限额 {{ scene.constants.demandLimit.toFixed(2) }} MW，调度页同步提醒。</div>
    <div class="kpi-row cols-5">
      <KpiCard label="有功功率" :value="num(snap.load)" unit="MW" color="#FFD83C" />
      <KpiCard label="无功功率" :value="num(snap.reactivePower)" unit="Mvar" />
      <KpiCard label="功率因数" :value="num(snap.powerFactor, 2)" sub="阈值来源：园区电能质量配置" />
      <KpiCard label="今日电量" :value="num(snap.todayLoad)" unit="MWh" />
      <KpiCard label="最大需量" :value="num(snap.peakDemand)" unit="MW" :sub="`发生在 ${snap.peakDemandTime}`" />
    </div>
    <div class="split main">
      <SectionCard title="负荷曲线" desc="实测为黄色实线。缺口断线，不用 0 填充。">
        <ChartBox class="grow" :option="chartOption" />
      </SectionCard>
      <SectionCard title="分项负荷" desc="估算与实测使用不同标识">
        <div v-for="item in scene.categories" :key="item.key" class="cat">
          <div><span>{{ item.key }}</span><StatusBadge :text="item.source" /></div>
          <b class="num">{{ num(item.value) }} MW</b>
          <div class="bar"><i :style="{ width: `${(item.value / snap.load) * 100}%`, background: item.color }"></i></div>
        </div>
      </SectionCard>
    </div>
    <div class="split three">
      <SectionCard title="变压器" desc="负载率超过 80% 提醒">
        <button v-for="item in scene.transformers" :key="item.id" type="button" class="plain-row" @click="open(item.id)">
          <div>
            <strong>{{ item.name }}</strong>
            <p class="muted">{{ item.capacityKva }} kVA · {{ item.temp }}℃</p>
          </div>
          <div>
            <b class="num" :class="{ 'warn-text': item.loadRate >= 80 }">{{ num(item.loadRate, 1) }}%</b>
            <StatusBadge :text="item.status" />
          </div>
        </button>
      </SectionCard>
      <SectionCard title="馈线" desc="只读">
        <div v-for="item in scene.feeders" :key="item.id" class="plain-row">
          <div>
            <strong>{{ item.name }}</strong>
            <p class="muted">{{ item.voltageKv }} kV · {{ item.currentA }} A · {{ item.switchStatus }}</p>
          </div>
          <b class="num">{{ num(item.powerMw) }}</b>
        </div>
      </SectionCard>
      <SectionCard title="作业事件">
        <div v-for="item in scene.events" :key="item.time + item.type" class="plain-row">
          <div>
            <strong>{{ item.time }} {{ item.type }}</strong>
            <p class="muted">{{ item.source }} · 可信度 {{ item.confidence }}</p>
          </div>
          <b class="num">+{{ num(item.impactMw) }}</b>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentScene } from '../data/store'
import { formatNumber } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ChartBox from '../components/ChartBox.vue'

const scene = currentScene
const router = useRouter()
const snap = computed(() => scene.value.snapshot)
const chartOption = computed(() => {
  const points = scene.value.series
  return lineOption({
    labels: points.map((p) => p.label),
    series: [
      { name: '总负荷', data: points.map((p) => p.load), lineStyle: { color: '#FFD83C', width: 2.5 }, itemStyle: { color: '#FFD83C' } },
      { name: '光伏', data: points.map((p) => p.pv), lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
    ],
  })
})
function num(value, digits = 2) { return formatNumber(value, digits) }
function open(id) { router.push(`/load/feeders/${id}`) }
</script>

<style scoped>
.cat { display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; margin-bottom: 8px; }
.cat div:first-child { display: flex; gap: 6px; align-items: center; }
.bar { grid-column: 1 / -1; height: 4px; background: #1a2332; border-radius: 2px; }
.bar i { display: block; height: 100%; border-radius: 2px; }
.plain-row { margin-bottom: 6px; }
</style>
