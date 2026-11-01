import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  STORAGE_KEYS,
  createProgressStorage,
  createStorageService,
  isStorageAvailable,
  isStorageLike,
  loadStoredProgress,
  saveStoredProgress,
} from './StorageService.js'

const silentLogger = { warn() {}, error() {} }

/**
 * Implementação em memória da API de Storage.
 *
 * @param {Record<string, string>} [seed]
 * @returns {Storage & { _map: Map<string, string> }}
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

describe('StorageService', () => {
  it('identifica storages válidos', () => {
    const storage = createMemoryStorage()

    assert.equal(isStorageLike(storage), true)
    assert.equal(isStorageLike(null), false)
    assert.equal(isStorageLike({}), false)
    assert.equal(isStorageAvailable(storage), true)
  })

  it('salva, lê e remove valores JSON', () => {
    const storage = createMemoryStorage()
    const service = createStorageService({
      key: 'test:key',
      storage,
      logger: silentLogger,
    })

    assert.equal(service.read(null), null)
    assert.equal(service.has(), false)

    assert.equal(service.write({ levels: { n1: { completed: true } } }), true)
    assert.equal(service.has(), true)
    assert.deepEqual(service.read(), { levels: { n1: { completed: true } } })

    assert.equal(service.remove(), true)
    assert.equal(service.has(), false)
    assert.equal(service.read(), null)
  })

  it('retorna o fallback quando o conteúdo está corrompido', () => {
    const storage = createMemoryStorage({ 'test:key': '{conteudo-invalido' })
    const service = createStorageService({
      key: 'test:key',
      storage,
      fallback: { safe: true },
      logger: silentLogger,
    })

    assert.deepEqual(service.read(), { safe: true })
  })

  it('faz update atômico e preserva o valor quando o updater retorna undefined', () => {
    const storage = createMemoryStorage({ 'test:key': '2' })
    const service = createStorageService({
      key: 'test:key',
      storage,
      logger: silentLogger,
    })

    assert.equal(
      service.update((current) => Number(current) + 1),
      3,
    )
    assert.equal(service.read(), 3)

    assert.equal(
      service.update(() => undefined),
      3,
    )
  })

  it('não lança exceção quando a escrita falha', () => {
    const storage = createMemoryStorage()
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }

    const service = createStorageService({
      key: 'test:key',
      storage,
      logger: silentLogger,
    })

    assert.equal(service.write({ any: true }), false)
    assert.equal(service.read(null), null)
  })

  it('usa a chave padrão de progresso', () => {
    const service = createProgressStorage()

    assert.equal(service.key, STORAGE_KEYS.PROGRESS)
  })

  it('expõe atalhos de leitura e escrita de progresso', () => {
    const progress = { version: 1, levels: {} }
    const storage = createMemoryStorage()

    // Os atalhos usam o localStorage do ambiente; aqui apenas garantimos que
    // não lançam exceção quando ele não está disponível.
    assert.doesNotThrow(() => saveStoredProgress(progress))
    assert.doesNotThrow(() => loadStoredProgress())

    const service = createProgressStorage({ storage, logger: silentLogger })
    service.write(progress)

    assert.deepEqual(service.read(), progress)
  })
})
