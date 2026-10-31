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
            ♥
          </span>
        </span>
        <span class="game-header__lives-count" aria-hidden="true">
          {{ safeLives }}/{{ safeMaxLives }}
        </span>
      </div>

      <div class="game-header__score">
        <span class="game-header__label">Pontuação</span>
        <span class="game-header__score-value">{{ formattedScore }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.game-header {
  --neon: #00f0ff;
  --surface: #0d0e15;
  --surface-hover: #141622;
  --border-default: #1a1c29;
  --text: #eafcff;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.game-header__exit {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease, background-color 150ms ease;
}

.game-header__exit:hover {
  color: var(--neon);
  border-color: var(--neon);
  background: var(--surface-hover);
}

.game-header__exit:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 2px;
}

.game-header__exit-icon {
  width: 16px;
  height: 16px;
}

.game-header__stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.game-header__lives,
.game-header__score {
  display: flex;
  align-items: center;
  gap: 10px;
}

.game-header__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a99ad;
}

.game-header__hearts {
  display: inline-flex;
  gap: 4px;
}

.game-header__heart {
  font-size: 1rem;
  line-height: 1;
  color: var(--neon);
}

.game-header__heart.is-empty {
  color: var(--border-default);
}

.game-header__lives-count {
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: #8a99ad;
}

.game-header__score {
  padding-left: 20px;
  border-left: 1px solid var(--border-default);
}

.game-header__score-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 1.1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--neon);
}

@media (max-width: 640px) {
  .game-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
  }

  .game-header__stats {
    flex: 1 1 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .game-header__score {
    padding-left: 12px;
  }

  .game-header__label {
    font-size: 0.65rem;
  }

  .game-header__heart {
    font-size: 0.9rem;
  }

  .game-header__score-value {
    font-size: 1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-header__exit {
    transition: none;
  }
}
</style>