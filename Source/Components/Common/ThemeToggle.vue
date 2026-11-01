<script setup>
import { onMounted, ref } from 'vue'

// Estado reativo para controlar se o tema escuro está ativo
const isDark = ref(false)

/**
 * Alterna entre o tema claro e escuro, atualizando a classe no <html>
 * e guardando a preferência no localStorage.
 */
function toggleTheme() {
  isDark.value = !isDark.value
  updateTheme()
}

function updateTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Ao carregar o componente, verifica o localStorage ou as preferências do sistema
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')

  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Se não houver preferência guardada, verifica a definição do sistema operativo
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  updateTheme()
})
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
    :title="isDark ? 'Tema Claro' : 'Tema Escuro'"
    @click="toggleTheme"
  >
    <!-- Ícone do Sol (Visível no modo escuro) -->
    <svg
      v-if="isDark"
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>

    <!-- Ícone da Lua (Visível no modo claro) -->
    <svg
      v-else
      class="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  cursor: pointer;
  background-color: var(--color-surface, #ffffff);
  border: var(--border-width, 2px) solid var(--color-border, #c7d3e1);
  border-radius: 50%;
  color: var(--color-ink, #17233a);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 160ms ease, background-color 200ms ease, border-color 200ms ease, color 200ms ease;
}

.theme-toggle:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary, #67e8f9);
  color: var(--color-primary-strong, #0e7490);
  background-color: var(--color-surface-soft, #f1f5f9);
}

.theme-toggle:active {
  transform: translateY(0);
}

.theme-toggle:focus-visible {
  outline: var(--border-width-strong, 3px) solid var(--color-focus, #0e7490);
  outline-offset: 3px;
}

.theme-toggle__icon {
  width: 22px;
  height: 22px;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle {
    transition: none;
  }

  .theme-toggle:hover {
    transform: none;
  }
}
</style>