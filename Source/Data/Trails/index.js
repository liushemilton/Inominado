/**
 * Trilhas de estudo.
 *
 * Conteúdo baseado no roteiro de Química Orgânica (`roteiro-quimica.pdf`).
 * Cada trilha possui tópicos e cada tópico possui subtópicos. Quando o
 * roteiro apresenta uma subdivisão dentro de um subtópico, ela é
 * representada em `children`.
 */

export const TRAILS = Object.freeze([
  {
    id: 'quimica-organica',
    title: 'Química Orgânica',
    description:
      '11 tópicos, da regra do octeto à reatividade dos compostos orgânicos.',
    topics: [
      {
        id: 'topico-01',
        order: 1,
        title: 'Regra do octeto',
        subtopics: [
          {
            id: 'topico-01-subtopico-01',
            title: 'Conceito de estabilidade química.',
          },
          {
            id: 'topico-01-subtopico-02',
            title: 'Camada de valência e elétrons de valência.',
          },
          {
            id: 'topico-01-subtopico-03',
            title: 'Regra do octeto e regra do dueto.',
          },
          {
            id: 'topico-01-subtopico-04',
            title: 'Ligações químicas: iônica, covalente e metálica.',
          },
          {
            id: 'topico-01-subtopico-05',
            title: 'Compartilhamento de elétrons nas ligações covalentes.',
          },
          {
            id: 'topico-01-subtopico-06',
            title: 'Exceções à regra do octeto.',
          },
        ],
      },
      {
        id: 'topico-02',
        order: 2,
        title: 'Características do carbono',
        subtopics: [
          {
            id: 'topico-02-subtopico-01',
            title: 'O carbono na Tabela Periódica.',
          },
          {
            id: 'topico-02-subtopico-02',
            title: 'Tetravalência do carbono.',
          },
          {
            id: 'topico-02-subtopico-03',
            title: 'Capacidade de formar quatro ligações covalentes.',
          },
          {
            id: 'topico-02-subtopico-04',
            title: 'Catenação: capacidade de formar cadeias carbônicas.',
          },
          {
            id: 'topico-02-subtopico-05',
            title: 'Ligações simples, duplas e triplas.',
          },
          {
            id: 'topico-02-subtopico-06',
            title: 'Ligações entre carbonos e outros elementos.',
          },
          {
            id: 'topico-02-subtopico-07',
            title:
              'Classificação dos átomos de carbono: primário, secundário, terciário e quaternário.',
          },
          {
            id: 'topico-02-subtopico-08',
            title:
              'Representação das fórmulas orgânicas: molecular, estrutural, condensada e em bastão.',
          },
        ],
      },
      {
        id: 'topico-03',
        order: 3,
        title: 'Hibridização do carbono',
        subtopics: [
          {
            id: 'topico-03-subtopico-01',
            title: 'Conceito de hibridização dos orbitais.',
          },
          {
            id: 'topico-03-subtopico-02',
            title:
              'Hibridização sp3: geometria tetraédrica e ângulo aproximado de 109,5°.',
          },
          {
            id: 'topico-03-subtopico-03',
            title: 'Hibridização sp2: geometria trigonal plana e ângulo de 120°.',
          },
          {
            id: 'topico-03-subtopico-04',
            title: 'Hibridização sp: geometria linear e ângulo de 180°.',
          },
          {
            id: 'topico-03-subtopico-05',
            title: 'Ligações sigma (σ) e pi (π).',
          },
          {
            id: 'topico-03-subtopico-06',
            title: 'Relação entre hibridização e tipos de ligações.',
          },
          {
            id: 'topico-03-subtopico-07',
            title: 'Identificação da hibridização em moléculas orgânicas.',
          },
        ],
      },
      {
        id: 'topico-04',
        order: 4,
        title: 'Hidrocarbonetos',
        subtopics: [
          {
            id: 'topico-04-subtopico-01',
            title: 'Conceito de hidrocarbonetos.',
          },
          {
            id: 'topico-04-subtopico-02',
            title: 'Classificação das cadeias carbônicas:',
            children: [
              {
                id: 'topico-04-subtopico-02-filho-01',
                title: 'Abertas, fechadas e mistas.',
              },
              {
                id: 'topico-04-subtopico-02-filho-02',
                title: 'Normais e ramificadas.',
              },
              {
                id: 'topico-04-subtopico-02-filho-03',
                title: 'Saturadas e insaturadas.',
              },
              {
                id: 'topico-04-subtopico-02-filho-04',
                title: 'Homogêneas e heterogêneas.',
              },
            ],
          },
          {
            id: 'topico-04-subtopico-03',
            title: 'Alcanos: ligações simples.',
          },
          {
            id: 'topico-04-subtopico-04',
            title: 'Alcenos: pelo menos uma ligação dupla.',
          },
          {
            id: 'topico-04-subtopico-05',
            title: 'Alcinos: pelo menos uma ligação tripla.',
          },
          {
            id: 'topico-04-subtopico-06',
            title: 'Alcadienos: duas ligações duplas.',
          },
          {
            id: 'topico-04-subtopico-07',
            title: 'Ciclanos e ciclenos.',
          },
          {
            id: 'topico-04-subtopico-08',
            title: 'Hidrocarbonetos aromáticos, como o benzeno.',
          },
          {
            id: 'topico-04-subtopico-09',
            title: 'Nomenclatura dos hidrocarbonetos.',
          },
          {
            id: 'topico-04-subtopico-10',
            title: 'Propriedades físicas e aplicações.',
          },
          {
            id: 'topico-04-subtopico-11',
            title: 'Isomeria em hidrocarbonetos.',
          },
        ],
      },
      {
        id: 'topico-05',
        order: 5,
        title: 'Funções oxigenadas',
        subtopics: [
          {
            id: 'topico-05-subtopico-01',
            title: 'Conceito de funções orgânicas oxigenadas.',
          },
          {
            id: 'topico-05-subtopico-02',
            title: 'Álcoois: grupo hidroxila ligado a carbono saturado.',
          },
          {
            id: 'topico-05-subtopico-03',
            title: 'Fenóis: hidroxila ligada diretamente a anel aromático.',
          },
          {
            id: 'topico-05-subtopico-04',
            title: 'Éteres: oxigênio entre dois grupos carbônicos.',
          },
          {
            id: 'topico-05-subtopico-05',
            title: 'Aldeídos: grupo carbonila na extremidade da cadeia.',
          },
          {
            id: 'topico-05-subtopico-06',
            title: 'Cetonas: grupo carbonila no interior da cadeia.',
          },
          {
            id: 'topico-05-subtopico-07',
            title: 'Ácidos carboxílicos: grupo carboxila.',
          },
          {
            id: 'topico-05-subtopico-08',
            title: 'Ésteres: derivados de ácidos carboxílicos.',
          },
          {
            id: 'topico-05-subtopico-09',
            title: 'Nomenclatura de cada função.',
          },
          {
            id: 'topico-05-subtopico-10',
            title: 'Identificação dos grupos funcionais.',
          },
          {
            id: 'topico-05-subtopico-11',
            title: 'Propriedades físicas e químicas.',
          },
          {
            id: 'topico-05-subtopico-12',
            title:
              'Aplicações cotidianas: álcool, vinagre, perfumes, solventes e gorduras.',
          },
        ],
      },
      {
        id: 'topico-06',
        order: 6,
        title: 'Funções nitrogenadas',
        subtopics: [
          {
            id: 'topico-06-subtopico-01',
            title: 'Conceito de funções orgânicas nitrogenadas.',
          },
          {
            id: 'topico-06-subtopico-02',
            title: 'Aminas: derivadas da amônia.',
          },
          {
            id: 'topico-06-subtopico-03',
            title: 'Amidas: presença do grupo funcional amida.',
          },
          {
            id: 'topico-06-subtopico-04',
            title: 'Nitrilas: presença do grupo −C≡N.',
          },
          {
            id: 'topico-06-subtopico-05',
            title: 'Nitrocompostos: presença do grupo −NO₂.',
          },
          {
            id: 'topico-06-subtopico-06',
            title: 'Nomenclatura das funções nitrogenadas.',
          },
          {
            id: 'topico-06-subtopico-07',
            title: 'Identificação dos grupos funcionais.',
          },
          {
            id: 'topico-06-subtopico-08',
            title: 'Propriedades físicas e químicas.',
          },
          {
            id: 'topico-06-subtopico-09',
            title:
              'Aplicações em medicamentos, fertilizantes, proteínas e outros compostos.',
          },
        ],
      },
      {
        id: 'topico-07',
        order: 7,
        title: 'Funções sulfonadas',
        subtopics: [
          {
            id: 'topico-07-subtopico-01',
            title: 'Conceito de compostos orgânicos sulfurados e sulfonados.',
          },
          {
            id: 'topico-07-subtopico-02',
            title: 'Diferença entre compostos sulfurados e compostos sulfonados.',
          },
          {
            id: 'topico-07-subtopico-03',
            title: 'Tióis: grupo −SH.',
          },
          {
            id: 'topico-07-subtopico-04',
            title: 'Sulfetos orgânicos: enxofre entre dois grupos carbônicos.',
          },
          {
            id: 'topico-07-subtopico-05',
            title: 'Ácidos sulfônicos: grupo −SO₃H.',
          },
          {
            id: 'topico-07-subtopico-06',
            title: 'Sulfatos e sulfonatos orgânicos: estrutura e diferenças.',
          },
          {
            id: 'topico-07-subtopico-07',
            title: 'Nomenclatura e identificação dos grupos funcionais.',
          },
          {
            id: 'topico-07-subtopico-08',
            title:
              'Propriedades e aplicações em detergentes, medicamentos e produtos industriais.',
          },
        ],
      },
      {
        id: 'topico-08',
        order: 8,
        title: 'Halogênios e haletos orgânicos',
        subtopics: [
          {
            id: 'topico-08-subtopico-01',
            title:
              'Halogênios na Tabela Periódica: flúor, cloro, bromo e iodo.',
          },
          {
            id: 'topico-08-subtopico-02',
            title: 'Conceito de haletos orgânicos.',
          },
          {
            id: 'topico-08-subtopico-03',
            title: 'Haletos de alquila e haletos de arila.',
          },
          {
            id: 'topico-08-subtopico-04',
            title: 'Identificação das ligações carbono-halogênio.',
          },
          {
            id: 'topico-08-subtopico-05',
            title: 'Nomenclatura dos haletos orgânicos.',
          },
          {
            id: 'topico-08-subtopico-06',
            title:
              'Classificação em primários, secundários e terciários, quando aplicável.',
          },
          {
            id: 'topico-08-subtopico-07',
            title: 'Polaridade das ligações.',
          },
          {
            id: 'topico-08-subtopico-08',
            title: 'Propriedades físicas e químicas.',
          },
          {
            id: 'topico-08-subtopico-09',
            title:
              'Aplicações e impactos ambientais, como os associados a certos CFCs.',
          },
        ],
      },
      {
        id: 'topico-09',
        order: 9,
        title: 'Polímeros naturais',
        subtopics: [
          {
            id: 'topico-09-subtopico-01',
            title: 'Conceito de polímeros e monômeros.',
          },
          {
            id: 'topico-09-subtopico-02',
            title: 'Formação de macromoléculas.',
          },
          {
            id: 'topico-09-subtopico-03',
            title: 'Polímeros naturais de origem vegetal e animal.',
          },
          {
            id: 'topico-09-subtopico-04',
            title: 'Carboidratos: amido e celulose.',
          },
          {
            id: 'topico-09-subtopico-05',
            title: 'Proteínas: aminoácidos e ligações peptídicas.',
          },
          {
            id: 'topico-09-subtopico-06',
            title: 'Ácidos nucleicos: DNA e RNA.',
          },
          {
            id: 'topico-09-subtopico-07',
            title: 'Borracha natural.',
          },
          {
            id: 'topico-09-subtopico-08',
            title: 'Funções biológicas e aplicações.',
          },
          {
            id: 'topico-09-subtopico-09',
            title: 'Diferenças entre polímeros naturais e sintéticos.',
          },
        ],
      },
      {
        id: 'topico-10',
        order: 10,
        title: 'Polímeros sintéticos',
        subtopics: [
          {
            id: 'topico-10-subtopico-01',
            title: 'Conceito de polímeros sintéticos.',
          },
          {
            id: 'topico-10-subtopico-02',
            title: 'Monômeros e unidades repetitivas.',
          },
          {
            id: 'topico-10-subtopico-03',
            title: 'Polimerização por adição.',
          },
          {
            id: 'topico-10-subtopico-04',
            title: 'Polimerização por condensação.',
          },
          {
            id: 'topico-10-subtopico-05',
            title: 'Termoplásticos e termofixos.',
          },
          {
            id: 'topico-10-subtopico-06',
            title: 'Elastômeros e fibras sintéticas.',
          },
          {
            id: 'topico-10-subtopico-07',
            title: 'Principais exemplos:',
            children: [
              {
                id: 'topico-10-subtopico-07-filho-01',
                title: 'Polietileno (PE).',
              },
              {
                id: 'topico-10-subtopico-07-filho-02',
                title: 'Polipropileno (PP).',
              },
              {
                id: 'topico-10-subtopico-07-filho-03',
                title: 'PVC.',
              },
              {
                id: 'topico-10-subtopico-07-filho-04',
                title: 'Poliestireno (PS).',
              },
              {
                id: 'topico-10-subtopico-07-filho-05',
                title: 'PET.',
              },
              {
                id: 'topico-10-subtopico-07-filho-06',
                title: 'Nylon.',
              },
              {
                id: 'topico-10-subtopico-07-filho-07',
                title: 'Borrachas sintéticas.',
              },
            ],
          },
          {
            id: 'topico-10-subtopico-08',
            title: 'Propriedades e aplicações.',
          },
          {
            id: 'topico-10-subtopico-09',
            title: 'Reciclagem e impactos ambientais dos plásticos.',
          },
        ],
      },
      {
        id: 'topico-11',
        order: 11,
        title: 'Reatividade dos compostos orgânicos',
        subtopics: [
          {
            id: 'topico-11-subtopico-01',
            title: 'Conceito de reatividade química.',
          },
          {
            id: 'topico-11-subtopico-02',
            title: 'Ruptura de ligações homolítica e heterolítica.',
          },
          {
            id: 'topico-11-subtopico-03',
            title: 'Reagentes nucleófilos e eletrófilos.',
          },
          {
            id: 'topico-11-subtopico-04',
            title:
              'Efeitos que influenciam a reatividade: polaridade, estrutura e grupos funcionais.',
          },
          {
            id: 'topico-11-subtopico-05',
            title: 'Principais tipos de reações orgânicas:',
            children: [
              {
                id: 'topico-11-subtopico-05-filho-01',
                title:
                  'Adição: comum em compostos com ligações duplas e triplas.',
              },
              {
                id: 'topico-11-subtopico-05-filho-02',
                title: 'Substituição: troca de um átomo ou grupo por outro.',
              },
              {
                id: 'topico-11-subtopico-05-filho-03',
                title:
                  'Eliminação: remoção de átomos ou grupos, frequentemente formando insaturações.',
              },
              {
                id: 'topico-11-subtopico-05-filho-04',
                title: 'Oxidação e redução: transformação dos estados de oxidação.',
              },
              {
                id: 'topico-11-subtopico-05-filho-05',
                title: 'Esterificação: formação de ésteres.',
              },
              {
                id: 'topico-11-subtopico-05-filho-06',
                title: 'Hidrólise: quebra de ligações pela participação da água.',
              },
              {
                id: 'topico-11-subtopico-05-filho-07',
                title: 'Combustão: reação com oxigênio.',
              },
              {
                id: 'topico-11-subtopico-05-filho-08',
                title: 'Polimerização: formação de polímeros.',
              },
            ],
          },
          {
            id: 'topico-11-subtopico-06',
            title: 'Reações características dos hidrocarbonetos.',
          },
          {
            id: 'topico-11-subtopico-07',
            title: 'Reações das funções oxigenadas e nitrogenadas.',
          },
          {
            id: 'topico-11-subtopico-08',
            title: 'Identificação dos reagentes, produtos e condições de reação.',
          },
        ],
      },
    ],
  },
])

export default TRAILS
