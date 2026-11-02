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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Roadmap
        </button>

        <div class="topic-trail__heading">
          <span v-if="level?.title" class="topic-trail__eyebrow">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M9 3h6" />
              <path d="M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.5h8.6a2.5 2.5 0 0 0 2.2-3.5L14 9.5V3" />
              <path d="M7.5 15h9" />
            </svg>
            {{ level.title }}
          </span>
          <h1 class="topic-trail__title">{{ title }}</h1>
          <p v-if="description" class="topic-trail__description">
            {{ description }}
          </p>
        </div>

        <div class="topic-trail__overview-meta">
          <span>
            {{ totalLevels }}
            {{ totalLevels === 1 ? 'nível' : 'níveis' }}
          </span>
          <span class="topic-trail__instruction">Toque em um nível para começar</span>
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

              <span class="topic-trail__arrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </li>
        </ol>
      </section>

      <section v-else class="topic-trail__empty">
        <span class="topic-trail__empty-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 3h6" />
            <path d="M10 3v6.5L5.5 17a2.5 2.5 0 0 0 2.2 3.5h8.6a2.5 2.5 0 0 0 2.2-3.5L14 9.5V3" />
            <path d="M7.5 15h9" />
          </svg>
        </span>
        <h2 class="topic-trail__empty-title">Nenhum nível disponível</h2>
        <p class="topic-trail__empty-text">
          Este módulo ainda não possui subtópicos cadastrados.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.topic-trail {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
  padding: var(--page-padding);
  color: var(--color-ink);
  background: var(--color-bg);
}

.topic-trail__shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: var(--content-width);
}

.topic-trail__header {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: clamp(20px, 3vw, 30px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.topic-trail__back {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-ink-muted);
  cursor: pointer;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.topic-trail__back svg {
  width: 14px;
  height: 14px;
}

.topic-trail__back:hover {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.topic-trail__heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-trail__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 6px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-mint-strong);
  background: var(--color-mint-soft);
  border: 2px solid var(--color-mint);
  border-radius: var(--radius-pill);
}

.topic-trail__eyebrow svg {
  width: 14px;
  height: 14px;
}

.topic-trail__title {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--color-ink);
}

.topic-trail__description {
  max-width: 56ch;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.topic-trail__overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 14px;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
  border-top: 2px solid var(--color-border-soft);
}

.topic-trail__overview-meta > span {
  padding: 5px 10px;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border-soft);
  border-radius: var(--radius-pill);
}

.topic-trail__overview-meta > .topic-trail__instruction {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
}

.topic-trail__board {
  padding: clamp(20px, 3vw, 30px);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.topic-trail__path {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.topic-trail__path::before {
  content: '';
  position: absolute;
  top: 30px;
  bottom: 30px;
  left: 50%;
  width: 0;
  border-left: 3px dashed var(--color-border);
  transform: translateX(-50%);
}

.topic-trail__node {
  position: relative;
  z-index: 1;
  width: min(360px, 100%);
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
  gap: 16px;
  width: 100%;
  padding: 16px;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
  background: var(--color-surface-soft);
  border: 3px solid var(--color-border-soft);
  border-radius: var(--radius-card);
  transition: border-color 180ms ease, transform 180ms ease, background-color 180ms ease;
}

.topic-trail__level:hover {
  background: var(--color-surface);
  border-color: var(--color-cyan);
  transform: translateY(-2px);
}

.topic-trail__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--color-cyan-strong);
  background: var(--color-surface);
  border: 2px solid var(--color-cyan);
  border-radius: 12px;
}

.topic-trail__node.is-first .topic-trail__marker {
  color: var(--color-primary-ink);
  background: var(--color-primary);
  border-color: var(--color-primary-border);
}

.topic-trail__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}

.topic-trail__level-label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.topic-trail__level-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.35;
  color: var(--color-ink);
}

.topic-trail__level-extra {
  font-size: 0.7rem;
  color: var(--color-ink-muted);
}

.topic-trail__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-pill);
  opacity: 0.8;
  transition: opacity 160ms ease, transform 160ms ease;
}

.topic-trail__arrow svg {
  width: 14px;
  height: 14px;
}

.topic-trail__level:hover .topic-trail__arrow {
  opacity: 1;
  transform: translateX(2px);
}

.topic-trail__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: clamp(36px, 6vw, 68px) 20px;
  text-align: center;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.topic-trail__empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border: 2px solid var(--color-cyan);
  border-radius: var(--radius-card);
}

.topic-trail__empty-icon svg {
  width: 28px;
  height: 28px;
}

.topic-trail__empty-title {
  margin: 4px 0 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--color-ink);
}

.topic-trail__empty-text {
  max-width: 42ch;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.topic-trail__back:focus-visible,
.topic-trail__level:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
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

  .topic-trail__back:hover,
  .topic-trail__level:hover {
    transform: none;
  }
}
</style>