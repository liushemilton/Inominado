/**
 * Banco de questões de múltipla escolha.
 *
 * Estrutura padrão de uma questão:
 *
 * ```js
 * {
 *   id: 'q1',                  // identificador único da questão
 *   type: 'MultipleChoise',    // grafia canônica usada pelo projeto
 *   prompt: 'Enunciado...',    // texto exibido ao jogador
 *   options: [                 // alternativas apresentadas
 *     { id: 'a', text: 'Paris' },
 *     { id: 'b', text: 'Londres' },
 *   ],
 *   correctAnswer: 'a',        // id da alternativa correta
 *   explanation: '...',        // feedback exibido após a resposta
 *   points: 100,               // opcional: pontuação base
 *   timeLimit: 30,             // opcional: limite em segundos
 * }
 * ```
 *
 * `correctAnswer` também aceita o texto exato da alternativa ou um array
 * de ids/textos para questões de múltipla seleção.
 */

export const multipleChoiseQuestions = [
  {
    id: 'q1',
    type: 'MultipleChoise',
    prompt: 'Qual é a capital da França?',
    options: [
      { id: 'a', text: 'Paris' },
      { id: 'b', text: 'Londres' },
      { id: 'c', text: 'Madri' },
      { id: 'd', text: 'Roma' },
    ],
    correctAnswer: 'a',
    explanation: 'Paris é a capital e maior cidade da França.',
  },
]

export default multipleChoiseQuestions
