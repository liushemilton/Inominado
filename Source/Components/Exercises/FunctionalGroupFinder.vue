<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const selectedHotspot = ref(null)

const instruction = computed(() => {
  return props.question?.prompt || props.question?.question || 'Clique no grupo funcional indicado na estrutura:'
})

const typeLabel = computed(() => {
  return 'Identificação Visual de Grupo Funcional'
})

// Lista de hotspots esperados (ex: [{ id: 'oh', label: 'Álcool', x: 45, y: 30, radius: 10 }])
const hotspots = computed(() => {
  return Array.isArray(props.question?.hotspots) ? props.question.hotspots : []
})

const canSubmit = computed(() => {
  return selectedHotspot.value !== null
})

function selectHotspot(hotspot) {
  if (props.disabled) return
  selectedHotspot.value = hotspot
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return
  emit('submit-answer', selectedHotspot.value)
}
</script>

<template>
  <section class="functional-group-finder">
    <header class="functional-group-finder__header">
      <span class="functional-group-finder__type">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M10 2v7.31L4.35 19.5a1 1 0 0 0 .86 1.5h13.58a1 1 0 0 0 .86-1.5L14 9.31V2h-4z" />
          <line x1="8" y1="6" x2="16" y2="6" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 class="functional-group-finder__instruction">
        {{ instruction }}
      </h2>
    </header>

    <!-- Área visual da molécula com suporte a hotspots -->
    <div class="functional-group-finder__visual-container">
      <div class="functional-group-finder__canvas">
        <img 
          v-if="question?.imageUrl" 
          :src="question.imageUrl" 
          alt="Estrutura molecular complexa" 
          class="functional-group-finder__image" 
        />

        <!-- Hotspots interativos sobrepostos -->
        <button
          v-for="spot in hotspots"
          :key="spot.id"
          type="button"
          class="functional-group-finder__hotspot"
          :class="{ 'is-selected': selectedHotspot?.id === spot.id }"
          :style="{ top: `${spot.y}%`, left: `${spot.x}%` }"
          :disabled="disabled"
          @click="selectHotspot(spot)"
          :aria-label="`Selecionar ${spot.label || 'grupo funcional'}`"
        >
          <span class="functional-group-finder__hotspot-dot"></span>
        </button>
      </div>
    </div>

    <div class="functional-group-finder__actions">
      <button
        type="button"
        class="functional-group-finder__submit"
        :disabled="disabled || !canSubmit"
        @click="submitAnswer"
      >
        Confirmar Seleção
      </button>
    </div>
  </section>
</template>

<style scoped>
.functional-group-finder {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  color: var(--color-ink, #111827);
}

.functional-group-finder__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.functional-group-finder__type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-emerald-strong, #047857);
  background: var(--color-emerald-soft, #ecfdf5);
  border: 2px solid var(--color-emerald, #10b981);
  border-radius: 9999px;
}

.functional-group-finder__type svg {
  width: 14px;
  height: 14px;
}

.functional-group-finder__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
}

.functional-group-finder__visual-container {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--color-surface-soft, #f9fafb);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}

.functional-group-finder__canvas {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.functional-group-finder__image {
  display: block;
  max-width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: contain;
}

/* Hotspots posicionados por porcentagem (%) */
.functional-group-finder__hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  padding: 0;
  background: rgba(16, 185, 129, 0.2);
  border: 2px solid var(--color-emerald, #10b981);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 150ms ease, background-color 150ms ease;
}

.functional-group-finder__hotspot-dot {
  width: 10px;
  height: 10px;
  background: var(--color-emerald-strong, #047857);
  border-radius: 50%;
}

.functional-group-finder__hotspot:hover {
  transform: translate(-50%, -50%) scale(1.15);
  background: rgba(16, 185, 129, 0.4);
}

.functional-group-finder__hotspot.is-selected {
  background: var(--color-emerald-strong, #047857);
  border-color: #065f46;
  transform: translate(-50%, -50%) scale(1.2);
}

.functional-group-finder__hotspot.is-selected .functional-group-finder__hotspot-dot {
  background: #ffffff;
}

.functional-group-finder__actions {
  display: flex;
  justify-content: flex-end;
}

.functional-group-finder__submit {
  min-width: 160px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  background: var(--color-primary, #059669);
  border: 2px solid var(--color-primary-border, #047857);
  border-radius: 9999px;
  transition: background-color 160ms ease, transform 160ms ease;
}

.functional-group-finder__submit:not(:disabled):hover {
  background: var(--color-primary-hover, #047857);
  transform: translateY(-1px);
}

.functional-group-finder__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
  border-color: var(--color-border-soft, #e5e7eb);
  color: var(--color-ink-faint, #9ca3af);
}
</style>