import type { RegraGenetica, DicaSaude } from './tipos';

export const regrasGeneticas: RegraGenetica[] = [
  {
    id: 'mama_ovario',
    palavras: ['mama', 'ovário', 'ovario'],
    aplicaSexo: 'feminino',
    idadeRecomendada: 30,
    mensagem: 'Histórico familiar de câncer de mama/ovário. Vale conversar sobre iniciar rastreio (mamografia) e avaliação com mastologista ou ginecologista a partir dos 30 anos, em vez dos 40.',
  },
  {
    id: 'colorretal',
    palavras: ['colorretal', 'cólon', 'colon', 'intestino'],
    aplicaSexo: null,
    idadeRecomendada: 40,
    mensagem: 'Histórico familiar de câncer colorretal. Vale conversar sobre iniciar rastreio (colonoscopia) a partir dos 40 anos e avaliação com gastroenterologista.',
  },
  {
    id: 'prostata',
    palavras: ['próstata', 'prostata'],
    aplicaSexo: 'masculino',
    idadeRecomendada: 45,
    mensagem: 'Histórico familiar de câncer de próstata. Vale conversar sobre avaliação urológica a partir dos 45 anos, em vez dos 50.',
  },
  {
    id: 'diabetes_tipo2',
    palavras: ['diabetes tipo 2'],
    aplicaSexo: null,
    idadeRecomendada: 30,
    mensagem: 'Histórico familiar de diabetes tipo 2. Vale conversar sobre rastreio de glicemia a partir dos 30-35 anos e acompanhamento com endocrinologista.',
  },
  {
    id: 'diabetes_tipo1',
    palavras: ['diabetes tipo 1'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de diabetes tipo 1. Não é uma condição com rastreio por idade — vale ficar atento a sintomas (sede/urina excessiva, perda de peso) e conversar com endocrinologista se surgirem.',
  },
  {
    id: 'cardiaca',
    palavras: ['infarto', 'cardíaca', 'cardiaca', 'cardiopatia', 'coração', 'coracao'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de doença cardíaca precoce. Vale conversar sobre avaliação cardiológica e perfil lipídico com um cardiologista.',
  },
  {
    id: 'hipertensao',
    palavras: ['hipertensão', 'hipertensao', 'pressão alta', 'pressao alta'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de hipertensão. Vale conversar sobre acompanhamento de pressão arterial mais frequente.',
  },
  {
    id: 'colesterol',
    palavras: ['colesterol'],
    aplicaSexo: null,
    idadeRecomendada: 10,
    mensagem: 'Histórico familiar de colesterol alto. As diretrizes recomendam rastreio (perfil lipídico) já entre 9-11 anos, com reforço entre 17-21 — vale conversar com o pediatra/clínico sobre adiantar esse exame.',
  },
  {
    id: 'hipotireoidismo',
    palavras: ['hipotireoidismo'],
    aplicaSexo: null,
    idadeRecomendada: 35,
    mensagem: 'Histórico familiar de hipotireoidismo. Vale considerar exame de TSH a partir dos 35 anos (repetindo a cada 5 anos), podendo ser antes se houver sintomas.',
  },
  {
    id: 'hipertireoidismo',
    palavras: ['hipertireoidismo'],
    aplicaSexo: null,
    idadeRecomendada: 35,
    mensagem: 'Histórico familiar de hipertireoidismo. Vale considerar exame de TSH a partir dos 35 anos (repetindo a cada 5 anos), podendo ser antes se houver sintomas.',
  },
  {
    id: 'osteoporose',
    palavras: ['osteoporose'],
    aplicaSexo: null,
    idadeRecomendada: 50,
    mensagem: 'Histórico familiar de osteoporose. Vale conversar sobre adiantar a densitometria óssea para os 50 anos (em vez dos 65), especialmente para mulheres.',
  },
  {
    id: 'doenca_renal',
    palavras: ['doença renal', 'doenca renal', 'renal'],
    aplicaSexo: null,
    idadeRecomendada: 20,
    mensagem: 'Histórico familiar de doença renal. Vale conversar sobre exames de função renal (e possivelmente ultrassom) a partir dos 20 anos.',
  },
  {
    id: 'avc',
    palavras: ['avc', 'acidente vascular cerebral', 'derrame'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de AVC. Não há uma idade específica de rastreio, mas vale reforçar o controle de fatores de risco (pressão, colesterol, tabagismo) com um médico.',
  },
  {
    id: 'cancer_outro',
    palavras: ['câncer (outro tipo)', 'cancer (outro tipo)'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de câncer. Vale mencionar esse histórico específico ao médico, que pode orientar sobre rastreio adequado ao tipo de câncer.',
  },
  {
    id: 'saude_mental',
    palavras: ['depressão', 'depressao', 'ansiedade'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de saúde mental (depressão/ansiedade). Vale ficar atento a sinais em si mesmo e considerar conversar com psicólogo ou psiquiatra se notar sintomas.',
  },
  {
    id: 'obesidade',
    palavras: ['obesidade'],
    aplicaSexo: null,
    idadeRecomendada: null,
    mensagem: 'Histórico familiar de obesidade. Vale manter acompanhamento nutricional e hábitos saudáveis desde cedo.',
  },
  {
    id: 'glaucoma',
    palavras: ['glaucoma'],
    aplicaSexo: null,
    idadeRecomendada: 35,
    mensagem: 'Histórico familiar de glaucoma. Vale conversar sobre adiantar o exame oftalmológico completo (com medição de pressão ocular) para os 35 anos, em vez dos 40.',
  },
];

export const tipoCondicaoLabels: Record<string, string> = {
  doenca: 'Hipótese diagnóstica',
  cirurgia: 'Cirurgia',
  internacao: 'Internação',
};

export const statusCondicaoLabels: Record<string, string> = {
  ativa: 'Ativa',
  resolvida: 'Resolvida',
  cronica: 'Crônica',
};

// Lista fechada de doenças comuns — usar termos fixos ajuda tanto na busca quanto no
// funcionamento dos Cuidados Preventivos (que procura por palavras-chave nas condições da família).
export const doencasComuns: { nome: string; categoria: string }[] = [
  { nome: 'Câncer de mama', categoria: 'Oncológica' },
  { nome: 'Câncer de ovário', categoria: 'Oncológica' },
  { nome: 'Câncer colorretal', categoria: 'Oncológica' },
  { nome: 'Câncer de próstata', categoria: 'Oncológica' },
  { nome: 'Câncer (outro tipo)', categoria: 'Oncológica' },
  { nome: 'Diabetes tipo 1', categoria: 'Endocrinológica' },
  { nome: 'Diabetes tipo 2', categoria: 'Endocrinológica' },
  { nome: 'Hipertensão (pressão alta)', categoria: 'Cardiológica' },
  { nome: 'Doença cardíaca / infarto', categoria: 'Cardiológica' },
  { nome: 'Colesterol alto', categoria: 'Cardiológica' },
  { nome: 'AVC (Acidente Vascular Cerebral)', categoria: 'Neurológica' },
  { nome: 'Asma', categoria: 'Pneumológica' },
  { nome: 'Alergia', categoria: 'Alergológica' },
  { nome: 'Hipotireoidismo', categoria: 'Endocrinológica' },
  { nome: 'Hipertireoidismo', categoria: 'Endocrinológica' },
  { nome: 'Depressão', categoria: 'Psiquiátrica' },
  { nome: 'Ansiedade', categoria: 'Psiquiátrica' },
  { nome: 'Epilepsia', categoria: 'Neurológica' },
  { nome: 'Artrite / Artrose', categoria: 'Reumatológica/Ortopédica' },
  { nome: 'Osteoporose', categoria: 'Reumatológica/Ortopédica' },
  { nome: 'Obesidade', categoria: 'Endocrinológica' },
  { nome: 'Doença renal', categoria: 'Nefrológica' },
  { nome: 'Doença de Alzheimer', categoria: 'Neurológica' },
  { nome: 'Doença de Parkinson', categoria: 'Neurológica' },
  { nome: 'Enxaqueca', categoria: 'Neurológica' },
  { nome: 'Glaucoma', categoria: 'Oftalmológica' },
  { nome: 'Catarata congênita', categoria: 'Oftalmológica' },
  { nome: 'Degeneração macular', categoria: 'Oftalmológica' },
  { nome: 'Retinose pigmentar', categoria: 'Oftalmológica' },
  { nome: 'Daltonismo (deficiência de percepção de cores)', categoria: 'Oftalmológica' },
  { nome: 'Alta miopia', categoria: 'Oftalmológica' },
  { nome: 'Dor de barriga', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Dor de cabeça', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Dor de ouvido', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Dor de garganta', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Febre', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Tosse', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Resfriado / Virose', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Vômito', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Diarreia', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Reação alérgica (sem diagnóstico fechado)', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Dor muscular', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Mal-estar geral', categoria: 'Sintomas comuns (sem diagnóstico fechado)' },
  { nome: 'Outra doença (especificar)', categoria: 'Outra' },
];

export const categoriasDoencas: string[] = Array.from(new Set(doencasComuns.map((d) => d.categoria))).sort();

// Atividades físicas/esportivas agrupadas por categoria (categorias e itens dentro de
// cada uma em ordem alfabética), usado no <select> com <optgroup> da tela de Esportes.
// "Outra (especificar)" fica fora dos grupos, como opção avulsa no fim do dropdown.
export const atividadesFisicasComuns: { categoria: string; itens: string[] }[] = [
  { categoria: 'Aquático', itens: ['Natação', 'Polo Aquático', 'Surfe'] },
  { categoria: 'Coletivo', itens: ['Basquete', 'Futebol', 'Futsal', 'Handebol', 'Rugby', 'Vôlei'] },
  { categoria: 'Combate/Artes Marciais', itens: ['Boxe', 'Capoeira', 'Esgrima', 'Jiu-Jitsu', 'Judô', 'Karatê', 'Luta Olímpica', 'Muay Thai', 'Taekwondo'] },
  { categoria: 'Condicionamento/Bem-estar', itens: ['Crossfit', 'Funcional', 'Musculação/Academia', 'Pilates', 'Yoga'] },
  { categoria: 'Dança', itens: ['Ballet', 'Dança Contemporânea', 'Dança de Rua', 'Dança de Salão', 'Forró', 'Samba', 'Sapateado'] },
  { categoria: 'Individual/Atletismo', itens: ['Atletismo', 'Badminton', 'Ciclismo', 'Corrida', 'Escalada', 'Ginástica Artística', 'Ginástica Rítmica', 'Golfe', 'Hipismo/Equitação', 'Patinação', 'Skate', 'Tênis'] },
  { categoria: 'Mental/Estratégia', itens: ['Xadrez'] },
];

// Dicas de saúde/bem-estar mostradas no carrossel da Home, filtradas pela idade e sexo
// biológico do membro selecionado (ver obterDicasFiltradas em page.tsx). idadeMin/idadeMax
// em anos; ausência de idadeMin/idadeMax/sexo = dica universal (vale pra qualquer um).
export const dicasDeSaude: DicaSaude[] = [
  // Universais (qualquer idade/sexo)
  { texto: 'Beber bastante água ao longo do dia ajuda a manter a energia e a concentração.', icone: '💧' },
  { texto: 'Manter um horário regular de sono (inclusive nos fins de semana) melhora a qualidade do descanso.', icone: '😴' },
  { texto: 'Consultas de rotina e exames preventivos ajudam a identificar problemas de saúde antes que piorem.', icone: '🩺' },
  { texto: 'Lavar as mãos com frequência continua sendo uma das formas mais simples de evitar doenças.', icone: '🧼' },
  { texto: 'Manter as vacinas em dia protege não só quem toma, mas também quem está por perto.', icone: '💉' },

  // Bebês (0-2 anos)
  { texto: 'O aleitamento materno exclusivo até os 6 meses é recomendado pela OMS sempre que possível.', icone: '🍼', idadeMax: 2 },
  { texto: 'Deixar o bebê de bruços supervisionado ("tummy time") todo dia ajuda a fortalecer pescoço e tronco.', icone: '🧸', idadeMax: 2 },
  { texto: 'Acompanhar as curvas de peso e altura nas consultas de rotina ajuda a identificar cedo qualquer desvio no crescimento.', icone: '📈', idadeMax: 2 },

  // Crianças (2-12 anos)
  { texto: 'Crianças costumam precisar de 9 a 12 horas de sono por noite — rotina de sono ajuda no desenvolvimento.', icone: '🛏️', idadeMin: 2, idadeMax: 12 },
  { texto: 'Limitar o tempo de tela e incentivar brincadeiras ao ar livre favorece o desenvolvimento motor e social.', icone: '🤸', idadeMin: 2, idadeMax: 12 },
  { texto: 'O calendário vacinal infantil tem reforços importantes entre 4 e 6 anos — vale conferir a caderneta.', icone: '💉', idadeMin: 2, idadeMax: 12 },
  { texto: 'Visitas regulares ao dentista desde cedo ajudam a prevenir cáries e criar o hábito de cuidar dos dentes.', icone: '🦷', idadeMin: 2, idadeMax: 12 },

  // Adolescentes (10-19 anos)
  { texto: 'A adolescência costuma trazer mudanças de humor — manter um canal aberto de conversa ajuda bastante.', icone: '💬', idadeMin: 10, idadeMax: 19 },
  { texto: 'O HPV é recomendado na faixa dos 9 aos 14 anos, mas pode ser aplicado depois — vale conferir com o pediatra.', icone: '💉', idadeMin: 9, idadeMax: 19 },
  { texto: 'Hábitos de sono, alimentação e atividade física formados na adolescência costumam se manter na vida adulta.', icone: '🥗', idadeMin: 10, idadeMax: 19 },

  // Adultos (18-59 anos) — universais nessa faixa
  { texto: 'Pausas regulares ao longo do dia de trabalho ajudam a reduzir tensão muscular e cansaço visual.', icone: '🧘', idadeMin: 18, idadeMax: 59 },
  { texto: 'Exames de rotina (colesterol, glicemia, pressão) a cada 1-2 anos ajudam a pegar alterações cedo.', icone: '🩸', idadeMin: 18, idadeMax: 59 },

  // Adultas (mulheres, 18-59)
  { texto: 'O exame preventivo (Papanicolau) costuma ser recomendado a cada 1-3 anos — vale conferir com o ginecologista.', icone: '🌸', idadeMin: 18, idadeMax: 59, sexo: 'feminino' },
  { texto: 'A mamografia de rastreio costuma ser recomendada a partir dos 40-50 anos — converse com seu médico sobre o momento certo pra você.', icone: '🎗️', idadeMin: 40, idadeMax: 59, sexo: 'feminino' },

  // Adultos (homens, 18-59)
  { texto: 'Check-ups cardiológicos são especialmente importantes pra homens com histórico familiar de problemas cardíacos.', icone: '❤️', idadeMin: 18, idadeMax: 59, sexo: 'masculino' },

  // Idosos (60+)
  { texto: 'Exercícios de equilíbrio e fortalecimento ajudam a prevenir quedas, uma das maiores causas de internação na terceira idade.', icone: '🚶‍♂️', idadeMin: 60 },
  { texto: 'A vacina contra herpes-zóster e o reforço da gripe costumam ser recomendados a partir dos 60 anos.', icone: '💉', idadeMin: 60 },
  { texto: 'Manter o convívio social ativo faz bem tanto para o humor quanto para a saúde cognitiva.', icone: '👥', idadeMin: 60 },
  { texto: 'A densitometria óssea ajuda a rastrear osteoporose, mais comum a partir dos 60-65 anos, especialmente em mulheres.', icone: '🦴', idadeMin: 60, sexo: 'feminino' },
  { texto: 'O exame de PSA costuma entrar na conversa com o urologista a partir dos 50 anos — e antes, se houver histórico familiar.', icone: '🩺', idadeMin: 50, sexo: 'masculino' },
];
