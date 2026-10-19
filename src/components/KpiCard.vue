<template>
  <div class="kpi" :class="tone" :style="{ '--rail': color }">
    <div class="kpi-label">
      <span>{{ label }}</span>
      <el-tooltip v-if="tip" :content="tip" placement="top">
        <span class="help" tabindex="0">?</span>
      </el-tooltip>
    </div>
    <div class="kpi-value num">{{ value }}<small v-if="unit">{{ unit }}</small></div>
    <div class="kpi-sub">{{ sub || ' ' }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: String,
  unit: String,
  sub: String,
  tip: String,
  tone: { type: String, default: '' },
  color: { type: String, default: '#ffffff' },
})
</script>
