<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  label: { type: String, default: '' },
  showValue: { type: Boolean, default: false },
})

const safeMax = computed(() => {
  return Number.isFinite(props.max) && props.max > 0 ? props.max : 100
})

const safeValue = computed(() => {
  const value = Number(props.value)

  if (!Number.isFinite(value)) return 0

  return Math.min(Math.max(value, 0), safeMax.value)
})

const percentage = computed(() => {
  return Math.round((safeValue.value / safeMax.value) * 100)
})

const showMeta = computed(() => Boolean(props.label) || props.showValue)
</script>

<template>
  <div class="progress-bar">
    <div v-if="showMeta" class="progress-bar__meta">
      <span v-if="label" class="progress-bar__label">{{ label }}</span>
      <span v-if="showValue" class="progress-bar__value">{{ percentage }}%</span>
    </div>

    <div
      class="progress-bar__track"
      role="progressbar"
      :aria-label="label || 'Progresso'"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="percentage"
      :aria-valuetext="`${percentage}%`"
    >
      <div class="progress-bar__fill" :style="{ width: `${percentage}%` }" />
    </div>
  </div>
</template>

<style scoped>
.progress-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.progress-bar__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.progress-bar__value {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-mint-strong);
}

.progress-bar__track {
  position: relative;
  width: 100%;
  height: 16px;
  overflow: hidden;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-mint);
  border-radius: inherit;
  transition: width 250ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar__fill {
    transition: none;
  }
}
</style>