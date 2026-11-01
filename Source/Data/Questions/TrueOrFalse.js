/**
 * Banco de questões de verdadeiro ou falso.
 *
 * Estrutura padrão de uma questão:
 *
 * ```js
 * {
 *   id: 'q2',                // identificador único da questão
 *   type: 'TrueOrFalse',     // grafia canônica usada pelo projeto
 *   statement: '...',        // afirmação avaliada pelo jogador
 *   correctAnswer: true,     // true/false
 *   explanation: '...',      // feedback exibido após a resposta
 *   points: 100,             // opcional: pontuação base
 *   timeLimit: 30,           // opcional: limite em segundos
 * }
 * ```
 *
 * O corretor também aceita `0`/`1` e textos como `"sim"`, `"não"`,
 * `"verdadeiro"` e `"falso"`.
 */

export const trueOrFalseQuestions = [
  {
    id: 'q2',
    type: 'TrueOrFalse',
    statement:
      'Vue.js é um framework JavaScript para construção de interfaces.',
    correctAnswer: true,
    explanation: 'Vue é um framework progressivo focado em interfaces.',
  },
]

export default trueOrFalseQuestions
