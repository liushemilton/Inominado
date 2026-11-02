import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createProgressStore } from './useProgress.js'
import { createAdaptiveLearning } from './useAdaptiveLearning.js'

const NOW = 1_700_000_000_000

const LEVELS = [
  {
    id: 'nivel-teste',
    title: 'Nível de teste',
    phases: [
      {
        id: 'fase-teste',
        title: 'Fase de teste',
        subtopics: [{ id: 'subtopico-01', title: 'Subtópico 01' }],
        questions: [
          {
            id: 'facil-1',
            type: 'TrueOrFalse',
            statement: 'Fácil 1',
            difficulty: 1,
            correctAnswer: true,
          },
          {
            id: 'facil-2',
            type: 'TrueOrFalse',
            statement: 'Fácil 2',
            difficulty: 1,
            correctAnswer: true,
          },
          {
            id: 'medio-1',
            type: 'TrueOrFalse',
            statement: 'Médio 1',
            difficulty: 3,
            correctAnswer: true,
          },
        ],
      },
    ],
  },
]

function createMemoryStorage() {
  const map = new Map()

  return {
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

function createHarness(options = {}) {
  const progressStore = createProgressStore({
    levels: LEVELS,
    storage: createMemoryStorage(),
    storageKey: 'test:adaptive',
    logger: { warn() {}, error() {} },
    now: () => NOW,
    ...options,
  })
  const adaptive = createAdaptiveLearning({
    levels: LEVELS,
    progressStore,
    now: () => NOW,
    selection: { shuffle: false },
  })

  return { progressStore, adaptive }
}

describe('useAdaptiveLearning', () => {
  it('inicia a sessão na dificuldade persistida e filtra o banco', () => {
    const { adaptive } = createHarness()
    const session = adaptive.buildSession({
      levelId: 'nivel-teste',
      phaseId: 'fase-teste',
      subtopicId: 'subtopico-01',
    })

    assert.equal(session.difficulty, 1)
    assert.deepEqual(
      session.questions.map((question) => question.id),
      ['facil-1', 'facil-2'],
    )
    assert.equal(session.subtopicId, 'subtopico-01')
  })

  it('sobe a dificuldade após dois acertos consecutivos', () => {
    const { adaptive } = createHarness()
    const base = {
      levelId: 'nivel-teste',
      phaseId: 'fase-teste',
      subtopicId: 'subtopico-01',
      expectedQuestionCount: 2,
    }

    adaptive.buildSession(base)
    adaptive.recordAttempt({
      ...base,
      question: LEVELS[0].phases[0].questions[0],
      userAnswer: true,
      isCorrect: true,
    })

    assert.equal(adaptive.sessionDifficulty.value, 1)
    assert.equal(adaptive.correctStreak.value, 1)

    const result = adaptive.recordAttempt({
      ...base,
      question: LEVELS[0].phases[0].questions[1],
      userAnswer: true,
      isCorrect: true,
    })

    assert.equal(adaptive.sessionDifficulty.value, 2)
    assert.equal(adaptive.correctStreak.value, 0)
    assert.equal(result.difficultyChange.direction, 'up')
  })

  it('desce a dificuldade após dois erros consecutivos', () => {
    const { adaptive } = createHarness()
    const base = {
      levelId: 'nivel-teste',
      phaseId: 'fase-teste',
      subtopicId: 'subtopico-01',
      expectedQuestionCount: 2,
    }

    adaptive.buildSession({ ...base, difficulty: 3 })
    adaptive.recordAttempt({
      ...base,
      question: LEVELS[0].phases[0].questions[2],
      userAnswer: false,
      isCorrect: false,
    })

    assert.equal(adaptive.sessionDifficulty.value, 3)
    assert.equal(adaptive.wrongStreak.value, 1)

    const result = adaptive.recordAttempt({
      ...base,
      question: LEVELS[0].phases[0].questions[2],
      userAnswer: false,
      isCorrect: false,
    })

    assert.equal(adaptive.sessionDifficulty.value, 2)
    assert.equal(adaptive.wrongStreak.value, 0)
    assert.equal(result.difficultyChange.direction, 'down')
  })

  it('persiste as tentativas no progresso do subtópico', () => {
    const { adaptive, progressStore } = createHarness()
    const base = {
      levelId: 'nivel-teste',
      phaseId: 'fase-teste',
      subtopicId: 'subtopico-01',
      expectedQuestionCount: 2,
    }

    adaptive.buildSession(base)
    adaptive.recordAttempt({
      ...base,
      question: LEVELS[0].phases[0].questions[0],
      userAnswer: true,
      isCorrect: true,
    })

    const subtopic = progressStore.getSubtopicProgress(
      'nivel-teste',
      'fase-teste',
      'subtopico-01',
    )

    assert.equal(subtopic.attempts, 1)
    assert.equal(subtopic.correct, 1)
    assert.equal(subtopic.questions['facil-1'].attempts, 1)
  })

  it('usa a dificuldade persistida ao montar uma nova sessão', () => {
    const { adaptive } = createHarness()
    const base = {
      levelId: 'nivel-teste',
      phaseId: 'fase-teste',
      subtopicId: 'subtopico-01',
      expectedQuestionCount: 2,
    }

    adaptive.buildSession(base)

    for (const question of LEVELS[0].phases[0].questions.slice(0, 2)) {
      adaptive.recordAttempt({
        ...base,
        question,
        userAnswer: true,
        isCorrect: true,
      })
    }

    const nextSession = adaptive.buildSession(base)

    assert.equal(nextSession.difficulty, 2)
    assert.equal(adaptive.correctStreak.value, 0)
    assert.equal(adaptive.wrongStreak.value, 0)
  })
})
