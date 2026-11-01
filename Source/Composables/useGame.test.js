import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import Level01 from '../Data/Levels/Level01.js'
import {
  EXERCISE_TYPES,
  checkAnswer,
  normalizeExerciseType,
} from '../Logic/AswerChecker.js'
import { useGame } from './useGame.js'

const QUESTIONS = Level01.phases.flatMap((phase) => phase.questions)

/**
 * Payloads no mesmo formato emitido por cada componente de exercício
 * (`Source/Components/Exercises`).
 */
const COMPONENT_ANSWERS = {
  q1: 'a',
  q2: true,
  q3: ['progressivo', 'reatividade'],
  q4: [
    { left: 'Vue', right: 'Framework de UI' },
    { left: 'Vite', right: 'Servidor de desenvolvimento' },
    { left: 'Pinia', right: 'Gerenciamento de estado' },
  ],
}

describe('normalizeExerciseType', () => {
  it('reconhece a grafia do projeto e as variações comuns', () => {
    assert.equal(normalizeExerciseType('MultipleChoise'), EXERCISE_TYPES.MULTIPLE_CHOICE)
    assert.equal(normalizeExerciseType('MultipleChoice'), EXERCISE_TYPES.MULTIPLE_CHOICE)
    assert.equal(normalizeExerciseType('multiple-choice'), EXERCISE_TYPES.MULTIPLE_CHOICE)
    assert.equal(normalizeExerciseType('TRUE_OR_FALSE'), EXERCISE_TYPES.TRUE_OR_FALSE)
    assert.equal(normalizeExerciseType('fill blanks'), EXERCISE_TYPES.FILL_BLANKS)
    assert.equal(normalizeExerciseType('matching-pairs'), EXERCISE_TYPES.MATCHING_PAIRS)
  })

  it('mantém tipos desconhecidos intactos', () => {
    assert.equal(normalizeExerciseType('Quiz'), 'Quiz')
    assert.equal(normalizeExerciseType(undefined), '')
  })
})

describe('checkAnswer com os payloads dos componentes', () => {
  for (const question of QUESTIONS) {
    it(`valida ${question.id} (${question.type})`, () => {
      const answer = COMPONENT_ANSWERS[question.id]
      const correctAnswer = question.correctAnswer ?? question.pairs

      assert.equal(checkAnswer(answer, correctAnswer, question.type), true)
    })
  }

  it('aceita o alias MultipleChoice', () => {
    assert.equal(checkAnswer('a', 'a', 'MultipleChoice'), true)
  })
})

describe('useGame integrado aos componentes de exercício', () => {
  for (const question of QUESTIONS) {
    it(`registra a resposta de ${question.type} no estado do jogo`, () => {
      const game = useGame({ questions: [question], lives: 3 })
      const feedback = game.submitAnswer(COMPONENT_ANSWERS[question.id])

      assert.ok(feedback)
      assert.equal(feedback.status, 'correct')
      assert.equal(feedback.isCorrect, true)
      assert.equal(game.correctCount.value, 1)
      assert.equal(game.wrongCount.value, 0)
      assert.equal(game.answers.value.length, 1)
      assert.ok(game.score.value > 0)
      assert.equal(game.hasAnsweredCurrent.value, true)
      assert.equal(game.canSubmit.value, false)
    })
  }

  it('usa os pares da questão como resposta correta de MatchingPairs', () => {
    const question = QUESTIONS.find((item) => item.type === 'MatchingPairs')
    const game = useGame({ questions: [question], lives: 3 })
    const feedback = game.submitAnswer(COMPONENT_ANSWERS[question.id])

    assert.equal(feedback.isCorrect, true)
    assert.deepEqual(feedback.correctAnswer, question.pairs)
  })

  it('corrige questões tipadas com alias', () => {
    const game = useGame({
      questions: [
        {
          id: 'alias',
          type: 'MultipleChoice',
          prompt: 'Escolha A',
          options: [
            { id: 'a', text: 'A' },
            { id: 'b', text: 'B' },
          ],
          correctAnswer: 'a',
        },
      ],
      lives: 3,
    })

    const feedback = game.submitAnswer('a')

    assert.equal(feedback.isCorrect, true)
  })

  it('ignora envios repetidos e reduz vidas em respostas erradas', () => {
    const question = QUESTIONS.find((item) => item.type === 'TrueOrFalse')
    const game = useGame({ questions: [question], lives: 3 })

    const wrong = game.submitAnswer(!question.correctAnswer)

    assert.equal(wrong.isCorrect, false)
    assert.equal(game.lives.value, 2)
    assert.equal(game.submitAnswer(question.correctAnswer), null)
  })

  it('avança para a próxima questão limpando o feedback', () => {
    const [first, second] = QUESTIONS
    const game = useGame({ questions: [first, second], lives: 3 })

    game.submitAnswer(COMPONENT_ANSWERS[first.id])
    assert.equal(game.nextQuestion(), true)
    assert.equal(game.currentQuestion.value.id, second.id)
    assert.equal(game.hasAnsweredCurrent.value, false)
    assert.equal(game.canSubmit.value, true)
  })
})
