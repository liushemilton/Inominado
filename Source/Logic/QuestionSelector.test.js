import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  filterQuestionsByDifficulty,
  getQuestionDifficulty,
  selectQuestions,
} from './QuestionSelector.js'

const QUESTIONS = [
  {
    id: 'facil-1',
    type: 'TrueOrFalse',
    statement: 'Fácil 1',
    dificuldade: 'facil',
    correctAnswer: true,
  },
  {
    id: 'facil-2',
    type: 'TrueOrFalse',
    statement: 'Fácil 2',
    dificuldade: 'facil',
    correctAnswer: true,
  },
  {
    id: 'medio-1',
    type: 'TrueOrFalse',
    statement: 'Médio 1',
    dificuldade: 'medio',
    correctAnswer: true,
  },
]

describe('seleção por dificuldade', () => {
  it('reconhece a chave `dificuldade` do banco', () => {
    assert.equal(getQuestionDifficulty({ dificuldade: 'facil' }), 1)
    assert.equal(getQuestionDifficulty({ dificuldade: 'medio' }), 3)
    assert.equal(getQuestionDifficulty({ dificuldade: 'dificil' }), 5)
  })

  it('mantém apenas o nível pedido quando ele existe', () => {
    const filtered = filterQuestionsByDifficulty(QUESTIONS, 1)
    const selected = selectQuestions(
      QUESTIONS,
      {},
      { difficulty: 1, shuffle: false },
    )

    assert.deepEqual(
      filtered.map((question) => question.id),
      ['facil-1', 'facil-2'],
    )
    assert.deepEqual(
      selected.map((question) => question.id),
      ['facil-1', 'facil-2'],
    )
  })

  it('cai para a dificuldade mais próxima quando o nível não existe', () => {
    const filtered = filterQuestionsByDifficulty(QUESTIONS, 5)
    const selected = selectQuestions(
      QUESTIONS,
      {},
      { difficulty: 5, shuffle: false },
    )

    assert.deepEqual(
      filtered.map((question) => question.id),
      ['medio-1'],
    )
    assert.deepEqual(
      selected.map((question) => question.id),
      ['medio-1'],
    )
  })

  it('respeita a faixa mínima/máxima de dificuldade', () => {
    const selected = selectQuestions(
      QUESTIONS,
      {},
      { minDifficulty: 3, maxDifficulty: 5, shuffle: false },
    )

    assert.deepEqual(
      selected.map((question) => question.id),
      ['medio-1'],
    )
  })
})
