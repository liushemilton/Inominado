/**
 * Banco de questões de preenchimento de lacunas.
 *
 * Estrutura padrão de uma questão:
 *
 * ```js
 * {
 *   id: 'q3',                    // identificador único da questão
 *   type: 'FillBlanks',          // grafia canônica usada pelo projeto
 *   prompt: 'Complete a frase:', // instrução exibida acima do texto
 *   text: 'Vue é ___ e usa ___.',// cada marcador vira um campo
 *   correctAnswer: ['a', 'b'],   // uma resposta por lacuna
 *   placeholders: ['...', '...'],// opcional: dica de cada campo
 *   explanation: '...',          // feedback exibido após a resposta
 *   points: 100,                 // opcional: pontuação base
 *   timeLimit: 30,               // opcional: limite em segundos
 * }
 * ```
 *
 * Marcadores aceitos no `text`: `___` (dois ou mais underscores),
 * `{{ blank }}` e `[blank]`.
 *
 * `correctAnswer` aceita uma string para uma única lacuna ou um array
 * com uma entrada por lacuna. Para aceitar mais de uma resposta na mesma
 * lacuna, use um array aninhado: `[['azul', 'blue']]`.
 */

export const fillBlanksQuestions = [
  {
    id: 'q3',
    type: 'FillBlanks',
    prompt: 'Complete a frase sobre Vue:',
    text: 'Vue é um framework ___ e usa ___ para atualizar a tela.',
    correctAnswer: ['progressivo', 'reatividade'],
    placeholders: ['adjetivo', 'conceito'],
    explanation: 'Vue é progressivo e reage a mudanças de estado.',
  },
]

export default fillBlanksQuestions
