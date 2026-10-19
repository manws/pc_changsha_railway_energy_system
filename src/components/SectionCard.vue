<template>
  <section class="section-card">
    <header v-if="title || $slots.extra" class="section-head">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="desc" class="section-desc">{{ desc }}</p>
      </div>
      <slot name="extra" />
    </header>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: String,
  desc: String,
})
</script>
