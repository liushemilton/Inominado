<script setup>
import { computed } from 'vue'

const props = defineProps({
  lives: { type: Number, default: 3 },
  maxLives: { type: Number, default: 3 },
  score: { type: Number, default: 0 },
  exitLabel: { type: String, default: 'Sair' },
})

const emit = defineEmits(['exit'])

const safeMaxLives = computed(() => {
  return Math.max(1, Math.floor(props.maxLives) || 1)
})

const safeLives = computed(() => {
  return Math.min(Math.max(0, Math.floor(props.lives) || 0), safeMaxLives.value)
})

const lifeSlots = computed(() => {
  return Array.from({ length: safeMaxLives.value }, (_, index) => {
    return index < safeLives.value
  })
})

const formattedScore = computed(() => {
  return new Intl.NumberFormat('pt-BR').format(Math.max(0, props.score))
})

const livesLabel = computed(() => {
  return `${safeLives.value} de ${safeMaxLives.value} vidas`
})
</script>

<template>
  <header class="game-header">
    <button
      type="button"
      class="game-header__exit"
      :aria-label="exitLabel"
      @click="emit('exit')"
    >
      <svg
        class="game-header__exit-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18l-6-6 6-6" />
        <path d="M3 12h18" />
      </svg>
      <span>{{ exitLabel }}</span>
    </button>

    <div class="game-header__stats">
      <div class="game-header__lives" :aria-label="livesLabel">
        <span class="game-header__label">Vidas</span>
        <span class="game-header__hearts" aria-hidden="true">
          <span
            v-for="(isFull, index) in lifeSlots"
            :key="index"
            class="game-header__heart"
            :class="{ 'is-empty': !isFull }"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </span>
        </span>
        <span class="game-header__lives-count" aria-hidden="true">
          {{ safeLives }}/{{ safeMaxLives }}
        </span>
      </div>

      <div class="game-header__score">
        <span class="game-header__label">Pontuação</span>
        <span class="game-header__score-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8" />
            <path d="M9.5 10h5" />
            <path d="M9.5 14h5" />
          </svg>
        </span>
        <span class="game-header__score-value">{{ formattedScore }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: var(--radius-card);
}

.game-header__exit {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-ink-soft);
  cursor: pointer;
  background: var(--color-surface-soft);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  transition: color 160ms ease, border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.game-header__exit:hover {
  color: var(--color-cyan-strong);
  background: var(--color-cyan-soft);
  border-color: var(--color-cyan);
  transform: translateY(-1px);
}

.game-header__exit:active {
  background: var(--color-cyan);
  transform: translateY(1px);
}

.game-header__exit:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.game-header__exit-icon {
  width: 16px;
  height: 16px;
}

.game-header__stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.game-header__lives,
.game-header__score {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 2px solid;
  border-radius: var(--radius-pill);
}

.game-header__lives {
  background: var(--color-coral-soft);
  border-color: var(--color-coral);
}

.game-header__score {
  background: var(--color-sun-soft);
  border-color: var(--color-sun);
}

.game-header__label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-ink-muted);
}

.game-header__hearts {
  display: inline-flex;
  gap: 3px;
}

.game-header__heart {
  display: inline-flex;
  color: var(--color-coral-strong);
}

.game-header__heart svg {
  width: 17px;
  height: 17px;
  fill: var(--color-coral);
}

.game-header__heart.is-empty {
  color: var(--color-border);
}

.game-header__heart.is-empty svg {
  fill: none;
}

.game-header__lives-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--color-coral-strong);
}

.game-header__score-icon {
  display: inline-flex;
  color: var(--color-sun-strong);
}

.game-header__score-icon svg {
  width: 17px;
  height: 17px;
}

.game-header__score-value {
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--color-sun-ink);
}

@media (max-width: 640px) {
  .game-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 14px;
  }

  .game-header__stats {
    flex: 1 1 100%;
    justify-content: space-between;
    gap: 8px;
  }

  .game-header__lives,
  .game-header__score {
    padding: 6px 10px;
  }

  .game-header__label {
    display: none;
  }

  .game-header__heart svg {
    width: 16px;
    height: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-header__exit {
    transition: none;
  }

  .game-header__exit:hover {
    transform: none;
  }
}
</style>
