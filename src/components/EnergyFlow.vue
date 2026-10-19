<template>
  <div class="flow" :class="{ frozen }">
    <div class="board">
      <div class="source">
        <button class="hero" type="button" @click="go('/pv')">
          <span class="k">光伏发电</span>
          <strong class="num">{{ n(flow.pv) }}<small>MW</small></strong>
        </button>
        <button v-for="item in meters" :key="item.label" class="meter" type="button" @click="go(item.to)">
          <span>{{ item.label }}</span>
          <i><b :class="{ live: item.value > 0.05 }" :style="{ width: item.width }"></b></i>
          <em class="num">{{ n(item.value) }}</em>
        </button>
      </div>

      <div class="stations">
        <button class="station load" type="button" @click="go('/load')">
          <span class="k">园区负荷</span>
          <strong class="num">{{ n(flow.load) }}<small>MW</small></strong>
          <em>直供 + 放电 + 购电</em>
        </button>
        <button class="station ess" type="button" @click="go('/ess')">
          <span class="k">储能 · {{ flow.essStatus }}</span>
          <strong class="num">{{ signed(flow.essNet) }}<small>MW</small></strong>
          <em>SOC {{ n(flow.soc, 1) }}% · 正充负放</em>
        </button>
        <button class="station grid" type="button" @click="go('/schedule')">
          <span class="k">电网 · {{ gridText }}</span>
          <strong class="num">{{ signed(flow.gridExchange) }}<small>MW</small></strong>
          <em>购电 {{ n(flow.gridBuy) }} · 上网 {{ n(flow.gridSell) }}</em>
        </button>
      </div>
    </div>
    <div class="aux">
      <button type="button" @click="go('/load')">充电桩 <b class="num">{{ n(charge) }}</b> MW</button>
      <button type="button" @click="go('/schedule/constraints')">可调负荷 <b class="num">{{ n(flexible) }}</b> MW</button>
      <span>负荷 = 光伏直供 + 储能放电 + 购电</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatNumber, formatSignedMw, gridDirection } from '../utils/format'

const props = defineProps({
  flow: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  frozen: Boolean,
})

const router = useRouter()
const gridText = computed(() => gridDirection(props.flow.gridExchange))
const charge = computed(() => props.categories.find((item) => item.key === '充电')?.value ?? null)
const flexible = computed(() => props.categories.find((item) => item.key === '铁路作业')?.value ?? null)

function n(value, digits = 2) {
  return formatNumber(value, digits)
}

function signed(value) {
  return formatSignedMw(value).replace(' MW', '')
}

function go(path) {
  router.push(path)
}

const meters = computed(() => {
  const rows = [
    { label: '直供负荷', value: props.flow.pvSelf, to: '/load' },
    { label: '充入储能', value: props.flow.essCharge, to: '/ess' },
    { label: '上网', value: props.flow.gridSell, to: '/schedule' },
    { label: '放电供负荷', value: props.flow.essDischarge, to: '/load' },
    { label: '购电供负荷', value: props.flow.gridBuy, to: '/load' },
  ]
  const max = Math.max(...rows.map((item) => item.value || 0), 0.01)
  return rows.map((item) => ({ ...item, width: `${Math.max(4, ((item.value || 0) / max) * 100)}%` }))
})
</script>

<style scoped>
.flow { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
.board {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 10px;
  align-items: stretch;
}
.source, .stations { min-height: 0; height: 100%; display: flex; flex-direction: column; gap: 8px; }
.stations { display: grid; grid-template-rows: 1.15fr 1fr 1fr; }
.hero, .station, .meter {
  text-align: left;
  border: 1px solid rgba(71, 223, 237, 0.16);
  background: linear-gradient(180deg, rgba(71, 223, 237, 0.07), rgba(7, 11, 16, 0.28));
  color: var(--font-2);
  border-radius: 12px;
  cursor: pointer;
}
.hero, .station { padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.hero:hover, .station:hover, .meter:hover, .hero:focus-visible, .station:focus-visible, .meter:focus-visible {
  border-color: var(--primary); outline: none;
}
.hero strong, .station strong { font-size: 32px; font-weight: 600; color: #fff; line-height: 1; letter-spacing: -0.03em; }
.hero strong small, .station strong small { margin-left: 4px; font-size: 12px; color: var(--font-3); font-weight: 500; letter-spacing: 0; }
.k { color: var(--font-3); font-size: 13px; letter-spacing: 0.04em; }
.station em { font-style: normal; color: var(--font-4); font-size: 12px; }
.load { border-color: rgba(255, 216, 60, 0.28); }
.ess { border-color: rgba(0, 255, 121, 0.28); }
.meter {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 84px 1fr 52px;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 12px;
  color: var(--font-3);
}
.meter i { height: 4px; border-radius: 4px; background: rgba(71, 223, 237, 0.12); display: block; }
.meter b { display: block; height: 100%; border-radius: 4px; background: #424955; }
.meter b.live { background: linear-gradient(90deg, rgba(71, 223, 237, 0.35), #47DFED); box-shadow: 0 0 8px rgba(71, 223, 237, 0.45); }
.meter em { font-style: normal; color: #fff; text-align: right; font-weight: 600; }
.frozen .meter b.live { box-shadow: none; }
.aux { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.aux button {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: rgba(7, 11, 16, 0.4);
  color: var(--font-2);
  cursor: pointer;
  font-size: 12px;
}
.aux button:hover { border-color: var(--primary); color: #fff; }
.aux b { color: #fff; font-weight: 600; }
.aux span { margin-left: auto; color: var(--font-5); font-size: 12px; }
</style>
