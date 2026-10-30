// Conteúdo das telas de Saúde mental, Hábitos de vida, Água e Diário alimentar.

export const humoresSM = [
  { id: 5, label: 'Muito bem', cor: '#2E7D5B' },
  { id: 4, label: 'Bem', cor: '#6FA58A' },
  { id: 3, label: 'Mais ou menos', cor: '#C9A44A' },
  { id: 2, label: 'Mal', cor: '#C97A45' },
  { id: 1, label: 'Muito mal', cor: '#A4521D' },
];

export const frequenciasSM: [string, string][] = [['0', 'Nunca'], ['1', 'Às vezes'], ['2', 'Muitas vezes'], ['3', 'Quase sempre']];

export const sinaisSM: { id: string; label: string }[] = [
  { id: 'ans', label: 'Ansiedade, nervosismo ou preocupação demais' },
  { id: 'triste', label: 'Tristeza ou desânimo' },
  { id: 'interesse', label: 'Pouco interesse ou prazer nas coisas' },
  { id: 'sono', label: 'Dificuldade para dormir ou sono demais' },
  { id: 'cansaco', label: 'Cansaço ou falta de energia' },
];

export const profissionaisSM: { id: string; label: string }[] = [
  { id: 'psico', label: 'Psicólogo' },
  { id: 'psiq', label: 'Psiquiatra' },
  { id: 'nenhum', label: 'Nenhum no momento' },
];

export const diagnosticosSM: string[] = ['Ansiedade', 'Depressão', 'Síndrome do pânico', 'TDAH', 'Transtorno bipolar', 'TOC', 'Burnout', 'Outro'];

export type PerguntaHabito = { id: string; label: string; multi?: boolean; opcoes: [string, string][] };
export type SecaoHabito = { id: string; titulo: string; obs: string; perguntas: PerguntaHabito[] };

const freqHab: [string, string][] = [['nunca', 'Quase nunca'], ['as', 'Às vezes'], ['maioria', 'Na maioria dos dias'], ['todo', 'Todo dia']];

export const secoesHabitos: SecaoHabito[] = [
  { id: 'alim', titulo: 'Alimentação', obs: 'Ex.: restrição, preferência, algo que não come', perguntas: [
    { id: 'ref', label: 'Quantas refeições por dia?', opcoes: [['1a2', '1 a 2'], ['3', '3'], ['4a5', '4 a 5'], ['6', '6 ou mais']] },
    { id: 'fv', label: 'Come frutas, verduras e legumes', opcoes: freqHab },
    { id: 'up', label: 'Come industrializados (salgadinho, refrigerante, embutidos)', opcoes: freqHab },
    { id: 'agua', label: 'Quanta água bebe por dia?', opcoes: [['pouca', 'Menos de 1 litro'], ['1a2', '1 a 2 litros'], ['mais2', 'Mais de 2 litros']] },
    { id: 'dieta', label: 'Segue algum tipo de alimentação?', multi: true, opcoes: [['veg', 'Vegetariana'], ['vegan', 'Vegana'], ['sglut', 'Sem glúten'], ['slact', 'Sem lactose'], ['orient', 'Orientada por nutricionista']] },
  ] },
  { id: 'ativ', titulo: 'Atividade física', obs: 'Ex.: musculação 3x, caminhada no fim de semana', perguntas: [
    { id: 'dias', label: 'Quantos dias por semana se exercita?', opcoes: [['0', 'Nenhum'], ['1a2', '1 a 2'], ['3a4', '3 a 4'], ['5', '5 ou mais']] },
    { id: 'tipo', label: 'Que tipo de atividade?', multi: true, opcoes: [['cam', 'Caminhada'], ['corr', 'Corrida'], ['musc', 'Musculação'], ['nat', 'Natação'], ['bike', 'Bicicleta'], ['yoga', 'Yoga ou pilates'], ['esp', 'Esporte coletivo'], ['out', 'Outra']] },
    { id: 'sent', label: 'Passa muitas horas sentado?', opcoes: [['nao', 'Não'], ['parte', 'Parte do dia'], ['maior', 'A maior parte do dia']] },
  ] },
  { id: 'sono', titulo: 'Sono', obs: 'Ex.: acorda de madrugada, trabalha em turno', perguntas: [
    { id: 'horas', label: 'Quantas horas dorme por noite?', opcoes: [['m5', 'Menos de 5'], ['5a6', '5 a 6'], ['7a8', '7 a 8'], ['m8', 'Mais de 8']] },
    { id: 'qual', label: 'Acorda descansado?', opcoes: [['sim', 'Sim'], ['as', 'Às vezes'], ['nao', 'Quase nunca']] },
    { id: 'sinais', label: 'Alguém já notou?', multi: true, opcoes: [['ronco', 'Ronco alto'], ['pausa', 'Pausas na respiração'], ['insonia', 'Dificuldade para pegar no sono'], ['remedio', 'Usa remédio para dormir']] },
  ] },
  { id: 'tela', titulo: 'Uso de telas', obs: 'Ex.: celular no trabalho, videogame à noite', perguntas: [
    { id: 'telaHoras', label: 'Horas por dia fora do trabalho ou escola', opcoes: [['m2', 'Até 2'], ['2a4', '2 a 4'], ['4a6', '4 a 6'], ['m6', 'Mais de 6']] },
    { id: 'telaNoite', label: 'Usa telas na última hora antes de dormir?', opcoes: [['nao', 'Não'], ['as', 'Às vezes'], ['sim', 'Sim, quase sempre']] },
  ] },
  { id: 'vicio', titulo: 'Álcool e cigarro', obs: 'Ex.: parou de fumar em 2018', perguntas: [
    { id: 'fumo', label: 'Fuma ou usa cigarro eletrônico?', opcoes: [['nunca', 'Nunca'], ['parou', 'Parei'], ['as', 'Às vezes'], ['diario', 'Todo dia']] },
    { id: 'alcool', label: 'Bebe bebida alcoólica?', opcoes: [['nao', 'Não bebe'], ['raro', 'Raramente'], ['semana', 'Toda semana'], ['quase', 'Quase todo dia']] },
  ] },
];

// Texto resumido de cada seção (também guardado nas colunas antigas, que o resumo para compartilhar usa).
export function resumoSecaoHabito(sec: SecaoHabito, respostas: Record<string, string>, obs: string): string {
  const partes: string[] = [];
  for (const p of sec.perguntas) {
    if (p.multi) {
      const marcados = p.opcoes.filter(([v]) => respostas[`${p.id}:${v}`]).map(([, l]) => l);
      if (marcados.length) partes.push(`${p.label.replace(/\?$/, '')}: ${marcados.join(', ')}`);
    } else if (respostas[p.id]) {
      const rot = p.opcoes.find(([v]) => v === respostas[p.id])?.[1];
      if (rot) partes.push(`${p.label.replace(/\?$/, '')}: ${rot}`);
    }
  }
  if (obs.trim()) partes.push(obs.trim());
  return partes.join(' · ');
}

export function dicaHabito(secId: string, respostas: Record<string, string>): string {
  if (secId === 'tela' && respostas.telaNoite === 'sim') return 'Telas perto da hora de dormir costumam atrapalhar o sono. Vale comentar com o médico se o sono também não está bom.';
  if (secId === 'sono' && (respostas['sinais:pausa'] || respostas['sinais:ronco'])) return 'Ronco alto e pausas na respiração são sinais que o médico gosta de saber. Leve isso para a próxima consulta.';
  return '';
}

export const metasAgua = [1500, 2000, 2500, 3000];
export const coposAgua: { ml: number; nome: string }[] = [{ ml: 200, nome: 'Copo pequeno' }, { ml: 300, nome: 'Copo' }, { ml: 500, nome: 'Garrafinha' }];

export function formatarLitros(ml: number): string {
  if (ml < 1000) return `${ml} ml`;
  const l = ml / 1000;
  return `${(Number.isInteger(l) ? String(l) : l.toFixed(2).replace(/0$/, '')).replace('.', ',')} L`;
}

export const focosInvestigar: { titulo: string; tag: string }[] = [
  { titulo: 'Intolerância à lactose', tag: 'leite' },
  { titulo: 'Doença celíaca ou sensibilidade ao glúten', tag: 'gluten' },
  { titulo: 'Alergia a ovo', tag: 'ovo' },
  { titulo: 'Outra suspeita', tag: 'outro' },
];

export const tagsDiario: Record<string, string> = { leite: 'Leite e derivados', gluten: 'Glúten', ovo: 'Ovo', outro: 'Outro suspeito' };
export const refeicoesDiario: [string, string][] = [['cafe', 'Café da manhã'], ['almoco', 'Almoço'], ['lanche', 'Lanche'], ['jantar', 'Jantar'], ['ceia', 'Ceia']];
export const planoDiario: [string, string][] = [['sim', 'Sim'], ['parcial', 'Em parte'], ['nao', 'Não']];
export const planoRotulo: Record<string, string> = { sim: 'Dentro do plano', parcial: 'Em parte', nao: 'Fora do plano' };
export const sintomasDiario: string[] = ['Inchaço', 'Gases', 'Dor de barriga', 'Diarreia', 'Enjoo', 'Coceira na pele', 'Dor de cabeça', 'Cansaço'];
export const intensidadesDiario: [string, string][] = [['leve', 'Leve'], ['moderado', 'Moderado'], ['forte', 'Forte']];
