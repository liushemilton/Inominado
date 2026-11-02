<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  question: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit-answer'])

const selectedIds = ref([])

const instruction = computed(() => {
  return (
    props.question?.prompt ??
    props.question?.question ??
    props.question?.instruction ??
    'Toque nos fragmentos na ordem correta para construir a cadeia orgânica:'
  )
})

const rawItems = computed(() => {
  const question = props.question
  const source =
    question?.items ??
    question?.options ??
    question?.fragments ??
    question?.chain ??
    []

  return Array.isArray(source) ? source : []
})

// Normaliza os fragmentos da molécula (átomos, radicais ou grupos funcionais)
const items = computed(() => {
  return rawItems.value.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      return {
        id: String(item.id ?? index),
        label: String(
          item.label ??
          item.text ??
          item.name ??
          item.value ??
          `Grupo ${index + 1}`,
        ),
        value: item.value ?? item.id ?? item.text ?? item.label ?? index,
      }
    }

    return {
      id: String(index),
      label: String(item),
      value: item,
    }
  })
})

const selectedItems = computed(() => {
  return selectedIds.value
    .map((id) => items.value.find((item) => item.id === id))
    .filter(Boolean)
})

const availableItems = computed(() => {
  return items.value.map((item) => ({
    ...item,
    selected: selectedIds.value.includes(item.id),
  }))
})

const canSubmit = computed(() => {
  return selectedIds.value.length > 0
})

const typeLabel = computed(() => {
  return 'Construção de Cadeia Orgânica'
})

watch(
  () => [props.question, items.value],
  () => {
    selectedIds.value = []
  },
  { immediate: true },
)

function selectItem(item) {
  if (props.disabled || selectedIds.value.includes(item.id)) return
  selectedIds.value.push(item.id)
}

function deselectItem(id) {
  if (props.disabled) return
  selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id)
}

// Função auxiliar simples para formatar números químicos automaticamente (ex: CH3 -> CH₂)
// Se preferir passar o texto cru, você pode remover ou ajustar essa formatação.
function formatChemicalLabel(text) {
  // Substitui números comuns por subscritos se desejar um visual mais profissional, 
  // ou apenas retorna o texto puro caso os blocos já venham formatados.
  return text
}

function submitAnswer() {
  if (props.disabled || !canSubmit.value) return
  const answer = selectedItems.value.map((item) => item.value)
  emit('submit-answer', answer)
}
</script>

<template>
  <section class="organic-builder">
    <header class="organic-builder__header">
      <span class="organic-builder__type">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 2v7.31L4.35 19.5a1 1 0 0 0 .86 1.5h13.58a1 1 0 0 0 .86-1.5L14 9.31V2h-4z" />
          <line x1="8" y1="6" x2="16" y2="6" />
        </svg>
        {{ typeLabel }}
      </span>

      <h2 v-if="instruction" class="organic-builder__instruction">
        {{ instruction }}
      </h2>
    </header>

    <div class="organic-builder__content">
      <!-- 1. Visualização da Molécula sendo Montada (Linha Principal) -->
      <div class="organic-builder__answer-zone">
        <div class="organic-builder__formula-line">
          <TransitionGroup name="molecule-pop">
            <template v-for="(item, index) in selectedItems" :key="item.id">
              <!-- Conector químico visual entre os blocos (traço de ligação) -->
              <span v-if="index > 0" class="organic-builder__bond" aria-hidden="true">—</span>

              <button
                type="button"
                class="organic-builder__chip is-selected"
                :disabled="disabled"
                @click="deselectItem(item.id)"
                title="Remover grupo"
              >
                <code>{{ formatChemicalLabel(item.label) }}</code>
              </button>
            </template>
          </TransitionGroup>

          <div v-if="selectedItems.length === 0" class="organic-builder__placeholder-text">
            Toque nos fragmentos abaixo para montar a estrutura da molécula
          </div>
        </div>
      </div>

      <!-- 2. Banco de Fragmentos Orgânicos (Abaixo) -->
      <div class="organic-builder__bank-zone">
        <div class="organic-builder__chips-grid">
          <button
            v-for="item in availableItems"
            :key="item.id"
            type="button"
            class="organic-builder__chip"
            :class="{ 'is-hidden': item.selected }"
            :disabled="disabled || item.selected"
            @click="selectItem(item)"
          >
            <code>{{ formatChemicalLabel(item.label) }}</code>
          </button>
        </div>
      </div>
    </div>

    <form class="organic-builder__form" @submit.prevent="submitAnswer">
      <div class="organic-builder__actions">
        <button
          type="submit"
          class="organic-builder__submit"
          :disabled="disabled || !canSubmit"
        >
          Confirmar Molécula
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.organic-builder {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  color: var(--color-ink, #111827);
}

.organic-builder__header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.organic-builder__type {
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

.organic-builder__type svg {
  width: 14px;
  height: 14px;
}

.organic-builder__instruction {
  margin: 0;
  font-size: clamp(1.1rem, 2.2vw, 1.4rem);
  font-weight: 800;
  line-height: 1.4;
  color: var(--color-ink, #111827);
}

.organic-builder__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--color-surface-soft, #f9fafb);
  border: 2px solid var(--color-border, #e5e7eb);
  border-radius: 20px;
  padding: 20px;
}

/* Área de Resposta / Montagem da Cadeia (Acima) */
.organic-builder__answer-zone {
  min-height: 100px;
  display: flex;
  align-items: center;
  border-bottom: 2px dashed var(--color-border, #d1d5db);
  padding-bottom: 16px;
  overflow-x: auto;
}

.organic-builder__formula-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  align-items: center;
}

.organic-builder__bond {
  font-size: 1.2rem;
  font-weight: 900;
  color: var(--color-emerald-strong, #047857);
  padding: 0 2px;
  user-select: none;
}

.organic-builder__placeholder-text {
  font-size: 0.9rem;
  color: var(--color-ink-faint, #9ca3af);
  font-style: italic;
  width: 100%;
  text-align: center;
  padding: 10px 0;
}

/* Banco de Fragmentos (Abaixo) */
.organic-builder__bank-zone {
  min-height: 80px;
  display: flex;
  align-items: center;
}

.organic-builder__chips-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

/* Blocos Estilizados para Fórmulas Químicas */
.organic-builder__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font: inherit;
  cursor: pointer;
  background: var(--color-surface, #ffffff);
  border: 2px solid var(--color-border, #d1d5db);
  border-bottom-width: 4px; /* Efeito 3D de bloco */
  border-radius: 12px;
  transition: transform 80ms ease, background-color 160ms ease, border-color 160ms ease;
  user-select: none;
}

.organic-builder__chip code {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-ink, #111827);
}

.organic-builder__chip:not(:disabled):hover {
  background: var(--color-emerald-soft, #ecfdf5);
  border-color: var(--color-emerald, #10b981);
}

.organic-builder__chip:not(:disabled):active {
  transform: translateY(2px);
  border-bottom-width: 2px;
}

/* Bloco Ativo na Cadeia Superior */
.organic-builder__chip.is-selected {
  background: var(--color-emerald-soft, #ecfdf5);
  border-color: var(--color-emerald-strong, #047857);
}

.organic-builder__chip.is-selected code {
  color: var(--color-emerald-strong, #047857);
}

/* Esconde o fragmento de baixo quando ele sobe para a cadeia */
.organic-builder__chip.is-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.8);
  transition: opacity 150ms ease, transform 150ms ease, visibility 150ms ease;
}

.organic-builder__form {
  display: flex;
  flex-direction: column;
}

.organic-builder__actions {
  display: flex;
  justify-content: flex-end;
}

.organic-builder__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  padding: 12px 22px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary-ink, #fff);
  cursor: pointer;
  background: var(--color-primary, #059669);
  border: 2px solid var(--color-primary-border, #047857);
  border-radius: 9999px;
  transition: background-color 160ms ease, transform 160ms ease;
}

.organic-builder__submit:not(:disabled):hover {
  background: var(--color-primary-hover, #047857);
  transform: translateY(-1px);
}

.organic-builder__submit:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background: var(--color-surface-soft, #f3f4f6);
  border-color: var(--color-border-soft, #e5e7eb);
  color: var(--color-ink-faint, #9ca3af);
}

/* Animação suave ao encaixar blocos */
.molecule-pop-enter-active,
.molecule-pop-leave-active {
  transition: all 150ms ease;
}
.molecule-pop-enter-from,
.molecule-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.9);
}
</style>