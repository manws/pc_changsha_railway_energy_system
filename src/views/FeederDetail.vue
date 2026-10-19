<template>
  <div v-if="transformer" class="page scroll">
    <div class="kpi-row cols-4">
      <KpiCard label="实时负荷" :value="num(transformer.loadMw)" unit="MW" color="#FFD83C" />
      <KpiCard label="负载率" :value="num(transformer.loadRate, 1)" unit="%" :sub="transformer.loadRate >= 80 ? '超过 80% 提醒' : '低于提醒阈值'" :color="transformer.loadRate >= 80 ? '#FFD83C' : '#00FF79'" />
      <KpiCard label="温度" :value="String(transformer.temp)" unit="℃" />
      <KpiCard label="需量限额" :value="num(transformer.demandLimitMw)" unit="MW" :sub="`${transformer.capacityKva} kVA`" />
    </div>
    <SectionCard :title="`${transformer.name} 负荷趋势`">
      <ChartBox :option="chartOption" height="280px" />
    </SectionCard>
    <SectionCard title="馈线">
      <div class="dark-table">
        <el-table :data="feeders" size="small">
          <el-table-column prop="name" label="馈线" />
          <el-table-column prop="voltageKv" label="电压 (kV)" />
          <el-table-column prop="currentA" label="电流 (A)" />
          <el-table-column prop="powerMw" label="功率 (MW)" />
          <el-table-column prop="powerFactor" label="功率因数" />
          <el-table-column prop="switchStatus" label="开关" />
        </el-table>
      </div>
    </SectionCard>
  </div>
  <div v-else class="state-panel"><p>未找到该变压器</p></div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { currentScene } from '../data/store'
import { formatNumber } from '../utils/format'
import { lineOption } from '../utils/charts'
import KpiCard from '../components/KpiCard.vue'
import SectionCard from '../components/SectionCard.vue'
import ChartBox from '../components/ChartBox.vue'

const route = useRoute()
const scene = currentScene
const transformer = computed(() => scene.value.transformers.find((item) => item.id === route.params.id))
const feeders = computed(() => scene.value.feeders.filter((item) => item.transformerId === route.params.id))
const chartOption = computed(() => {
  if (!transformer.value) return lineOption({ labels: [], series: [] })
  const share = transformer.value.loadMw / scene.value.snapshot.load
  const points = scene.value.balanceSeries.filter((item) => item.index <= scene.value.nowIndex)
  return lineOption({
    labels: points.map((item) => item.label),
    series: [
      { name: '负荷', data: points.map((item) => Number((item.load * share).toFixed(2))), lineStyle: { color: '#FFD83C' }, itemStyle: { color: '#FFD83C' } },
      { name: '80% 提醒', data: points.map(() => Number((transformer.value.capacityKva / 1000 * 0.8).toFixed(2))), lineStyle: { color: '#F8473A', type: 'dashed', width: 1 }, itemStyle: { color: '#F8473A' } },
    ],
  })
})
function num(value, digits = 2) { return formatNumber(value, digits) }
</script>
