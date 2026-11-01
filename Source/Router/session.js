/**
 * Estado de sessão compartilhado entre as rotas do jogo.
 *
 * `GameView` só recebe `questions`, e `ResultView`/`ExplanationView` precisam
 * de dados produzidos durante a partida. Como as rotas são navegáveis por URL,
 * guardamos o último resultado e a última resposta de forma serializável
 * (também em `sessionStorage`) para que a navegação e o recarregamento da
 * página não quebrem.
 */

import { shallowRef } from 'vue'

const STORAGE_KEY = 'inominado:game-session'

const EMPTY_STATE = Object.freeze({ result: null, answer: null })

/**
 * @returns {{ result: object | null, answer: object | null }}
 */
function readStoredState() {
  if (typeof sessionStorage === 'undefined') return { ...EMPTY_STATE }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)

    if (!raw) return { ...EMPTY_STATE }

    const parsed = JSON.parse(raw)

    return {
      result: parsed?.result ?? null,
      answer: parsed?.answer ?? null,
    }
  } catch {
    return { ...EMPTY_STATE }
  }
}

/**
 * @param {{ result: object | null, answer: object | null }} state
 * @returns {void}
 */
function writeStoredState(state) {
  if (typeof sessionStorage === 'undefined') return

  try {
    if (!state.result && !state.answer) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Armazenamento indisponível (modo privado/cota): segue só em memória.
  }
}

const initialState = readStoredState()

/** @type {import('vue').ShallowRef<object | null>} */
export const lastResult = shallowRef(initialState.result)

/** @type {import('vue').ShallowRef<object | null>} */
export const lastAnswer = shallowRef(initialState.answer)

/**
 * @param {object | null} value
 * @returns {void}
 */
export function setLastResult(value) {
  lastResult.value = value ?? null
  writeStoredState({ result: lastResult.value, answer: lastAnswer.value })
}

/**
 * @param {object | null} value
 * @returns {void}
 */
export function setLastAnswer(value) {
  lastAnswer.value = value ?? null
  writeStoredState({ result: lastResult.value, answer: lastAnswer.value })
}

/**
 * @returns {void}
 */
export function clearGameSession() {
  lastResult.value = null
  lastAnswer.value = null
  writeStoredState({ ...EMPTY_STATE })
}

/**
 * Compara IDs de rota com IDs armazenados sem depender do tipo.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function sameId(a, b) {
  return a !== undefined && a !== null && b !== undefined && b !== null
    ? String(a) === String(b)
    : false
}
