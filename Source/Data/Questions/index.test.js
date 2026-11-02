import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  QUESTIONS,
  QUESTION_BANK_META,
  QUESTION_CATEGORIES,
  getQuestionBankCategories,
  getQuestionsByCategory,
  normalizePair,
  normalizeQuestion,
} from './index.js'

describe('adaptador do banco de questões', () => {
  it('normaliza todas as questões dos arquivos modulares', () => {
    assert.equal(QUESTIONS.length, 70)
    assert.equal(QUESTION_BANK_META.total, 70)
    assert.equal(QUESTION_CATEGORIES.length, 11)

    for (const question of QUESTIONS) {
      assert.ok(question.id)
      assert.ok(question.prompt)
      assert.ok(question.category)
      assert.ok([1, 3, 5].includes(question.difficulty))
      assert.ok(['MultipleChoise', 'TrueOrFalse', 'MatchingPairs'].includes(question.type))
    }
  })

  it('converte alternativas e resposta de múltipla escolha', () => {
    const question = normalizeQuestion({
      id: 'Q-TESTE',
      tipo: 'multipla_escolha',
      enunciado: 'Pergunta?',
      dificuldade: 'facil',
      alternativas: [
        { id: 'A', texto: 'Primeira' },
        { id: 'B', texto: 'Segunda' },
      ],
      resposta: 'B',
    })

    assert.equal(question.type, 'MultipleChoise')
    assert.equal(question.difficulty, 1)
    assert.deepEqual(question.options, [
      { id: 'A', text: 'Primeira', label: 'Primeira' },
      { id: 'B', text: 'Segunda', label: 'Segunda' },
    ])
    assert.equal(question.correctAnswer, 'B')
  })

  it('converte pares de associação para left/right', () => {
    const pair = normalizePair({
      id: 'P1',
      item: 'Ligação iônica',
      correspondencia: 'Transferência de elétrons',
    })
    const question = normalizeQuestion({
      id: 'Q-PARES',
      tipo: 'combinar_pares',
      enunciado: 'Relacione',
      dificuldade: 'medio',
      pares: [
        {
          id: 'P1',
          item: 'Ligação iônica',
          correspondencia: 'Transferência de elétrons',
        },
      ],
    })

    assert.deepEqual(pair, {
      id: 'P1',
      left: 'Ligação iônica',
      right: 'Transferência de elétrons',
    })
    assert.equal(question.type, 'MatchingPairs')
    assert.deepEqual(question.pairs, [pair])
    assert.deepEqual(question.correctAnswer, question.pairs)
  })

  it('consulta questões por categoria ignorando acentos e caixa', () => {
    const questions = getQuestionsByCategory('regra do OCTETO')

    assert.equal(questions.length, 6)
    assert.ok(
      questions.every((question) => question.category === 'Regra do octeto'),
    )
    assert.equal(getQuestionsByCategory('categoria inexistente').length, 0)

    const summary = getQuestionBankCategories()

    assert.equal(summary.length, 11)
    assert.equal(
      summary.reduce((total, category) => total + category.count, 0),
      70,
    )
  })
})