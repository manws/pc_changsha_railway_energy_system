<template>
  <div class="shell" :class="{ 'is-frozen': frozen, 'show-watermark': dataMode.text === '演示数据' }">
    <header class="top-bar">
      <div class="brand">
        <span class="brand-mark"></span>
        <div>
          <strong>{{ scene.constants.org }}</strong>
          <em>智能能源管控</em>
        </div>
      </div>
      <nav class="nav">
        <router-link to="/overview" class="nav-link" :class="{ active: route.meta.group === '电站首页' }">电站首页</router-link>
        <el-dropdown v-for="group in groups" :key="group.label" trigger="hover">
          <button type="button" class="nav-link" :class="{ active: route.meta.group === group.label }">{{ group.label }}</button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="item in group.items" :key="item.path">
                <router-link class="menu-link" :to="item.path">{{ item.title }}</router-link>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>
      <div class="top-tools">
        <el-select :model-value="energyState.park" class="park" disabled>
          <el-option :label="energyState.park" :value="energyState.park" />
        </el-select>
        <el-select v-if="!isLeader" :model-value="energyState.scenarioId" class="scene" @change="setScenario">
          <el-option v-for="item in sceneList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <span class="mode" :class="dataMode.tone">{{ dataMode.text }}</span>
        <div class="clocks">
          <span class="num">回放 {{ formatDateTime(scene.pageClock) }}</span>
          <span>本机 {{ wallClock }}</span>
        </div>
        <el-dropdown trigger="click">
          <button type="button" class="user-btn">{{ isLeader ? '领导' : '管理员' }}</button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="setRole('admin')">管理员</el-dropdown-item>
              <el-dropdown-item @click="setRole('leader')">领导（只读）</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <button type="button" class="ghost" @click="toggleFull">全屏</button>
      </div>
    </header>

    <div class="crumb">
      <span>{{ route.meta.group }}</span>
      <span>/</span>
      <strong>{{ route.meta.title }}</strong>
      <em>{{ route.meta.pageCode }}</em>
      <span class="crumb-time" :class="timeTone">数据 {{ formatDateTime(scene.pageClock) }}</span>
    </div>

    <main class="main" :class="{ fit: route.meta.fit }">
      <div v-if="energyState.fault === 'error'" class="banner alarm">数据服务异常，展示最近更新于 {{ formatDateTime(scene.pageClock) }} 的数据</div>
      <div v-if="energyState.fault === 'offline'" class="banner alarm">数据源离线，展示最近成功数据。动态刷新已停止。</div>
      <div v-if="energyState.fault === 'loading'" class="state-panel">
        <div class="skel-grid"><div v-for="n in 6" :key="n" class="skel"></div></div>
        <p>正在获取数据</p>
      </div>
      <div v-else-if="energyState.fault === 'empty'" class="state-panel">
        <p>当前筛选范围暂无数据</p>
      </div>
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { currentScene, dataMode, energyState, isLeader, sceneList, setRole, setScenario } from './data/store'
import { formatDateTime } from './utils/format'

const route = useRoute()
const scene = currentScene
const wallClock = ref('')
let timer

const groups = [
  { label: '实时监视', items: [
    { path: '/pv', title: '光伏运行总览' },
    { path: '/pv/devices', title: '光伏设备列表' },
    { path: '/load', title: '园区负荷总览' },
    { path: '/system/sources', title: '数据源与接口' },
  ] },
  { label: '预测分析', items: [
    { path: '/pv/forecast', title: '光伏发电预测' },
    { path: '/load/forecast', title: '负荷预测' },
    { path: '/pv/evaluation', title: '光伏预测评估' },
  ] },
  { label: '储能系统', items: [
    { path: '/ess', title: '储能综合看板' },
    { path: '/ess/CAB-01', title: '储能设备详情' },
  ] },
  { label: '智能调度', items: [
    { path: '/schedule', title: '调度总览' },
    { path: '/schedule/day-ahead', title: '日前调度计划' },
    { path: '/schedule/intraday', title: '日内滚动修正' },
    { path: '/schedule/constraints', title: '策略与约束' },
  ] },
  { label: '告警管理', items: [{ path: '/alarms', title: '实时告警' }] },
]

const frozen = computed(() => energyState.fault === 'offline' || energyState.fault === 'error')
const timeTone = computed(() => (energyState.fault === 'offline' || energyState.fault === 'error' ? 'alarm-text' : ''))

function tick() {
  wallClock.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date())
}

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
  else document.exitFullscreen?.()
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.shell { height: 100vh; display: flex; flex-direction: column; background: transparent; position: relative; }
.show-watermark .main {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='340' height='210'><text x='28' y='128' fill='rgba(255,255,255,0.032)' font-size='18' font-family='sans-serif' transform='rotate(-18 170 105)'>演示数据</text></svg>");
}
.top-bar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: rgba(7, 11, 16, 0.82);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
  flex-shrink: 0;
}
.brand { display: flex; align-items: center; gap: 10px; min-width: 180px; }
.brand-mark { width: 3px; height: 28px; border-radius: 2px; background: var(--primary); box-shadow: 0 0 12px var(--primary); }
.brand strong, .brand em { display: block; font-style: normal; }
.brand strong { color: var(--font-1); font-size: 13px; }
.brand em { color: var(--font-4); font-size: 12px; }
.nav { display: flex; align-items: stretch; gap: 4px; flex: 1; height: 100%; }
.nav-link {
  height: 56px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  color: var(--font-3);
  text-decoration: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
}
.nav-link:hover, .nav-link:focus-visible { color: var(--font-1); outline: none; }
.nav-link.active { color: var(--primary); border-bottom-color: var(--primary); text-shadow: 0 0 12px rgba(71, 223, 237, 0.35); }
.top-tools { display: flex; align-items: center; gap: 8px; }
.park { width: 168px; }
.scene { width: 148px; }
.mode { height: 24px; padding: 0 8px; border-radius: 999px; font-size: 12px; line-height: 24px; letter-spacing: 0.04em; }
.mode.demo { color: var(--warn); background: rgba(255, 216, 60, 0.12); border: 1px solid rgba(255, 216, 60, 0.28); }
.mode.offline { color: var(--alarm); background: rgba(248, 71, 58, 0.12); }
.clocks { display: flex; flex-direction: column; align-items: flex-end; font-size: 12px; color: var(--font-4); line-height: 1.25; }
.clocks .num { color: var(--font-1); font-size: 13px; }
.user-btn, .ghost {
  height: 32px; padding: 0 10px; border-radius: 4px; cursor: pointer;
  background: transparent; border: 1px solid var(--border-color); color: var(--font-2);
}
.user-btn:hover, .ghost:hover { border-color: var(--primary); color: var(--primary); }
.crumb {
  height: 32px; display: flex; align-items: center; gap: 8px; padding: 0 20px;
  color: var(--font-4); font-size: 12px; flex-shrink: 0;
}
.crumb strong { color: var(--font-2); font-weight: 600; }
.crumb em { font-style: normal; color: var(--font-5); }
.crumb-time { margin-left: auto; }
.main { flex: 1; min-height: 0; padding: 12px 20px 16px; overflow: auto; display: flex; flex-direction: column; gap: 8px; }
.main.fit { overflow: hidden; }
.menu-link { color: inherit; text-decoration: none; display: block; min-width: 128px; }
@media (max-width: 1600px) {
  .brand em, .clocks span:last-child { display: none; }
  .park { display: none; }
}
</style>
