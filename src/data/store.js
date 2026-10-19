import { computed, reactive } from 'vue'
import { SCENE_LIST, SCENES } from './scenarios.js'

export const energyState = reactive({
  role: 'admin',
  scenarioId: 'sunny',
  park: '长沙铁路物流园区',
  fault: 'ok',
})

export const sceneList = SCENE_LIST

export const currentScene = computed(() => SCENES[energyState.scenarioId])

export const isLeader = computed(() => energyState.role === 'leader')

export const dataMode = computed(() => {
  if (energyState.fault === 'offline') {
    return { text: '离线', tone: 'offline' }
  }
  return { text: '演示数据', tone: 'demo' }
})

export function setScenario(id) {
  if (SCENES[id]) energyState.scenarioId = id
}

export function setRole(role) {
  energyState.role = role === 'leader' ? 'leader' : 'admin'
}

export function setFault(fault) {
  energyState.fault = fault
}
