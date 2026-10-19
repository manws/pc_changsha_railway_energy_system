<template>
  <div class="page scroll">
    <SectionCard :title="`1#储能站 / ${route.params.id}`" desc="站、舱、PCS、BMS 四级。电芯明细后补，最高最低值位置已预留。">
      <div class="tree">
        <article>
          <h3>储能站</h3>
          <p>容量 {{ scene.constants.essCapacity }} MWh · 功率 {{ scene.constants.essPower }} MW</p>
          <p>SOC {{ num(snap.soc, 1) }}% · SOH {{ num(snap.soh, 1) }}% · {{ scene.ess.status }}</p>
        </article>
        <article>
          <h3>1#储能舱 CAB-01</h3>
          <p>额定 5.00 MWh · 温度 {{ scene.ess.temp }}℃</p>
          <p>消防正常 · 舱门关闭</p>
        </article>
        <article>
          <h3>PCS-01</h3>
          <p>交流功率 {{ signed(snap.essNet) }}</p>
          <p>电压 380 V · 电流 {{ num(Math.abs(snap.essNet) * 1000 / (1.732 * 0.38), 1) }} A · 频率 50.02 Hz</p>
          <p>直流 {{ num(scene.ess.maxCellVoltage * 240, 1) }} V · 效率 97.6% · {{ scene.ess.status }}</p>
        </article>
        <article>
          <h3>BMS-01</h3>
          <p>总压 {{ num(scene.ess.maxCellVoltage * 240, 1) }} V · 绝缘 {{ scene.ess.insulation }} MΩ</p>
          <p>最高单体 {{ scene.ess.maxCellVoltage }} V · {{ scene.ess.maxCellPos }}</p>
          <p>最低单体 {{ scene.ess.minCellVoltage }} V · {{ scene.ess.minCellPos }}</p>
          <p>最高温度 {{ scene.ess.maxTemperature }}℃ · {{ scene.ess.maxTempPos }}</p>
          <p>最低温度 {{ scene.ess.minTemperature }}℃ · {{ scene.ess.minTempPos }}</p>
          <p>压差 {{ scene.ess.vDiff }} mV · 温差 {{ scene.ess.tDiff }}℃</p>
        </article>
      </div>
    </SectionCard>
    <SectionCard title="SOC / 功率 / 温度">
      <ChartBox :option="chartOption" height="280px" />
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { currentScene } from '../data/store'
import { formatNumber, formatSignedMw } from '../utils/format'
import { lineOption } from '../utils/charts'
import SectionCard from '../components/SectionCard.vue'
import ChartBox from '../components/ChartBox.vue'

const route = useRoute()
const scene = currentScene
const snap = computed(() => scene.value.snapshot)
const chartOption = computed(() => {
  const points = scene.value.balanceSeries.filter((item) => item.index <= scene.value.nowIndex && item.index % 2 === 0)
  return lineOption({
    labels: points.map((item) => item.label),
    series: [
      { name: 'SOC', data: points.map((item) => item.soc), lineStyle: { color: '#47DFED' }, itemStyle: { color: '#47DFED' } },
      { name: '功率', data: points.map((item) => item.essNet), lineStyle: { color: '#00FF79' }, itemStyle: { color: '#00FF79' } },
    ],
  })
})
function num(value, digits = 2) { return formatNumber(value, digits) }
function signed(value) { return formatSignedMw(value) }
</script>

<style scoped>
.tree { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
article { background: rgba(10, 14, 23, 0.55); border-radius: 8px; padding: 12px; }
h3 { color: var(--font-1); font-size: 14px; margin-bottom: 8px; }
p { color: var(--font-3); font-size: 13px; line-height: 1.6; }
@media (max-width: 1366px) { .tree { grid-template-columns: 1fr 1fr; } }
</style>
