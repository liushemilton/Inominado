<script setup>
import { computed } from 'vue'

const props = defineProps({
  level: { type: Object, default: () => ({}) },
  phase: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['back', 'select'])

const title = computed(() => props.phase?.title ?? 'Trilha')

const description = computed(() => props.phase?.description ?? '')

const subtopics = computed(() => {
  return Array.isArray(props.phase?.subtopics) ? props.phase.subtopics : []
})

const totalLevels = computed(() => subtopics.value.length)

/**
 * @param {object} subtopic
 * @returns {number}
 */
function childCount(subtopic) {
  return Array.isArray(subtopic?.children) ? subtopic.children.length : 0
}

/**
 * @param {object} subtopic
 * @returns {void}
 */
function handleSelect(subtopic) {
  emit('select', subtopic)
}
</script>

<template>
  <main class="topic-trail">
    <div class="topic-trail__shell">
      <header class="topic-trail__header">
        <button type="button" class="topic-trail__back" @click="emit('back')">
          <span aria-hidden="true">←</span>
          Roadmap
        </button>

        <span v-if="level?.title" class="topic-trail__eyebrow">
          {{ level.title }}
        </span>

        <h1 class="topic-trail__title">{{ title }}</h1>

        <p v-if="description" class="topic-trail__description">
          {{ description }}
        </p>

        <div class="topic-trail__meta">
          <span>
            {{ totalLevels }}
            {{ totalLevels === 1 ? 'nível' : 'níveis' }}
          </span>
          <span>Toque em um nível para começar</span>
        </div>
      </header>

      <section
        v-if="subtopics.length"
        class="topic-trail__board"
        aria-label="Trilha de níveis"
      >
        <ol class="topic-trail__path">
          <li
            v-for="(subtopic, index) in subtopics"
            :key="subtopic.id"
            class="topic-trail__node"
            :class="{ 'is-first': index === 0 }"
          >
            <button
              type="button"
              class="topic-trail__level"
              @click="handleSelect(subtopic)"
            >
              <span class="topic-trail__marker" aria-hidden="true">
                {{ String(index + 1).padStart(2, '0') }}
              </span>

              <span class="topic-trail__copy">
                <span class="topic-trail__level-label">
                  Nível {{ index + 1 }}
                </span>
                <span class="topic-trail__level-title">
                  {{ subtopic.title }}
                </span>
                <span
                  v-if="childCount(subtopic) > 0"
                  class="topic-trail__level-extra"
                >
                  {{ childCount(subtopic) }} tópicos internos
                </span>
              </span>

              <span class="topic-trail__arrow" aria-hidden="true">→</span>
            </button>
          </li>
        </ol>
      </section>

      <section v-else class="topic-trail__empty">
        <span class="topic-trail__empty-icon" aria-hidden="true">✦</span>
        <h2 class="topic-trail__empty-title">Nenhum nível disponível</h2>
        <p class="topic-trail__empty-text">
          Este módulo ainda não possui subtópicos cadastrados.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
  min-height: 100%;
}

:global(body) {
  margin: 0;
  background: #08080c;
}

.topic-trail {
  --neon: #00f0ff;
  --surface: #0d0e15;
  --surface-panel: #10121a;
  --border-default: #1a1c29;
  --text: #eafcff;
  --muted: #8a99ad;

  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: clamp(16px, 3vw, 36px) clamp(12px, 2vw, 24px);
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: var(--text);
  background: #08080c;
}

.topic-trail__shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 720px;
}

.topic-trail__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: clamp(16px, 3vw, 24px);
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.topic-trail__back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 6px;
  font: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  transition: color 150ms ease, border-color 150ms ease;
}

.topic-trail__back:hover {
  color: var(--neon);
  border-color: rgb(0 240 255 / 45%);
}

.topic-trail__eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon);
}

.topic-trail__title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.15;
}

.topic-trail__description {
  max-width: 54ch;
  margin: 2px 0 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--muted);
}

.topic-trail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 4px;
  font-size: 0.7rem;
  color: var(--muted);
}

.topic-trail__board {
  padding: clamp(16px, 3vw, 24px);
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.topic-trail__path {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.topic-trail__path::before {
  content: '';
  position: absolute;
  top: 24px;
  bottom: 24px;
  left: 50%;
  width: 0;
  border-left: 2px dashed rgb(0 240 255 / 22%);
  transform: translateX(-50%);
}

.topic-trail__node {
  position: relative;
  z-index: 1;
  width: min(330px, 100%);
}

.topic-trail__node:nth-child(odd) {
  align-self: flex-start;
}

.topic-trail__node:nth-child(even) {
  align-self: flex-end;
}

.topic-trail__level {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  transition: border-color 150ms ease, box-shadow 150ms ease,
    transform 150ms ease;
}

.topic-trail__level:hover {
  border-color: rgb(0 240 255 / 55%);
  box-shadow: 0 0 0 1px rgb(0 240 255 / 18%), 0 8px 24px rgb(0 0 0 / 35%);
  transform: translateY(-1px);
}

.topic-trail__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--neon);
  background: transparent;
  border: 1px solid rgb(0 240 255 / 45%);
  border-radius: 50%;
}

.topic-trail__node.is-first .topic-trail__marker {
  color: #08080c;
  background: var(--neon);
  border-color: var(--neon);
  box-shadow: 0 0 18px rgb(0 240 255 / 35%);
}

.topic-trail__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}

.topic-trail__level-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.topic-trail__level-title {
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.35;
}

.topic-trail__level-extra {
  font-size: 0.68rem;
  color: var(--muted);
}

.topic-trail__arrow {
  flex: 0 0 auto;
  font-size: 0.9rem;
  color: var(--neon);
  opacity: 0.7;
  transition: opacity 150ms ease, transform 150ms ease;
}

.topic-trail__level:hover .topic-trail__arrow {
  opacity: 1;
  transform: translateX(2px);
}

.topic-trail__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: clamp(32px, 6vw, 64px) 20px;
  text-align: center;
  background: var(--surface-panel);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.topic-trail__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  font-size: 1.1rem;
  color: var(--neon);
  border: 1px solid var(--neon);
  border-radius: 4px;
}

.topic-trail__empty-title {
  margin: 4px 0 0;
  font-size: 1.15rem;
}

.topic-trail__empty-text {
  max-width: 40ch;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--muted);
}

.topic-trail__back:focus-visible,
.topic-trail__level:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .topic-trail__path::before {
    display: none;
  }

  .topic-trail__node,
  .topic-trail__node:nth-child(even) {
    width: 100%;
    align-self: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .topic-trail__back,
  .topic-trail__level,
  .topic-trail__arrow {
    transition: none;
  }
}
</style>
