/**
 * Composable de progresso do usuário.
 *
 * Mantém um estado reativo, normalizado e persistido no `localStorage`.
 * O progresso é organizado por nível e, dentro dele, por fase:
 *
 * ```js
 * {
 *   version: 1,
 *   levels: {
 *     'nivel-01': {
 *       completed: true,
 *       attempts: 2,
 *       bestScore: 850,
 *       phases: {
 *         'fase-01': { completed: true, bestScore: 500, ... },
 *       },
 *     },
 *   },
 *   lastPlayed: { levelId: 'nivel-01', phaseId: 'fase-01', at: 0 },
 *   updatedAt: 0,
 * }
 * ```
 *
 * A instância retornada por `useProgress()` é compartilhada entre todos os
 * componentes. Assim, ao concluir uma fase em `GameView`, o `RoadmapView`
 * reage imediatamente à mudança, sem precisar recarregar a página.
 *
 * Para testes ou cenários isolados, use `createProgressStore()`.
 */

import { computed, readonly, ref, shallowRef, unref } from 'vue'

import {
  STORAGE_KEYS,
  createProgressStorage,
} from '../Services/StorageService.js'

export const PROGRESS_VERSION = 1

const EMPTY_PHASE = Object.freeze({
  completed: false,
  completedAt: null,
  attempts: 0,
  lastScore: 0,
  bestScore: 0,
  accuracy: 0,
  correctCount: 0,
  wrongCount: 0,
  totalQuestions: 0,
  elapsedSeconds: 0,
  updatedAt: null,
})

const EMPTY_LEVEL = Object.freeze({
  completed: false,
  completedAt: null,
  attempts: 0,
  lastScore: 0,
  bestScore: 0,
  accuracy: 0,
  correctCount: 0,
  wrongCount: 0,
  totalQuestions: 0,
  elapsedSeconds: 0,
  updatedAt: null,
})

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Converte um identificador em chave de objeto.
 *
 * @param {unknown} value
 * @returns {string | null}
 */
function toKey(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value !== 'string') return null

  const key = value.trim()

  return key === '' ? null : key
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
function toSafeNumber(value, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
function toNonNegativeNumber(value, fallback = 0) {
  return Math.max(0, toSafeNumber(value, fallback))
}

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
function toNonNegativeInteger(value, fallback = 0) {
  return Math.floor(toNonNegativeNumber(value, fallback))
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function toTimestamp(value) {
  const number = Number(value)

  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null
}

/**
 * @param {unknown} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Retorna o primeiro valor definido (ignora `null` e `undefined`).
 *
 * @param {...unknown} values
 * @returns {unknown}
 */
function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

/**
 * @param {unknown} phases
 * @returns {object[]}
 */
function toPhaseArray(phases) {
  if (Array.isArray(phases)) {
    return phases.filter(isPlainObject)
  }

  if (isPlainObject(phases)) {
    return Object.entries(phases).map(([id, phase]) => {
      if (!isPlainObject(phase)) return { id }

      return {
        ...phase,
        id: toKey(phase.id) ?? id,
      }
    })
  }

  return []
}

/**
 * @param {unknown} levels
 * @returns {object[]}
 */
function toLevelArray(levels) {
  if (Array.isArray(levels)) {
    return levels.filter(isPlainObject)
  }

  if (isPlainObject(levels)) {
    return Object.entries(levels).map(([id, level]) => {
      if (!isPlainObject(level)) return { id }

      return {
        ...level,
        id: toKey(level.id) ?? id,
      }
    })
  }

  return []
}

/**
 * @param {unknown} raw
 * @returns {typeof EMPTY_PHASE & { completedAt: number | null, updatedAt: number | null }}
 */
function normalizePhase(raw) {
  const source = isPlainObject(raw) ? raw : {}

  return {
    completed: source.completed === true,
    completedAt: toTimestamp(source.completedAt),
    attempts: toNonNegativeInteger(source.attempts),
    lastScore: toNonNegativeNumber(source.lastScore),
    bestScore: toNonNegativeNumber(source.bestScore),
    accuracy: clamp(toSafeNumber(source.accuracy), 0, 100),
    correctCount: toNonNegativeInteger(source.correctCount),
    wrongCount: toNonNegativeInteger(source.wrongCount),
    totalQuestions: toNonNegativeInteger(source.totalQuestions),
    elapsedSeconds: toNonNegativeInteger(source.elapsedSeconds),
    updatedAt: toTimestamp(source.updatedAt),
  }
}

/**
 * @param {unknown} raw
 * @returns {object}
 */
function normalizeLevel(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const phases = {}

  if (isPlainObject(source.phases)) {
    for (const [rawId, rawPhase] of Object.entries(source.phases)) {
      const id = toKey(rawId) ?? toKey(rawPhase?.id)

      if (id) phases[id] = normalizePhase(rawPhase)
    }
  }

  return {
    completed: source.completed === true,
    completedAt: toTimestamp(source.completedAt),
    attempts: toNonNegativeInteger(source.attempts),
    lastScore: toNonNegativeNumber(source.lastScore),
    bestScore: toNonNegativeNumber(source.bestScore),
    accuracy: clamp(toSafeNumber(source.accuracy), 0, 100),
    correctCount: toNonNegativeInteger(source.correctCount),
    wrongCount: toNonNegativeInteger(source.wrongCount),
    totalQuestions: toNonNegativeInteger(source.totalQuestions),
    elapsedSeconds: toNonNegativeInteger(source.elapsedSeconds),
    phases,
    updatedAt: toTimestamp(source.updatedAt),
  }
}

/**
 * @returns {object}
 */
function createEmptyProgress() {
  return {
    version: PROGRESS_VERSION,
    levels: {},
    lastPlayed: null,
    updatedAt: 0,
  }
}

/**
 * @param {unknown} raw
 * @returns {object}
 */
function normalizeProgress(raw) {
  const source = isPlainObject(raw) ? raw : {}
  const levels = {}

  if (isPlainObject(source.levels)) {
    for (const [rawId, rawLevel] of Object.entries(source.levels)) {
      const id = toKey(rawId) ?? toKey(rawLevel?.id)

      if (id) levels[id] = normalizeLevel(rawLevel)
    }
  }

  let lastPlayed = null

  if (isPlainObject(source.lastPlayed)) {
    const levelId = toKey(source.lastPlayed.levelId)
    const phaseId = toKey(source.lastPlayed.phaseId)

    if (levelId) {
      lastPlayed = {
        levelId,
        phaseId,
        at: toTimestamp(source.lastPlayed.at) ?? 0,
      }
    }
  }

  return {
    version: PROGRESS_VERSION,
    levels,
    lastPlayed,
    updatedAt: toTimestamp(source.updatedAt) ?? 0,
  }
}

/**
 * @param {object} progress
 * @returns {object}
 */
function cloneProgress(progress) {
  try {
    return JSON.parse(JSON.stringify(progress))
  } catch {
    return createEmptyProgress()
  }
}

/**
 * Extrai estatísticas de um resultado de partida sem assumir um único formato.
 *
 * @param {unknown} rawPayload
 * @returns {{
 *   score?: number,
 *   accuracy?: number,
 *   correctCount?: number,
 *   wrongCount?: number,
 *   totalQuestions?: number,
 *   elapsedSeconds?: number
 * }}
 */
function extractCompletionStats(rawPayload) {
  const payload = isPlainObject(rawPayload) ? rawPayload : {}
  const summary = isPlainObject(payload.summary) ? payload.summary : {}
  const stats = {}

  const score = firstDefined(
    payload.score,
    payload.totalScore,
    payload.points,
    summary.total,
  )

  if (score !== undefined) stats.score = toNonNegativeNumber(score)

  const accuracy = firstDefined(
    payload.accuracy,
    payload.accuracyPercent,
    summary.accuracyPercent,
  )

  if (accuracy !== undefined) {
    stats.accuracy = clamp(toSafeNumber(accuracy), 0, 100)
  }

  const correctCount = firstDefined(
    payload.correctCount,
    payload.correctAnswers,
    summary.correctAnswers,
  )

  if (correctCount !== undefined) {
    stats.correctCount = toNonNegativeInteger(correctCount)
  }

  const wrongCount = firstDefined(payload.wrongCount, summary.wrongCount)

  if (wrongCount !== undefined) {
    stats.wrongCount = toNonNegativeInteger(wrongCount)
  }

  const totalQuestions = firstDefined(
    payload.totalQuestions,
    summary.totalQuestions,
  )

  if (totalQuestions !== undefined) {
    stats.totalQuestions = toNonNegativeInteger(totalQuestions)
  }

  const elapsedSeconds = firstDefined(
    payload.elapsedSeconds,
    summary.timeSpentSeconds,
  )

  if (elapsedSeconds !== undefined) {
    stats.elapsedSeconds = toNonNegativeInteger(elapsedSeconds)
  }

  if (
    stats.totalQuestions > 0 &&
    stats.correctCount !== undefined &&
    stats.accuracy === undefined
  ) {
    stats.accuracy = Math.round(
      (stats.correctCount / stats.totalQuestions) * 100,
    )
  }

  return stats
}

/**
 * @param {object} level
 * @param {string} levelId
 * @param {object | null} definition
 * @param {boolean} unlocked
 * @returns {object}
 */
function makeLevelSnapshot(levelId, level, definition, unlocked) {
  const snapshot = normalizeLevel(level)
  const phases = toPhaseArray(definition?.phases)
  const completedPhases = phases.filter((phase) => {
    return snapshot.phases[toKey(phase.id)]?.completed === true
  }).length
  const percent =
    phases.length > 0
      ? Math.round((completedPhases / phases.length) * 100)
      : snapshot.completed
        ? 100
        : 0

  return {
    id: levelId,
    ...snapshot,
    totalPhases: phases.length,
    completedPhases,
    percent,
    unlocked,
  }
}

/**
 * Resolve as assinaturas aceitas por `completePhase`.
 *
 * @param {unknown} levelId
 * @param {unknown} phaseId
 * @param {unknown} payload
 * @returns {{ levelId: string, phaseId: string, payload: object } | null}
 */
function resolvePhaseArgs(levelId, phaseId, payload) {
  let levelSource = levelId
  let phaseSource = phaseId
  let payloadSource = payload

  if (isPlainObject(levelId)) {
    const args = levelId

    levelSource = args.levelId ?? args.level ?? args.id
    phaseSource = args.phaseId ?? args.phase ?? args.faseId
    payloadSource = args
  }

  const resolvedLevelId = toKey(levelSource)
  const resolvedPhaseId = toKey(phaseSource)

  if (!resolvedLevelId || !resolvedPhaseId) return null

  return {
    levelId: resolvedLevelId,
    phaseId: resolvedPhaseId,
    payload: isPlainObject(payloadSource) ? payloadSource : {},
  }
}

/**
 * Resolve as assinaturas aceitas por `completeLevel`.
 *
 * @param {unknown} levelId
 * @param {unknown} payload
 * @returns {{ levelId: string, payload: object } | null}
 */
function resolveLevelArgs(levelId, payload) {
  let levelSource = levelId
  let payloadSource = payload

  if (isPlainObject(levelId)) {
    levelSource = levelId.levelId ?? levelId.level ?? levelId.id
    payloadSource = levelId
  }

  const resolvedLevelId = toKey(levelSource)

  if (!resolvedLevelId) return null

  return {
    levelId: resolvedLevelId,
    payload: isPlainObject(payloadSource) ? payloadSource : {},
  }
}

/**
 * Cria uma instância independente do store de progresso.
 *
 * @param {Object} [options]
 * @param {object[] | { [id: string]: object }} [options.levels] Catálogo de níveis.
 * @param {Storage | null} [options.storage] Armazenamento injetável.
 * @param {string} [options.storageKey] Chave usada no armazenamento.
 * @param {string} [options.key] Alias de `storageKey`.
 * @param {() => number} [options.now] Relógio injetável (testes).
 * @param {boolean} [options.sync=true] Sincronizar entre abas.
 * @param {{ warn?: Function }} [options.logger]
 * @returns {object}
 */
export function createProgressStore(options = {}) {
  const {
    levels,
    storage,
    storageKey,
    key,
    now,
    sync = true,
    logger = console,
  } = options

  const resolvedKey = storageKey ?? key ?? STORAGE_KEYS.PROGRESS
  const getNow = typeof now === 'function' ? now : () => Date.now()
  const configuredLevels = shallowRef(toLevelArray(unref(levels)))

  const storageService = createProgressStorage({
    key: resolvedKey,
    storage,
    logger,
  })

  const progress = ref(loadFromStorage())
  let synchronizationStarted = false

  /**
   * @returns {object}
   */
  function loadFromStorage() {
    const stored = storageService.read(null)

    return stored ? normalizeProgress(stored) : createEmptyProgress()
  }

  /**
   * @param {object} mutator
   * @returns {unknown}
   */
  function mutate(mutator) {
    const at = getNow()
    const draft = cloneProgress(progress.value)
    const result = mutator(draft, at)

    draft.version = PROGRESS_VERSION
    draft.updatedAt = at

    progress.value = draft
    storageService.write(draft)

    return result
  }

  /**
   * @param {object} draft
   * @param {string} levelId
   * @returns {object}
   */
  function ensureLevel(draft, levelId) {
    if (!isPlainObject(draft.levels)) draft.levels = {}
    if (!isPlainObject(draft.levels[levelId])) {
      draft.levels[levelId] = normalizeLevel(null)
    }

    return draft.levels[levelId]
  }

  /**
   * @param {object} level
   * @param {string} phaseId
   * @param {object} stats
   * @param {number} at
   * @param {{ completed: boolean, incrementAttempt: boolean }} flags
   * @returns {object}
   */
  function applyPhaseStats(level, phaseId, stats, at, flags) {
    if (!isPlainObject(level.phases)) level.phases = {}

    const phase = normalizePhase(level.phases[phaseId])

    if (flags.incrementAttempt) phase.attempts += 1

    if (stats.score !== undefined) {
      phase.lastScore = stats.score
      phase.bestScore = Math.max(phase.bestScore, stats.score)
    }

    if (stats.accuracy !== undefined) phase.accuracy = stats.accuracy
    if (stats.correctCount !== undefined) phase.correctCount = stats.correctCount
    if (stats.wrongCount !== undefined) phase.wrongCount = stats.wrongCount

    if (stats.totalQuestions !== undefined) {
      phase.totalQuestions = stats.totalQuestions
    }

    if (stats.elapsedSeconds !== undefined) {
      phase.elapsedSeconds = stats.elapsedSeconds
    }

    if (flags.completed) {
      phase.completed = true
      phase.completedAt = at
    }

    phase.updatedAt = at
    level.phases[phaseId] = phase

    return phase
  }

  /**
   * @returns {object}
   */
  function snapshot() {
    return cloneProgress(progress.value)
  }

  /**
   * Recarrega o progresso do armazenamento.
   *
   * @returns {object}
   */
  function load() {
    progress.value = loadFromStorage()

    return snapshot()
  }

  /**
   * Persiste o estado atual.
   *
   * @returns {boolean}
   */
  function save() {
    return storageService.write(progress.value)
  }

  /**
   * @returns {object[]}
   */
  function resolveLevels(levelsOverride) {
    if (levelsOverride === undefined) return configuredLevels.value

    return toLevelArray(unref(levelsOverride))
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} [levelsOverride]
   * @returns {object | null}
   */
  function findLevel(levelId, levelsOverride) {
    const levelKey = toKey(levelId)

    if (!levelKey) return null

    return (
      resolveLevels(levelsOverride).find(
        (level) => toKey(level?.id) === levelKey,
      ) ?? null
    )
  }

  /**
   * Atualiza o catálogo de níveis usado pelas regras de desbloqueio.
   *
   * @param {object[] | { [id: string]: object }} nextLevels
   * @returns {object[]}
   */
  function configureLevels(nextLevels) {
    configuredLevels.value = toLevelArray(unref(nextLevels))

    return configuredLevels.value
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} [levelsOverride]
   * @returns {object}
   */
  function getLevelProgress(levelId, levelsOverride) {
    const levelKey = toKey(levelId)

    if (!levelKey) {
      return makeLevelSnapshot('', null, null, true)
    }

    const levels = resolveLevels(levelsOverride)
    const definition = findLevel(levelKey, levels)
    const entry = progress.value.levels[levelKey]

    return makeLevelSnapshot(
      levelKey,
      entry,
      definition,
      isLevelUnlocked(levelKey, levelsOverride),
    )
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {object}
   */
  function getPhaseProgress(levelId, phaseId) {
    const levelKey = toKey(levelId)
    const phaseKey = toKey(phaseId)

    if (!levelKey || !phaseKey) {
      return {
        levelId: levelKey ?? '',
        phaseId: phaseKey ?? '',
        ...normalizePhase(null),
      }
    }

    return {
      levelId: levelKey,
      phaseId: phaseKey,
      ...normalizePhase(progress.value.levels[levelKey]?.phases?.[phaseKey]),
    }
  }

  /**
   * @param {unknown} levelId
   * @returns {boolean}
   */
  function isLevelCompleted(levelId) {
    const levelKey = toKey(levelId)

    if (!levelKey) return false

    return progress.value.levels[levelKey]?.completed === true
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {boolean}
   */
  function isPhaseCompleted(levelId, phaseId) {
    const levelKey = toKey(levelId)
    const phaseKey = toKey(phaseId)

    if (!levelKey || !phaseKey) return false

    return (
      progress.value.levels[levelKey]?.phases?.[phaseKey]?.completed === true
    )
  }

  /**
   * O primeiro nível está sempre liberado. Os demais dependem da conclusão
   * do nível anterior na ordem recebida.
   *
   * @param {unknown} levelId
   * @param {object[]} [levelsOverride]
   * @returns {boolean}
   */
  function isLevelUnlocked(levelId, levelsOverride) {
    const levelKey = toKey(levelId)
    const levels = resolveLevels(levelsOverride)

    if (!levelKey || levels.length === 0) return true

    const index = levels.findIndex((level) => toKey(level?.id) === levelKey)

    if (index <= 0) return true
    if (index < 0) return true

    return isLevelCompleted(levels[index - 1]?.id)
  }

  /**
   * A primeira fase de um nível liberado está sempre disponível. As demais
   * dependem da conclusão da fase anterior.
   *
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @param {object} [levelOverride]
   * @returns {boolean}
   */
  function isPhaseUnlocked(levelId, phaseId, levelOverride) {
    const levelKey = toKey(levelId)
    const phaseKey = toKey(phaseId)
    const level = levelOverride ?? findLevel(levelKey)
    const phases = toPhaseArray(level?.phases)

    if (!levelKey || !phaseKey) return false
    if (phases.length === 0) return isLevelUnlocked(levelKey)

    const index = phases.findIndex((phase) => toKey(phase?.id) === phaseKey)

    if (index < 0) return true
    if (!isLevelUnlocked(levelKey)) return false

    return index === 0 || isPhaseCompleted(levelKey, phases[index - 1]?.id)
  }

  /**
   * @param {unknown} levelId
   * @param {object[]} [levelsOverride]
   * @returns {'locked' | 'available' | 'in-progress' | 'completed'}
   */
  function getLevelStatus(levelId, levelsOverride) {
    if (!isLevelUnlocked(levelId, levelsOverride)) return 'locked'

    const levelProgress = getLevelProgress(levelId, levelsOverride)

    if (levelProgress.completed) return 'completed'
    if (levelProgress.attempts > 0 || levelProgress.completedPhases > 0) {
      return 'in-progress'
    }

    return 'available'
  }

  /**
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @param {object} [levelOverride]
   * @returns {'locked' | 'available' | 'in-progress' | 'completed'}
   */
  function getPhaseStatus(levelId, phaseId, levelOverride) {
    if (!isPhaseUnlocked(levelId, phaseId, levelOverride)) return 'locked'

    const phaseProgress = getPhaseProgress(levelId, phaseId)

    if (phaseProgress.completed) return 'completed'
    if (phaseProgress.attempts > 0) return 'in-progress'

    return 'available'
  }

  /**
   * Estatísticas agregadas de conclusão.
   *
   * @param {object[]} [levelsOverride]
   * @returns {{
   *   totalLevels: number,
   *   completedLevels: number,
   *   totalPhases: number,
   *   completedPhases: number,
   *   totalUnits: number,
   *   completedUnits: number,
   *   percent: number
   * }}
   */
  function getOverallStats(levelsOverride) {
    const levels = resolveLevels(levelsOverride)

    let completedLevels = 0
    let totalPhases = 0
    let completedPhases = 0

    for (const level of levels) {
      const levelKey = toKey(level?.id)

      if (!levelKey) continue

      if (isLevelCompleted(levelKey)) completedLevels += 1

      for (const phase of toPhaseArray(level?.phases)) {
        totalPhases += 1

        if (isPhaseCompleted(levelKey, phase.id)) completedPhases += 1
      }
    }

    const totalUnits = totalPhases > 0 ? totalPhases : levels.length
    const completedUnits = totalPhases > 0 ? completedPhases : completedLevels
    const percent =
      totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

    return {
      totalLevels: levels.length,
      completedLevels,
      totalPhases,
      completedPhases,
      totalUnits,
      completedUnits,
      percent,
    }
  }

  /**
   * Marca/atualiza uma fase concluída e persiste imediatamente.
   *
   * Aceita tanto `(levelId, phaseId, payload)` quanto
   * `({ levelId, phaseId, ...payload })`.
   *
   * @param {unknown} levelId
   * @param {unknown} [phaseId]
   * @param {object} [payload]
   * @returns {object | null}
   */
  function completePhase(levelId, phaseId, payload) {
    const args = resolvePhaseArgs(levelId, phaseId, payload)

    if (!args) return null

    const stats = extractCompletionStats(args.payload)
    const completed = args.payload.completed !== false

    return mutate((draft, at) => {
      const level = ensureLevel(draft, args.levelId)

      applyPhaseStats(level, args.phaseId, stats, at, {
        completed,
        incrementAttempt: true,
      })

      level.updatedAt = at
      draft.lastPlayed = {
        levelId: args.levelId,
        phaseId: args.phaseId,
        at,
      }

      return {
        levelId: args.levelId,
        phaseId: args.phaseId,
        ...normalizePhase(level.phases[args.phaseId]),
      }
    })
  }

  /**
   * Registra uma tentativa em uma fase sem marcá-la como concluída.
   *
   * @param {unknown} levelId
   * @param {unknown} [phaseId]
   * @param {object} [payload]
   * @returns {object | null}
   */
  function recordPhaseAttempt(levelId, phaseId, payload) {
    const args = resolvePhaseArgs(levelId, phaseId, payload)

    if (!args) return null

    return completePhase(args.levelId, args.phaseId, {
      ...args.payload,
      completed: false,
    })
  }

  /**
   * Marca/atualiza um nível concluído e persiste imediatamente.
   *
   * Pode receber `phaseId` no payload para também registrar a fase final,
   * mas não incrementa novamente as tentativas dessa fase.
   *
   * @param {unknown} levelId
   * @param {object} [payload]
   * @returns {object | null}
   */
  function completeLevel(levelId, payload) {
    const args = resolveLevelArgs(levelId, payload)

    if (!args) return null

    const stats = extractCompletionStats(args.payload)
    const completed = args.payload.completed !== false
    const phaseId = toKey(
      args.payload.phaseId ?? args.payload.phase ?? args.payload.faseId,
    )
    const unlocked = isLevelUnlocked(args.levelId)

    return mutate((draft, at) => {
      const level = ensureLevel(draft, args.levelId)

      level.attempts += 1

      if (stats.score !== undefined) {
        level.lastScore = stats.score
        level.bestScore = Math.max(level.bestScore, stats.score)
      }

      if (stats.accuracy !== undefined) level.accuracy = stats.accuracy
      if (stats.correctCount !== undefined) {
        level.correctCount = stats.correctCount
      }
      if (stats.wrongCount !== undefined) level.wrongCount = stats.wrongCount

      if (stats.totalQuestions !== undefined) {
        level.totalQuestions = stats.totalQuestions
      }

      if (stats.elapsedSeconds !== undefined) {
        level.elapsedSeconds = stats.elapsedSeconds
      }

      // `completeLevel` não altera as estatísticas da fase (isso é feito por
      // `completePhase`); apenas garante que a fase final fique concluída.
      if (phaseId) {
        if (!isPlainObject(level.phases)) level.phases = {}

        const phase = normalizePhase(level.phases[phaseId])

        if (completed) {
          phase.completed = true
          phase.completedAt = at
        }

        phase.updatedAt = at
        level.phases[phaseId] = phase
      }

      // A melhor pontuação do nível nunca fica abaixo da soma das melhores
      // pontuações de suas fases.
      const phaseBestTotal = Object.values(level.phases).reduce(
        (total, phase) => total + toNonNegativeNumber(phase?.bestScore),
        0,
      )

      level.bestScore = Math.max(level.bestScore, phaseBestTotal)

      if (completed) {
        level.completed = true
        level.completedAt = at
      }

      level.updatedAt = at

      const previousLastPlayed = draft.lastPlayed
      const lastPhaseId =
        phaseId ??
        (previousLastPlayed?.levelId === args.levelId
          ? previousLastPlayed.phaseId
          : null)

      draft.lastPlayed = {
        levelId: args.levelId,
        phaseId: lastPhaseId,
        at,
      }

      const definition = findLevel(args.levelId)

      return makeLevelSnapshot(
        args.levelId,
        level,
        definition,
        unlocked,
      )
    })
  }

  /**
   * Remove o progresso de um nível.
   *
   * @param {unknown} levelId
   * @returns {boolean}
   */
  function resetLevel(levelId) {
    const levelKey = toKey(levelId)

    if (!levelKey) return false

    return Boolean(
      mutate((draft) => {
        delete draft.levels[levelKey]

        if (draft.lastPlayed?.levelId === levelKey) {
          draft.lastPlayed = null
        }

        return true
      }),
    )
  }

  /**
   * Remove o progresso de uma fase.
   *
   * @param {unknown} levelId
   * @param {unknown} phaseId
   * @returns {boolean}
   */
  function resetPhase(levelId, phaseId) {
    const levelKey = toKey(levelId)
    const phaseKey = toKey(phaseId)

    if (!levelKey || !phaseKey) return false

    return Boolean(
      mutate((draft) => {
        const level = draft.levels[levelKey]

        if (level?.phases) delete level.phases[phaseKey]

        return true
      }),
    )
  }

  /**
   * Apaga todo o progresso persistido.
   *
   * @returns {object}
   */
  function resetProgress() {
    storageService.remove()

    const empty = createEmptyProgress()
    empty.updatedAt = getNow()
    progress.value = empty

    return snapshot()
  }

  function handleStorageEvent(event) {
    if (!event || event.key === null || event.key === resolvedKey) {
      load()
    }
  }

  /**
   * Começa a ouvir alterações feitas em outra aba.
   *
   * @returns {void}
   */
  function startSync() {
    if (!sync || synchronizationStarted) return

    const target = globalThis.window

    if (!target || typeof target.addEventListener !== 'function') return

    target.addEventListener('storage', handleStorageEvent)
    synchronizationStarted = true
  }

  /**
   * Para de ouvir alterações externas.
   *
   * @returns {void}
   */
  function stopSync() {
    if (!synchronizationStarted) return

    const target = globalThis.window

    if (target && typeof target.removeEventListener === 'function') {
      target.removeEventListener('storage', handleStorageEvent)
    }

    synchronizationStarted = false
  }

  startSync()

  const store = {
    // Estado reativo (somente leitura).
    progress: readonly(progress),
    levels: configuredLevels,

    // Derivados.
    lastPlayed: computed(() => progress.value.lastPlayed),
    overallStats: computed(() => getOverallStats()),
    completionPercent: computed(() => getOverallStats().percent),

    // Leitura.
    getLevelProgress,
    getPhaseProgress,
    isLevelCompleted,
    isPhaseCompleted,
    isLevelUnlocked,
    isPhaseUnlocked,
    getLevelStatus,
    getPhaseStatus,
    getOverallStats,
    snapshot,

    // Escrita.
    completePhase,
    completeLevel,
    recordPhaseAttempt,
    configureLevels,
    load,
    reload: load,
    save,
    resetLevel,
    resetPhase,
    resetProgress,

    // Sincronização.
    startSync,
    stopSync,

    // Aliases de leitura/escrita.
    markPhaseComplete: completePhase,
    markLevelComplete: completeLevel,
    loadProgress: load,
    saveProgress: save,
    clearProgress: resetProgress,
  }

  return store
}

let sharedStore = null

/**
 * Composable compartilhado. Todos os componentes que chamarem
 * `useProgress()` enxergam o mesmo estado reativo.
 *
 * @param {Parameters<typeof createProgressStore>[0]} [options]
 * @returns {ReturnType<typeof createProgressStore>}
 */
export function useProgress(options = {}) {
  if (!sharedStore) {
    sharedStore = createProgressStore(options)
  } else if (options.levels !== undefined) {
    sharedStore.configureLevels(options.levels)
  }

  return sharedStore
}

/**
 * Libera a instância compartilhada (não apaga o progresso salvo).
 * Útil para testes/HMR.
 *
 * @returns {void}
 */
export function resetProgressStore() {
  if (sharedStore) sharedStore.stopSync()

  sharedStore = null
}

export default useProgress
