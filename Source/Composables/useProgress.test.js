import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { STORAGE_KEYS } from '../Services/StorageService.js'
import {
  PROGRESS_VERSION,
  createProgressStore,
  resetProgressStore,
  useProgress,
} from './useProgress.js'

const silentLogger = { warn() {}, error() {} }

const LEVELS = [
  {
    id: 'nivel-01',
    title: 'Nível 01',
    phases: [{ id: 'fase-01' }, { id: 'fase-02' }],
  },
  {
    id: 'nivel-02',
    title: 'Nível 02',
    phases: [{ id: 'fase-01' }],
  },
]

/**
 * @param {Record<string, string>} [seed]
 */
function createMemoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed))

  return {
    _map: map,
    get length() {
      return map.size
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null
    },
    getItem(key) {
      return map.has(key) ? map.get(key) : null
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
    removeItem(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
  }
}

function createStore(storage = createMemoryStorage(), options = {}) {
  return createProgressStore({
    levels: LEVELS,
    storage,
    storageKey: 'test:progress',
    logger: silentLogger,
    now: () => 1_700_000_000_000,
    ...options,
  })
}

describe('useProgress', () => {
  it('começa com progresso vazio e normalizado', () => {
    const store = createStore()

    assert.equal(store.progress.value.version, PROGRESS_VERSION)
    assert.deepEqual(store.progress.value.levels, {})
    assert.equal(store.progress.value.lastPlayed, null)
    assert.equal(store.getLevelProgress('nivel-01').completed, false)
    assert.equal(store.getOverallStats().percent, 0)
  })

  it('persiste a conclusão de uma fase e recarrega do localStorage', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)

    const phase = store.completePhase('nivel-01', 'fase-01', {
      score: 120,
      accuracy: 80,
      correctCount: 4,
      wrongCount: 1,
      totalQuestions: 5,
      elapsedSeconds: 42,
    })

    assert.equal(phase.completed, true)
    assert.equal(phase.bestScore, 120)
    assert.equal(phase.attempts, 1)
    assert.equal(phase.accuracy, 80)
    assert.deepEqual(store.progress.value.lastPlayed, {
      levelId: 'nivel-01',
      phaseId: 'fase-01',
      at: 1_700_000_000_000,
    })

    const saved = JSON.parse(storage.getItem('test:progress'))

    assert.equal(saved.levels['nivel-01'].phases['fase-01'].completed, true)

    const reloaded = createStore(storage)

    assert.equal(reloaded.getPhaseProgress('nivel-01', 'fase-01').completed, true)
    assert.equal(reloaded.getPhaseProgress('nivel-01', 'fase-01').bestScore, 120)
    assert.equal(reloaded.getLevelProgress('nivel-01').completedPhases, 1)
  })

  it('mantém a melhor pontuação e atualiza a última', () => {
    const store = createStore()

    store.completePhase('nivel-01', 'fase-01', { score: 150 })
    store.completePhase('nivel-01', 'fase-01', { score: 90 })
    store.completePhase('nivel-01', 'fase-01', { score: 210 })

    const phase = store.getPhaseProgress('nivel-01', 'fase-01')

    assert.equal(phase.attempts, 3)
    assert.equal(phase.lastScore, 210)
    assert.equal(phase.bestScore, 210)
  })

  it('registra tentativa sem concluir a fase quando completed = false', () => {
    const store = createStore()

    store.completePhase('nivel-01', 'fase-01', {
      completed: false,
      score: 40,
    })

    const phase = store.getPhaseProgress('nivel-01', 'fase-01')

    assert.equal(phase.completed, false)
    assert.equal(phase.completedAt, null)
    assert.equal(phase.attempts, 1)
    assert.equal(phase.lastScore, 40)
  })

  it('aceita o formato de objeto em completePhase', () => {
    const store = createStore()

    const phase = store.completePhase({
      levelId: 'nivel-01',
      phaseId: 'fase-01',
      score: 77,
      completed: true,
    })

    assert.equal(phase.completed, true)
    assert.equal(store.isPhaseCompleted('nivel-01', 'fase-01'), true)
  })

  it('conclui o nível e a fase final sem duplicar tentativas da fase', () => {
    const store = createStore()

    store.completePhase('nivel-01', 'fase-01', { score: 100 })
    store.completePhase('nivel-01', 'fase-02', { score: 50, completed: false })

    const level = store.completeLevel('nivel-01', {
      score: 320,
      accuracy: 90,
      totalQuestions: 10,
      phaseId: 'fase-02',
    })

    assert.equal(level.completed, true)
    assert.equal(level.bestScore, 320)
    assert.equal(level.attempts, 1)
    assert.equal(store.getPhaseProgress('nivel-01', 'fase-02').completed, true)
    assert.equal(store.getPhaseProgress('nivel-01', 'fase-02').attempts, 1)
    assert.equal(store.isLevelCompleted('nivel-01'), true)
  })

  it('usa a soma das melhores fases como piso da pontuação do nível', () => {
    const store = createStore()

    store.completePhase('nivel-01', 'fase-01', { score: 400 })
    store.completePhase('nivel-01', 'fase-02', { score: 600 })

    const level = store.completeLevel('nivel-01', {
      phaseId: 'fase-02',
    })

    assert.equal(level.bestScore, 1_000)
    assert.equal(level.bestScore, store.getLevelProgress('nivel-01').bestScore)
  })

  it('calcula estatísticas gerais e desbloqueia níveis/fases em ordem', () => {
    const store = createStore()

    assert.equal(store.isLevelUnlocked('nivel-01'), true)
    assert.equal(store.isLevelUnlocked('nivel-02'), false)
    assert.equal(store.isPhaseUnlocked('nivel-01', 'fase-01'), true)
    assert.equal(store.isPhaseUnlocked('nivel-01', 'fase-02'), false)
    assert.equal(store.getPhaseStatus('nivel-01', 'fase-02'), 'locked')
    assert.equal(store.getLevelStatus('nivel-01'), 'available')

    store.completePhase('nivel-01', 'fase-01', { score: 100, accuracy: 100 })
    store.completePhase('nivel-01', 'fase-02', { score: 150, accuracy: 100 })
    store.completeLevel('nivel-01', { score: 250, phaseId: 'fase-02' })

    const stats = store.getOverallStats()

    assert.equal(stats.totalLevels, 2)
    assert.equal(stats.completedLevels, 1)
    assert.equal(stats.totalPhases, 3)
    assert.equal(stats.completedPhases, 2)
    assert.equal(stats.percent, 67)

    assert.equal(store.isLevelUnlocked('nivel-02'), true)
    assert.equal(store.getLevelStatus('nivel-02'), 'available')
    assert.equal(store.completionPercent.value, 67)
  })

  it('remove o progresso de um nível e o progresso geral', () => {
    const storage = createMemoryStorage()
    const store = createStore(storage)

    store.completePhase('nivel-01', 'fase-01', { score: 10 })
    store.completeLevel('nivel-01', { score: 10, phaseId: 'fase-01' })

    assert.equal(store.resetLevel('nivel-01'), true)
    assert.equal(store.getLevelProgress('nivel-01').completed, false)
    assert.equal(store.lastPlayed.value, null)

    store.completePhase('nivel-01', 'fase-01', { score: 10 })
    store.resetProgress()

    assert.deepEqual(store.progress.value.levels, {})
    assert.equal(store.progress.value.lastPlayed, null)
    assert.equal(storage.getItem('test:progress'), null)
  })

  it('ignora dados corrompidos e normaliza dados parciais', () => {
    const badStorage = createMemoryStorage({
      'test:progress': '{conteudo-invalido',
    })
    const badStore = createStore(badStorage)

    assert.deepEqual(badStore.progress.value.levels, {})

    const partialStorage = createMemoryStorage({
      'test:progress': JSON.stringify({
        levels: {
          'nivel-01': {
            completed: true,
            phases: {
              'fase-01': { bestScore: '300', attempts: '2' },
            },
          },
        },
      }),
    })
    const partialStore = createStore(partialStorage)

    assert.equal(partialStore.getLevelProgress('nivel-01').completed, true)
    assert.equal(
      partialStore.getPhaseProgress('nivel-01', 'fase-01').bestScore,
      300,
    )
    assert.equal(
      partialStore.getPhaseProgress('nivel-01', 'fase-01').attempts,
      2,
    )
  })

  it('compartilha a mesma instância em useProgress', () => {
    resetProgressStore()

    const storage = createMemoryStorage()
    const first = useProgress({
      levels: LEVELS,
      storage,
      storageKey: STORAGE_KEYS.PROGRESS,
      logger: silentLogger,
    })
    const second = useProgress()

    assert.equal(first, second)

    first.completePhase('nivel-01', 'fase-01', { score: 10 })

    assert.equal(second.isPhaseCompleted('nivel-01', 'fase-01'), true)

    resetProgressStore()
  })
})
