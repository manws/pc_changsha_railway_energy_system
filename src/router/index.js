import { createRouter, createWebHistory } from 'vue-router'
import Overview from '../views/Overview.vue'
import PvMonitor from '../views/PvMonitor.vue'
import PvDevices from '../views/PvDevices.vue'
import PvDeviceDetail from '../views/PvDeviceDetail.vue'
import PvForecast from '../views/PvForecast.vue'
import PvEvaluation from '../views/PvEvaluation.vue'
import LoadMonitor from '../views/LoadMonitor.vue'
import LoadForecast from '../views/LoadForecast.vue'
import FeederDetail from '../views/FeederDetail.vue'
import EssMonitor from '../views/EssMonitor.vue'
import EssDetail from '../views/EssDetail.vue'
import Schedule from '../views/Schedule.vue'
import DayAhead from '../views/DayAhead.vue'
import Intraday from '../views/Intraday.vue'
import Constraints from '../views/Constraints.vue'
import DataSources from '../views/DataSources.vue'
import Alarms from '../views/Alarms.vue'

const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', component: Overview, meta: { title: '能源协同总览', group: '电站首页', pageCode: 'OV-01', fit: true } },
  { path: '/pv', component: PvMonitor, meta: { title: '光伏运行总览', group: '实时监视', pageCode: 'PV-M01', fit: true } },
  { path: '/pv/devices', component: PvDevices, meta: { title: '光伏设备列表', group: '实时监视', pageCode: 'PV-M02' } },
  { path: '/pv/devices/:id', component: PvDeviceDetail, meta: { title: '光伏设备详情', group: '实时监视', pageCode: 'PV-M03' } },
  { path: '/pv/forecast', component: PvForecast, meta: { title: '光伏发电预测', group: '预测分析', pageCode: 'PV-F01', fit: true } },
  { path: '/pv/evaluation', component: PvEvaluation, meta: { title: '光伏预测评估', group: '预测分析', pageCode: 'PV-F02' } },
  { path: '/load', component: LoadMonitor, meta: { title: '园区负荷总览', group: '实时监视', pageCode: 'LD-M01', fit: true } },
  { path: '/load/forecast', component: LoadForecast, meta: { title: '负荷预测', group: '预测分析', pageCode: 'LD-F01', fit: true } },
  { path: '/load/feeders/:id', component: FeederDetail, meta: { title: '变压器与馈线详情', group: '实时监视', pageCode: 'LD-M02' } },
  { path: '/ess', component: EssMonitor, meta: { title: '储能综合看板', group: '储能系统', pageCode: 'ES-M01', fit: true } },
  { path: '/ess/:id', component: EssDetail, meta: { title: '储能设备详情', group: '储能系统', pageCode: 'ES-M02' } },
  { path: '/schedule', component: Schedule, meta: { title: '智能调度总览', group: '智能调度', pageCode: 'SCH-01', fit: true } },
  { path: '/schedule/day-ahead', component: DayAhead, meta: { title: '日前调度计划', group: '智能调度', pageCode: 'SCH-02', fit: true } },
  { path: '/schedule/intraday', component: Intraday, meta: { title: '日内滚动修正', group: '智能调度', pageCode: 'SCH-03' } },
  { path: '/schedule/constraints', component: Constraints, meta: { title: '策略与约束', group: '智能调度', pageCode: 'SCH-04' } },
  { path: '/system/sources', component: DataSources, meta: { title: '数据源与接口状态', group: '实时监视', pageCode: 'SYS-01' } },
  { path: '/alarms', component: Alarms, meta: { title: '实时告警', group: '告警管理', pageCode: 'ALM-01' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_PATH || '/'),
  routes,
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '能源管控'} · 长沙铁路物流园区`
})

export default router
