<template>
  <span class="status-badge" :class="tone">{{ text }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '--' },
})

const tone = computed(() => {
  const value = props.text
  if (['正常', '运行', '充电', '合闸', '已批准'].includes(value)) return 'ok'
  if (['放电', '演示数据', '部分实时'].includes(value)) return 'info'
  if (['提醒', '待机', '超时', '估算', '未确认', '待审批'].includes(value)) return 'warn'
  if (['告警', '故障', '失败', '离线'].includes(value)) return 'alarm'
  if (['停机', '未接入', '历史回放'].includes(value)) return 'offline'
  return 'idle'
})
</script>
