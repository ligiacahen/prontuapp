// Conteúdo de apoio do acompanhamento da gestação.
// Calendário baseado no pré-natal de risco habitual do Ministério da Saúde (Caderneta da Gestante,
// caderno de Atenção ao Pré-Natal) e no calendário de vacinação da gestante da SBIm 2026/27.
// São orientações gerais: o obstetra sempre pode ajustar.

export function normalizar(s: string): string {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export type MarcoPreNatal = {
  id: string;
  titulo: string;
  de: number;          // semana em que começa
  ate: number;         // semana em que termina
  quando: string;
  exame?: string;      // nome do exame que, se registrado, marca o passo como feito
  vacina?: string;     // trecho do nome da vacina que marca o passo como feito
  soRhNegativo?: boolean;
};

export const marcosPreNatal: MarcoPreNatal[] = [
  { id: 'consulta1', titulo: '1ª consulta de pré-natal', de: 0, ate: 12, quando: 'O quanto antes, até 12 semanas' },
  { id: 'us1', titulo: 'Ultrassom do 1º trimestre', de: 11, ate: 14, quando: 'Entre 11 e 14 semanas', exame: 'Ultrassom do 1º trimestre' },
  { id: 'morfo', titulo: 'Ultrassom morfológico', de: 20, ate: 24, quando: 'Entre 20 e 24 semanas', exame: 'Ultrassom morfológico' },
  { id: 'dtpa', titulo: 'Vacina dTpa', de: 20, ate: 36, quando: 'A partir de 20 semanas', vacina: 'dtpa' },
  { id: 'totg', titulo: 'Curva glicêmica', de: 24, ate: 28, quando: 'Entre 24 e 28 semanas', exame: 'Curva glicêmica' },
  { id: 'vsr', titulo: 'Vacina contra o VSR', de: 28, ate: 36, quando: 'A partir de 28 semanas (peça ao obstetra)', vacina: 'vsr' },
  { id: 'antirh', titulo: 'Imunoglobulina anti-Rh', de: 28, ate: 34, quando: 'Entre 28 e 34 semanas (Rh negativo)', soRhNegativo: true },
  { id: 'sor3', titulo: 'Repetir exames de sangue', de: 28, ate: 32, quando: 'No 3º trimestre', exame: 'Sorologias de repetição' },
  { id: 'mala', titulo: 'Mala e plano de parto prontos', de: 34, ate: 37, quando: 'Até 36 semanas' },
  { id: 'gbs', titulo: 'Pesquisa de estreptococo B', de: 35, ate: 37, quando: 'Entre 35 e 37 semanas', exame: 'Estreptococo do grupo B' },
];

export type ExamePreNatal = { nome: string; detalhe: string; soRhNegativo?: boolean };

export const examesPreNatal: Record<1 | 2 | 3, ExamePreNatal[]> = {
  1: [
    { nome: 'Tipo sanguíneo e fator Rh', detalhe: '' },
    { nome: 'Hemograma', detalhe: '' },
    { nome: 'Glicemia de jejum', detalhe: '' },
    { nome: 'TSH', detalhe: 'Tireoide' },
    { nome: 'Sorologias', detalhe: 'HIV, sífilis, hepatites B e C, toxoplasmose, rubéola' },
    { nome: 'Urina (EAS) e urocultura', detalhe: '' },
    { nome: 'Ultrassom do 1º trimestre', detalhe: 'Translucência nucal' },
  ],
  2: [
    { nome: 'Curva glicêmica', detalhe: 'Entre 24 e 28 semanas' },
    { nome: 'Ultrassom morfológico', detalhe: 'Entre 20 e 24 semanas' },
    { nome: 'Hemograma', detalhe: '' },
    { nome: 'Urina (EAS) e urocultura', detalhe: '' },
    { nome: 'Coombs indireto', detalhe: 'Todo mês, se Rh negativo', soRhNegativo: true },
  ],
  3: [
    { nome: 'Sorologias de repetição', detalhe: 'HIV, sífilis, hepatites' },
    { nome: 'Hemograma', detalhe: '' },
    { nome: 'Glicemia de jejum', detalhe: '' },
    { nome: 'Urina (EAS) e urocultura', detalhe: '' },
    { nome: 'Estreptococo do grupo B', detalhe: 'Entre 35 e 37 semanas' },
    { nome: 'Ultrassom do 3º trimestre', detalhe: 'Conforme indicação do obstetra' },
  ],
};

// Vacinas da gestação. "chave" é buscada no nome da vacina registrada.
export const vacinasGestacao: { nome: string; curto: string; chave: string; exigeNaGestacao: boolean }[] = [
  { nome: 'Influenza (Gripe)', curto: 'Gripe', chave: 'influenza', exigeNaGestacao: true },
  { nome: 'dTpa (Tríplice bacteriana acelular do adulto)', curto: 'dTpa', chave: 'dtpa', exigeNaGestacao: true },
  { nome: 'Hepatite B', curto: 'hepatite B', chave: 'hepatite b', exigeNaGestacao: false },
  { nome: 'Covid-19', curto: 'Covid-19', chave: 'covid', exigeNaGestacao: true },
  { nome: 'VSR (Vírus Sincicial Respiratório)', curto: 'VSR', chave: 'vsr', exigeNaGestacao: true },
];

export type GrupoIntercorrencia = { id: 'gest' | 'parto' | 'rn'; titulo: string; itens: [string, string][] };

export const gruposIntercorrencia: GrupoIntercorrencia[] = [
  { id: 'gest', titulo: 'Durante a gestação', itens: [
    ['Diabetes gestacional', 'Ex.: controlado com dieta'], ['Pressão alta ou pré-eclâmpsia', 'Ex.: a partir de 32 semanas'], ['Síndrome HELLP', ''],
    ['Sangramento', 'Ex.: placenta prévia, ameaça de aborto'], ['Ameaça de parto prematuro', ''], ['Bolsa rompeu antes da hora', ''],
    ['Infecção urinária', ''], ['Anemia', ''], ['Enjoo e vômito intensos', ''], ['Colestase (coceira intensa)', ''],
    ['Alteração da tireoide', ''], ['Incompatibilidade Rh', ''], ['Bebê pequeno para a idade', ''],
    ['Pouco ou muito líquido', ''], ['Infecção na gestação', 'Ex.: toxoplasmose, sífilis, estreptococo B'],
    ['Gestação de gêmeos', ''], ['Malformação vista no pré-natal', ''],
  ] },
  { id: 'parto', titulo: 'No parto', itens: [
    ['Trabalho de parto longo', ''], ['Sofrimento fetal', ''], ['Circular de cordão', 'Ex.: uma volta no pescoço'],
    ['Líquido com mecônio', ''], ['Bebê sentado (pélvico)', ''], ['Distocia de ombro', ''],
    ['Hemorragia pós-parto', ''], ['Febre ou infecção da mãe', ''],
  ] },
  { id: 'rn', titulo: 'Com o bebê', itens: [
    ['Prematuridade', 'Ex.: prematuro tardio, 36 semanas'], ['Baixo peso', ''], ['Precisou de reanimação', ''],
    ['Precisou de oxigênio', ''], ['Desconforto respiratório', ''], ['Aspiração de mecônio', ''],
    ['Icterícia com fototerapia', 'Ex.: 3 dias de fototerapia'], ['Hipoglicemia', ''], ['Infecção neonatal', ''],
    ['Ficou na UTI neonatal', 'Ex.: quantos dias e por quê'], ['Fratura ou lesão do parto', ''], ['Malformação congênita', ''],
    ['Alteração nos testes da triagem', 'Ex.: teste da orelhinha repetido'], ['Alteração no quadril', ''],
  ] },
];

export const opcoesTipoParto: { value: string; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'cesarea', label: 'Cesárea' },
  { value: 'cesarea_urgencia', label: 'Cesárea de urgência' },
  { value: 'forceps', label: 'Fórceps ou vácuo' },
];

export function rotuloTipoParto(v: string | null): string {
  if (!v) return '—';
  return opcoesTipoParto.find((o) => o.value === v)?.label || v;
}
