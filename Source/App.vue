<script setup>
import { ref } from 'vue'

import GameView from './Views/GameView.vue'

// Questões de exemplo (uma de cada tipo) só para deixar o jogo jogável.
const QUESTIONS = [
  {
    id: 'q1',
    type: 'MultipleChoise',
    prompt: 'Qual é a capital da França?',
    options: [
      { id: 'a', text: 'Paris' },
      { id: 'b', text: 'Londres' },
      { id: 'c', text: 'Madri' },
      { id: 'd', text: 'Roma' },
    ],
    correctAnswer: 'a',
    explanation: 'Paris é a capital e maior cidade da França.',
  },
  {
    id: 'q2',
    type: 'TrueOrFalse',
    statement: 'Vue.js é um framework JavaScript para construção de interfaces.',
    correctAnswer: true,
    explanation: 'Vue é um framework progressivo focado em interfaces.',
  },
  {
    id: 'q3',
    type: 'FillBlanks',
    prompt: 'Complete a frase sobre Vue:',
    text: 'Vue é um framework ___ e usa ___ para atualizar a tela.',
    correctAnswer: ['progressivo', 'reatividade'],
    explanation: 'Vue é progressivo e reage a mudanças de estado.',
  },
  {
    id: 'q4',
    type: 'MatchingPairs',
    prompt: 'Ligue cada ferramenta à sua função:',
    pairs: [
      { left: 'Vue', right: 'Framework de UI' },
      { left: 'Vite', right: 'Servidor de desenvolvimento' },
      { left: 'Pinia', right: 'Gerenciamento de estado' },
    ],
    explanation: 'Cada ferramenta tem um papel no ecossistema.',
  },
]

const gameKey = ref(0)
const result = ref(null)

function finish(payload) {
  result.value = payload
}

function restart() {
  result.value = null
  gameKey.value += 1
}
</script>

<template>
  <GameView
    v-if="!result"
    :key="gameKey"
    :questions="QUESTIONS"
    :lives="3"
    @finished="finish"
    @exit="finish"
  />

  <main v-else class="result">
    <h1 class="result__title">Fim de jogo</h1>

    <p class="result__score">
      Pontuação: <strong>{{ result.score }}</strong>
    </p>

    <p v-if="result.correctCount !== undefined" class="result__detail">
      {{ result.correctCount }} acertos · {{ result.wrongCount }} erros
    </p>

    <button type="button" class="result__button" @click="restart">
      Jogar de novo
    </button>
  </main>
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
  color: #eafcff;
  text-align: center;
  background: #08080c;
}

.result__title {
  margin: 0;
  font-size: clamp(28px, 6vw, 44px);
}

.result__score {
  margin: 0;
  font-size: 20px;
  color: #7dfcff;
}

.result__detail {
  margin: 0;
  color: rgba(234, 252, 255, 0.58);
}

.result__button {
  margin-top: 12px;
  padding: 12px 28px;
  font: inherit;
  font-weight: 600;
  color: #08080c;
  cursor: pointer;
  background: #00f0ff;
  border: 0;
  border-radius: 999px;
}

.result__button:hover {
  background: #7dfcff;
}
</style>