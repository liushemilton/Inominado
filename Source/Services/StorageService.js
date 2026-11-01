/**
 * Serviço de persistência local.
 *
 * Encapsula o acesso ao `localStorage` para que o restante da aplicação não
 * precise lidar com:
 *
 * - ambientes onde `localStorage` não existe (SSR, testes, navegação privada);
 * - conteúdo corrompido ou com formato inesperado;
 * - falhas de escrita (quota excedida, permissões, etc.);
 * - serialização/desserialização de JSON.
 *
 * O serviço é genérico. O formato do progresso do usuário é tratado em
 * `Composables/useProgress.js`.
 *
 * @example
 * ```js
 * import { createProgressStorage } from './StorageService.js'
 *
 * const storage = createProgressStorage()
 * storage.write({ levels: {} })
 * const data = storage.read({ levels: {} })
 * ```
 */

export const STORAGE_KEYS = Object.freeze({
  PROGRESS: 'inominado:progress',
  SETTINGS: 'inominado:settings',
})

export const STORAGE_VERSION = 1

/**
 * Verifica se o valor informado se comporta como um `Storage`.
 *
 * @param {unknown} storage
 * @returns {boolean}
 */
export function isStorageLike(storage) {
  return Boolean(
    storage &&
      typeof storage.getItem === 'function' &&
      typeof storage.setItem === 'function' &&
      typeof storage.removeItem === 'function',
  )
}

/**
 * Obtém o `localStorage` do ambiente atual sem lançar exceção.
 *
 * Acessar `globalThis.localStorage` pode falhar em alguns navegadores
 * (por exemplo, quando cookies/armazenamento estão bloqueados).
 *
 * @returns {Storage | null}
 */
export function getDefaultStorage() {
  try {
    const storage = globalThis.localStorage

    return isStorageLike(storage) ? storage : null
  } catch {
    return null
  }
}

/**
 * Testa se o armazenamento aceita leitura e escrita.
 *
 * @param {Storage | null} [storage]
 * @returns {boolean}
 */
export function isStorageAvailable(storage = getDefaultStorage()) {
  if (!isStorageLike(storage)) return false

  const probeKey = `__inominado_probe__${Date.now()}_${Math.random()}`

  try {
    storage.setItem(probeKey, '1')
    const available = storage.getItem(probeKey) === '1'
    storage.removeItem(probeKey)

    return available
  } catch {
    try {
      storage.removeItem(probeKey)
    } catch {
      // Ignora: o armazenamento não está disponível.
    }

    return false
  }
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function cloneValue(value) {
  if (value === undefined || value === null) return value

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

/**
 * @param {unknown} fallback
 * @returns {unknown}
 */
function resolveFallback(fallback) {
  return typeof fallback === 'function' ? fallback() : cloneValue(fallback)
}

/**
 * Cria um serviço de armazenamento JSON com uma chave fixa.
 *
 * @param {Object} [options]
 * @param {string} [options.key] Chave usada no `localStorage`.
 * @param {Storage | null} [options.storage] Armazenamento injetável (útil em testes).
 * @param {unknown} [options.fallback] Valor retornado quando não há dados válidos.
 * @param {{ warn?: Function, error?: Function }} [options.logger]
 * @returns {{
 *   key: string,
 *   storage: Storage | null,
 *   available: boolean,
 *   read: (fallback?: unknown) => unknown,
 *   write: (value: unknown) => boolean,
 *   update: (updater: (current: unknown) => unknown, fallback?: unknown) => unknown,
 *   remove: () => boolean,
 *   has: () => boolean
 * }}
 */
export function createStorageService(options = {}) {
  const {
    key = STORAGE_KEYS.PROGRESS,
    storage = getDefaultStorage(),
    fallback = null,
    logger = console,
  } = options

  if (typeof key !== 'string' || key.trim() === '') {
    throw new TypeError('[StorageService] A chave deve ser uma string não vazia.')
  }

  const resolvedKey = key.trim()

  function warn(message, error) {
    if (typeof logger?.warn === 'function') {
      logger.warn(`[StorageService] ${message}`, error)
    }
  }

  const service = {
    key: resolvedKey,

    get storage() {
      return storage
    },

    get available() {
      return isStorageLike(storage)
    },

    /**
     * Lê e desserializa o valor armazenado.
     *
     * @param {unknown} [fallbackValue]
     * @returns {unknown}
     */
    read(fallbackValue = fallback) {
      if (!isStorageLike(storage)) return resolveFallback(fallbackValue)

      try {
        const raw = storage.getItem(resolvedKey)

        if (raw === null || raw === undefined) {
          return resolveFallback(fallbackValue)
        }

        return JSON.parse(raw)
      } catch (error) {
        warn(`Não foi possível ler "${resolvedKey}". Usando valor padrão.`, error)

        return resolveFallback(fallbackValue)
      }
    },

    /**
     * Serializa e salva um valor.
     *
     * @param {unknown} value
     * @returns {boolean} `true` quando a escrita foi concluída.
     */
    write(value) {
      if (!isStorageLike(storage)) return false

      try {
        const serialized = JSON.stringify(value)

        if (typeof serialized !== 'string') {
          warn(`O valor de "${resolvedKey}" não é serializável.`)

          return false
        }

        storage.setItem(resolvedKey, serialized)

        return true
      } catch (error) {
        warn(`Não foi possível salvar "${resolvedKey}".`, error)

        return false
      }
    },

    /**
     * Lê, transforma e salva o valor em uma única operação.
     *
     * Se o `updater` retornar `undefined`, o valor lido é preservado.
     *
     * @param {(current: unknown) => unknown} updater
     * @param {unknown} [fallbackValue]
     * @returns {unknown}
     */
    update(updater, fallbackValue = fallback) {
      if (typeof updater !== 'function') {
        throw new TypeError('[StorageService] O updater deve ser uma função.')
      }

      const current = service.read(fallbackValue)
      const next = updater(current)

      if (next === undefined) return current

      service.write(next)

      return next
    },

    /**
     * Remove o valor armazenado.
     *
     * @returns {boolean}
     */
    remove() {
      if (!isStorageLike(storage)) return false

      try {
        storage.removeItem(resolvedKey)

        return true
      } catch (error) {
        warn(`Não foi possível remover "${resolvedKey}".`, error)

        return false
      }
    },

    /**
     * @returns {boolean}
     */
    has() {
      if (!isStorageLike(storage)) return false

      try {
        return storage.getItem(resolvedKey) !== null
      } catch {
        return false
      }
    },
  }

  return service
}

/**
 * Cria um serviço já apontando para a chave de progresso.
 *
 * @param {Omit<Parameters<typeof createStorageService>[0], 'key'> & { key?: string }} [options]
 * @returns {ReturnType<typeof createStorageService>}
 */
export function createProgressStorage(options = {}) {
  return createStorageService({
    ...options,
    key: options.key ?? STORAGE_KEYS.PROGRESS,
  })
}

/**
 * Atalhos para a chave de progresso padrão.
 * São úteis para inspeção manual no console e para scripts simples.
 */
export function loadStoredProgress(fallback = null) {
  return createProgressStorage().read(fallback)
}

export function saveStoredProgress(progress) {
  return createProgressStorage().write(progress)
}

export function clearStoredProgress() {
  return createProgressStorage().remove()
}

export default createStorageService
