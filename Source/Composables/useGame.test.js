import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EXERCISE_TYPES,
  checkAnswer,
  normalizeExerciseType,
} from '../Logic/AswerChecker.js'
import { useGame } from './useGame.js'

/**
 * Questões de exemplo usadas apenas nos testes. O conteúdo real do quiz
 * será cadastrado em `Source/Data/Questions`.
 */
const QUESTIONS = [
  {
    id: 'q1',
    type: 'MultipleChoise',
    prompt: 'Qual é o símbolo químico do carbono?',
    options: [
      { id: 'a', text: 'C' },
      { id: 'b', text: 'O' },
      { id: 'c', text: 'H' },
      { id: 'd', text: 'N' },
    ],
    correctAnswer: 'a',
    explanation: 'O carbono é representado pelo símbolo C.',
  },
  {
    id: 'q2',
    type: 'TrueOrFalse',
    statement: 'O carbono é tetravalente.',
    correctAnswer: true,
    explanation: 'O carbono forma quatro ligações covalentes.',
  },
  {
    id: 'q3',
    type: 'FillBlanks',
    text: 'O carbono forma ___ ligações covalentes e pode se ligar a ___.',
    correctAnswer: ['quatro', 'outros carbonos'],
    explanation: 'A tetravalência permite quatro ligações covalentes.',
  },
  {
    id: 'q4',
    type: 'MatchingPairs',
    prompt: 'Ligue cada hidrocarboneto ao tipo de ligação:',
    pairs: [
      { left: 'Alcano', right: 'Ligação simples' },
      { left: 'Alceno', right: 'Ligação dupla' },
      { left: 'Alcino', right: 'Ligação tripla' },
    ],
    explanation: 'A insaturação define a classe do hidrocarboneto.',
  },
]

/**
 * Payloads no mesmo formato emitido por cada componente de exercício
 * (`Source/Components/Exercises`).
 */
const COMPONENT_ANSWERS = {
  q1: 'a',
  q2: true,
  q3: ['quatro', 'outros carbonos'],
  q4: [
    { left: 'Alcano', right: 'Ligação simples' },
    { left: 'Alceno', right: 'Ligação dupla' },
    { left: 'Alcino', right: 'Ligação tripla' },
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
