'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import anthro_zscores from 'anthro-js';

type Membro = {
  id: string;
  nome: string;
  data_nascimento: string;
  sexo_biologico: string;
  tipo_sanguineo: string | null;
  observacoes_gerais: string | null;
  data_falecimento: string | null;
  parentesco: string | null;
  foto_url: string | null;
  alergias: string | null;
};

const opcoesParentesco: { value: string; label: string }[] = [
  { value: 'eu_mesmo', label: 'Eu mesmo(a) (titular da conta)' },
  { value: 'filho', label: 'Filho(a)' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'irmao', label: 'Irmão/Irmã' },
  { value: 'avo', label: 'Avô/Avó' },
  { value: 'outro_sangue', label: 'Outro parente de sangue' },
  { value: 'conjuge', label: 'Cônjuge/parceiro(a) (sem parentesco de sangue)' },
  { value: 'sem_parentesco', label: 'Sem parentesco de sangue (ex: cuidador)' },
];

const parentescosDeSangue = ['eu_mesmo', 'filho', 'pai', 'mae', 'irmao', 'avo', 'outro_sangue'];

type Condicao = {
  id: string;
  tipo: string;
  nome: string;
  data_diagnostico_ou_procedimento: string | null;
  status: string;
  relevante_geneticamente: boolean;
  observacao: string | null;
  orientacoes: string | null;
  medico: string | null;
  evento_relacionado_id: string | null;
};

type Medicacao = {
  id: string;
  nome: string;
  dosagem: string | null;
  frequencia: string | null;
  horario: string | null;
  data_inicio: string;
  data_fim: string | null;
  condicao_relacionada_id: string | null;
  consulta_relacionada_id: string | null;
  classe: string | null;
  observacao: string | null;
  medico_receitou: string | null;
};

const classesMedicamento: { value: string; label: string }[] = [
  { value: 'analgesico', label: 'Analgésicos' },
  { value: 'anestesico', label: 'Anestésicos' },
  { value: 'ansiolitico', label: 'Ansiolíticos' },
  { value: 'antiacido', label: 'Antiácidos' },
  { value: 'antiacneico', label: 'Antiacneicos' },
  { value: 'antiagregante_plaquetario', label: 'Antiagregantes Plaquetários' },
  { value: 'antialergico', label: 'Antialérgicos (Anti-histamínicos)' },
  { value: 'antianemico', label: 'Antianêmicos' },
  { value: 'antiasmatico', label: 'Antiasmáticos' },
  { value: 'antibiotico', label: 'Antibacterianos (Antibióticos)' },
  { value: 'anticoagulante', label: 'Anticoagulantes' },
  { value: 'anticoncepcional', label: 'Anticoncepcionais' },
  { value: 'anticonvulsivante', label: 'Anticonvulsivantes' },
  { value: 'antidepressivo', label: 'Antidepressivos' },
  { value: 'antidiabetico', label: 'Antidiabéticos' },
  { value: 'antidiarreico', label: 'Antidiarréicos' },
  { value: 'antiemetico', label: 'Antieméticos' },
  { value: 'antiepileptico', label: 'Antiepilépticos' },
  { value: 'antifungico', label: 'Antifúngicos' },
  { value: 'anti_hipertensivo', label: 'Anti-hipertensivos' },
  { value: 'anti_inflamatorio', label: 'Anti-inflamatórios' },
  { value: 'antimalarico', label: 'Antimaláricos' },
  { value: 'antineoplasico', label: 'Antineoplásicos (Quimioterápicos)' },
  { value: 'antiparasitario', label: 'Antiparasitários (Vermífugos)' },
  { value: 'antiprotozoario', label: 'Antiprotozoários' },
  { value: 'antirreumatico', label: 'Antirreumáticos' },
  { value: 'antisseptico', label: 'Antissépticos' },
  { value: 'antitussigeno', label: 'Antitussígenos' },
  { value: 'antiviral', label: 'Antivirais' },
  { value: 'betabloqueador', label: 'Betabloqueadores' },
  { value: 'bloqueador_canal_calcio', label: 'Bloqueadores de Canais de Cálcio' },
  { value: 'broncodilatador', label: 'Broncodilatadores' },
  { value: 'corticoide', label: 'Corticoides' },
  { value: 'diuretico', label: 'Diuréticos' },
  { value: 'estatina', label: 'Estatinas (Hipolipemiantes)' },
  { value: 'expectorante', label: 'Expectorantes' },
  { value: 'imunomodulador', label: 'Imunomoduladores / Imunossupressores' },
  { value: 'laxante', label: 'Laxantes' },
  { value: 'opioide', label: 'Opioides' },
  { value: 'relaxante_muscular', label: 'Relaxantes Musculares' },
  { value: 'outros', label: 'Outros' },
];

const especialidadesMedicas: string[] = [
  'Alergia e Imunologia', 'Anestesiologia', 'Angiologia', 'Cardiologia',
  'Cirurgia Cardiovascular', 'Cirurgia da Mão', 'Cirurgia de Cabeça e Pescoço',
  'Cirurgia do Aparelho Digestivo', 'Cirurgia Geral', 'Cirurgia Oncológica',
  'Cirurgia Pediátrica', 'Cirurgia Plástica', 'Cirurgia Torácica', 'Cirurgia Vascular',
  'Clínica Médica', 'Coloproctologia', 'Dermatologia', 'Endocrinologia e Metabologia',
  'Endoscopia', 'Fisioterapia', 'Fonoaudiologia', 'Gastroenterologia', 'Genética Médica',
  'Geriatria', 'Ginecologia e Obstetrícia', 'Hematologia e Hemoterapia', 'Homeopatia',
  'Infectologia', 'Mastologia', 'Medicina de Família e Comunidade', 'Medicina do Trabalho',
  'Medicina Esportiva', 'Medicina Intensiva', 'Medicina Nuclear', 'Nefrologia',
  'Neurocirurgia', 'Neurologia', 'Nutrição', 'Nutrologia', 'Odontologia', 'Oftalmologia', 'Ortodontia',
  'Oncologia Clínica', 'Ortopedia e Traumatologia', 'Otorrinolaringologia', 'Patologia',
  'Patologia Clínica / Medicina Laboratorial', 'Pediatria', 'Pneumologia', 'Psicologia',
  'Psiquiatria', 'Radiologia e Diagnóstico por Imagem', 'Radioterapia', 'Reumatologia',
  'Urologia', 'Outros',
];

const vacinasComuns: string[] = [
  'BCG', 'Hepatite B', 'Pentavalente (DTP+Hib+Hep B)', 'DTP (Difteria, Tétano e Coqueluche)',
  'DTPa (acelular)', 'dT (Dupla adulto)', 'dTpa (Tríplice bacteriana acelular do adulto)',
  'VIP (Poliomielite inativada)', 'VOP (Poliomielite oral)', 'Rotavírus',
  'Pneumocócica 10-valente', 'Pneumocócica 13-valente', 'Pneumocócica 23-valente',
  'Meningocócica C (conjugada)', 'Meningocócica ACWY', 'Meningocócica B',
  'Febre Amarela', 'Tríplice Viral (Sarampo, Caxumba e Rubéola)', 'Tetra Viral (SCR + Varicela)',
  'Varicela (Catapora)', 'Hepatite A', 'HPV', 'Influenza (Gripe)', 'Dengue', 'Covid-19',
  'Raiva', 'Herpes-zóster', 'Outra (especificar)',
];

type Consulta = {
  id: string;
  data_hora: string;
  local: string | null;
  motivo: string | null;
  anotacoes: string | null;
  status: string;
  especialidade: { nome: string } | null;
  profissional_saude: { nome: string } | null;
  data_retorno_sugerida: string | null;
  forma_atendimento: string | null;
  valor_pago: number | null;
  solicitou_reembolso: boolean;
  valor_reembolsado: number | null;
  incluir_ir: boolean;
  obs_financeira: string | null;
  condicao_relacionada_id: string | null;
};

type Exame = {
  id: string;
  nome: string;
  data_realizacao: string;
  laboratorio: string | null;
  resultado_resumo: string | null;
  condicao_relacionada_id: string | null;
};

type Vacina = {
  id: string;
  nome: string;
  dose: string | null;
  data_aplicacao: string;
  proxima_dose_data: string | null;
  observacoes: string | null;
  condicao_relacionada_id: string | null;
};

type InformacaoNascimento = {
  id: string;
  peso_nascimento: number | null;
  comprimento_nascimento: number | null;
  perimetro_cefalico: number | null;
  idade_gestacional_semanas: number | null;
  tipo_parto: string | null;
  apgar_1min: number | null;
  apgar_5min: number | null;
  uti_neonatal: boolean;
  intercorrencias: string | null;
  local_nascimento: string | null;
  pre_natal_adequado: string | null;
  pre_natal_num_consultas: number | null;
  intercorrencias_gestacionais: string | null;
  uso_substancias_medicacoes: string | null;
};

// As 5 seções de anamnese abaixo seguem todas o mesmo padrão de informacao_nascimento:
// um registro único por membro (não uma lista com datas), editável quando precisar atualizar.
type Desenvolvimento = {
  id: string;
  sustentou_cabeca: string | null;
  sentou: string | null;
  engatinhou: string | null;
  andou: string | null;
  primeiras_palavras: string | null;
  desenvolvimento_adequado: boolean | null;
  observacao: string | null;
};

type AlimentacaoInfantil = {
  id: string;
  aleitamento_materno: boolean | null;
  aleitamento_exclusivo_meses: number | null;
  formula: string | null;
  introducao_alimentar: string | null;
  aceitacao_alimentar: string | null;
};

type PuberdadeSexualidade = {
  id: string;
  menarca_espermarca: string | null;
  ciclo_menstrual: string | null;
  vida_sexual_ativa: boolean | null;
  metodos_contraceptivos: string | null;
  historico_ist: string | null;
};

type SaudeMental = {
  id: string;
  humor: string | null;
  ansiedade: boolean | null;
  tristeza_persistente: boolean | null;
  ideacao_suicida: boolean | null;
  automutilacao: boolean | null;
  observacao: string | null;
};

type HabitosVida = {
  id: string;
  alimentacao: string | null;
  atividade_fisica: string | null;
  sono: string | null;
  uso_telas: string | null;
};

type MedicaoCrescimento = {
  id: string;
  data_medicao: string;
  peso_kg: number | null;
  altura_cm: number | null;
  condicao_relacionada_id: string | null;
};

type Medico = {
  id: string;
  nome: string;
  especialidade: string | null;
  telefone: string | null;
  local: string | null;
  observacao: string | null;
};

type Passo = 'login' | 'cadastro' | 'onboarding' | 'painel';
type Aba = 'geral' | 'condicoes' | 'cirurgias' | 'medicacoes' | 'consultas' | 'odontologia' | 'exames' | 'vacinas' | 'nascimento' | 'menupessoal' | 'gestacao' | 'desenvolvimento' | 'alimentacaoinfantil' | 'puberdade' | 'saudemental' | 'habitosvida' | 'crescimento' | 'riscos' | 'medicos' | 'bemestar' | 'nutricionista' | 'esportes' | 'novoregistro' | 'onboardingvoz' | 'eventoresumo';

function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function calcularIdadeEmMeses(dataNascimento: string, dataReferencia: string) {
  const nasc = new Date(dataNascimento);
  const ref = new Date(dataReferencia);
  let meses = (ref.getFullYear() - nasc.getFullYear()) * 12 + (ref.getMonth() - nasc.getMonth());
  if (ref.getDate() < nasc.getDate()) meses--;
  return meses;
}

function formatarIdadeEmMeses(totalMeses: number): string {
  if (totalMeses < 12) {
    return `${totalMeses} ${totalMeses === 1 ? 'mês' : 'meses'}`;
  }
  const anos = Math.floor(totalMeses / 12);
  const mesesRestantes = totalMeses % 12;
  const textoAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  if (mesesRestantes === 0) return textoAnos;
  const textoMeses = `${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`;
  return `${textoAnos} e ${textoMeses}`;
}

function classificarZScorePeso(z: number): string {
  if (z < -3) return 'Peso muito baixo p/ idade';
  if (z < -2) return 'Peso baixo p/ idade';
  if (z <= 2) return 'Peso adequado p/ idade';
  return 'Peso elevado p/ idade';
}

function classificarZScoreAltura(z: number): string {
  if (z < -3) return 'Estatura muito baixa p/ idade';
  if (z < -2) return 'Estatura baixa p/ idade';
  if (z <= 2) return 'Estatura adequada p/ idade';
  return 'Estatura alta p/ idade';
}

// A OMS só publica a referência de peso/altura por idade (Child Growth Standards) até os 5 anos (60 meses).
// Acima disso, mostramos a medida sem comparação com a OMS.
function calcularZScoresOMS(
  sexoBiologico: string,
  idadeEmMeses: number,
  pesoKg: number | null,
  alturaCm: number | null
): { zPeso: number | null; zAltura: number | null } | null {
  if (idadeEmMeses < 0 || idadeEmMeses > 60) return null;
  try {
    const resultado: any = anthro_zscores({
      sex: sexoBiologico === 'masculino' ? 'm' : 'f',
      age: idadeEmMeses,
      is_age_in_month: true,
      weight: pesoKg ?? undefined,
      lenhei: alturaCm ?? undefined,
    });
    // Nomes de campo podem variar conforme a versão da biblioteca — checamos as variações mais comuns.
    const zPeso = resultado?.zwei ?? resultado?.zwfa ?? null;
    const zAltura = resultado?.zlen ?? resultado?.zhfa ?? resultado?.zlfa ?? null;
    return {
      zPeso: typeof zPeso === 'number' ? zPeso : null,
      zAltura: typeof zAltura === 'number' ? zAltura : null,
    };
  } catch {
    return null;
  }
}

// IMC (índice de massa corporal) — cálculo padrão pra adultos (peso em kg / altura em m²).
// Usamos a classificação clássica da OMS pra adultos; em crianças/adolescentes o IMC
// interpretado da mesma forma não é preciso (o ideal seria IMC-por-idade), por isso só
// mostramos essa classificação a partir dos 18 anos — abaixo disso a tela já usa os
// z-scores da OMS (até 5 anos) ou só mostra peso/altura sem rótulo de classificação.
function calcularIMC(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  if (alturaM <= 0) return null;
  return pesoKg / (alturaM * alturaM);
}

function classificarIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso adequado';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

// ATENÇÃO: estas são orientações gerais de rastreamento, baseadas em diretrizes conhecidas
// (ex: sociedades de mastologia, coloproctologia, urologia, diabetes). Elas NÃO substituem
// avaliação médica individual — sempre recomendamos consultar um profissional de saúde.
type RegraGenetica = {
  id: string;
  palavras: string[];
  aplicaSexo: 'masculino' | 'feminino' | null;
  idadeRecomendada: number | null;
  mensagem: string;
};

const regrasGeneticas: RegraGenetica[] = [
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

type RiscoGenetico = {
  id: string;
  mensagem: string;
  naIdadeRecomendada: boolean;
  idadeRecomendada: number | null;
  categoria: string;
};

function calcularRiscosGeneticos(
  membro: Membro,
  nomesCondicoesFamilia: string[]
): RiscoGenetico[] {
  const idade = calcularIdade(membro.data_nascimento);
  const resultados: RiscoGenetico[] = [];
  for (const regra of regrasGeneticas) {
    if (regra.aplicaSexo && regra.aplicaSexo !== membro.sexo_biologico) continue;
    const nomeEncontrado = nomesCondicoesFamilia.find((nome) =>
      regra.palavras.some((p) => nome.toLowerCase().includes(p))
    );
    if (nomeEncontrado) {
      resultados.push({
        id: regra.id,
        mensagem: regra.mensagem,
        naIdadeRecomendada: regra.idadeRecomendada == null || idade >= regra.idadeRecomendada,
        idadeRecomendada: regra.idadeRecomendada,
        categoria: obterCategoriaDoenca(nomeEncontrado),
      });
    }
  }
  return resultados;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Converte texto digitado em número, tolerando unidades (ex: "3,250 kg", "38 semanas")
// e vírgula decimal. Retorna null se o campo estiver vazio, e NaN se não for possível entender o número.
function paraNumeroTolerante(valor: string): number | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  const apenasNumero = limpo.replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!apenasNumero) return NaN;
  const num = Number(apenasNumero);
  return num;
}

const tipoCondicaoLabels: Record<string, string> = {
  doenca: 'Hipótese diagnóstica',
  cirurgia: 'Cirurgia',
  internacao: 'Internação',
};

const statusCondicaoLabels: Record<string, string> = {
  ativa: 'Ativa',
  resolvida: 'Resolvida',
  cronica: 'Crônica',
};

// Lista fechada de doenças comuns — usar termos fixos ajuda tanto na busca quanto no
// funcionamento dos Cuidados Preventivos (que procura por palavras-chave nas condições da família).
const doencasComuns: { nome: string; categoria: string }[] = [
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

const categoriasDoencas: string[] = Array.from(new Set(doencasComuns.map((d) => d.categoria))).sort();

function obterCategoriaDoenca(nome: string): string {
  const nomeLower = nome.toLowerCase();
  const exata = doencasComuns.find((d) => d.nome === nome);
  if (exata) return exata.categoria;
  // Correspondência por palavra-chave, pra cobrir registros antigos em texto livre
  // (ex: "Hipertensão" sozinho, sem o "(pressão alta)" da lista fechada atual).
  for (const d of doencasComuns) {
    const tokens = d.nome
      .toLowerCase()
      .replace(/[()/]/g, ' ')
      .split(' ')
      .filter((t) => t.length > 3 && !['tipo', 'outro', 'outra', 'especificar'].includes(t));
    if (tokens.some((t) => nomeLower.includes(t))) return d.categoria;
  }
  return 'Outra';
}

export default function Home() {
  const [passo, setPasso] = useState<Passo>('login');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');

  const [modoOnboarding, setModoOnboarding] = useState<'criar' | 'convite'>('criar');
  const [nomeFamilia, setNomeFamilia] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');

  const [codigoGerado, setCodigoGerado] = useState('');

  const [membros, setMembros] = useState<Membro[]>([]);
  const [mostrarFormMembro, setMostrarFormMembro] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novoSexo, setNovoSexo] = useState('');
  const [novoFalecido, setNovoFalecido] = useState(false);
  const [novaDataFalecimento, setNovaDataFalecimento] = useState('');
  const [novoTipoSanguineo, setNovoTipoSanguineo] = useState('');
  const [novoParentesco, setNovoParentesco] = useState('');
  const [erroMembro, setErroMembro] = useState('');

  const [editandoTipo, setEditandoTipo] = useState(false);
  const [valorTipoEdit, setValorTipoEdit] = useState('');
  const [editandoObs, setEditandoObs] = useState(false);
  const [valorObsEdit, setValorObsEdit] = useState('');
  const [editandoAlergias, setEditandoAlergias] = useState(false);
  const [valorAlergiasEdit, setValorAlergiasEdit] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState('');

  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [telaDetalhe, setTelaDetalhe] = useState<Aba | null>(null);

  // Guarda qual membro está selecionado "agora", pra funções assíncronas
  // (carregarCondicoes, carregarMedicacoes etc.) poderem conferir, quando a
  // resposta do Supabase chega, se ainda é o membro atual antes de aplicar o
  // resultado — evita que uma resposta atrasada de um membro antigo sobrescreva
  // a tela de outro membro selecionado depois (race condition). Atualizado direto
  // no corpo do componente (não num useEffect) pra já valer antes de qualquer
  // efeito rodar, sem depender de ordem de execução entre efeitos.
  const membroAtualRef = useRef<string | null>(null);
  membroAtualRef.current = membroSelecionado?.id ?? null;

  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  const [mostrarFormCondicao, setMostrarFormCondicao] = useState(false);
  const [novoTipoCondicao, setNovoTipoCondicao] = useState('doenca');
  const [novoNomeCondicao, setNovoNomeCondicao] = useState('');
  const [novaDataCondicao, setNovaDataCondicao] = useState('');
  const [novoStatusCondicao, setNovoStatusCondicao] = useState('ativa');
  const [novoRelevanteGenetico, setNovoRelevanteGenetico] = useState(false);
  const [novaObservacaoCondicao, setNovaObservacaoCondicao] = useState('');
  const [novaOrientacaoCondicao, setNovaOrientacaoCondicao] = useState('');
  const [doencaOutraNome, setDoencaOutraNome] = useState('');
  const [erroCondicao, setErroCondicao] = useState('');
  const [condicaoEditandoId, setCondicaoEditandoId] = useState<string | null>(null);
  // Tela de "resumo do evento": qual condição está sendo vista, e (quando a pessoa
  // clica em "+ nova consulta/medicação" de dentro do resumo) pra onde voltar depois
  // de salvar, já ligado a esse evento.
  const [condicaoResumoId, setCondicaoResumoId] = useState<string | null>(null);
  const [voltarResumoEventoId, setVoltarResumoEventoId] = useState<string | null>(null);
  const [buscaCondicao, setBuscaCondicao] = useState('');

  const [medicacoes, setMedicacoes] = useState<Medicacao[]>([]);
  const [mostrarFormMedicacao, setMostrarFormMedicacao] = useState(false);
  const [novoNomeMedicacao, setNovoNomeMedicacao] = useState('');
  const [novaDosagem, setNovaDosagem] = useState('');
  const [novaFrequencia, setNovaFrequencia] = useState('');
  const [novoHorario, setNovoHorario] = useState('');
  const [novaDataInicioMed, setNovaDataInicioMed] = useState('');
  const [usoContinuo, setUsoContinuo] = useState(true);
  const [novaDataFimMed, setNovaDataFimMed] = useState('');
  const [novaCondicaoRelacionada, setNovaCondicaoRelacionada] = useState('');
  const [novaConsultaRelacionadaMed, setNovaConsultaRelacionadaMed] = useState('');
  const [novaClasseMedicacao, setNovaClasseMedicacao] = useState('');
  const [novaObservacaoMedicacao, setNovaObservacaoMedicacao] = useState('');
  const [erroMedicacao, setErroMedicacao] = useState('');
  const [medicacaoEditandoId, setMedicacaoEditandoId] = useState<string | null>(null);
  const [buscaMedicacao, setBuscaMedicacao] = useState('');

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [mostrarFormConsulta, setMostrarFormConsulta] = useState(false);
  const [novaEspecialidadeConsulta, setNovaEspecialidadeConsulta] = useState('');
  const [novoProfissionalConsulta, setNovoProfissionalConsulta] = useState('');
  const [novaDataHoraConsulta, setNovaDataHoraConsulta] = useState('');
  const [novoLocalConsulta, setNovoLocalConsulta] = useState('');
  const [novoMotivoConsulta, setNovoMotivoConsulta] = useState('');
  const [novoStatusConsulta, setNovoStatusConsulta] = useState('agendada');
  const [novaAnotacaoConsulta, setNovaAnotacaoConsulta] = useState('');
  const [especialidadeOutroConsulta, setEspecialidadeOutroConsulta] = useState('');
  const [novaDataRetornoConsulta, setNovaDataRetornoConsulta] = useState('');
  const [novaFormaAtendimento, setNovaFormaAtendimento] = useState('');
  const [novoValorPagoConsulta, setNovoValorPagoConsulta] = useState('');
  const [novoSolicitouReembolso, setNovoSolicitouReembolso] = useState(false);
  const [novoValorReembolsado, setNovoValorReembolsado] = useState('');
  const [novoIncluirIr, setNovoIncluirIr] = useState(false);
  const [novaObsFinanceira, setNovaObsFinanceira] = useState('');
  const [novaCondicaoRelacionadaConsulta, setNovaCondicaoRelacionadaConsulta] = useState('');
  const [erroConsulta, setErroConsulta] = useState('');
  const [gravandoCampo, setGravandoCampo] = useState<string | null>(null);
  const [consultaEditandoId, setConsultaEditandoId] = useState<string | null>(null);
  const [buscaConsulta, setBuscaConsulta] = useState('');

  const [confirmandoExclusaoMembro, setConfirmandoExclusaoMembro] = useState(false);

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [mostrarFormMedico, setMostrarFormMedico] = useState(false);
  const [medicoEditandoId, setMedicoEditandoId] = useState<string | null>(null);
  const [novoNomeMedico, setNovoNomeMedico] = useState('');
  const [novaEspecialidadeMedico, setNovaEspecialidadeMedico] = useState('');
  const [especialidadeOutraMedico, setEspecialidadeOutraMedico] = useState('');
  const [novoTelefoneMedico, setNovoTelefoneMedico] = useState('');
  const [novoLocalMedico, setNovoLocalMedico] = useState('');
  const [novaObsMedico, setNovaObsMedico] = useState('');
  const [erroMedico, setErroMedico] = useState('');

  // Estados do fluxo "+ Novo Registro" — um formulário enxuto e único pra criar
  // Evento de Saúde, Cirurgia, Consulta ou Medicação rapidamente, já ligando um ao
  // outro quando fizer sentido. Os registros criados aqui são reais (vão pras mesmas
  // tabelas/telas de sempre) — só ficam com menos campos preenchidos, pra completar
  // depois em Evento de Saúde / Consultas / Medicações.
  const [nrTipo, setNrTipo] = useState<'evento' | 'cirurgia' | 'consulta' | 'medicamento' | null>(null);
  const [nrBusca, setNrBusca] = useState('');
  const [nrSalvo, setNrSalvo] = useState(false);
  const [erroNovoRegistro, setErroNovoRegistro] = useState('');

  // Evento de saúde (doença)
  const [nrEventoNome, setNrEventoNome] = useState('');
  const [nrEventoOutroNome, setNrEventoOutroNome] = useState('');
  const [nrEventoData, setNrEventoData] = useState('');
  const [nrEventoCronica, setNrEventoCronica] = useState(false);
  const [nrEventoRelato, setNrEventoRelato] = useState('');
  const [nrEventoGerouConsulta, setNrEventoGerouConsulta] = useState(false);
  const [nrEventoGerouMedicamento, setNrEventoGerouMedicamento] = useState(false);

  // Cirurgia / Internação
  const [nrCirurgiaTipo, setNrCirurgiaTipo] = useState<'cirurgia' | 'internacao'>('cirurgia');
  const [nrCirurgiaNome, setNrCirurgiaNome] = useState('');
  const [nrCirurgiaData, setNrCirurgiaData] = useState('');
  const [nrCirurgiaMedico, setNrCirurgiaMedico] = useState('');
  const [nrCirurgiaRelato, setNrCirurgiaRelato] = useState('');
  const [nrCirurgiaEventoRelacionado, setNrCirurgiaEventoRelacionado] = useState('');
  const [nrCirurgiaGerouMedicamento, setNrCirurgiaGerouMedicamento] = useState(false);

  // Consulta
  const [nrConsultaEspecialidade, setNrConsultaEspecialidade] = useState('');
  const [nrConsultaEspecialidadeOutro, setNrConsultaEspecialidadeOutro] = useState('');
  const [nrConsultaMedico, setNrConsultaMedico] = useState('');
  const [nrConsultaData, setNrConsultaData] = useState('');
  const [nrConsultaRotina, setNrConsultaRotina] = useState(false);
  const [nrConsultaEventoRelacionado, setNrConsultaEventoRelacionado] = useState('');
  // Quando nrConsultaEventoRelacionado === '__novo__', esse é o nome do evento de
  // saúde novo que vai ser criado junto (em vez de ligar a um já existente).
  const [nrConsultaNovoEventoNome, setNrConsultaNovoEventoNome] = useState('');
  const [nrConsultaObs, setNrConsultaObs] = useState('');
  const [nrConsultaGerouMedicamento, setNrConsultaGerouMedicamento] = useState(false);

  // Medicamento
  const [nrMedNome, setNrMedNome] = useState('');
  const [nrMedDosagem, setNrMedDosagem] = useState('');
  const [nrMedData, setNrMedData] = useState('');
  const [nrMedUsoContinuo, setNrMedUsoContinuo] = useState(true);
  const [nrMedDataFim, setNrMedDataFim] = useState('');
  const [nrMedEventoRelacionado, setNrMedEventoRelacionado] = useState('');
  // Mesma ideia do nrConsultaNovoEventoNome, mas pro fluxo de medicamento.
  const [nrMedNovoEventoNome, setNrMedNovoEventoNome] = useState('');
  const [nrMedMedicoReceitou, setNrMedMedicoReceitou] = useState('');
  const [nrMedObs, setNrMedObs] = useState('');

  // Campos "gerou consulta" / "gerou medicamento" inline (compartilhados pelos 3 fluxos
  // que podem disparar essas mini-seções: evento, cirurgia e consulta)
  const [nrSubConsultaEspecialidade, setNrSubConsultaEspecialidade] = useState('');
  const [nrSubConsultaMedico, setNrSubConsultaMedico] = useState('');
  const [nrSubConsultaData, setNrSubConsultaData] = useState('');
  const [nrSubMedNome, setNrSubMedNome] = useState('');
  const [nrSubMedDosagem, setNrSubMedDosagem] = useState('');
  const [nrSubMedUsoContinuo, setNrSubMedUsoContinuo] = useState(true);

  // Estados do protótipo "contar por voz" no onboarding de um novo membro.
  // Por enquanto o "entendimento" da fala é feito por um heurística simples (sem
  // custo de IA) só pra validar o fluxo com a Roberta antes de ligar numa IA de verdade.
  type ItemOnboardingVoz = { id: string; tipo: 'evento' | 'alergia' | 'cirurgia' | 'medicamento'; texto: string; incluir: boolean };
  const [ovTexto, setOvTexto] = useState('');
  const [ovItens, setOvItens] = useState<ItemOnboardingVoz[]>([]);
  const [ovErro, setOvErro] = useState('');
  const [ovSalvando, setOvSalvando] = useState(false);
  const [ovProcessando, setOvProcessando] = useState(false);

  // Estados do wizard passo a passo de onboarding (estilo "configuração inicial do
  // iPhone"): ao criar um membro novo, ele vai sendo guiado tela por tela pelas
  // categorias principais, com opção de pular qualquer uma. Aparece só uma vez, logo
  // depois de criar o membro — passosOnboarding está definido mais abaixo, junto de secoes.
  const [onboardingAtivo, setOnboardingAtivo] = useState(false);
  const [onboardingPasso, setOnboardingPasso] = useState(0);

  const [exames, setExames] = useState<Exame[]>([]);
  const [mostrarFormExame, setMostrarFormExame] = useState(false);
  const [novoNomeExame, setNovoNomeExame] = useState('');
  const [novaDataExame, setNovaDataExame] = useState('');
  const [novoLaboratorioExame, setNovoLaboratorioExame] = useState('');
  const [novoResultadoExame, setNovoResultadoExame] = useState('');
  const [erroExame, setErroExame] = useState('');
  const [exameEditandoId, setExameEditandoId] = useState<string | null>(null);
  const [novaCondicaoRelacionadaExame, setNovaCondicaoRelacionadaExame] = useState('');

  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [mostrarFormVacina, setMostrarFormVacina] = useState(false);
  const [novoNomeVacina, setNovoNomeVacina] = useState('');
  const [vacinaOutroNome, setVacinaOutroNome] = useState('');
  const [novaDoseVacina, setNovaDoseVacina] = useState('');
  const [novaDataVacina, setNovaDataVacina] = useState('');
  const [novaProximaDoseVacina, setNovaProximaDoseVacina] = useState('');
  const [novaObsVacina, setNovaObsVacina] = useState('');
  const [erroVacina, setErroVacina] = useState('');
  const [vacinaEditandoId, setVacinaEditandoId] = useState<string | null>(null);
  const [novaCondicaoRelacionadaVacina, setNovaCondicaoRelacionadaVacina] = useState('');

  const [nascimento, setNascimento] = useState<InformacaoNascimento | null>(null);
  const [mostrarFormNascimento, setMostrarFormNascimento] = useState(false);
  const [novoPesoNascimento, setNovoPesoNascimento] = useState('');
  const [novoComprimentoNascimento, setNovoComprimentoNascimento] = useState('');
  const [novoPerimetroCefalico, setNovoPerimetroCefalico] = useState('');
  const [novaIdadeGestacional, setNovaIdadeGestacional] = useState('');
  const [novoTipoParto, setNovoTipoParto] = useState('');
  const [novoApgar1, setNovoApgar1] = useState('');
  const [novoApgar5, setNovoApgar5] = useState('');
  const [novoUtiNeonatal, setNovoUtiNeonatal] = useState(false);
  const [novasIntercorrencias, setNovasIntercorrencias] = useState('');
  const [novoLocalNascimento, setNovoLocalNascimento] = useState('');
  const [novoPreNatalAdequado, setNovoPreNatalAdequado] = useState('');
  const [novoPreNatalNumConsultas, setNovoPreNatalNumConsultas] = useState('');
  const [novasIntercorrenciasGestacionais, setNovasIntercorrenciasGestacionais] = useState('');
  const [novoUsoSubstancias, setNovoUsoSubstancias] = useState('');
  const [erroNascimento, setErroNascimento] = useState('');

  // As 5 seções de anamnese abaixo (pedido da Roberta) seguem o mesmo padrão de
  // "Informações de nascimento": um registro único por membro, com uma tela de
  // visualização e um formulário de edição que usa um objeto de estado único (em vez
  // de um useState por campo, pra não precisar de ~25 estados separados).
  const [desenvolvimento, setDesenvolvimento] = useState<Desenvolvimento | null>(null);
  const [mostrarFormDesenvolvimento, setMostrarFormDesenvolvimento] = useState(false);
  const [formDesenvolvimento, setFormDesenvolvimento] = useState({
    sustentou_cabeca: '', sentou: '', engatinhou: '', andou: '', primeiras_palavras: '',
    desenvolvimento_adequado: '' as '' | 'sim' | 'nao', observacao: '',
  });
  const [erroDesenvolvimento, setErroDesenvolvimento] = useState('');

  const [alimentacaoInfantil, setAlimentacaoInfantil] = useState<AlimentacaoInfantil | null>(null);
  const [mostrarFormAlimentacaoInfantil, setMostrarFormAlimentacaoInfantil] = useState(false);
  const [formAlimentacaoInfantil, setFormAlimentacaoInfantil] = useState({
    aleitamento_materno: '' as '' | 'sim' | 'nao', aleitamento_exclusivo_meses: '',
    formula: '', introducao_alimentar: '', aceitacao_alimentar: '',
  });
  const [erroAlimentacaoInfantil, setErroAlimentacaoInfantil] = useState('');

  const [puberdadeSexualidade, setPuberdadeSexualidade] = useState<PuberdadeSexualidade | null>(null);
  const [mostrarFormPuberdade, setMostrarFormPuberdade] = useState(false);
  const [formPuberdade, setFormPuberdade] = useState({
    menarca_espermarca: '', ciclo_menstrual: '', vida_sexual_ativa: '' as '' | 'sim' | 'nao',
    metodos_contraceptivos: '', historico_ist: '',
  });
  const [erroPuberdade, setErroPuberdade] = useState('');

  const [saudeMental, setSaudeMental] = useState<SaudeMental | null>(null);
  const [mostrarFormSaudeMental, setMostrarFormSaudeMental] = useState(false);
  const [formSaudeMental, setFormSaudeMental] = useState({
    humor: '', ansiedade: '' as '' | 'sim' | 'nao', tristeza_persistente: '' as '' | 'sim' | 'nao',
    ideacao_suicida: '' as '' | 'sim' | 'nao', automutilacao: '' as '' | 'sim' | 'nao', observacao: '',
  });
  const [erroSaudeMental, setErroSaudeMental] = useState('');

  const [habitosVida, setHabitosVida] = useState<HabitosVida | null>(null);
  const [mostrarFormHabitosVida, setMostrarFormHabitosVida] = useState(false);
  const [formHabitosVida, setFormHabitosVida] = useState({
    alimentacao: '', atividade_fisica: '', sono: '', uso_telas: '',
  });
  const [erroHabitosVida, setErroHabitosVida] = useState('');

  const [crescimento, setCrescimento] = useState<MedicaoCrescimento[]>([]);
  const [mostrarFormCrescimento, setMostrarFormCrescimento] = useState(false);
  const [novaDataCrescimento, setNovaDataCrescimento] = useState('');
  const [novoPesoCrescimento, setNovoPesoCrescimento] = useState('');
  const [novaAlturaCrescimento, setNovaAlturaCrescimento] = useState('');
  const [erroCrescimento, setErroCrescimento] = useState('');
  const [crescimentoEditandoId, setCrescimentoEditandoId] = useState<string | null>(null);
  const [novaCondicaoRelacionadaCrescimento, setNovaCondicaoRelacionadaCrescimento] = useState('');

  const [editandoParentesco, setEditandoParentesco] = useState(false);
  const [valorParentescoEdit, setValorParentescoEdit] = useState('');

  const [riscos, setRiscos] = useState<RiscoGenetico[] | null>(null);
  const [historicoGeral, setHistoricoGeral] = useState<string[] | null>(null);
  const [filtroEspecialidadeRisco, setFiltroEspecialidadeRisco] = useState('');

  useEffect(() => {
    if (passo === 'painel') carregarMembros();
  }, [passo]);

  useEffect(() => {
    if (membroSelecionado) {
      carregarCondicoes(membroSelecionado.id);
      carregarMedicacoes(membroSelecionado.id);
      carregarConsultas(membroSelecionado.id);
      carregarExames(membroSelecionado.id);
      carregarVacinas(membroSelecionado.id);
      carregarNascimento(membroSelecionado.id);
      carregarDesenvolvimento(membroSelecionado.id);
      carregarAlimentacaoInfantil(membroSelecionado.id);
      carregarPuberdadeSexualidade(membroSelecionado.id);
      carregarSaudeMental(membroSelecionado.id);
      carregarHabitosVida(membroSelecionado.id);
      carregarCrescimento(membroSelecionado.id);
      carregarRiscosGeneticos(membroSelecionado);
      carregarMedicos();
    } else {
      setCondicoes([]);
      setMedicacoes([]);
      setConsultas([]);
      setExames([]);
      setVacinas([]);
      setNascimento(null);
      setDesenvolvimento(null);
      setAlimentacaoInfantil(null);
      setPuberdadeSexualidade(null);
      setSaudeMental(null);
      setHabitosVida(null);
      setCrescimento([]);
      setRiscos(null);
      setHistoricoGeral(null);
      setMedicos([]);
    }
    setEditandoTipo(false);
    setEditandoObs(false);
    setEditandoParentesco(false);
  }, [membroSelecionado]);

  async function carregarMembros() {
    const { data, error } = await supabase
      .from('membro')
      .select('id, nome, data_nascimento, sexo_biologico, tipo_sanguineo, observacoes_gerais, data_falecimento, parentesco, foto_url, alergias')
      .is('data_falecimento', null)
      .order('nome');
    if (!error && data) setMembros(data);
  }

  async function carregarCondicoes(membroId: string) {
    const { data, error } = await supabase
      .from('condicao')
      .select('id, tipo, nome, data_diagnostico_ou_procedimento, status, relevante_geneticamente, observacao, orientacoes, medico, evento_relacionado_id')
      .eq('membro_id', membroId)
      .order('data_diagnostico_ou_procedimento', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setCondicoes(data);
  }

  async function carregarMedicacoes(membroId: string) {
    const { data, error } = await supabase
      .from('medicacao')
      .select('id, nome, dosagem, frequencia, horario, data_inicio, data_fim, condicao_relacionada_id, consulta_relacionada_id, classe, observacao, medico_receitou')
      .eq('membro_id', membroId)
      .order('data_inicio', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setMedicacoes(data);
  }

  async function carregarConsultas(membroId: string) {
    const { data, error } = await supabase
      .from('consulta')
      .select('id, data_hora, local, motivo, anotacoes, status, especialidade(nome), profissional_saude(nome), data_retorno_sugerida, forma_atendimento, valor_pago, solicitou_reembolso, valor_reembolsado, incluir_ir, obs_financeira, condicao_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_hora', { ascending: true });
    if (!error && data && membroAtualRef.current === membroId) setConsultas(data as any);
  }

  async function carregarExames(membroId: string) {
    const { data, error } = await supabase
      .from('exame')
      .select('id, nome, data_realizacao, laboratorio, resultado_resumo, condicao_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_realizacao', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setExames(data);
  }

  async function carregarVacinas(membroId: string) {
    const { data, error } = await supabase
      .from('vacina')
      .select('id, nome, dose, data_aplicacao, proxima_dose_data, observacoes, condicao_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_aplicacao', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setVacinas(data);
  }

  async function carregarNascimento(membroId: string) {
    const { data, error } = await supabase
      .from('informacao_nascimento')
      .select('id, peso_nascimento, comprimento_nascimento, perimetro_cefalico, idade_gestacional_semanas, tipo_parto, apgar_1min, apgar_5min, uti_neonatal, intercorrencias, local_nascimento, pre_natal_adequado, pre_natal_num_consultas, intercorrencias_gestacionais, uso_substancias_medicacoes')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setNascimento(data);
  }

  // Carregamento das 5 seções novas de anamnese — todas "uma por membro", igual
  // informacao_nascimento, por isso maybeSingle() em todas.
  async function carregarDesenvolvimento(membroId: string) {
    const { data, error } = await supabase
      .from('desenvolvimento_neuropsicomotor')
      .select('id, sustentou_cabeca, sentou, engatinhou, andou, primeiras_palavras, desenvolvimento_adequado, observacao')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setDesenvolvimento(data);
  }

  async function carregarAlimentacaoInfantil(membroId: string) {
    const { data, error } = await supabase
      .from('alimentacao_infantil')
      .select('id, aleitamento_materno, aleitamento_exclusivo_meses, formula, introducao_alimentar, aceitacao_alimentar')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setAlimentacaoInfantil(data);
  }

  async function carregarPuberdadeSexualidade(membroId: string) {
    const { data, error } = await supabase
      .from('puberdade_sexualidade')
      .select('id, menarca_espermarca, ciclo_menstrual, vida_sexual_ativa, metodos_contraceptivos, historico_ist')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setPuberdadeSexualidade(data);
  }

  async function carregarSaudeMental(membroId: string) {
    const { data, error } = await supabase
      .from('saude_mental')
      .select('id, humor, ansiedade, tristeza_persistente, ideacao_suicida, automutilacao, observacao')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setSaudeMental(data);
  }

  async function carregarHabitosVida(membroId: string) {
    const { data, error } = await supabase
      .from('habitos_vida')
      .select('id, alimentacao, atividade_fisica, sono, uso_telas')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error && membroAtualRef.current === membroId) setHabitosVida(data);
  }

  async function carregarCrescimento(membroId: string) {
    const { data, error } = await supabase
      .from('medicao_crescimento')
      .select('id, data_medicao, peso_kg, altura_cm, condicao_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_medicao', { ascending: true });
    if (!error && data && membroAtualRef.current === membroId) setCrescimento(data);
  }

  async function resolverEspecialidade(nome: string): Promise<string | null> {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return null;
    const { data: existente } = await supabase
      .from('especialidade')
      .select('id')
      .ilike('nome', nomeLimpo)
      .maybeSingle();
    if (existente) return existente.id;
    const { data: nova, error } = await supabase
      .from('especialidade')
      .insert({ nome: nomeLimpo })
      .select('id')
      .single();
    if (error) throw error;
    return nova.id;
  }

  async function resolverProfissional(nome: string, familiaId: string): Promise<string | null> {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return null;
    const { data: existente } = await supabase
      .from('profissional_saude')
      .select('id')
      .eq('familia_id', familiaId)
      .ilike('nome', nomeLimpo)
      .maybeSingle();
    if (existente) return existente.id;
    const { data: novo, error } = await supabase
      .from('profissional_saude')
      .insert({ nome: nomeLimpo, familia_id: familiaId })
      .select('id')
      .single();
    if (error) throw error;
    return novo.id;
  }

  // Médicos/profissionais de saúde são guardados por família (não por membro) — por
  // isso um pediatra cadastrado para um filho já aparece automaticamente para os
  // irmãos, sem precisar "copiar" nada.
  async function obterFamiliaId(): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    const { data: meuUsuario } = await supabase
      .from('usuario')
      .select('familia_id')
      .eq('id', userData.user?.id)
      .single();
    return meuUsuario?.familia_id || null;
  }

  async function carregarMedicos() {
    const familiaId = await obterFamiliaId();
    if (!familiaId) return;
    const { data, error } = await supabase
      .from('profissional_saude')
      .select('id, nome, especialidade, telefone, local, observacao')
      .eq('familia_id', familiaId)
      .order('nome');
    if (!error && data) setMedicos(data);
  }

  function abrirNovoMedico() {
    setMedicoEditandoId(null);
    setNovoNomeMedico('');
    setNovaEspecialidadeMedico('');
    setEspecialidadeOutraMedico('');
    setNovoTelefoneMedico('');
    setNovoLocalMedico('');
    setNovaObsMedico('');
    setErroMedico('');
    setMostrarFormMedico(true);
  }

  function abrirEdicaoMedico(m: Medico) {
    setMedicoEditandoId(m.id);
    setNovoNomeMedico(m.nome);
    if (m.especialidade && !especialidadesMedicas.includes(m.especialidade)) {
      setNovaEspecialidadeMedico('Outros');
      setEspecialidadeOutraMedico(m.especialidade);
    } else {
      setNovaEspecialidadeMedico(m.especialidade || '');
      setEspecialidadeOutraMedico('');
    }
    setNovoTelefoneMedico(m.telefone || '');
    setNovoLocalMedico(m.local || '');
    setNovaObsMedico(m.observacao || '');
    setErroMedico('');
    setMostrarFormMedico(true);
  }

  async function salvarMedico() {
    setErroMedico('');
    if (!novoNomeMedico.trim()) {
      setErroMedico('Preencha ao menos o nome.');
      return;
    }
    const familiaId = await obterFamiliaId();
    if (!familiaId) return;
    setCarregando(true);

    const especialidadeFinal =
      novaEspecialidadeMedico === 'Outros' ? especialidadeOutraMedico.trim() || null : novaEspecialidadeMedico || null;

    const dados = {
      nome: novoNomeMedico.trim(),
      especialidade: especialidadeFinal,
      telefone: novoTelefoneMedico || null,
      local: novoLocalMedico || null,
      observacao: novaObsMedico || null,
    };

    const { error } = medicoEditandoId
      ? await supabase.from('profissional_saude').update(dados).eq('id', medicoEditandoId)
      : await supabase.from('profissional_saude').insert({ familia_id: familiaId, ...dados });

    setCarregando(false);
    if (error) {
      setErroMedico(error.message);
      return;
    }
    setMedicoEditandoId(null);
    setMostrarFormMedico(false);
    await carregarMedicos();
  }

  async function excluirMedico() {
    if (!medicoEditandoId) return;
    setCarregando(true);
    const { error } = await supabase.from('profissional_saude').delete().eq('id', medicoEditandoId);
    setCarregando(false);
    if (error) {
      setErroMedico(error.message);
      return;
    }
    setMedicoEditandoId(null);
    setMostrarFormMedico(false);
    await carregarMedicos();
  }

  // --- Fluxo "+ Novo Registro" ---

  function limparNovoRegistro() {
    setNrEventoNome(''); setNrEventoOutroNome(''); setNrEventoData(''); setNrEventoCronica(false);
    setNrEventoRelato(''); setNrEventoGerouConsulta(false); setNrEventoGerouMedicamento(false);
    setNrCirurgiaTipo('cirurgia'); setNrCirurgiaNome(''); setNrCirurgiaData(''); setNrCirurgiaMedico(''); setNrCirurgiaRelato('');
    setNrCirurgiaEventoRelacionado(''); setNrCirurgiaGerouMedicamento(false);
    setNrConsultaEspecialidade(''); setNrConsultaEspecialidadeOutro(''); setNrConsultaMedico('');
    setNrConsultaData(''); setNrConsultaRotina(false); setNrConsultaEventoRelacionado('');
    setNrConsultaNovoEventoNome('');
    setNrConsultaObs(''); setNrConsultaGerouMedicamento(false);
    setNrMedNome(''); setNrMedDosagem(''); setNrMedData(''); setNrMedUsoContinuo(true);
    setNrMedDataFim(''); setNrMedEventoRelacionado(''); setNrMedNovoEventoNome(''); setNrMedMedicoReceitou(''); setNrMedObs('');
    setNrSubConsultaEspecialidade(''); setNrSubConsultaMedico(''); setNrSubConsultaData('');
    setNrSubMedNome(''); setNrSubMedDosagem(''); setNrSubMedUsoContinuo(true);
    setErroNovoRegistro('');
  }

  // Cria um evento de saúde "rápido" (só com nome) a partir do fluxo de Consulta ou
  // Medicamento, pra quando a pessoa ainda não tinha cadastrado esse evento antes e
  // não quer sair da tela de Novo Registro pra fazer isso separadamente.
  async function criarEventoRapido(opts: { membroId: string; nome: string }): Promise<string> {
    const { data: novaCondicao, error } = await supabase
      .from('condicao')
      .insert({
        membro_id: opts.membroId,
        tipo: 'doenca',
        nome: opts.nome,
        status: 'ativa',
        relevante_geneticamente: false,
      })
      .select('id')
      .single();
    if (error) throw error;
    return novaCondicao.id as string;
  }

  async function criarConsultaRapida(opts: {
    membroId: string;
    especialidade: string;
    medico: string;
    data: string;
    condicaoId: string | null;
    familiaId: string | null;
    observacao?: string;
  }): Promise<string> {
    const especialidadeId = opts.especialidade ? await resolverEspecialidade(opts.especialidade) : null;
    const profissionalId = opts.medico && opts.familiaId ? await resolverProfissional(opts.medico, opts.familiaId) : null;
    const { data: nova, error } = await supabase
      .from('consulta')
      .insert({
        membro_id: opts.membroId,
        especialidade_id: especialidadeId,
        profissional_id: profissionalId,
        data_hora: opts.data || new Date().toISOString(),
        status: 'realizada',
        condicao_relacionada_id: opts.condicaoId,
        anotacoes: opts.observacao || null,
        origem_agendamento: 'manual',
      })
      .select('id')
      .single();
    if (error) throw error;
    return nova.id as string;
  }

  async function criarMedicamentoRapido(opts: {
    membroId: string;
    nome: string;
    dosagem?: string;
    dataInicio?: string;
    usoContinuo: boolean;
    dataFim?: string;
    condicaoId: string | null;
    consultaId?: string | null;
    medicoReceitou?: string;
    observacao?: string;
  }): Promise<void> {
    if (!opts.nome || !opts.nome.trim()) return;
    const { error } = await supabase.from('medicacao').insert({
      membro_id: opts.membroId,
      nome: opts.nome.trim(),
      dosagem: opts.dosagem || null,
      data_inicio: opts.dataInicio || new Date().toISOString().slice(0, 10),
      data_fim: opts.usoContinuo ? null : (opts.dataFim || null),
      condicao_relacionada_id: opts.condicaoId || null,
      consulta_relacionada_id: opts.consultaId || null,
      medico_receitou: opts.medicoReceitou || null,
      observacao: opts.observacao || null,
    });
    if (error) throw error;
  }

  async function salvarNovoRegistro() {
    if (!membroSelecionado || !nrTipo) return;
    const membroId = membroSelecionado.id;
    setErroNovoRegistro('');
    setNrSalvo(false);
    setCarregando(true);
    try {
      const familiaId = await obterFamiliaId();

      if (nrTipo === 'evento') {
        const nomeFinal = nrEventoNome === 'Outra doença (especificar)' ? nrEventoOutroNome.trim() : nrEventoNome;
        if (!nomeFinal) throw new Error('Escolha ou digite qual é o evento de saúde.');
        const { data: novaCondicao, error: erroCondicao } = await supabase
          .from('condicao')
          .insert({
            membro_id: membroId,
            tipo: 'doenca',
            nome: nomeFinal,
            data_diagnostico_ou_procedimento: nrEventoData || null,
            status: nrEventoCronica ? 'cronica' : 'ativa',
            relevante_geneticamente: false,
            observacao: nrEventoRelato || null,
          })
          .select('id')
          .single();
        if (erroCondicao) throw erroCondicao;
        const condicaoId = novaCondicao.id as string;

        let consultaId: string | null = null;
        if (nrEventoGerouConsulta) {
          consultaId = await criarConsultaRapida({
            membroId,
            especialidade: nrSubConsultaEspecialidade,
            medico: nrSubConsultaMedico,
            data: nrSubConsultaData,
            condicaoId,
            familiaId,
          });
        }
        if (nrEventoGerouMedicamento) {
          await criarMedicamentoRapido({
            membroId,
            nome: nrSubMedNome,
            dosagem: nrSubMedDosagem,
            usoContinuo: nrSubMedUsoContinuo,
            condicaoId,
            consultaId,
          });
        }
      } else if (nrTipo === 'cirurgia') {
        if (!nrCirurgiaNome.trim()) throw new Error(nrCirurgiaTipo === 'internacao' ? 'Escreva o motivo da internação.' : 'Escreva qual foi a cirurgia.');
        const { data: novaCirurgia, error: erroCirurgia } = await supabase
          .from('condicao')
          .insert({
            membro_id: membroId,
            tipo: nrCirurgiaTipo,
            nome: nrCirurgiaNome.trim(),
            data_diagnostico_ou_procedimento: nrCirurgiaData || null,
            status: 'resolvida',
            relevante_geneticamente: false,
            observacao: nrCirurgiaRelato || null,
            medico: nrCirurgiaMedico || null,
            evento_relacionado_id: nrCirurgiaEventoRelacionado || null,
          })
          .select('id')
          .single();
        if (erroCirurgia) throw erroCirurgia;
        const cirurgiaId = novaCirurgia.id as string;
        if (nrCirurgiaGerouMedicamento) {
          await criarMedicamentoRapido({
            membroId,
            nome: nrSubMedNome,
            dosagem: nrSubMedDosagem,
            usoContinuo: nrSubMedUsoContinuo,
            condicaoId: cirurgiaId,
            consultaId: null,
          });
        }
      } else if (nrTipo === 'consulta') {
        const especialidadeFinal = nrConsultaEspecialidade === 'Outros' ? nrConsultaEspecialidadeOutro.trim() : nrConsultaEspecialidade;
        if (!especialidadeFinal || !nrConsultaData) throw new Error('Preencha ao menos a especialidade e a data.');
        let condicaoEscolhida: string | null = null;
        if (!nrConsultaRotina) {
          if (nrConsultaEventoRelacionado === '__novo__') {
            if (!nrConsultaNovoEventoNome.trim()) throw new Error('Digite o nome do novo evento de saúde.');
            condicaoEscolhida = await criarEventoRapido({ membroId, nome: nrConsultaNovoEventoNome.trim() });
          } else {
            condicaoEscolhida = nrConsultaEventoRelacionado || null;
          }
        }
        const consultaId = await criarConsultaRapida({
          membroId,
          especialidade: especialidadeFinal,
          medico: nrConsultaMedico,
          data: nrConsultaData,
          condicaoId: condicaoEscolhida,
          familiaId,
          observacao: nrConsultaObs,
        });
        if (nrConsultaGerouMedicamento) {
          await criarMedicamentoRapido({
            membroId,
            nome: nrSubMedNome,
            dosagem: nrSubMedDosagem,
            usoContinuo: nrSubMedUsoContinuo,
            condicaoId: condicaoEscolhida,
            consultaId,
          });
        }
      } else if (nrTipo === 'medicamento') {
        if (!nrMedNome.trim() || !nrMedData) throw new Error('Preencha ao menos o nome e a data de início.');
        let condicaoEscolhidaMed: string | null = null;
        if (nrMedEventoRelacionado === '__novo__') {
          if (!nrMedNovoEventoNome.trim()) throw new Error('Digite o nome do novo evento de saúde.');
          condicaoEscolhidaMed = await criarEventoRapido({ membroId, nome: nrMedNovoEventoNome.trim() });
        } else {
          condicaoEscolhidaMed = nrMedEventoRelacionado || null;
        }
        await criarMedicamentoRapido({
          membroId,
          nome: nrMedNome,
          dosagem: nrMedDosagem,
          dataInicio: nrMedData,
          usoContinuo: nrMedUsoContinuo,
          dataFim: nrMedDataFim,
          condicaoId: condicaoEscolhidaMed,
          medicoReceitou: nrMedMedicoReceitou,
          observacao: nrMedObs,
        });
      }

      await Promise.all([
        carregarCondicoes(membroId),
        carregarConsultas(membroId),
        carregarMedicacoes(membroId),
      ]);
      limparNovoRegistro();
      setNrSalvo(true);
    } catch (e: any) {
      setErroNovoRegistro(e.message || 'Erro ao salvar.');
    } finally {
      setCarregando(false);
    }
  }

  // --- Protótipo "contar por voz" (onboarding de novo membro) ---

  function limparOnboardingVoz() {
    setOvTexto('');
    setOvItens([]);
    setOvErro('');
  }

  // Heurística simples que foi usada enquanto não tínhamos IA de verdade ligada —
  // deixada aqui comentada só de referência/fallback caso a chamada de IA falhe.
  // function processarFalaOnboardingHeuristica() {
  //   const texto = ovTexto.trim();
  //   const frases = texto
  //     .split(/,| e (?=\S)|\.|;/i)
  //     .map((f) => f.trim())
  //     .filter((f) => f.length > 2);
  //   return frases.map((f, i) => {
  //     const low = f.toLowerCase();
  //     let tipo: ItemOnboardingVoz['tipo'] = 'evento';
  //     if (low.includes('alerg')) tipo = 'alergia';
  //     else if (low.includes('remédio') || low.includes('remedio') || low.includes('medicamento') || low.includes('mg') || low.includes('gotas') || low.includes('xarope') || low.includes('comprimido')) tipo = 'medicamento';
  //     else if (low.includes('cirurgia') || low.includes('operad') || low.includes('internaç') || low.includes('internac') || low.includes('hospital')) tipo = 'cirurgia';
  //     return { id: `ov-${Date.now()}-${i}`, tipo, texto: f, incluir: true };
  //   });
  // }

  // Chama a rota de API (/api/interpretar-fala), que usa IA de verdade (Claude) pra
  // separar o texto em itens (evento/alergia/cirurgia/medicamento). O resto do fluxo
  // (revisão, edição, confirmação e salvamento) continua exatamente igual.
  async function processarFalaOnboarding() {
    setOvErro('');
    const texto = ovTexto.trim();
    if (!texto) return;
    setOvProcessando(true);
    try {
      const resposta = await fetch('/api/interpretar-fala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Não consegui entender essa descrição, tenta de novo.');
      const itensRecebidos: { tipo: ItemOnboardingVoz['tipo']; texto: string }[] = dados.itens || [];
      if (itensRecebidos.length === 0) {
        setOvErro('Não consegui separar nada dessa descrição — tenta contar em partes mais curtas.');
        return;
      }
      const itens: ItemOnboardingVoz[] = itensRecebidos.map((it, i) => ({
        id: `ov-${Date.now()}-${i}`,
        tipo: it.tipo,
        texto: it.texto,
        incluir: true,
      }));
      setOvItens(itens);
    } catch (e: any) {
      setOvErro(e.message || 'Não consegui processar agora — tenta de novo em instantes.');
    } finally {
      setOvProcessando(false);
    }
  }

  function alternarIncluirItemOnboarding(id: string) {
    setOvItens((itens) => itens.map((it) => (it.id === id ? { ...it, incluir: !it.incluir } : it)));
  }

  function atualizarTipoItemOnboarding(id: string, tipo: ItemOnboardingVoz['tipo']) {
    setOvItens((itens) => itens.map((it) => (it.id === id ? { ...it, tipo } : it)));
  }

  function atualizarTextoItemOnboarding(id: string, texto: string) {
    setOvItens((itens) => itens.map((it) => (it.id === id ? { ...it, texto } : it)));
  }

  async function confirmarOnboardingVoz() {
    if (!membroSelecionado) return;
    const membroId = membroSelecionado.id;
    const itensIncluidos = ovItens.filter((it) => it.incluir && it.texto.trim());
    if (itensIncluidos.length === 0) {
      setOvErro('Marque ao menos um item pra salvar, ou pule por enquanto.');
      return;
    }
    setOvSalvando(true);
    setOvErro('');
    try {
      const alergiasNovas: string[] = [];
      for (const item of itensIncluidos) {
        if (item.tipo === 'evento') {
          const { error } = await supabase.from('condicao').insert({
            membro_id: membroId,
            tipo: 'doenca',
            nome: item.texto.trim(),
            status: 'ativa',
            relevante_geneticamente: false,
          });
          if (error) throw error;
        } else if (item.tipo === 'cirurgia') {
          const { error } = await supabase.from('condicao').insert({
            membro_id: membroId,
            tipo: 'cirurgia',
            nome: item.texto.trim(),
            status: 'resolvida',
            relevante_geneticamente: false,
          });
          if (error) throw error;
        } else if (item.tipo === 'medicamento') {
          await criarMedicamentoRapido({
            membroId,
            nome: item.texto.trim(),
            usoContinuo: false,
            condicaoId: null,
          });
        } else if (item.tipo === 'alergia') {
          alergiasNovas.push(item.texto.trim());
        }
      }
      if (alergiasNovas.length > 0) {
        const alergiasAtuais = membroSelecionado.alergias ? membroSelecionado.alergias + ', ' : '';
        const novoValor = alergiasAtuais + alergiasNovas.join(', ');
        const { error } = await supabase.from('membro').update({ alergias: novoValor }).eq('id', membroId);
        if (error) throw error;
      }
      await Promise.all([carregarCondicoes(membroId), carregarMedicacoes(membroId), carregarMembros()]);
      limparOnboardingVoz();
      // Se veio do wizard passo a passo (link "contar por voz" dentro do passo de
      // Evento de Saúde), volta pro passo atual em vez de fechar o painel inteiro.
      setTelaDetalhe(onboardingAtivo ? passosOnboarding[onboardingPasso].aba : null);
    } catch (e: any) {
      setOvErro(e.message || 'Erro ao salvar.');
    } finally {
      setOvSalvando(false);
    }
  }

  async function verificarFamilia() {
    const { data: userData } = await supabase.auth.getUser();
    const { data: usuarioExistente } = await supabase
      .from('usuario')
      .select('id')
      .eq('id', userData.user?.id)
      .maybeSingle();
    setPasso(usuarioExistente ? 'painel' : 'onboarding');
  }

  async function entrar() {
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) return setErro(error.message);
    await verificarFamilia();
  }

  async function cadastrar() {
    setErro('');
    setCarregando(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    setCarregando(false);
    if (error) return setErro(error.message);
    await verificarFamilia();
  }

  async function sair() {
    await supabase.auth.signOut();
    setPasso('login');
    setCodigoGerado('');
    setEmail('');
    setSenha('');
    setMembros([]);
    setMembroSelecionado(null);
  }

  async function criarFamilia() {
    setErro('');
    setCarregando(true);
    const { error } = await supabase.rpc('criar_familia', {
      p_nome_familia: nomeFamilia,
      p_nome_usuario: nomeUsuario,
    });
    setCarregando(false);
    if (error) return setErro(error.message);
    setPasso('painel');
  }

  async function usarConvite() {
    setErro('');
    setCarregando(true);
    const { error } = await supabase.rpc('resgatar_convite', {
      p_codigo: codigoConvite.trim().toUpperCase(),
      p_nome: nomeUsuario,
    });
    setCarregando(false);
    if (error) return setErro(error.message);
    setPasso('painel');
  }

  async function gerarConvite() {
    setErro('');
    const { data: userData } = await supabase.auth.getUser();
    const { data: meuUsuario } = await supabase
      .from('usuario')
      .select('familia_id')
      .eq('id', userData.user?.id)
      .single();

    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from('convite').insert({
      familia_id: meuUsuario?.familia_id,
      codigo,
      criado_por: userData.user?.id,
    });

    if (error) return setErro(error.message);
    setCodigoGerado(codigo);
  }

  async function adicionarMembro() {
    setErroMembro('');
    if (!novoNome || !novaData || !novoSexo) {
      setErroMembro('Preencha nome, data de nascimento e sexo biológico.');
      return;
    }
    setCarregando(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: meuUsuario } = await supabase
      .from('usuario')
      .select('familia_id')
      .eq('id', userData.user?.id)
      .single();

    const nomeSalvo = novoNome;
    const dataSalva = novaData;

    // Importante: inserimos SEM pedir os dados de volta na mesma operação
    // (sem .select() encadeado). Em alguns bancos, pedir o registro de volta
    // junto do insert obriga o Postgres a checar a política de LEITURA sobre
    // a linha recém-criada no mesmo instante — e se essa política depender de
    // algo que só fica visível um instante depois, o insert inteiro é
    // rejeitado com "violates row-level security policy", mesmo a gravação
    // em si sendo permitida. Buscamos o membro criado numa consulta separada,
    // logo em seguida.
    const { error } = await supabase.from('membro').insert({
      familia_id: meuUsuario?.familia_id,
      criado_por: userData.user?.id,
      nome: novoNome,
      data_nascimento: novaData,
      sexo_biologico: novoSexo,
      tipo_sanguineo: novoTipoSanguineo || null,
      parentesco: novoParentesco || null,
      data_falecimento: novoFalecido ? novaDataFalecimento || null : null,
    });

    setCarregando(false);
    if (error) {
      setErroMembro(error.message);
      return;
    }
    setNovoNome('');
    setNovaData('');
    setNovoSexo('');
    setNovoTipoSanguineo('');
    setNovoParentesco('');
    setNovoFalecido(false);
    setNovaDataFalecimento('');
    setMostrarFormMembro(false);

    const { data: membrosAtualizados } = await supabase
      .from('membro')
      .select('id, nome, data_nascimento, sexo_biologico, tipo_sanguineo, observacoes_gerais, data_falecimento, parentesco, foto_url, alergias')
      .is('data_falecimento', null)
      .order('nome');

    if (membrosAtualizados) {
      setMembros(membrosAtualizados);
      // Leva direto pro protótipo de "contar por voz", já com o membro recém-criado
      // selecionado — resolve a dor de ter que preencher tudo manualmente no primeiro
      // cadastro. A pessoa pode pular a qualquer momento e preencher depois do jeito normal.
      const membroCriado = membrosAtualizados.find((m) => m.nome === nomeSalvo && m.data_nascimento === dataSalva);
      if (membroCriado) {
        setMembroSelecionado(membroCriado as Membro);
        // Leva pro wizard passo a passo (estilo configuração inicial do iPhone) em vez
        // da tela de "contar por voz" — dá pra pular qualquer etapa, e a opção de
        // contar por voz continua disponível dentro do próprio wizard, no passo de
        // Evento de Saúde.
        setOnboardingAtivo(true);
        setOnboardingPasso(0);
        setTelaDetalhe(passosOnboarding[0].aba);
      }
    }
  }

  function abrirNovaCondicao(tipoPadrao: string = 'doenca') {
    setCondicaoEditandoId(null);
    setNovoTipoCondicao(tipoPadrao);
    setNovoNomeCondicao('');
    setDoencaOutraNome('');
    setNovaDataCondicao('');
    setNovoStatusCondicao('ativa');
    setNovoRelevanteGenetico(false);
    setNovaObservacaoCondicao('');
    setNovaOrientacaoCondicao('');
    setErroCondicao('');
    setMostrarFormCondicao(true);
  }

  function abrirEdicaoCondicao(c: Condicao) {
    setCondicaoEditandoId(c.id);
    setNovoTipoCondicao(c.tipo);
    if (c.tipo === 'doenca' && !doencasComuns.some((d) => d.nome === c.nome)) {
      setNovoNomeCondicao('Outra doença (especificar)');
      setDoencaOutraNome(c.nome);
    } else {
      setNovoNomeCondicao(c.nome);
      setDoencaOutraNome('');
    }
    setNovaDataCondicao(c.data_diagnostico_ou_procedimento || '');
    setNovoStatusCondicao(c.status);
    setNovoRelevanteGenetico(c.relevante_geneticamente);
    setNovaObservacaoCondicao(c.observacao || '');
    setNovaOrientacaoCondicao(c.orientacoes || '');
    setErroCondicao('');
    setMostrarFormCondicao(true);
  }

  // Abre a tela de "resumo" de um evento de saúde: mostra tudo que está ligado a
  // ele (consultas, medicações — e no futuro exames/vacinas/crescimento, quando o
  // banco tiver o campo de vínculo) com um "+ novo" que já cria o registro ligado.
  function abrirResumoEvento(c: Condicao) {
    setCondicaoResumoId(c.id);
    setTelaDetalhe('eventoresumo');
  }

  // Chamadas pelos botões "+ nova consulta" / "+ nova medicação" de dentro do
  // resumo do evento: abrem o formulário de sempre, já com o evento pré-selecionado,
  // e marcam pra onde voltar depois de salvar (de volta pro resumo desse evento).
  function abrirNovaMedicacaoParaEvento(condicaoId: string) {
    abrirNovaMedicacao();
    setNovaCondicaoRelacionada(condicaoId);
    setVoltarResumoEventoId(condicaoId);
    setTelaDetalhe('medicacoes');
  }

  function abrirNovaConsultaParaEvento(condicaoId: string) {
    abrirNovaConsulta();
    setNovaCondicaoRelacionadaConsulta(condicaoId);
    setVoltarResumoEventoId(condicaoId);
    setTelaDetalhe('consultas');
  }

  async function salvarCondicao() {
    setErroCondicao('');
    const nomeFinal =
      novoTipoCondicao === 'doenca' && novoNomeCondicao === 'Outra doença (especificar)'
        ? doencaOutraNome.trim()
        : novoNomeCondicao;
    if (!nomeFinal) {
      setErroCondicao('Preencha o nome da condição.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const dados = {
      tipo: novoTipoCondicao,
      nome: nomeFinal,
      data_diagnostico_ou_procedimento: novaDataCondicao || null,
      status: novoStatusCondicao,
      relevante_geneticamente: novoRelevanteGenetico,
      observacao: novaObservacaoCondicao || null,
      orientacoes: novaOrientacaoCondicao || null,
    };

    const { error } = condicaoEditandoId
      ? await supabase.from('condicao').update(dados).eq('id', condicaoEditandoId)
      : await supabase.from('condicao').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroCondicao(error.message);
      return;
    }
    setCondicaoEditandoId(null);
    setNovoTipoCondicao('doenca');
    setNovoNomeCondicao('');
    setDoencaOutraNome('');
    setNovaDataCondicao('');
    setNovoStatusCondicao('ativa');
    setNovoRelevanteGenetico(false);
    setNovaObservacaoCondicao('');
    setNovaOrientacaoCondicao('');
    setMostrarFormCondicao(false);
    await carregarCondicoes(membroSelecionado.id);
  }

  async function excluirCondicao() {
    if (!condicaoEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('condicao').delete().eq('id', condicaoEditandoId);
    setCarregando(false);
    if (error) {
      setErroCondicao(error.message);
      return;
    }
    setCondicaoEditandoId(null);
    setMostrarFormCondicao(false);
    await carregarCondicoes(membroSelecionado.id);
  }

  function abrirNovaMedicacao() {
    setMedicacaoEditandoId(null);
    setNovoNomeMedicacao('');
    setNovaDosagem('');
    setNovaFrequencia('');
    setNovoHorario('');
    setNovaDataInicioMed('');
    setUsoContinuo(true);
    setNovaDataFimMed('');
    setNovaCondicaoRelacionada('');
    setNovaConsultaRelacionadaMed('');
    setNovaClasseMedicacao('');
    setNovaObservacaoMedicacao('');
    setErroMedicacao('');
    setMostrarFormMedicacao(true);
  }

  function abrirEdicaoMedicacao(m: Medicacao) {
    setMedicacaoEditandoId(m.id);
    setNovoNomeMedicacao(m.nome);
    setNovaDosagem(m.dosagem || '');
    setNovaFrequencia(m.frequencia || '');
    setNovoHorario(m.horario || '');
    setNovaDataInicioMed(m.data_inicio);
    setUsoContinuo(!m.data_fim);
    setNovaDataFimMed(m.data_fim || '');
    setNovaCondicaoRelacionada(m.condicao_relacionada_id || '');
    setNovaConsultaRelacionadaMed(m.consulta_relacionada_id || '');
    setNovaClasseMedicacao(m.classe || '');
    setNovaObservacaoMedicacao(m.observacao || '');
    setErroMedicacao('');
    setMostrarFormMedicacao(true);
  }

  async function salvarMedicacao() {
    setErroMedicacao('');
    if (!novoNomeMedicacao || !novaDataInicioMed) {
      setErroMedicacao('Preencha ao menos o nome e a data de início.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const dados = {
      nome: novoNomeMedicacao,
      dosagem: novaDosagem || null,
      frequencia: novaFrequencia || null,
      horario: novoHorario || null,
      data_inicio: novaDataInicioMed,
      // Se desmarcou "uso contínuo" mas não preencheu uma data de término, usa hoje como
      // padrão — sem isso, data_fim ficava null (= "uso contínuo" pro resto do app) mesmo
      // com a caixinha desmarcada.
      data_fim: usoContinuo ? null : (novaDataFimMed || new Date().toISOString().slice(0, 10)),
      condicao_relacionada_id: novaCondicaoRelacionada || null,
      consulta_relacionada_id: novaConsultaRelacionadaMed || null,
      classe: novaClasseMedicacao || null,
      observacao: novaObservacaoMedicacao || null,
    };

    const { error } = medicacaoEditandoId
      ? await supabase.from('medicacao').update(dados).eq('id', medicacaoEditandoId)
      : await supabase.from('medicacao').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroMedicacao(error.message);
      return;
    }
    setMedicacaoEditandoId(null);
    setNovoNomeMedicacao('');
    setNovaDosagem('');
    setNovaFrequencia('');
    setNovoHorario('');
    setNovaDataInicioMed('');
    setUsoContinuo(true);
    setNovaDataFimMed('');
    setNovaCondicaoRelacionada('');
    setNovaConsultaRelacionadaMed('');
    setNovaClasseMedicacao('');
    setNovaObservacaoMedicacao('');
    setMostrarFormMedicacao(false);
    await carregarMedicacoes(membroSelecionado.id);
    if (voltarResumoEventoId) {
      setCondicaoResumoId(voltarResumoEventoId);
      setVoltarResumoEventoId(null);
      setTelaDetalhe('eventoresumo');
    }
  }

  async function excluirMedicacao() {
    if (!medicacaoEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('medicacao').delete().eq('id', medicacaoEditandoId);
    setCarregando(false);
    if (error) {
      setErroMedicacao(error.message);
      return;
    }
    setMedicacaoEditandoId(null);
    setMostrarFormMedicacao(false);
    await carregarMedicacoes(membroSelecionado.id);
  }

  function abrirNovaConsulta(especialidadePadrao: string = '') {
    setConsultaEditandoId(null);
    setNovaEspecialidadeConsulta(especialidadePadrao);
    setEspecialidadeOutroConsulta('');
    setNovoProfissionalConsulta('');
    setNovaDataHoraConsulta('');
    setNovoLocalConsulta('');
    setNovoMotivoConsulta('');
    setNovoStatusConsulta('agendada');
    setNovaAnotacaoConsulta('');
    setNovaDataRetornoConsulta('');
    setNovaFormaAtendimento('');
    setNovoValorPagoConsulta('');
    setNovoSolicitouReembolso(false);
    setNovoValorReembolsado('');
    setNovoIncluirIr(false);
    setNovaObsFinanceira('');
    setNovaCondicaoRelacionadaConsulta('');
    setErroConsulta('');
    setMostrarFormConsulta(true);
  }

  function abrirEdicaoConsulta(c: Consulta) {
    setConsultaEditandoId(c.id);
    const nomeEsp = c.especialidade?.nome || '';
    if (nomeEsp && !especialidadesMedicas.includes(nomeEsp)) {
      setNovaEspecialidadeConsulta('Outros');
      setEspecialidadeOutroConsulta(nomeEsp);
    } else {
      setNovaEspecialidadeConsulta(nomeEsp);
      setEspecialidadeOutroConsulta('');
    }
    setNovoProfissionalConsulta(c.profissional_saude?.nome || '');
    setNovaDataHoraConsulta(c.data_hora ? c.data_hora.slice(0, 16) : '');
    setNovoLocalConsulta(c.local || '');
    setNovoMotivoConsulta(c.motivo || '');
    setNovoStatusConsulta(c.status);
    setNovaAnotacaoConsulta(c.anotacoes || '');
    setNovaDataRetornoConsulta(c.data_retorno_sugerida || '');
    setNovaFormaAtendimento(c.forma_atendimento || '');
    setNovoValorPagoConsulta(c.valor_pago != null ? String(c.valor_pago) : '');
    setNovoSolicitouReembolso(c.solicitou_reembolso || false);
    setNovoValorReembolsado(c.valor_reembolsado != null ? String(c.valor_reembolsado) : '');
    setNovoIncluirIr(c.incluir_ir || false);
    setNovaObsFinanceira(c.obs_financeira || '');
    setNovaCondicaoRelacionadaConsulta(c.condicao_relacionada_id || '');
    setErroConsulta('');
    setMostrarFormConsulta(true);
  }

  async function salvarConsulta() {
    setErroConsulta('');
    const nomeEspecialidadeFinal =
      novaEspecialidadeConsulta === 'Outros' ? especialidadeOutroConsulta.trim() : novaEspecialidadeConsulta;
    if (!nomeEspecialidadeFinal || !novaDataHoraConsulta) {
      setErroConsulta('Preencha ao menos a especialidade e a data/hora.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: meuUsuario } = await supabase
        .from('usuario')
        .select('familia_id')
        .eq('id', userData.user?.id)
        .single();
      const familiaId = meuUsuario?.familia_id;

      const especialidadeId = await resolverEspecialidade(nomeEspecialidadeFinal);
      const profissionalId = novoProfissionalConsulta
        ? await resolverProfissional(novoProfissionalConsulta, familiaId)
        : null;

      const dados = {
        especialidade_id: especialidadeId,
        profissional_id: profissionalId,
        data_hora: novaDataHoraConsulta,
        local: novoLocalConsulta || null,
        motivo: novoMotivoConsulta || null,
        status: novoStatusConsulta,
        anotacoes: novaAnotacaoConsulta || null,
        data_retorno_sugerida: novaDataRetornoConsulta || null,
        forma_atendimento: novaFormaAtendimento || null,
        valor_pago: novaFormaAtendimento === 'particular' && novoValorPagoConsulta
          ? Number(novoValorPagoConsulta.replace(',', '.'))
          : null,
        solicitou_reembolso: novoSolicitouReembolso,
        valor_reembolsado: novoSolicitouReembolso && novoValorReembolsado
          ? Number(novoValorReembolsado.replace(',', '.'))
          : null,
        incluir_ir: novoIncluirIr,
        obs_financeira: novaObsFinanceira || null,
        condicao_relacionada_id: novaCondicaoRelacionadaConsulta || null,
      };

      const { error } = consultaEditandoId
        ? await supabase.from('consulta').update(dados).eq('id', consultaEditandoId)
        : await supabase.from('consulta').insert({ membro_id: membroSelecionado.id, origem_agendamento: 'manual', ...dados });

      if (error) throw error;

      setConsultaEditandoId(null);
      setNovaEspecialidadeConsulta('');
      setEspecialidadeOutroConsulta('');
      setNovoProfissionalConsulta('');
      setNovaDataHoraConsulta('');
      setNovoLocalConsulta('');
      setNovoMotivoConsulta('');
      setNovoStatusConsulta('agendada');
      setNovaAnotacaoConsulta('');
      setNovaDataRetornoConsulta('');
      setNovaFormaAtendimento('');
      setNovoValorPagoConsulta('');
      setNovoSolicitouReembolso(false);
      setNovoValorReembolsado('');
      setNovoIncluirIr(false);
      setNovaObsFinanceira('');
      setNovaCondicaoRelacionadaConsulta('');
      setMostrarFormConsulta(false);
      await carregarConsultas(membroSelecionado.id);
      if (voltarResumoEventoId) {
        setCondicaoResumoId(voltarResumoEventoId);
        setVoltarResumoEventoId(null);
        setTelaDetalhe('eventoresumo');
      }
    } catch (e: any) {
      setErroConsulta(e.message || 'Erro ao salvar consulta.');
    }
    setCarregando(false);
  }

  async function excluirMembro() {
    if (!membroSelecionado) return;
    setCarregando(true);
    setErro('');
    const membroId = membroSelecionado.id;
    // Apaga registros relacionados primeiro, caso o banco não tenha ON DELETE CASCADE configurado.
    await supabase.from('condicao').delete().eq('membro_id', membroId);
    await supabase.from('medicacao').delete().eq('membro_id', membroId);
    await supabase.from('consulta').delete().eq('membro_id', membroId);
    await supabase.from('exame').delete().eq('membro_id', membroId);
    await supabase.from('vacina').delete().eq('membro_id', membroId);
    await supabase.from('informacao_nascimento').delete().eq('membro_id', membroId);
    await supabase.from('medicao_crescimento').delete().eq('membro_id', membroId);
    const { error, count } = await supabase
      .from('membro')
      .delete({ count: 'exact' })
      .eq('id', membroId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    if (!count) {
      setErro('Não foi possível excluir este membro (sem permissão ou já excluído). Tente sair e entrar na conta novamente.');
      return;
    }
    setConfirmandoExclusaoMembro(false);
    setMembroSelecionado(null);
    await carregarMembros();
  }

  async function excluirConsulta() {
    if (!consultaEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('consulta').delete().eq('id', consultaEditandoId);
    setCarregando(false);
    if (error) {
      setErroConsulta(error.message);
      return;
    }
    setConsultaEditandoId(null);
    setMostrarFormConsulta(false);
    await carregarConsultas(membroSelecionado.id);
  }

  // Reconhecimento de voz nativo do navegador (Web Speech API). Funciona bem no Chrome/Android;
  // suporte no Safari/iPhone é mais limitado. Precisa de internet — o áudio é processado
  // pelo próprio navegador, o app não grava nem guarda o áudio, só o texto reconhecido.
  function alternarReconhecimentoVoz(campo: string, setValor: React.Dispatch<React.SetStateAction<string>>) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não é suportado neste navegador. Tente pelo Chrome (funciona melhor no Android).');
      return;
    }
    if (gravandoCampo === campo) {
      setGravandoCampo(null);
      return;
    }
    const reconhecimento = new SpeechRecognition();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.onresult = (event: any) => {
      const texto = event.results[0][0].transcript;
      setValor((anterior) => (anterior ? `${anterior} ${texto}` : texto));
    };
    reconhecimento.onend = () => setGravandoCampo(null);
    reconhecimento.onerror = () => setGravandoCampo(null);
    reconhecimento.start();
    setGravandoCampo(campo);
  }

  function abrirNovoExame() {
    setExameEditandoId(null);
    setNovoNomeExame('');
    setNovaDataExame('');
    setNovoLaboratorioExame('');
    setNovoResultadoExame('');
    setNovaCondicaoRelacionadaExame('');
    setErroExame('');
    setMostrarFormExame(true);
  }

  function abrirEdicaoExame(e: Exame) {
    setExameEditandoId(e.id);
    setNovoNomeExame(e.nome);
    setNovaDataExame(e.data_realizacao);
    setNovoLaboratorioExame(e.laboratorio || '');
    setNovoResultadoExame(e.resultado_resumo || '');
    setNovaCondicaoRelacionadaExame(e.condicao_relacionada_id || '');
    setErroExame('');
    setMostrarFormExame(true);
  }

  function abrirNovoExameParaEvento(condicaoId: string) {
    abrirNovoExame();
    setNovaCondicaoRelacionadaExame(condicaoId);
    setVoltarResumoEventoId(condicaoId);
    setTelaDetalhe('exames');
  }

  async function salvarExame() {
    setErroExame('');
    if (!novoNomeExame || !novaDataExame) {
      setErroExame('Preencha ao menos o nome e a data do exame.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const dados = {
      nome: novoNomeExame,
      data_realizacao: novaDataExame,
      laboratorio: novoLaboratorioExame || null,
      resultado_resumo: novoResultadoExame || null,
      condicao_relacionada_id: novaCondicaoRelacionadaExame || null,
    };

    const { error } = exameEditandoId
      ? await supabase.from('exame').update(dados).eq('id', exameEditandoId)
      : await supabase.from('exame').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroExame(error.message);
      return;
    }
    setExameEditandoId(null);
    setNovoNomeExame('');
    setNovaDataExame('');
    setNovoLaboratorioExame('');
    setNovoResultadoExame('');
    setNovaCondicaoRelacionadaExame('');
    setMostrarFormExame(false);
    await carregarExames(membroSelecionado.id);
    if (voltarResumoEventoId) {
      setCondicaoResumoId(voltarResumoEventoId);
      setVoltarResumoEventoId(null);
      setTelaDetalhe('eventoresumo');
    }
  }

  async function excluirExame() {
    if (!exameEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('exame').delete().eq('id', exameEditandoId);
    setCarregando(false);
    if (error) {
      setErroExame(error.message);
      return;
    }
    setExameEditandoId(null);
    setMostrarFormExame(false);
    await carregarExames(membroSelecionado.id);
  }

  function abrirNovaVacina() {
    setVacinaEditandoId(null);
    setNovoNomeVacina('');
    setVacinaOutroNome('');
    setNovaDoseVacina('');
    setNovaDataVacina('');
    setNovaProximaDoseVacina('');
    setNovaObsVacina('');
    setNovaCondicaoRelacionadaVacina('');
    setErroVacina('');
    setMostrarFormVacina(true);
  }

  function abrirEdicaoVacina(v: Vacina) {
    setVacinaEditandoId(v.id);
    if (vacinasComuns.includes(v.nome)) {
      setNovoNomeVacina(v.nome);
      setVacinaOutroNome('');
    } else {
      setNovoNomeVacina('Outra (especificar)');
      setVacinaOutroNome(v.nome);
    }
    setNovaDoseVacina(v.dose || '');
    setNovaDataVacina(v.data_aplicacao);
    setNovaProximaDoseVacina(v.proxima_dose_data || '');
    setNovaObsVacina(v.observacoes || '');
    setNovaCondicaoRelacionadaVacina(v.condicao_relacionada_id || '');
    setErroVacina('');
    setMostrarFormVacina(true);
  }

  function abrirNovaVacinaParaEvento(condicaoId: string) {
    abrirNovaVacina();
    setNovaCondicaoRelacionadaVacina(condicaoId);
    setVoltarResumoEventoId(condicaoId);
    setTelaDetalhe('vacinas');
  }

  async function salvarVacina() {
    setErroVacina('');
    const nomeFinal = novoNomeVacina === 'Outra (especificar)' ? vacinaOutroNome.trim() : novoNomeVacina;
    if (!nomeFinal || !novaDataVacina) {
      setErroVacina('Preencha ao menos o nome e a data de aplicação.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const dados = {
      nome: nomeFinal,
      dose: novaDoseVacina || null,
      data_aplicacao: novaDataVacina,
      proxima_dose_data: novaProximaDoseVacina || null,
      observacoes: novaObsVacina || null,
      condicao_relacionada_id: novaCondicaoRelacionadaVacina || null,
    };

    const { error } = vacinaEditandoId
      ? await supabase.from('vacina').update(dados).eq('id', vacinaEditandoId)
      : await supabase.from('vacina').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroVacina(error.message);
      return;
    }
    setVacinaEditandoId(null);
    setNovoNomeVacina('');
    setVacinaOutroNome('');
    setNovaDoseVacina('');
    setNovaDataVacina('');
    setNovaProximaDoseVacina('');
    setNovaObsVacina('');
    setNovaCondicaoRelacionadaVacina('');
    setMostrarFormVacina(false);
    await carregarVacinas(membroSelecionado.id);
    if (voltarResumoEventoId) {
      setCondicaoResumoId(voltarResumoEventoId);
      setVoltarResumoEventoId(null);
      setTelaDetalhe('eventoresumo');
    }
  }

  async function excluirVacina() {
    if (!vacinaEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('vacina').delete().eq('id', vacinaEditandoId);
    setCarregando(false);
    if (error) {
      setErroVacina(error.message);
      return;
    }
    setVacinaEditandoId(null);
    setMostrarFormVacina(false);
    await carregarVacinas(membroSelecionado.id);
  }

  function abrirEdicaoNascimento() {
    setNovoPesoNascimento(nascimento?.peso_nascimento != null ? String(nascimento.peso_nascimento) : '');
    setNovoComprimentoNascimento(nascimento?.comprimento_nascimento != null ? String(nascimento.comprimento_nascimento) : '');
    setNovoPerimetroCefalico(nascimento?.perimetro_cefalico != null ? String(nascimento.perimetro_cefalico) : '');
    setNovaIdadeGestacional(nascimento?.idade_gestacional_semanas != null ? String(nascimento.idade_gestacional_semanas) : '');
    setNovoTipoParto(nascimento?.tipo_parto || '');
    setNovoApgar1(nascimento?.apgar_1min != null ? String(nascimento.apgar_1min) : '');
    setNovoApgar5(nascimento?.apgar_5min != null ? String(nascimento.apgar_5min) : '');
    setNovoUtiNeonatal(nascimento?.uti_neonatal || false);
    setNovasIntercorrencias(nascimento?.intercorrencias || '');
    setNovoLocalNascimento(nascimento?.local_nascimento || '');
    setNovoPreNatalAdequado(nascimento?.pre_natal_adequado || '');
    setNovoPreNatalNumConsultas(nascimento?.pre_natal_num_consultas != null ? String(nascimento.pre_natal_num_consultas) : '');
    setNovasIntercorrenciasGestacionais(nascimento?.intercorrencias_gestacionais || '');
    setNovoUsoSubstancias(nascimento?.uso_substancias_medicacoes || '');
    setErroNascimento('');
    setMostrarFormNascimento(true);
  }

  async function salvarNascimento() {
    setErroNascimento('');
    if (!membroSelecionado) return;

    const peso = paraNumeroTolerante(novoPesoNascimento);
    const comprimento = paraNumeroTolerante(novoComprimentoNascimento);
    const perimetro = paraNumeroTolerante(novoPerimetroCefalico);
    const idadeGestacional = paraNumeroTolerante(novaIdadeGestacional);
    const apgar1 = paraNumeroTolerante(novoApgar1);
    const apgar5 = paraNumeroTolerante(novoApgar5);
    const preNatalNumConsultas = paraNumeroTolerante(novoPreNatalNumConsultas);

    const camposInvalidos: string[] = [];
    if (Number.isNaN(peso)) camposInvalidos.push('peso ao nascer');
    if (Number.isNaN(comprimento)) camposInvalidos.push('comprimento ao nascer');
    if (Number.isNaN(perimetro)) camposInvalidos.push('perímetro cefálico');
    if (Number.isNaN(idadeGestacional)) camposInvalidos.push('idade gestacional');
    if (Number.isNaN(apgar1)) camposInvalidos.push('Apgar 1º minuto');
    if (Number.isNaN(apgar5)) camposInvalidos.push('Apgar 5º minuto');
    if (Number.isNaN(preNatalNumConsultas)) camposInvalidos.push('número de consultas do pré-natal');

    if (camposInvalidos.length > 0) {
      setErroNascimento(`Não consegui entender o número em: ${camposInvalidos.join(', ')}. Deixe só os números (pode usar vírgula para decimais).`);
      return;
    }

    setCarregando(true);

    const dados = {
      membro_id: membroSelecionado.id,
      peso_nascimento: peso,
      comprimento_nascimento: comprimento,
      perimetro_cefalico: perimetro,
      idade_gestacional_semanas: idadeGestacional,
      tipo_parto: novoTipoParto || null,
      apgar_1min: apgar1,
      apgar_5min: apgar5,
      uti_neonatal: novoUtiNeonatal,
      intercorrencias: novasIntercorrencias || null,
      local_nascimento: novoLocalNascimento || null,
      pre_natal_adequado: novoPreNatalAdequado || null,
      pre_natal_num_consultas: preNatalNumConsultas,
      intercorrencias_gestacionais: novasIntercorrenciasGestacionais || null,
      uso_substancias_medicacoes: novoUsoSubstancias || null,
    };

    const { error } = await supabase
      .from('informacao_nascimento')
      .upsert(dados, { onConflict: 'membro_id' });

    setCarregando(false);
    if (error) {
      setErroNascimento(error.message);
      return;
    }
    setMostrarFormNascimento(false);
    await carregarNascimento(membroSelecionado.id);
  }

  // Os 3 campos "Sim/Não/não informado" das 5 seções de anamnese usam esse par de
  // conversores, pra representar um boolean|null como valor de <select>.
  function boolParaSelect(v: boolean | null): '' | 'sim' | 'nao' {
    return v === true ? 'sim' : v === false ? 'nao' : '';
  }
  function selectParaBool(v: '' | 'sim' | 'nao'): boolean | null {
    return v === 'sim' ? true : v === 'nao' ? false : null;
  }

  function abrirEdicaoDesenvolvimento() {
    setFormDesenvolvimento({
      sustentou_cabeca: desenvolvimento?.sustentou_cabeca || '',
      sentou: desenvolvimento?.sentou || '',
      engatinhou: desenvolvimento?.engatinhou || '',
      andou: desenvolvimento?.andou || '',
      primeiras_palavras: desenvolvimento?.primeiras_palavras || '',
      desenvolvimento_adequado: boolParaSelect(desenvolvimento?.desenvolvimento_adequado ?? null),
      observacao: desenvolvimento?.observacao || '',
    });
    setErroDesenvolvimento('');
    setMostrarFormDesenvolvimento(true);
  }

  async function salvarDesenvolvimento() {
    if (!membroSelecionado) return;
    setErroDesenvolvimento('');
    setCarregando(true);
    const f = formDesenvolvimento;
    const { error } = await supabase.from('desenvolvimento_neuropsicomotor').upsert({
      membro_id: membroSelecionado.id,
      sustentou_cabeca: f.sustentou_cabeca || null,
      sentou: f.sentou || null,
      engatinhou: f.engatinhou || null,
      andou: f.andou || null,
      primeiras_palavras: f.primeiras_palavras || null,
      desenvolvimento_adequado: selectParaBool(f.desenvolvimento_adequado),
      observacao: f.observacao || null,
    }, { onConflict: 'membro_id' });
    setCarregando(false);
    if (error) { setErroDesenvolvimento(error.message); return; }
    setMostrarFormDesenvolvimento(false);
    await carregarDesenvolvimento(membroSelecionado.id);
  }

  function abrirEdicaoAlimentacaoInfantil() {
    setFormAlimentacaoInfantil({
      aleitamento_materno: boolParaSelect(alimentacaoInfantil?.aleitamento_materno ?? null),
      aleitamento_exclusivo_meses: alimentacaoInfantil?.aleitamento_exclusivo_meses != null ? String(alimentacaoInfantil.aleitamento_exclusivo_meses) : '',
      formula: alimentacaoInfantil?.formula || '',
      introducao_alimentar: alimentacaoInfantil?.introducao_alimentar || '',
      aceitacao_alimentar: alimentacaoInfantil?.aceitacao_alimentar || '',
    });
    setErroAlimentacaoInfantil('');
    setMostrarFormAlimentacaoInfantil(true);
  }

  async function salvarAlimentacaoInfantil() {
    if (!membroSelecionado) return;
    setErroAlimentacaoInfantil('');
    const f = formAlimentacaoInfantil;
    const exclusivoMeses = paraNumeroTolerante(f.aleitamento_exclusivo_meses);
    if (Number.isNaN(exclusivoMeses)) {
      setErroAlimentacaoInfantil('Não consegui entender o número em "aleitamento exclusivo até". Deixe só números.');
      return;
    }
    setCarregando(true);
    const { error } = await supabase.from('alimentacao_infantil').upsert({
      membro_id: membroSelecionado.id,
      aleitamento_materno: selectParaBool(f.aleitamento_materno),
      aleitamento_exclusivo_meses: exclusivoMeses,
      formula: f.formula || null,
      introducao_alimentar: f.introducao_alimentar || null,
      aceitacao_alimentar: f.aceitacao_alimentar || null,
    }, { onConflict: 'membro_id' });
    setCarregando(false);
    if (error) { setErroAlimentacaoInfantil(error.message); return; }
    setMostrarFormAlimentacaoInfantil(false);
    await carregarAlimentacaoInfantil(membroSelecionado.id);
  }

  function abrirEdicaoPuberdade() {
    setFormPuberdade({
      menarca_espermarca: puberdadeSexualidade?.menarca_espermarca || '',
      ciclo_menstrual: puberdadeSexualidade?.ciclo_menstrual || '',
      vida_sexual_ativa: boolParaSelect(puberdadeSexualidade?.vida_sexual_ativa ?? null),
      metodos_contraceptivos: puberdadeSexualidade?.metodos_contraceptivos || '',
      historico_ist: puberdadeSexualidade?.historico_ist || '',
    });
    setErroPuberdade('');
    setMostrarFormPuberdade(true);
  }

  async function salvarPuberdade() {
    if (!membroSelecionado) return;
    setErroPuberdade('');
    setCarregando(true);
    const f = formPuberdade;
    const { error } = await supabase.from('puberdade_sexualidade').upsert({
      membro_id: membroSelecionado.id,
      menarca_espermarca: f.menarca_espermarca || null,
      ciclo_menstrual: f.ciclo_menstrual || null,
      vida_sexual_ativa: selectParaBool(f.vida_sexual_ativa),
      metodos_contraceptivos: f.metodos_contraceptivos || null,
      historico_ist: f.historico_ist || null,
    }, { onConflict: 'membro_id' });
    setCarregando(false);
    if (error) { setErroPuberdade(error.message); return; }
    setMostrarFormPuberdade(false);
    await carregarPuberdadeSexualidade(membroSelecionado.id);
  }

  function abrirEdicaoSaudeMental() {
    setFormSaudeMental({
      humor: saudeMental?.humor || '',
      ansiedade: boolParaSelect(saudeMental?.ansiedade ?? null),
      tristeza_persistente: boolParaSelect(saudeMental?.tristeza_persistente ?? null),
      ideacao_suicida: boolParaSelect(saudeMental?.ideacao_suicida ?? null),
      automutilacao: boolParaSelect(saudeMental?.automutilacao ?? null),
      observacao: saudeMental?.observacao || '',
    });
    setErroSaudeMental('');
    setMostrarFormSaudeMental(true);
  }

  async function salvarSaudeMental() {
    if (!membroSelecionado) return;
    setErroSaudeMental('');
    setCarregando(true);
    const f = formSaudeMental;
    const { error } = await supabase.from('saude_mental').upsert({
      membro_id: membroSelecionado.id,
      humor: f.humor || null,
      ansiedade: selectParaBool(f.ansiedade),
      tristeza_persistente: selectParaBool(f.tristeza_persistente),
      ideacao_suicida: selectParaBool(f.ideacao_suicida),
      automutilacao: selectParaBool(f.automutilacao),
      observacao: f.observacao || null,
    }, { onConflict: 'membro_id' });
    setCarregando(false);
    if (error) { setErroSaudeMental(error.message); return; }
    setMostrarFormSaudeMental(false);
    await carregarSaudeMental(membroSelecionado.id);
  }

  function abrirEdicaoHabitosVida() {
    setFormHabitosVida({
      alimentacao: habitosVida?.alimentacao || '',
      atividade_fisica: habitosVida?.atividade_fisica || '',
      sono: habitosVida?.sono || '',
      uso_telas: habitosVida?.uso_telas || '',
    });
    setErroHabitosVida('');
    setMostrarFormHabitosVida(true);
  }

  async function salvarHabitosVida() {
    if (!membroSelecionado) return;
    setErroHabitosVida('');
    setCarregando(true);
    const f = formHabitosVida;
    const { error } = await supabase.from('habitos_vida').upsert({
      membro_id: membroSelecionado.id,
      alimentacao: f.alimentacao || null,
      atividade_fisica: f.atividade_fisica || null,
      sono: f.sono || null,
      uso_telas: f.uso_telas || null,
    }, { onConflict: 'membro_id' });
    setCarregando(false);
    if (error) { setErroHabitosVida(error.message); return; }
    setMostrarFormHabitosVida(false);
    await carregarHabitosVida(membroSelecionado.id);
  }

  function abrirNovaMedicaoCrescimento() {
    setCrescimentoEditandoId(null);
    setNovaDataCrescimento('');
    setNovoPesoCrescimento('');
    setNovaAlturaCrescimento('');
    setNovaCondicaoRelacionadaCrescimento('');
    setErroCrescimento('');
    setMostrarFormCrescimento(true);
  }

  function abrirEdicaoCrescimento(m: MedicaoCrescimento) {
    setCrescimentoEditandoId(m.id);
    setNovaDataCrescimento(m.data_medicao);
    setNovoPesoCrescimento(m.peso_kg != null ? String(m.peso_kg) : '');
    setNovaAlturaCrescimento(m.altura_cm != null ? String(m.altura_cm) : '');
    setNovaCondicaoRelacionadaCrescimento(m.condicao_relacionada_id || '');
    setErroCrescimento('');
    setMostrarFormCrescimento(true);
  }

  function abrirNovaMedicaoCrescimentoParaEvento(condicaoId: string) {
    abrirNovaMedicaoCrescimento();
    setNovaCondicaoRelacionadaCrescimento(condicaoId);
    setVoltarResumoEventoId(condicaoId);
    setTelaDetalhe('crescimento');
  }

  async function salvarMedicaoCrescimento() {
    setErroCrescimento('');
    if (!membroSelecionado) return;
    if (!novaDataCrescimento) {
      setErroCrescimento('Preencha a data da medição.');
      return;
    }
    const peso = paraNumeroTolerante(novoPesoCrescimento);
    const altura = paraNumeroTolerante(novaAlturaCrescimento);
    if (Number.isNaN(peso) || Number.isNaN(altura)) {
      setErroCrescimento('Não consegui entender o peso ou a altura. Deixe só os números.');
      return;
    }
    if (peso == null && altura == null) {
      setErroCrescimento('Preencha ao menos o peso ou a altura.');
      return;
    }
    setCarregando(true);

    const dados = {
      data_medicao: novaDataCrescimento,
      peso_kg: peso,
      altura_cm: altura,
      condicao_relacionada_id: novaCondicaoRelacionadaCrescimento || null,
    };

    const { error } = crescimentoEditandoId
      ? await supabase.from('medicao_crescimento').update(dados).eq('id', crescimentoEditandoId)
      : await supabase.from('medicao_crescimento').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroCrescimento(error.message);
      return;
    }
    setCrescimentoEditandoId(null);
    setNovaCondicaoRelacionadaCrescimento('');
    setMostrarFormCrescimento(false);
    await carregarCrescimento(membroSelecionado.id);
    if (voltarResumoEventoId) {
      setCondicaoResumoId(voltarResumoEventoId);
      setVoltarResumoEventoId(null);
      setTelaDetalhe('eventoresumo');
    }
  }

  async function excluirMedicaoCrescimento() {
    if (!crescimentoEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('medicao_crescimento').delete().eq('id', crescimentoEditandoId);
    setCarregando(false);
    if (error) {
      setErroCrescimento(error.message);
      return;
    }
    setCrescimentoEditandoId(null);
    setMostrarFormCrescimento(false);
    await carregarCrescimento(membroSelecionado.id);
  }

  async function salvarTipoSanguineo(novoValor: string) {
    if (!membroSelecionado) return;
    setValorTipoEdit(novoValor);
    const { error } = await supabase
      .from('membro')
      .update({ tipo_sanguineo: novoValor || null })
      .eq('id', membroSelecionado.id);

    if (error) {
      setErroEdicao(error.message);
      return;
    }
    setErroEdicao('');
    setMembroSelecionado({ ...membroSelecionado, tipo_sanguineo: novoValor || null });
    setEditandoTipo(false);
    await carregarMembros();
  }

  async function salvarParentesco(novoValor: string) {
    if (!membroSelecionado) return;
    setValorParentescoEdit(novoValor);
    const { error } = await supabase
      .from('membro')
      .update({ parentesco: novoValor || null })
      .eq('id', membroSelecionado.id);

    if (error) {
      setErroEdicao(error.message);
      return;
    }
    setErroEdicao('');
    setMembroSelecionado({ ...membroSelecionado, parentesco: novoValor || null });
    setEditandoParentesco(false);
    await carregarMembros();
    await carregarRiscosGeneticos({ ...membroSelecionado, parentesco: novoValor || null });
  }

  async function salvarFotoMembro(arquivo: File) {
    if (!membroSelecionado) return;
    if (!arquivo.type.startsWith('image/')) {
      setErroFoto('Selecione um arquivo de imagem (jpg, png, etc).');
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroFoto('A imagem deve ter no máximo 5MB.');
      return;
    }
    setErroFoto('');
    setEnviandoFoto(true);

    const extensao = arquivo.name.split('.').pop() || 'jpg';
    const caminho = `${membroSelecionado.id}/${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from('fotos-membros')
      .upload(caminho, arquivo, { upsert: true });

    if (erroUpload) {
      setEnviandoFoto(false);
      setErroFoto(erroUpload.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('fotos-membros').getPublicUrl(caminho);
    const novaUrl = urlData.publicUrl;

    const { error: erroUpdate } = await supabase
      .from('membro')
      .update({ foto_url: novaUrl })
      .eq('id', membroSelecionado.id);

    setEnviandoFoto(false);
    if (erroUpdate) {
      setErroFoto(erroUpdate.message);
      return;
    }
    setMembroSelecionado({ ...membroSelecionado, foto_url: novaUrl });
    await carregarMembros();
  }

  async function removerFotoMembro() {
    if (!membroSelecionado) return;
    setErroFoto('');
    setEnviandoFoto(true);
    const { error } = await supabase
      .from('membro')
      .update({ foto_url: null })
      .eq('id', membroSelecionado.id);
    setEnviandoFoto(false);
    if (error) {
      setErroFoto(error.message);
      return;
    }
    setMembroSelecionado({ ...membroSelecionado, foto_url: null });
    await carregarMembros();
  }

  async function carregarRiscosGeneticos(membro: Membro) {
    if (!membro.parentesco) {
      if (membroAtualRef.current === membro.id) {
        setRiscos(null);
        setHistoricoGeral(null);
      }
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { data: meuUsuario } = await supabase
      .from('usuario')
      .select('familia_id')
      .eq('id', userData.user?.id)
      .single();
    const familiaId = meuUsuario?.familia_id;
    if (!familiaId) {
      if (membroAtualRef.current === membro.id) {
        setRiscos([]);
        setHistoricoGeral([]);
      }
      return;
    }

    // Traz TODOS os membros da família, incluindo falecidos — histórico de saúde de
    // parentes que já faleceram costuma ser justamente o mais relevante geneticamente.
    const { data: membrosFamilia } = await supabase
      .from('membro')
      .select('id, parentesco')
      .eq('familia_id', familiaId);

    const idsDeSangue = (membrosFamilia || [])
      .filter((m) => m.id !== membro.id && m.parentesco && parentescosDeSangue.includes(m.parentesco))
      .map((m) => m.id);

    if (idsDeSangue.length === 0) {
      if (membroAtualRef.current === membro.id) {
        setRiscos([]);
        setHistoricoGeral([]);
      }
      return;
    }

    const { data: condicoesFamilia } = await supabase
      .from('condicao')
      .select('nome')
      .in('membro_id', idsDeSangue)
      .eq('relevante_geneticamente', true);

    // Confere de novo antes de aplicar: essas buscas fazem várias idas ao banco em
    // sequência, então o usuário pode ter trocado de membro (ou de parentesco) antes
    // de tudo voltar — nesse caso não aplicamos mais o resultado, que já não vale.
    if (membroAtualRef.current !== membro.id) return;

    const nomes = (condicoesFamilia || []).map((c) => c.nome);
    setRiscos(calcularRiscosGeneticos(membro, nomes));

    // Condições marcadas como genéticas na família, mas que não batem com nenhuma regra
    // de rastreio — ainda assim são relevantes pro médico saber, então mostramos à parte.
    const nomesCobertosPorRegra = new Set<string>();
    for (const regra of regrasGeneticas) {
      if (regra.aplicaSexo && regra.aplicaSexo !== membro.sexo_biologico) continue;
      for (const nome of nomes) {
        if (regra.palavras.some((p) => nome.toLowerCase().includes(p))) {
          nomesCobertosPorRegra.add(nome);
        }
      }
    }
    const outrosNomes = Array.from(new Set(nomes.filter((n) => !nomesCobertosPorRegra.has(n))));
    setHistoricoGeral(outrosNomes);
  }

  async function salvarObservacoes() {
    if (!membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase
      .from('membro')
      .update({ observacoes_gerais: valorObsEdit || null })
      .eq('id', membroSelecionado.id);

    setCarregando(false);
    if (error) {
      setErroEdicao(error.message);
      return;
    }
    setErroEdicao('');
    setMembroSelecionado({ ...membroSelecionado, observacoes_gerais: valorObsEdit || null });
    setEditandoObs(false);
    await carregarMembros();
  }

  async function salvarAlergias() {
    if (!membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase
      .from('membro')
      .update({ alergias: valorAlergiasEdit || null })
      .eq('id', membroSelecionado.id);

    setCarregando(false);
    if (error) {
      setErroEdicao(error.message);
      return;
    }
    setErroEdicao('');
    setMembroSelecionado({ ...membroSelecionado, alergias: valorAlergiasEdit || null });
    setEditandoAlergias(false);
    await carregarMembros();
  }

  const inputClasse =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const botaoPrimario =
    'w-full rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50';
  const botaoSecundario =
    'w-full rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-[#FAFAF8]';

  // Pendências do membro selecionado, mostradas na tela inicial do perfil (quando
  // nenhum ícone de categoria foi tocado ainda): próxima consulta agendada, próxima
  // dose de vacina prevista, e medicação de uso contínuo com horário cadastrado.
  // Usa os dados que já estão carregados em `consultas`/`vacinas`/`medicacoes` —
  // não faz nenhuma busca nova no banco.
  type ItemPendencia = { id: string; tipo: 'consulta' | 'vacina' | 'medicacao'; titulo: string; detalhe: string };
  function iconePendencia(tipo: ItemPendencia['tipo']) {
    const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#0F766E', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (tipo) {
      case 'consulta':
        return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
      case 'vacina':
        return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
      case 'medicacao':
        return <svg {...props}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>;
      default:
        return null;
    }
  }
  function obterPendencias(): ItemPendencia[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const itens: ItemPendencia[] = [];

    // Mostra TODAS as consultas agendadas futuras (não só a próxima), da mais próxima
    // pra mais distante.
    const consultasFuturas = consultas
      .filter((c) => c.status === 'agendada' && new Date(c.data_hora) >= hoje)
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    for (const c of consultasFuturas) {
      const dh = new Date(c.data_hora);
      itens.push({
        id: `consulta-${c.id}`,
        tipo: 'consulta',
        titulo: `Consulta: ${c.especialidade?.nome || 'a confirmar'}${c.profissional_saude?.nome ? ' — ' + c.profissional_saude.nome : ''}`,
        detalhe: `${dh.toLocaleDateString('pt-BR')}${c.local ? ' · ' + c.local : ''}`,
      });
    }

    // Mostra TODAS as vacinas com próxima dose marcada (atrasadas e futuras), da mais
    // atrasada/mais próxima pra mais distante.
    const vacinasComProxima = vacinas
      .filter((v) => v.proxima_dose_data)
      .sort((a, b) => new Date(a.proxima_dose_data as string).getTime() - new Date(b.proxima_dose_data as string).getTime());
    for (const v of vacinasComProxima) {
      const dv = new Date(v.proxima_dose_data as string);
      const diasRestantes = Math.round((dv.getTime() - hoje.getTime()) / 86400000);
      itens.push({
        id: `vacina-${v.id}`,
        tipo: 'vacina',
        titulo: `Vacina: ${v.nome}${v.dose ? ' — ' + v.dose : ''}`,
        detalhe: diasRestantes < 0 ? `atrasada desde ${dv.toLocaleDateString('pt-BR')}` : diasRestantes === 0 ? 'hoje' : `vence em ${diasRestantes} dias`,
      });
    }

    // Mostra TODAS as medicações de uso contínuo/ainda ativas, não só a primeira.
    const medicacoesAtivas = medicacoes.filter((m) => !m.data_fim || new Date(m.data_fim) >= hoje);
    for (const m of medicacoesAtivas) {
      itens.push({
        id: `medicacao-${m.id}`,
        tipo: 'medicacao',
        titulo: `Medicação: ${m.nome}`,
        detalhe: m.horario ? `hoje às ${m.horario}` : 'uso contínuo',
      });
    }

    return itens;
  }

  // Passos do wizard de onboarding (estilo "configuração inicial do iPhone"), mostrado
  // só uma vez, logo depois de criar um membro novo. Cada passo reaproveita a tela e o
  // formulário que já existem pra aquela categoria — o wizard só guia a navegação entre
  // elas, com uma explicação rápida e opção de pular.
  const passosOnboarding: { aba: Aba; titulo: string; explicacao: string }[] = [
    { aba: 'nascimento', titulo: 'Dados pessoais', explicacao: 'Confira os dados básicos e complete o que quiser: tipo sanguíneo, parentesco, alergias e observações gerais.' },
    { aba: 'condicoes', titulo: 'Evento de Saúde', explicacao: 'Registre doenças ou condições de saúde que esta pessoa já teve ou tem atualmente.' },
    { aba: 'cirurgias', titulo: 'Cirurgia/Internação', explicacao: 'Registre cirurgias ou internações pelas quais esta pessoa já passou.' },
    { aba: 'consultas', titulo: 'Consultas', explicacao: 'Registre consultas médicas já feitas ou marcadas para esta pessoa.' },
    { aba: 'odontologia', titulo: 'Odontologia', explicacao: 'Registre visitas ao dentista ou ortodontista.' },
    { aba: 'exames', titulo: 'Exames', explicacao: 'Registre exames já realizados, pra manter um histórico e os resultados à mão.' },
    { aba: 'medicacoes', titulo: 'Medicações', explicacao: 'Registre os medicamentos que esta pessoa usa ou já usou, incluindo os de uso contínuo.' },
    { aba: 'vacinas', titulo: 'Vacinas', explicacao: 'Registre as vacinas já tomadas e as próximas doses previstas.' },
    { aba: 'crescimento', titulo: 'Peso e IMC', explicacao: 'Registre o peso e a altura mais recentes, pra acompanhar a curva de crescimento ou o IMC.' },
  ];

  // Avança, volta ou conclui o wizard. delta = 1 (próximo/pular) ou -1 (anterior).
  function moverPassoOnboarding(delta: number) {
    const novoIndex = onboardingPasso + delta;
    if (novoIndex < 0) return;
    if (novoIndex >= passosOnboarding.length) {
      setOnboardingAtivo(false);
      setOnboardingPasso(0);
      setTelaDetalhe(null);
      return;
    }
    // Fecha qualquer formulário aberto do passo anterior, pra sempre abrir o próximo
    // passo na tela de lista (nunca presa num formulário com dados do passo anterior).
    setMostrarFormCondicao(false);
    setMostrarFormMedicacao(false);
    setMostrarFormConsulta(false);
    setMostrarFormExame(false);
    setMostrarFormVacina(false);
    setMostrarFormCrescimento(false);
    setOnboardingPasso(novoIndex);
    setTelaDetalhe(passosOnboarding[novoIndex].aba);
  }

  // labelCurto é o texto exibido na fileira pequena de ícones do hub (cards de 76px) —
  // quando ausente, usa o label completo (esse sempre aparece no cabeçalho da tela).
  const secoes: { id: Aba; label: string; labelCurto?: string }[] = [
    { id: 'condicoes', label: 'Evento de Saúde' },
    { id: 'cirurgias', label: 'Cirurgia/Internação', labelCurto: 'Cirurgia / Intern.' },
    { id: 'medicacoes', label: 'Medicações' },
    { id: 'consultas', label: 'Consultas' },
    { id: 'odontologia', label: 'Odontologia', labelCurto: 'Dentista' },
    { id: 'exames', label: 'Exames' },
    { id: 'vacinas', label: 'Vacinas' },
    { id: 'crescimento', label: 'Peso e IMC' },
    { id: 'riscos', label: 'Cuidados Preventivos', labelCurto: 'Cuidados Prev.' },
    { id: 'bemestar', label: 'Bem-estar' },
    { id: 'medicos', label: 'Médicos' },
  ];

  // Itens do menu que abre ao tocar nos 3 risquinhos (pedido da Roberta: uma anamnese
  // mais completa, organizada em seções). Cada seção só aparece pra idade em que faz
  // sentido perguntar aquilo — mas nunca desaparece se já tiver dado salvo, pra não
  // sumir uma informação que já foi preenchida quando o membro "sai" da faixa etária.
  const telasMenuPessoal: Aba[] = ['nascimento', 'gestacao', 'desenvolvimento', 'alimentacaoinfantil', 'puberdade', 'saudemental', 'habitosvida'];
  function itensMenuPessoal(): { id: Aba; label: string; descricao: string }[] {
    const idadeAnos = membroSelecionado ? calcularIdade(membroSelecionado.data_nascimento) : 0;
    const itens = [
      { id: 'nascimento' as Aba, label: 'Dados pessoais', descricao: 'Foto, tipo sanguíneo, parentesco, alergias e observações gerais.', mostrar: true },
      { id: 'gestacao' as Aba, label: 'Gestação e Nascimento', descricao: 'Pré-natal, parto, Apgar e intercorrências da gestação e do nascimento.', mostrar: true },
      { id: 'desenvolvimento' as Aba, label: 'Desenvolvimento Neuropsicomotor', descricao: 'Marcos do desenvolvimento: sustentar a cabeça, sentar, engatinhar, andar, falar.', mostrar: idadeAnos < 6 || !!desenvolvimento },
      { id: 'alimentacaoinfantil' as Aba, label: 'Alimentação', descricao: 'Aleitamento materno, fórmula, introdução e aceitação alimentar.', mostrar: idadeAnos < 6 || !!alimentacaoInfantil },
      { id: 'puberdade' as Aba, label: 'Puberdade e Sexualidade', descricao: 'Menarca/espermarca, ciclo menstrual, vida sexual e métodos contraceptivos.', mostrar: idadeAnos >= 9 || !!puberdadeSexualidade },
      { id: 'saudemental' as Aba, label: 'Saúde Mental', descricao: 'Humor, ansiedade e outros pontos de atenção emocional.', mostrar: true },
      { id: 'habitosvida' as Aba, label: 'Hábitos de Vida', descricao: 'Alimentação do dia a dia, atividade física, sono e uso de telas.', mostrar: true },
    ];
    return itens.filter((i) => i.mostrar);
  }

  // Ícones de linha (estilo do protótipo) pra cada seção do hub do membro — substituem
  // os emojis que eram usados antes, pra bater com a cara combinada com a Roberta.
  function iconeSecao(id: Aba, tamanho: number = 26) {
    const props = { width: tamanho, height: tamanho, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (id) {
      case 'novoregistro':
        return <svg {...props}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
      case 'condicoes':
        return <svg {...props}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /></svg>;
      case 'cirurgias':
        return <svg {...props}><path d="M3 21l7-7" /><path d="M13.5 10.5l6-6a2.1 2.1 0 0 0-3-3l-6 6" /><path d="M9 12l6 6" /><path d="M13 15l3 3" /><path d="M10 18l3 3" /></svg>;
      case 'medicacoes':
        return <svg {...props}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>;
      case 'consultas':
        return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
      case 'odontologia':
        return <svg {...props}><path d="M12 2C9 2 6.5 4 6.5 8c0 2 .5 3.5 1 6 .3 1.5.8 3 1.5 3s1-1.2 1-3 .5-3 2-3 2 1 2 3 .5 3 1 3 1.2-1.5 1.5-3c.5-2.5 1-4 1-6 0-4-2.5-6-5.5-6z" /></svg>;
      case 'bemestar':
        return <svg {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
      case 'nutricionista':
        return <svg {...props}><path d="M12 6c-1-2-3-3-5-2 0 2 1 3 2 4-3 0-5 2-5 6 0 4 3 7 6 7 1 0 2-.5 2-.5s1 .5 2 .5c3 0 6-3 6-7 0-4-2-6-5-6 1-1 2-2 2-4-2-1-4 0-5 2z" /></svg>;
      case 'esportes':
        return <svg {...props}><line x1="6" y1="5" x2="6" y2="19" /><line x1="18" y1="5" x2="18" y2="19" /><line x1="2" y1="9" x2="2" y2="15" /><line x1="22" y1="9" x2="22" y2="15" /><line x1="6" y1="12" x2="18" y2="12" /></svg>;
      case 'medicos':
        return <svg {...props}><circle cx="12" cy="7" r="4" /><path d="M5.5 21a6.5 6.5 0 0 1 13 0" /></svg>;
      case 'exames':
        return <svg {...props}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>;
      case 'vacinas':
        return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
      case 'nascimento':
        return <svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>;
      case 'menupessoal':
        return <svg {...props}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;
      case 'gestacao':
        return <svg {...props}><path d="M12 21s-7-4.35-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.65-9.5 9-9.5 9z" /></svg>;
      case 'desenvolvimento':
        return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9" y2="9.01" /><line x1="15" y1="9" x2="15" y2="9.01" /></svg>;
      case 'alimentacaoinfantil':
        return <svg {...props}><path d="M9 2h6v3H9z" /><path d="M8 6h8l-1 13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /><line x1="8" y1="10" x2="16" y2="10" /></svg>;
      case 'puberdade':
        return <svg {...props}><path d="M12 22V8" /><path d="M5 12c0-4 3-8 7-8s7 4 7 8" /></svg>;
      case 'saudemental':
        return <svg {...props}><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4 1.5 6.5V19a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3.5C19 13 20 11.5 20 9a7 7 0 0 0-7-7z" /><path d="M9 9c0-1.5 1.5-2 3-2s3 .5 3 2-1.5 2-3 3" /></svg>;
      case 'habitosvida':
        return <svg {...props}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></svg>;
      case 'crescimento':
        return <svg {...props}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
      case 'riscos':
        return <svg {...props}><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></svg>;
      default:
        return null;
    }
  }

  const larguraContainer = membroSelecionado ? 'max-w-2xl' : 'max-w-sm';

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className={`w-full ${larguraContainer} rounded-2xl bg-white p-8 shadow-sm border border-[#E5E1DA] transition-all`}>
        {!membroSelecionado && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-green-600 bg-green-50 text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" />
                <path d="m8.5 13 2.5 2.5 4.5-5" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-800">ProntuApp</h1>
            <p className="text-sm text-slate-400 mt-1">Prontuário na palma da mão.</p>
          </div>
        )}

        {(passo === 'login' || passo === 'cadastro') && (
          <div className="space-y-3">
            <input className={inputClasse} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className={inputClasse} placeholder="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            {passo === 'login' ? (
              <>
                <button disabled={carregando} onClick={entrar} className={botaoPrimario}>
                  {carregando ? 'Entrando...' : 'Entrar'}
                </button>
                <button onClick={() => { setErro(''); setPasso('cadastro'); }} className="w-full text-sm text-teal-700 mt-2">
                  Não tenho conta — criar agora
                </button>
              </>
            ) : (
              <>
                <button disabled={carregando} onClick={cadastrar} className={botaoPrimario}>
                  {carregando ? 'Criando conta...' : 'Criar conta'}
                </button>
                <button onClick={() => { setErro(''); setPasso('login'); }} className="w-full text-sm text-teal-700 mt-2">
                  Já tenho conta — entrar
                </button>
              </>
            )}
          </div>
        )}

        {passo === 'onboarding' && (
          <div className="space-y-4">
            <input className={inputClasse} placeholder="seu nome" value={nomeUsuario} onChange={(e) => setNomeUsuario(e.target.value)} />
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button onClick={() => setModoOnboarding('criar')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${modoOnboarding === 'criar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                Criar família
              </button>
              <button onClick={() => setModoOnboarding('convite')} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${modoOnboarding === 'convite' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>
                Tenho um convite
              </button>
            </div>
            {modoOnboarding === 'criar' ? (
              <>
                <input className={inputClasse} placeholder="nome da família (ex: Família Silva)" value={nomeFamilia} onChange={(e) => setNomeFamilia(e.target.value)} />
                {erro && <p className="text-sm text-red-600">{erro}</p>}
                <button disabled={carregando} onClick={criarFamilia} className={botaoPrimario}>
                  {carregando ? 'Criando...' : 'Criar família'}
                </button>
              </>
            ) : (
              <>
                <input className={inputClasse} placeholder="código do convite" value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value)} />
                {erro && <p className="text-sm text-red-600">{erro}</p>}
                <button disabled={carregando} onClick={usarConvite} className={botaoPrimario}>
                  {carregando ? 'Entrando...' : 'Usar convite'}
                </button>
              </>
            )}
          </div>
        )}

        {passo === 'painel' && !membroSelecionado && (
          <div className="space-y-4">
            <div className="space-y-2">
              {membros.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-2">Nenhum membro cadastrado ainda.</p>
              )}
              {membros.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMembroSelecionado(m); setTelaDetalhe(null); }}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                >
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt={m.nome}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold">
                      {m.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800">{m.nome}</p>
                    <p className="text-xs text-slate-400">{calcularIdade(m.data_nascimento)} anos</p>
                  </div>
                </button>
              ))}
            </div>

            {!mostrarFormMembro ? (
              <button onClick={() => setMostrarFormMembro(true)} className={botaoPrimario}>
                + Adicionar membro
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                <input className={inputClasse} placeholder="nome" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                <input className={inputClasse} type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
                <select className={inputClasse} value={novoSexo} onChange={(e) => setNovoSexo(e.target.value)}>
                  <option value="">sexo biológico</option>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                </select>
                <select className={inputClasse} value={novoTipoSanguineo} onChange={(e) => setNovoTipoSanguineo(e.target.value)}>
                  <option value="">tipo sanguíneo (opcional)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <select className={inputClasse} value={novoParentesco} onChange={(e) => setNovoParentesco(e.target.value)}>
                  <option value="">grau de parentesco (importante p/ Cuidados Preventivos)</option>
                  {opcoesParentesco.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={novoFalecido} onChange={(e) => setNovoFalecido(e.target.checked)} />
                  Esta pessoa já faleceu
                </label>
                {novoFalecido && (
                  <input
                    className={inputClasse}
                    type="date"
                    placeholder="data do falecimento"
                    value={novaDataFalecimento}
                    onChange={(e) => setNovaDataFalecimento(e.target.value)}
                  />
                )}
                {erroMembro && <p className="text-sm text-red-600">{erroMembro}</p>}
                <div className="flex gap-2">
                  <button disabled={carregando} onClick={adicionarMembro} className={botaoPrimario}>
                    {carregando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setMostrarFormMembro(false)} className={botaoSecundario}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-[#E5E1DA] pt-4 text-center space-y-2">
              <button onClick={gerarConvite} className="text-sm text-teal-700">
                Convidar alguém para a família
              </button>
              {codigoGerado && (
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
                  <p className="text-xs text-slate-500 mb-1">Compartilhe este código:</p>
                  <p className="text-xl font-mono font-semibold text-teal-700 tracking-widest">{codigoGerado}</p>
                </div>
              )}
              <button onClick={sair} className="block w-full text-sm text-slate-400 mt-2">
                Sair
              </button>
            </div>
          </div>
        )}

        {passo === 'painel' && membroSelecionado && telaDetalhe === null && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setTelaDetalhe('menupessoal')}
                aria-label="Mais informações"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-[#FAFAF8] hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => setMembroSelecionado(null)} className="text-sm text-teal-700">
                  ← Voltar
                </button>
                <button
                  aria-label="Notificações"
                  title="Notificações (em breve)"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={() => setTelaDetalhe('menupessoal')}
              className="mb-6 flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[#FAFAF8]"
            >
              {membroSelecionado.foto_url ? (
                <img
                  src={membroSelecionado.foto_url}
                  alt={membroSelecionado.nome}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-lg">
                  {membroSelecionado.nome.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{membroSelecionado.nome}</h2>
                <p className="text-xs text-slate-400">{calcularIdade(membroSelecionado.data_nascimento)} anos · toque para ver a ficha pessoal</p>
              </div>
            </button>

            <div className="flex justify-center overflow-x-auto pb-1 -mx-1 px-1">
              <div className="grid grid-flow-col grid-rows-2 auto-cols-[76px] gap-2">
                {secoes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTelaDetalhe(s.id)}
                    className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-[#E5E1DA] bg-white px-1 py-2.5 text-teal-700 transition hover:bg-[#FAFAF8]"
                  >
                    {iconeSecao(s.id, 20)}
                    <span className="w-full text-[10px] font-medium text-slate-600 text-center leading-tight">
                      {s.labelCurto ?? s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-800">Pendências</h3>
              <p className="mb-3 text-xs text-slate-400">Toque num ícone acima pra ver a lista completa daquela categoria.</p>
              {(() => {
                const pendencias = obterPendencias();
                if (pendencias.length === 0) {
                  return <p className="text-sm text-slate-400 py-2">Nada pendente por aqui no momento.</p>;
                }
                return (
                  <div className="space-y-2">
                    {pendencias.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-[#E5E1DA] bg-white p-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1]">
                          {iconePendencia(p.tipo)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{p.titulo}</p>
                          <p className="text-xs text-slate-400">{p.detalhe}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="mt-8 border-t border-[#E5E1DA] pt-4">
              {!confirmandoExclusaoMembro ? (
                <button onClick={() => setConfirmandoExclusaoMembro(true)} className="w-full text-sm text-red-600">
                  Excluir este membro
                </button>
              ) : (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 space-y-2">
                  <p className="text-sm text-red-700">
                    Isso vai apagar {membroSelecionado.nome} e todo o histórico (condições, medicações, consultas, exames, vacinas) permanentemente. Tem certeza?
                  </p>
                  {erro && <p className="text-sm text-red-600">{erro}</p>}
                  <div className="flex gap-2">
                    <button disabled={carregando} onClick={excluirMembro} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                      {carregando ? 'Excluindo...' : 'Sim, excluir'}
                    </button>
                    <button onClick={() => setConfirmandoExclusaoMembro(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-[#FAFAF8]">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {passo === 'painel' && membroSelecionado && telaDetalhe !== null && (
          <div>
            {onboardingAtivo && (
              <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-teal-700">
                    Passo {onboardingPasso + 1} de {passosOnboarding.length} · {passosOnboarding[onboardingPasso].titulo}
                  </p>
                  <button
                    onClick={() => { setOnboardingAtivo(false); setOnboardingPasso(0); setTelaDetalhe(null); }}
                    className="shrink-0 text-xs text-teal-700/70 hover:text-teal-700"
                  >
                    sair do passo a passo
                  </button>
                </div>
                <div className="h-1.5 w-full rounded-full bg-teal-100">
                  <div
                    className="h-1.5 rounded-full bg-teal-600 transition-all"
                    style={{ width: `${((onboardingPasso + 1) / passosOnboarding.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-teal-800">{passosOnboarding[onboardingPasso].explicacao}</p>
                {passosOnboarding[onboardingPasso].aba === 'condicoes' && telaDetalhe !== 'onboardingvoz' && (
                  <button onClick={() => setTelaDetalhe('onboardingvoz')} className="text-xs text-teal-700 underline">
                    🎤 prefiro contar por voz
                  </button>
                )}
                <div className="flex items-center gap-2 pt-1">
                  {onboardingPasso > 0 && (
                    <button onClick={() => moverPassoOnboarding(-1)} className="rounded-xl border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100">
                      ← anterior
                    </button>
                  )}
                  <button onClick={() => moverPassoOnboarding(1)} className="text-xs text-teal-700/70 hover:text-teal-700 ml-auto">
                    pular
                  </button>
                  <button onClick={() => moverPassoOnboarding(1)} className="rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-teal-700">
                    {onboardingPasso === passosOnboarding.length - 1 ? 'concluir' : 'próximo →'}
                  </button>
                </div>
              </div>
            )}

            {telaDetalhe !== 'eventoresumo' && (
              <>
                <button
                  onClick={() => {
                    if (onboardingAtivo) {
                      setOnboardingAtivo(false);
                      setOnboardingPasso(0);
                      setTelaDetalhe(null);
                      return;
                    }
                    if (telaDetalhe === 'nutricionista' || telaDetalhe === 'esportes') {
                      setTelaDetalhe('bemestar');
                    } else if (telasMenuPessoal.includes(telaDetalhe as Aba)) {
                      setTelaDetalhe('menupessoal');
                    } else {
                      setTelaDetalhe(null);
                    }
                  }}
                  className="mb-4 text-sm text-teal-700"
                >
                  ← Voltar
                </button>

                <div className="mb-4 flex items-center gap-2 text-teal-700">
                  {telaDetalhe === 'onboardingvoz' ? (
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                  ) : (
                    iconeSecao(telaDetalhe as Aba)
                  )}
                  <h2 className="text-lg font-semibold text-slate-800">
                    {telaDetalhe === 'onboardingvoz'
                      ? 'Contar sobre a saúde'
                      : telaDetalhe === 'nutricionista'
                      ? 'Nutricionista'
                      : telaDetalhe === 'esportes'
                      ? 'Exercícios/Esportes'
                      : telaDetalhe === 'menupessoal'
                      ? 'Mais informações'
                      : telaDetalhe === 'nascimento'
                      ? 'Dados pessoais'
                      : telaDetalhe === 'gestacao'
                      ? 'Gestação e Nascimento'
                      : telaDetalhe === 'desenvolvimento'
                      ? 'Desenvolvimento Neuropsicomotor'
                      : telaDetalhe === 'alimentacaoinfantil'
                      ? 'Alimentação'
                      : telaDetalhe === 'puberdade'
                      ? 'Puberdade e Sexualidade'
                      : telaDetalhe === 'saudemental'
                      ? 'Saúde Mental'
                      : telaDetalhe === 'habitosvida'
                      ? 'Hábitos de Vida'
                      : secoes.find((s) => s.id === telaDetalhe)?.label}
                  </h2>
                </div>
              </>
            )}

            {telaDetalhe === 'onboardingvoz' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
                  <p className="text-xs text-teal-700">
                    🤖 Usando IA pra interpretar o que você contar — sempre confira e corrija antes de salvar.
                  </p>
                </div>
                <p className="text-sm text-slate-500">
                  Conte rapidamente sobre a saúde de <strong>{membroSelecionado.nome}</strong>: doenças, alergias, cirurgias, remédios que usa. Fale tudo de uma vez, separando por vírgula ou “e”.
                </p>
                <div className="rounded-xl border border-[#E5E1DA] p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">o que você quiser contar</label>
                    <button
                      type="button"
                      onClick={() => alternarReconhecimentoVoz('ovFala', setOvTexto)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${gravandoCampo === 'ovFala' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-teal-100 text-teal-700'}`}
                    >
                      🎤 {gravandoCampo === 'ovFala' ? 'Ouvindo...' : 'Falar'}
                    </button>
                  </div>
                  <textarea
                    className={inputClasse}
                    rows={4}
                    placeholder="ex: tem asma desde os 3 anos, é alérgico a amendoim, tomou amoxicilina semana passada por causa de uma otite"
                    value={ovTexto}
                    onChange={(e) => setOvTexto(e.target.value)}
                  />
                  {ovErro && <p className="text-sm text-red-600">{ovErro}</p>}
                  <button disabled={!ovTexto.trim() || ovProcessando} onClick={processarFalaOnboarding} className={botaoPrimario}>
                    {ovProcessando ? 'Entendendo...' : 'Processar'}
                  </button>
                </div>

                {ovItens.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-600">Confira o que eu entendi — pode corrigir tudo antes de salvar:</p>
                    {ovItens.map((item) => (
                      <div key={item.id} className={`rounded-xl border p-3 space-y-2 ${item.incluir ? 'border-slate-200' : 'border-[#E5E1DA] opacity-50'}`}>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={item.incluir} onChange={() => alternarIncluirItemOnboarding(item.id)} />
                          <select
                            className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                            value={item.tipo}
                            onChange={(e) => atualizarTipoItemOnboarding(item.id, e.target.value as typeof item.tipo)}
                          >
                            <option value="evento">Evento de saúde</option>
                            <option value="alergia">Alergia</option>
                            <option value="cirurgia">Cirurgia/Internação</option>
                            <option value="medicamento">Medicamento</option>
                          </select>
                        </div>
                        <input
                          className={inputClasse}
                          value={item.texto}
                          onChange={(e) => atualizarTextoItemOnboarding(item.id, e.target.value)}
                        />
                      </div>
                    ))}
                    <button disabled={ovSalvando} onClick={confirmarOnboardingVoz} className={botaoPrimario}>
                      {ovSalvando ? 'Salvando...' : 'Confirmar e salvar'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    limparOnboardingVoz();
                    setTelaDetalhe(onboardingAtivo ? passosOnboarding[onboardingPasso].aba : null);
                  }}
                  className="w-full text-sm text-slate-400 pt-1"
                >
                  Pular por enquanto, prefiro preencher manualmente
                </button>
              </div>
            )}

            {telaDetalhe === 'novoregistro' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Escolha o que você quer registrar. Os campos aqui são resumidos — dá pra completar mais detalhes depois na tela de cada um.
                </p>
                <datalist id="lista-medicos-cadastrados">
                  {medicos.map((m) => (
                    <option key={m.id} value={m.nome} />
                  ))}
                </datalist>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'evento' as const, label: 'Evento de Saúde' },
                    { id: 'cirurgia' as const, label: 'Cirurgia/Internação' },
                    { id: 'consulta' as const, label: 'Consulta' },
                    { id: 'medicamento' as const, label: 'Medicamento' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      onClick={() => {
                        setNrTipo(op.id);
                        setNrBusca('');
                        setNrSalvo(false);
                        setErroNovoRegistro('');
                      }}
                      className={`rounded-xl border p-4 text-center transition ${nrTipo === op.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-[#FAFAF8]'}`}
                    >
                      <div className="flex justify-center text-teal-700">
                        {op.id === 'evento' && (
                          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /></svg>
                        )}
                        {op.id === 'cirurgia' && (
                          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l7-7" /><path d="M13.5 10.5l6-6a2.1 2.1 0 0 0-3-3l-6 6" /><path d="M9 12l6 6" /><path d="M13 15l3 3" /><path d="M10 18l3 3" /></svg>
                        )}
                        {op.id === 'consulta' && (
                          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        )}
                        {op.id === 'medicamento' && (
                          <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>
                        )}
                      </div>
                      <div className="text-sm font-medium text-slate-700 mt-1">{op.label}</div>
                    </button>
                  ))}
                </div>

                {nrSalvo && (
                  <p className="text-sm text-teal-700 bg-teal-50 rounded-xl p-3">
                    ✓ Salvo! Você pode completar mais detalhes a qualquer momento na tela correspondente.
                  </p>
                )}

                {nrTipo === 'evento' && (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="🔎 buscar evento de saúde já cadastrado"
                      value={nrBusca}
                      onChange={(e) => setNrBusca(e.target.value)}
                    />
                    {nrBusca.trim() && (
                      <div className="space-y-1">
                        {condicoes
                          .filter((c) => c.tipo === 'doenca' && c.nome.toLowerCase().includes(nrBusca.trim().toLowerCase()))
                          .slice(0, 5)
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setTelaDetalhe('condicoes'); abrirEdicaoCondicao(c); }}
                              className="w-full text-left text-sm rounded-lg bg-[#FAFAF8] px-3 py-2 hover:bg-slate-100"
                            >
                              {c.nome}{c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                            </button>
                          ))}
                        {condicoes.filter((c) => c.tipo === 'doenca' && c.nome.toLowerCase().includes(nrBusca.trim().toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400">Nenhum encontrado — pode cadastrar um novo abaixo.</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-500 pt-1">Novo evento de saúde</p>
                    <select className={inputClasse} value={nrEventoNome} onChange={(e) => setNrEventoNome(e.target.value)}>
                      <option value="">qual o evento (doença)?</option>
                      {categoriasDoencas.map((cat) => (
                        <optgroup key={cat} label={cat}>
                          {doencasComuns.filter((d) => d.categoria === cat).map((d) => (
                            <option key={d.nome} value={d.nome}>{d.nome}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {nrEventoNome === 'Outra doença (especificar)' && (
                      <input
                        className={inputClasse}
                        placeholder="qual evento de saúde?"
                        value={nrEventoOutroNome}
                        onChange={(e) => setNrEventoOutroNome(e.target.value)}
                      />
                    )}
                    <input className={inputClasse} type="date" value={nrEventoData} onChange={(e) => setNrEventoData(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrEventoCronica} onChange={(e) => setNrEventoCronica(e.target.checked)} />
                      É crônica / contínua
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrEventoGerouConsulta} onChange={(e) => setNrEventoGerouConsulta(e.target.checked)} />
                      Gerou consulta
                    </label>
                    {nrEventoGerouConsulta && (
                      <div className="ml-2 space-y-2 border-l-2 border-teal-100 pl-3">
                        <select className={inputClasse} value={nrSubConsultaEspecialidade} onChange={(e) => setNrSubConsultaEspecialidade(e.target.value)}>
                          <option value="">especialidade</option>
                          {especialidadesMedicas.map((esp) => (
                            <option key={esp} value={esp}>{esp}</option>
                          ))}
                        </select>
                        <input
                          className={inputClasse}
                          placeholder="médico (opcional)"
                          list="lista-medicos-cadastrados"
                          value={nrSubConsultaMedico}
                          onChange={(e) => setNrSubConsultaMedico(e.target.value)}
                        />
                        <input className={inputClasse} type="date" value={nrSubConsultaData} onChange={(e) => setNrSubConsultaData(e.target.value)} />
                      </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrEventoGerouMedicamento} onChange={(e) => setNrEventoGerouMedicamento(e.target.checked)} />
                      Gerou medicamento
                    </label>
                    {nrEventoGerouMedicamento && (
                      <div className="ml-2 space-y-2 border-l-2 border-teal-100 pl-3">
                        <input className={inputClasse} placeholder="nome do remédio" value={nrSubMedNome} onChange={(e) => setNrSubMedNome(e.target.value)} />
                        <input className={inputClasse} placeholder="dosagem (opcional)" value={nrSubMedDosagem} onChange={(e) => setNrSubMedDosagem(e.target.value)} />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={nrSubMedUsoContinuo} onChange={(e) => setNrSubMedUsoContinuo(e.target.checked)} />
                          Uso contínuo
                        </label>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">breve relato (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('nrEventoRelato', setNrEventoRelato)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'nrEventoRelato' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'nrEventoRelato' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea className={inputClasse} rows={2} value={nrEventoRelato} onChange={(e) => setNrEventoRelato(e.target.value)} />
                    </div>
                    {erroNovoRegistro && <p className="text-sm text-red-600">{erroNovoRegistro}</p>}
                    <button disabled={carregando} onClick={salvarNovoRegistro} className={botaoPrimario}>
                      {carregando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}

                {nrTipo === 'cirurgia' && (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="🔎 buscar cirurgia/internação já cadastrada"
                      value={nrBusca}
                      onChange={(e) => setNrBusca(e.target.value)}
                    />
                    {nrBusca.trim() && (
                      <div className="space-y-1">
                        {condicoes
                          .filter((c) => (c.tipo === 'cirurgia' || c.tipo === 'internacao') && c.nome.toLowerCase().includes(nrBusca.trim().toLowerCase()))
                          .slice(0, 5)
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setTelaDetalhe('condicoes'); abrirEdicaoCondicao(c); }}
                              className="w-full text-left text-sm rounded-lg bg-[#FAFAF8] px-3 py-2 hover:bg-slate-100"
                            >
                              {tipoCondicaoLabels[c.tipo]}: {c.nome}{c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                            </button>
                          ))}
                        {condicoes.filter((c) => (c.tipo === 'cirurgia' || c.tipo === 'internacao') && c.nome.toLowerCase().includes(nrBusca.trim().toLowerCase())).length === 0 && (
                          <p className="text-xs text-slate-400">Nenhuma encontrada — pode cadastrar uma nova abaixo.</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-500 pt-1">Nova cirurgia/internação</p>
                    <div className="flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setNrCirurgiaTipo('cirurgia')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${nrCirurgiaTipo === 'cirurgia' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                      >
                        Cirurgia
                      </button>
                      <button
                        type="button"
                        onClick={() => setNrCirurgiaTipo('internacao')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${nrCirurgiaTipo === 'internacao' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                      >
                        Internação
                      </button>
                    </div>
                    <input
                      className={inputClasse}
                      placeholder={nrCirurgiaTipo === 'internacao' ? 'motivo da internação (ex: Pneumonia)' : 'qual cirurgia'}
                      value={nrCirurgiaNome}
                      onChange={(e) => setNrCirurgiaNome(e.target.value)}
                    />
                    <input className={inputClasse} type="date" value={nrCirurgiaData} onChange={(e) => setNrCirurgiaData(e.target.value)} />
                    <input
                      className={inputClasse}
                      placeholder="médico (opcional)"
                      list="lista-medicos-cadastrados"
                      value={nrCirurgiaMedico}
                      onChange={(e) => setNrCirurgiaMedico(e.target.value)}
                    />
                    <select className={inputClasse} value={nrCirurgiaEventoRelacionado} onChange={(e) => setNrCirurgiaEventoRelacionado(e.target.value)}>
                      <option value="">relacionada a algum evento de saúde? (opcional)</option>
                      {condicoes.filter((c) => c.tipo === 'doenca').map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrCirurgiaGerouMedicamento} onChange={(e) => setNrCirurgiaGerouMedicamento(e.target.checked)} />
                      Gerou medicamento
                    </label>
                    {nrCirurgiaGerouMedicamento && (
                      <div className="ml-2 space-y-2 border-l-2 border-teal-100 pl-3">
                        <input className={inputClasse} placeholder="nome do remédio" value={nrSubMedNome} onChange={(e) => setNrSubMedNome(e.target.value)} />
                        <input className={inputClasse} placeholder="dosagem (opcional)" value={nrSubMedDosagem} onChange={(e) => setNrSubMedDosagem(e.target.value)} />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={nrSubMedUsoContinuo} onChange={(e) => setNrSubMedUsoContinuo(e.target.checked)} />
                          Uso contínuo
                        </label>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">breve relato (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('nrCirurgiaRelato', setNrCirurgiaRelato)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'nrCirurgiaRelato' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'nrCirurgiaRelato' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea className={inputClasse} rows={2} value={nrCirurgiaRelato} onChange={(e) => setNrCirurgiaRelato(e.target.value)} />
                    </div>
                    {erroNovoRegistro && <p className="text-sm text-red-600">{erroNovoRegistro}</p>}
                    <button disabled={carregando} onClick={salvarNovoRegistro} className={botaoPrimario}>
                      {carregando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}

                {nrTipo === 'consulta' && (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="🔎 buscar consulta já cadastrada"
                      value={nrBusca}
                      onChange={(e) => setNrBusca(e.target.value)}
                    />
                    {nrBusca.trim() && (
                      <div className="space-y-1">
                        {consultas
                          .filter((c) =>
                            (c.especialidade?.nome || '').toLowerCase().includes(nrBusca.trim().toLowerCase()) ||
                            (c.profissional_saude?.nome || '').toLowerCase().includes(nrBusca.trim().toLowerCase())
                          )
                          .slice(0, 5)
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => { setTelaDetalhe('consultas'); abrirEdicaoConsulta(c); }}
                              className="w-full text-left text-sm rounded-lg bg-[#FAFAF8] px-3 py-2 hover:bg-slate-100"
                            >
                              {c.especialidade?.nome || 'Consulta'} · {new Date(c.data_hora).toLocaleDateString('pt-BR')}
                            </button>
                          ))}
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-500 pt-1">Nova consulta</p>
                    <select className={inputClasse} value={nrConsultaEspecialidade} onChange={(e) => setNrConsultaEspecialidade(e.target.value)}>
                      <option value="">especialidade</option>
                      {especialidadesMedicas.map((esp) => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                    {nrConsultaEspecialidade === 'Outros' && (
                      <input
                        className={inputClasse}
                        placeholder="qual especialidade?"
                        value={nrConsultaEspecialidadeOutro}
                        onChange={(e) => setNrConsultaEspecialidadeOutro(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      placeholder="médico (opcional)"
                      list="lista-medicos-cadastrados"
                      value={nrConsultaMedico}
                      onChange={(e) => setNrConsultaMedico(e.target.value)}
                    />
                    <input className={inputClasse} type="datetime-local" value={nrConsultaData} onChange={(e) => setNrConsultaData(e.target.value)} />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={nrConsultaRotina}
                        onChange={(e) => {
                          setNrConsultaRotina(e.target.checked);
                          if (e.target.checked) setNrConsultaEventoRelacionado('');
                        }}
                      />
                      Consulta de rotina (não ligada a nenhum evento de saúde)
                    </label>
                    {!nrConsultaRotina && (
                      <>
                        <select className={inputClasse} value={nrConsultaEventoRelacionado} onChange={(e) => setNrConsultaEventoRelacionado(e.target.value)}>
                          <option value="">ligada a qual evento de saúde?</option>
                          {condicoes.map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                          <option value="__novo__">+ Criar novo evento de saúde</option>
                        </select>
                        {nrConsultaEventoRelacionado === '__novo__' && (
                          <input
                            className={inputClasse}
                            placeholder="nome do novo evento de saúde"
                            value={nrConsultaNovoEventoNome}
                            onChange={(e) => setNrConsultaNovoEventoNome(e.target.value)}
                          />
                        )}
                      </>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrConsultaGerouMedicamento} onChange={(e) => setNrConsultaGerouMedicamento(e.target.checked)} />
                      Gerou medicamento
                    </label>
                    {nrConsultaGerouMedicamento && (
                      <div className="ml-2 space-y-2 border-l-2 border-teal-100 pl-3">
                        <input className={inputClasse} placeholder="nome do remédio" value={nrSubMedNome} onChange={(e) => setNrSubMedNome(e.target.value)} />
                        <input className={inputClasse} placeholder="dosagem (opcional)" value={nrSubMedDosagem} onChange={(e) => setNrSubMedDosagem(e.target.value)} />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={nrSubMedUsoContinuo} onChange={(e) => setNrSubMedUsoContinuo(e.target.checked)} />
                          Uso contínuo
                        </label>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">observação (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('nrConsultaObs', setNrConsultaObs)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'nrConsultaObs' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'nrConsultaObs' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea className={inputClasse} rows={2} value={nrConsultaObs} onChange={(e) => setNrConsultaObs(e.target.value)} />
                    </div>
                    {erroNovoRegistro && <p className="text-sm text-red-600">{erroNovoRegistro}</p>}
                    <button disabled={carregando} onClick={salvarNovoRegistro} className={botaoPrimario}>
                      {carregando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}

                {nrTipo === 'medicamento' && (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="🔎 buscar medicamento já cadastrado"
                      value={nrBusca}
                      onChange={(e) => setNrBusca(e.target.value)}
                    />
                    {nrBusca.trim() && (
                      <div className="space-y-1">
                        {medicacoes
                          .filter((m) => m.nome.toLowerCase().includes(nrBusca.trim().toLowerCase()))
                          .slice(0, 5)
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={() => { setTelaDetalhe('medicacoes'); abrirEdicaoMedicacao(m); }}
                              className="w-full text-left text-sm rounded-lg bg-[#FAFAF8] px-3 py-2 hover:bg-slate-100"
                            >
                              {m.nome}{m.dosagem && ` · ${m.dosagem}`}
                            </button>
                          ))}
                      </div>
                    )}
                    <p className="text-xs font-medium text-slate-500 pt-1">Novo medicamento</p>
                    <input className={inputClasse} placeholder="qual remédio" value={nrMedNome} onChange={(e) => setNrMedNome(e.target.value)} />
                    <input className={inputClasse} placeholder="dosagem (opcional)" value={nrMedDosagem} onChange={(e) => setNrMedDosagem(e.target.value)} />
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data de início</label>
                      <input className={inputClasse} type="date" value={nrMedData} onChange={(e) => setNrMedData(e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={nrMedUsoContinuo} onChange={(e) => setNrMedUsoContinuo(e.target.checked)} />
                      Uso contínuo
                    </label>
                    {!nrMedUsoContinuo && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de término</label>
                        <input className={inputClasse} type="date" value={nrMedDataFim} onChange={(e) => setNrMedDataFim(e.target.value)} />
                      </div>
                    )}
                    <select className={inputClasse} value={nrMedEventoRelacionado} onChange={(e) => setNrMedEventoRelacionado(e.target.value)}>
                      <option value="">relacionado a qual evento de saúde? (opcional)</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                      <option value="__novo__">+ Criar novo evento de saúde</option>
                    </select>
                    {nrMedEventoRelacionado === '__novo__' && (
                      <input
                        className={inputClasse}
                        placeholder="nome do novo evento de saúde"
                        value={nrMedNovoEventoNome}
                        onChange={(e) => setNrMedNovoEventoNome(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      placeholder="médico que receitou (opcional)"
                      list="lista-medicos-cadastrados"
                      value={nrMedMedicoReceitou}
                      onChange={(e) => setNrMedMedicoReceitou(e.target.value)}
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">observação (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('nrMedObs', setNrMedObs)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'nrMedObs' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'nrMedObs' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea className={inputClasse} rows={2} value={nrMedObs} onChange={(e) => setNrMedObs(e.target.value)} />
                    </div>
                    {erroNovoRegistro && <p className="text-sm text-red-600">{erroNovoRegistro}</p>}
                    <button disabled={carregando} onClick={salvarNovoRegistro} className={botaoPrimario}>
                      {carregando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {(telaDetalhe === 'condicoes' || telaDetalhe === 'cirurgias') && (() => {
              const ehCirurgias = telaDetalhe === 'cirurgias';
              const condicoesDaTela = condicoes.filter((c) => (ehCirurgias ? c.tipo !== 'doenca' : c.tipo === 'doenca'));
              return (
              <div className="space-y-3">
                {!mostrarFormCondicao && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{condicoesDaTela.length} registrado{condicoesDaTela.length === 1 ? '' : 's'}</p>
                    <button
                      onClick={() => abrirNovaCondicao(ehCirurgias ? 'cirurgia' : 'doenca')}
                      aria-label={ehCirurgias ? 'Nova cirurgia ou internação' : 'Novo evento de saúde'}
                      className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      {ehCirurgias ? 'nova' : 'novo'}
                    </button>
                  </div>
                )}
                {!mostrarFormCondicao && condicoesDaTela.length > 0 && (
                  <input
                    className={inputClasse}
                    placeholder="🔎 buscar por nome, tipo ou status"
                    value={buscaCondicao}
                    onChange={(e) => setBuscaCondicao(e.target.value)}
                  />
                )}
                {!mostrarFormCondicao && condicoesDaTela.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">
                    {ehCirurgias ? 'Nenhuma cirurgia ou internação registrada ainda.' : 'Nenhum evento de saúde registrado ainda.'}
                  </p>
                )}
                {!mostrarFormCondicao && condicoesDaTela
                  .filter((c) => {
                    const termo = buscaCondicao.trim().toLowerCase();
                    if (!termo) return true;
                    return (
                      c.nome.toLowerCase().includes(termo) ||
                      (tipoCondicaoLabels[c.tipo] || c.tipo).toLowerCase().includes(termo) ||
                      (statusCondicaoLabels[c.status] || c.status).toLowerCase().includes(termo)
                    );
                  })
                  .map((c) => {
                  const consultasLigadas = consultas.filter((cs) => cs.condicao_relacionada_id === c.id);
                  const medicacoesLigadas = medicacoes.filter((m) => m.condicao_relacionada_id === c.id);
                  return (
                  <div
                    key={c.id}
                    onClick={() => abrirResumoEvento(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') abrirResumoEvento(c); }}
                    className="w-full cursor-pointer rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{c.nome}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.relevante_geneticamente && (
                          <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">genético</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); abrirEdicaoCondicao(c); }}
                          aria-label="Editar evento de saúde"
                          className="text-slate-400 hover:text-teal-700"
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {tipoCondicaoLabels[c.tipo] || c.tipo} · {statusCondicaoLabels[c.status] || c.status}
                      {c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                    </p>
                    {c.observacao && <p className="text-xs text-slate-500 mt-1">📝 {c.observacao}</p>}
                    {c.orientacoes && <p className="text-xs text-teal-700 mt-1">💡 {c.orientacoes}</p>}
                    {(consultasLigadas.length > 0 || medicacoesLigadas.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {consultasLigadas.length > 0 && (
                          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            📅 {consultasLigadas.length} consulta{consultasLigadas.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {medicacoesLigadas.length > 0 && (
                          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            💊 {medicacoesLigadas.length} medicação{medicacoesLigadas.length > 1 ? 'ões' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })}

                {mostrarFormCondicao && (
                  <>
                    <button onClick={() => setMostrarFormCondicao(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <select
                      className={inputClasse}
                      value={novoTipoCondicao}
                      onChange={(e) => {
                        setNovoTipoCondicao(e.target.value);
                        setNovoNomeCondicao('');
                        setDoencaOutraNome('');
                      }}
                    >
                      <option value="doenca">Hipótese diagnóstica</option>
                      <option value="cirurgia">Cirurgia</option>
                      <option value="internacao">Internação</option>
                    </select>
                    {novoTipoCondicao === 'doenca' ? (
                      <>
                        <select
                          className={inputClasse}
                          value={novoNomeCondicao}
                          onChange={(e) => setNovoNomeCondicao(e.target.value)}
                        >
                          <option value="">selecione a hipótese diagnóstica</option>
                          {categoriasDoencas.map((cat) => (
                            <optgroup key={cat} label={cat}>
                              {doencasComuns.filter((d) => d.categoria === cat).map((d) => (
                                <option key={d.nome} value={d.nome}>{d.nome}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        {novoNomeCondicao === 'Outra doença (especificar)' && (
                          <input
                            className={inputClasse}
                            placeholder="qual hipótese diagnóstica?"
                            value={doencaOutraNome}
                            onChange={(e) => setDoencaOutraNome(e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <input
                        className={inputClasse}
                        placeholder={novoTipoCondicao === 'internacao' ? 'motivo da internação (ex: Pneumonia)' : 'nome da cirurgia (ex: Apendicectomia)'}
                        value={novoNomeCondicao}
                        onChange={(e) => setNovoNomeCondicao(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      type="date"
                      placeholder="data do diagnóstico/procedimento"
                      value={novaDataCondicao}
                      onChange={(e) => setNovaDataCondicao(e.target.value)}
                    />
                    <select className={inputClasse} value={novoStatusCondicao} onChange={(e) => setNovoStatusCondicao(e.target.value)}>
                      <option value="ativa">Ativa</option>
                      <option value="resolvida">Resolvida</option>
                      <option value="cronica">Crônica</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={novoRelevanteGenetico}
                        onChange={(e) => setNovoRelevanteGenetico(e.target.checked)}
                      />
                      Relevante geneticamente (aparece no histórico familiar)
                    </label>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">breve relato (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('obsCondicao', setNovaObservacaoCondicao)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'obsCondicao' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'obsCondicao' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="breve relato (opcional)"
                        rows={2}
                        value={novaObservacaoCondicao}
                        onChange={(e) => setNovaObservacaoCondicao(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">orientações (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('orientacaoCondicao', setNovaOrientacaoCondicao)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'orientacaoCondicao' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'orientacaoCondicao' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="orientações do médico, cuidados a seguir... (opcional)"
                        rows={2}
                        value={novaOrientacaoCondicao}
                        onChange={(e) => setNovaOrientacaoCondicao(e.target.value)}
                      />
                    </div>
                    {erroCondicao && <p className="text-sm text-red-600">{erroCondicao}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarCondicao} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormCondicao(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {condicaoEditandoId && (
                      <button disabled={carregando} onClick={excluirCondicao} className="w-full text-sm text-red-600 pt-1">
                        Excluir esta condição
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
              );
            })()}

            {telaDetalhe === 'eventoresumo' && (() => {
              const evento = condicoes.find((c) => c.id === condicaoResumoId);
              if (!evento) {
                return (
                  <div>
                    <p className="text-sm text-slate-400">Esse evento não foi encontrado.</p>
                    <button onClick={() => setTelaDetalhe('condicoes')} className="mt-3 text-sm text-teal-700">
                      ← Voltar pra Eventos de Saúde
                    </button>
                  </div>
                );
              }
              const telaDeOrigem: Aba = evento.tipo === 'doenca' ? 'condicoes' : 'cirurgias';
              const consultasDoEvento = consultas.filter((cs) => cs.condicao_relacionada_id === evento.id);
              const medicacoesDoEvento = medicacoes.filter((m) => m.condicao_relacionada_id === evento.id);
              return (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <button onClick={() => setTelaDetalhe(telaDeOrigem)} className="mb-1 text-sm text-teal-700">
                        ← {telaDeOrigem === 'condicoes' ? 'Eventos de Saúde' : 'Cirurgia/Internação'}
                      </button>
                      <h2 className="text-lg font-semibold text-slate-800">{evento.nome}</h2>
                      <p className="text-xs text-slate-400">
                        {tipoCondicaoLabels[evento.tipo] || evento.tipo} · {statusCondicaoLabels[evento.status] || evento.status}
                        {evento.data_diagnostico_ou_procedimento && ` · ${formatarData(evento.data_diagnostico_ou_procedimento)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setTelaDetalhe(telaDeOrigem); abrirEdicaoCondicao(evento); }}
                      className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-[#FAFAF8] hover:text-teal-700"
                      aria-label="Editar evento"
                    >
                      ✎ editar
                    </button>
                  </div>

                  {evento.observacao && <p className="text-sm text-slate-500">📝 {evento.observacao}</p>}
                  {evento.orientacoes && <p className="text-sm text-teal-700">💡 {evento.orientacoes}</p>}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">💊 Medicações</h3>
                      <button onClick={() => abrirNovaMedicacaoParaEvento(evento.id)} className="text-xs font-medium text-teal-700">
                        + nova
                      </button>
                    </div>
                    {medicacoesDoEvento.length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhuma medicação ligada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {medicacoesDoEvento.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { setTelaDetalhe('medicacoes'); abrirEdicaoMedicacao(m); }}
                            className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                          >
                            <p className="text-sm font-medium text-slate-800">{m.nome}</p>
                            <p className="text-xs text-slate-400">
                              {m.dosagem ? `${m.dosagem} · ` : ''}{m.data_fim ? `até ${formatarData(m.data_fim)}` : 'uso contínuo'}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">📅 Consultas</h3>
                      <button onClick={() => abrirNovaConsultaParaEvento(evento.id)} className="text-xs font-medium text-teal-700">
                        + nova
                      </button>
                    </div>
                    {consultasDoEvento.length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhuma consulta ligada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {consultasDoEvento.map((cs) => (
                          <button
                            key={cs.id}
                            onClick={() => { setTelaDetalhe('consultas'); abrirEdicaoConsulta(cs); }}
                            className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                          >
                            <p className="text-sm font-medium text-slate-800">{cs.especialidade?.nome || 'Consulta'}</p>
                            <p className="text-xs text-slate-400">{new Date(cs.data_hora).toLocaleDateString('pt-BR')}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">🧪 Exames</h3>
                      <button onClick={() => abrirNovoExameParaEvento(evento.id)} className="text-xs font-medium text-teal-700">
                        + novo
                      </button>
                    </div>
                    {exames.filter((e) => e.condicao_relacionada_id === evento.id).length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhum exame ligado ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {exames.filter((e) => e.condicao_relacionada_id === evento.id).map((e) => (
                          <button
                            key={e.id}
                            onClick={() => { setTelaDetalhe('exames'); abrirEdicaoExame(e); }}
                            className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                          >
                            <p className="text-sm font-medium text-slate-800">{e.nome}</p>
                            <p className="text-xs text-slate-400">{formatarData(e.data_realizacao)}{e.laboratorio ? ` · ${e.laboratorio}` : ''}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">💉 Vacinas</h3>
                      <button onClick={() => abrirNovaVacinaParaEvento(evento.id)} className="text-xs font-medium text-teal-700">
                        + nova
                      </button>
                    </div>
                    {vacinas.filter((v) => v.condicao_relacionada_id === evento.id).length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhuma vacina ligada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {vacinas.filter((v) => v.condicao_relacionada_id === evento.id).map((v) => (
                          <button
                            key={v.id}
                            onClick={() => { setTelaDetalhe('vacinas'); abrirEdicaoVacina(v); }}
                            className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                          >
                            <p className="text-sm font-medium text-slate-800">{v.nome}{v.dose ? ` — ${v.dose}` : ''}</p>
                            <p className="text-xs text-slate-400">{formatarData(v.data_aplicacao)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">📈 Crescimento</h3>
                      <button onClick={() => abrirNovaMedicaoCrescimentoParaEvento(evento.id)} className="text-xs font-medium text-teal-700">
                        + nova
                      </button>
                    </div>
                    {crescimento.filter((m) => m.condicao_relacionada_id === evento.id).length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhuma medição ligada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {crescimento.filter((m) => m.condicao_relacionada_id === evento.id).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { setTelaDetalhe('crescimento'); abrirEdicaoCrescimento(m); }}
                            className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                          >
                            <p className="text-sm font-medium text-slate-800">
                              {m.peso_kg != null ? `${m.peso_kg} kg` : ''}{m.peso_kg != null && m.altura_cm != null ? ' · ' : ''}{m.altura_cm != null ? `${m.altura_cm} cm` : ''}
                            </p>
                            <p className="text-xs text-slate-400">{formatarData(m.data_medicao)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {telaDetalhe === 'medicacoes' && (
              <div className="space-y-3">
                {!mostrarFormMedicacao ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{medicacoes.length} registrada{medicacoes.length === 1 ? '' : 's'}</p>
                      <button
                        onClick={abrirNovaMedicacao}
                        aria-label="Nova medicação"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        nova
                      </button>
                    </div>
                    {medicacoes.length > 0 && (
                      <input
                        className={inputClasse}
                        placeholder="🔎 buscar por nome ou classe (ex: antibiótico)"
                        value={buscaMedicacao}
                        onChange={(e) => setBuscaMedicacao(e.target.value)}
                      />
                    )}
                    {medicacoes.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma medicação registrada ainda.</p>
                    )}
                    {medicacoes
                      .filter((m) => {
                        const termo = buscaMedicacao.trim().toLowerCase();
                        if (!termo) return true;
                        const labelClasse = classesMedicamento.find((c) => c.value === m.classe)?.label || '';
                        return m.nome.toLowerCase().includes(termo) || labelClasse.toLowerCase().includes(termo);
                      })
                      .sort((a, b) => Number(!b.data_fim) - Number(!a.data_fim))
                      .map((m) => {
                      const continua = !m.data_fim;
                      const ativa = continua || (m.data_fim as string) >= new Date().toISOString().slice(0, 10);
                      const condicaoNome = condicoes.find((c) => c.id === m.condicao_relacionada_id)?.nome;
                      const consultaLigada = consultas.find((cs) => cs.id === m.consulta_relacionada_id);
                      const labelClasse = classesMedicamento.find((c) => c.value === m.classe)?.label;
                      return (
                        <button
                          key={m.id}
                          onClick={() => abrirEdicaoMedicacao(m)}
                          className={`w-full rounded-xl border p-3 text-left transition hover:bg-[#FAFAF8] ${continua ? 'border-teal-200 bg-teal-50/40' : 'border-[#E5E1DA]'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800">{m.nome} ✎</p>
                            {continua ? (
                              <span className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 bg-teal-600 text-white">
                                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>
                                uso contínuo
                              </span>
                            ) : (
                              <span className={`text-xs rounded-full px-2 py-0.5 ${ativa ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                                {ativa ? 'ativa' : 'encerrada'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {[m.dosagem, m.frequencia, m.horario && `às ${m.horario}`].filter(Boolean).join(' · ')}
                          </p>
                          {labelClasse && (
                            <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                              {labelClasse}
                            </span>
                          )}
                          {condicaoNome && (
                            <p className="text-xs text-slate-400 mt-1">Para: {condicaoNome}</p>
                          )}
                          {consultaLigada && (
                            <p className="text-xs text-slate-400 mt-1">
                              Receitada em: {consultaLigada.especialidade?.nome || 'consulta'} de {new Date(consultaLigada.data_hora).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {m.observacao && <p className="text-xs text-slate-500 mt-1">📝 {m.observacao}</p>}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <button onClick={() => setMostrarFormMedicacao(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="nome do remédio"
                      value={novoNomeMedicacao}
                      onChange={(e) => setNovoNomeMedicacao(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="dosagem (ex: 500mg)"
                      value={novaDosagem}
                      onChange={(e) => setNovaDosagem(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="frequência (ex: 1x ao dia, a cada 8h)"
                      value={novaFrequencia}
                      onChange={(e) => setNovaFrequencia(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="horário (ex: 08:00, 20:00)"
                      value={novoHorario}
                      onChange={(e) => setNovoHorario(e.target.value)}
                    />
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data de início</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataInicioMed}
                        onChange={(e) => setNovaDataInicioMed(e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={usoContinuo} onChange={(e) => setUsoContinuo(e.target.checked)} />
                      Uso contínuo (sem data de término)
                    </label>
                    {!usoContinuo && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de término (se deixar em branco, usa a data de hoje)</label>
                        <input
                          className={inputClasse}
                          type="date"
                          value={novaDataFimMed}
                          onChange={(e) => setNovaDataFimMed(e.target.value)}
                        />
                      </div>
                    )}
                    <select
                      className={inputClasse}
                      value={novaCondicaoRelacionada}
                      onChange={(e) => {
                        setNovaCondicaoRelacionada(e.target.value);
                        setNovaConsultaRelacionadaMed('');
                      }}
                    >
                      <option value="">não relacionado a nenhum evento de saúde específico</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <select
                      className={inputClasse}
                      value={novaConsultaRelacionadaMed}
                      onChange={(e) => setNovaConsultaRelacionadaMed(e.target.value)}
                    >
                      <option value="">não veio de nenhuma consulta específica</option>
                      {consultas
                        .filter((cs) => !novaCondicaoRelacionada || cs.condicao_relacionada_id === novaCondicaoRelacionada)
                        .map((cs) => (
                          <option key={cs.id} value={cs.id}>
                            {(cs.especialidade?.nome || 'Consulta')} · {new Date(cs.data_hora).toLocaleDateString('pt-BR')}
                            {cs.profissional_saude?.nome ? ` · ${cs.profissional_saude.nome}` : ''}
                          </option>
                        ))}
                    </select>
                    {novaCondicaoRelacionada && consultas.filter((cs) => cs.condicao_relacionada_id === novaCondicaoRelacionada).length === 0 && (
                      <p className="text-xs text-slate-400 -mt-1">Nenhuma consulta ligada a esse evento ainda — pode deixar em branco.</p>
                    )}
                    <select
                      className={inputClasse}
                      value={novaClasseMedicacao}
                      onChange={(e) => setNovaClasseMedicacao(e.target.value)}
                    >
                      <option value="">classe do remédio (opcional)</option>
                      {classesMedicamento.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">observação (ex: motivo de uso)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('obsMedicacao', setNovaObservacaoMedicacao)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'obsMedicacao' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'obsMedicacao' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="observação (ex: motivo de uso)"
                        rows={2}
                        value={novaObservacaoMedicacao}
                        onChange={(e) => setNovaObservacaoMedicacao(e.target.value)}
                      />
                    </div>
                    {erroMedicacao && <p className="text-sm text-red-600">{erroMedicacao}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarMedicacao} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormMedicacao(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {medicacaoEditandoId && (
                      <button disabled={carregando} onClick={excluirMedicacao} className="w-full text-sm text-red-600 pt-1">
                        Excluir esta medicação
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            )}

            {(telaDetalhe === 'consultas' || telaDetalhe === 'odontologia' || telaDetalhe === 'nutricionista') && (() => {
              const especialidadesFiltroTela: Record<string, string[]> = {
                odontologia: ['Odontologia', 'Ortodontia'],
                nutricionista: ['Nutrição'],
              };
              const filtroEsp = especialidadesFiltroTela[telaDetalhe as string] || null;
              const especialidadePadraoTela = telaDetalhe === 'odontologia' ? 'Odontologia' : telaDetalhe === 'nutricionista' ? 'Nutrição' : '';
              const consultasDaTela = filtroEsp ? consultas.filter((c) => filtroEsp.includes(c.especialidade?.nome || '')) : consultas;
              const nomeVazio = telaDetalhe === 'odontologia' ? 'Nenhuma consulta de odontologia registrada ainda.' : telaDetalhe === 'nutricionista' ? 'Nenhuma consulta com nutricionista registrada ainda.' : 'Nenhuma consulta registrada ainda.';
              return (
              <div className="space-y-3">
                {!mostrarFormConsulta ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{consultasDaTela.length} registrada{consultasDaTela.length === 1 ? '' : 's'}</p>
                      <button
                        onClick={() => abrirNovaConsulta(especialidadePadraoTela)}
                        aria-label="Nova consulta"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        nova
                      </button>
                    </div>
                    {consultasDaTela.length > 0 && (
                      <input
                        className={inputClasse}
                        placeholder="🔎 buscar por especialidade ou profissional"
                        value={buscaConsulta}
                        onChange={(e) => setBuscaConsulta(e.target.value)}
                      />
                    )}
                    {consultasDaTela.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">{nomeVazio}</p>
                    )}
                    {consultasDaTela
                      .filter((c) => {
                        const termo = buscaConsulta.trim().toLowerCase();
                        if (!termo) return true;
                        return (
                          (c.especialidade?.nome || '').toLowerCase().includes(termo) ||
                          (c.profissional_saude?.nome || '').toLowerCase().includes(termo)
                        );
                      })
                      .map((c) => {
                      const dh = new Date(c.data_hora);
                      const dataFormatada = dh.toLocaleDateString('pt-BR');
                      const horaFormatada = dh.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const statusEstilo =
                        c.status === 'realizada'
                          ? 'bg-teal-100 text-teal-700'
                          : c.status === 'cancelada'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-700';
                      const condicaoLigadaNome = condicoes.find((cd) => cd.id === c.condicao_relacionada_id)?.nome;
                      return (
                        <button
                          key={c.id}
                          onClick={() => abrirEdicaoConsulta(c)}
                          className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800">{c.especialidade?.nome || 'Especialidade'} ✎</p>
                            <span className={`text-xs rounded-full px-2 py-0.5 ${statusEstilo}`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {dataFormatada} às {horaFormatada}
                            {c.profissional_saude?.nome && ` · ${c.profissional_saude.nome}`}
                            {c.local && ` · ${c.local}`}
                          </p>
                          {c.motivo && <p className="text-xs text-slate-400 mt-1">Motivo: {c.motivo}</p>}
                          {condicaoLigadaNome && (
                            <p className="text-xs text-slate-400 mt-1">Sobre: {condicaoLigadaNome}</p>
                          )}
                          {c.anotacoes && <p className="text-xs text-slate-500 mt-1">📝 {c.anotacoes}</p>}
                          {c.data_retorno_sugerida && (
                            <span className="inline-block mt-1 mr-1 text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                              retorno: {formatarData(c.data_retorno_sugerida)}
                            </span>
                          )}
                          {c.forma_atendimento && (
                            <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                              {c.forma_atendimento === 'particular' ? `Particular${c.valor_pago ? ` · R$ ${c.valor_pago.toFixed(2)}` : ''}` : 'Plano de saúde'}
                              {c.solicitou_reembolso ? ' · reembolso' : ''}
                              {c.incluir_ir ? ' · IR' : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <button onClick={() => setMostrarFormConsulta(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <select
                      className={inputClasse}
                      value={novaEspecialidadeConsulta}
                      onChange={(e) => setNovaEspecialidadeConsulta(e.target.value)}
                    >
                      <option value="">especialidade</option>
                      {especialidadesMedicas.map((esp) => (
                        <option key={esp} value={esp}>{esp}</option>
                      ))}
                    </select>
                    {novaEspecialidadeConsulta === 'Outros' && (
                      <input
                        className={inputClasse}
                        placeholder="qual especialidade?"
                        value={especialidadeOutroConsulta}
                        onChange={(e) => setEspecialidadeOutroConsulta(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      placeholder="profissional (opcional, ex: Dr. João Silva)"
                      list="lista-medicos-cadastrados"
                      value={novoProfissionalConsulta}
                      onChange={(e) => setNovoProfissionalConsulta(e.target.value)}
                    />
                    <datalist id="lista-medicos-cadastrados">
                      {medicos.map((m) => (
                        <option key={m.id} value={m.nome} />
                      ))}
                    </datalist>
                    {medicos.length > 0 && (
                      <p className="text-xs text-slate-400 -mt-1">
                        💡 Digite o mesmo nome de um médico já cadastrado em “Médicos” para reaproveitar os dados dele.
                      </p>
                    )}
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data e hora</label>
                      <input
                        className={inputClasse}
                        type="datetime-local"
                        value={novaDataHoraConsulta}
                        onChange={(e) => setNovaDataHoraConsulta(e.target.value)}
                      />
                    </div>
                    <input
                      className={inputClasse}
                      placeholder="local (opcional)"
                      value={novoLocalConsulta}
                      onChange={(e) => setNovoLocalConsulta(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="motivo (opcional)"
                      value={novoMotivoConsulta}
                      onChange={(e) => setNovoMotivoConsulta(e.target.value)}
                    />
                    <select
                      className={inputClasse}
                      value={novaCondicaoRelacionadaConsulta}
                      onChange={(e) => setNovaCondicaoRelacionadaConsulta(e.target.value)}
                    >
                      <option value="">essa consulta é sobre qual evento de saúde? (opcional)</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <select
                      className={inputClasse}
                      value={novoStatusConsulta}
                      onChange={(e) => setNovoStatusConsulta(e.target.value)}
                    >
                      <option value="agendada">Agendada</option>
                      <option value="realizada">Realizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">o que o médico disse, o que acompanhar, exames pedidos... (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('anotacaoConsulta', setNovaAnotacaoConsulta)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'anotacaoConsulta' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'anotacaoConsulta' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="o que o médico disse, o que acompanhar, exames pedidos... (opcional)"
                        rows={3}
                        value={novaAnotacaoConsulta}
                        onChange={(e) => setNovaAnotacaoConsulta(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">agendar retorno (opcional)</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataRetornoConsulta}
                        onChange={(e) => setNovaDataRetornoConsulta(e.target.value)}
                      />
                    </div>

                    <div className="rounded-xl border border-[#E5E1DA] p-3 space-y-3">
                      <p className="text-xs font-medium text-slate-500">Financeiro / reembolso</p>
                      <div className="flex rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setNovaFormaAtendimento('plano_saude')}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${novaFormaAtendimento === 'plano_saude' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                        >
                          Plano de saúde
                        </button>
                        <button
                          type="button"
                          onClick={() => setNovaFormaAtendimento('particular')}
                          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${novaFormaAtendimento === 'particular' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}
                        >
                          Particular
                        </button>
                      </div>
                      {novaFormaAtendimento === 'particular' && (
                        <input
                          className={inputClasse}
                          placeholder="valor pago (ex: 250,00)"
                          value={novoValorPagoConsulta}
                          onChange={(e) => setNovoValorPagoConsulta(e.target.value)}
                        />
                      )}
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={novoSolicitouReembolso}
                          onChange={(e) => setNovoSolicitouReembolso(e.target.checked)}
                        />
                        Solicitou reembolso
                      </label>
                      {novoSolicitouReembolso && (
                        <input
                          className={inputClasse}
                          placeholder="valor reembolsado (opcional)"
                          value={novoValorReembolsado}
                          onChange={(e) => setNovoValorReembolsado(e.target.value)}
                        />
                      )}
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={novoIncluirIr}
                          onChange={(e) => setNovoIncluirIr(e.target.checked)}
                        />
                        Incluir na declaração de IR
                      </label>
                      <input
                        className={inputClasse}
                        placeholder="obs. financeira (ex: nome do plano, nº do recibo)"
                        value={novaObsFinanceira}
                        onChange={(e) => setNovaObsFinanceira(e.target.value)}
                      />
                    </div>
                    {erroConsulta && <p className="text-sm text-red-600">{erroConsulta}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarConsulta} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormConsulta(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {consultaEditandoId && (
                      <button disabled={carregando} onClick={excluirConsulta} className="w-full text-sm text-red-600 pt-1">
                        Excluir esta consulta
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
              );
            })()}

            {telaDetalhe === 'medicos' && (
              <div className="space-y-3">
                {!mostrarFormMedico && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{medicos.length} cadastrado{medicos.length === 1 ? '' : 's'}</p>
                      <button
                        onClick={abrirNovoMedico}
                        aria-label="Novo médico"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        novo
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Esses profissionais ficam disponíveis para todos os membros da família — não precisa cadastrar de novo para um irmão que usa o mesmo médico.
                    </p>
                    {medicos.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhum médico cadastrado ainda.</p>
                    )}
                    {medicos.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => abrirEdicaoMedico(m)}
                        className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                      >
                        <p className="font-medium text-slate-800">{m.nome} ✎</p>
                        <p className="text-xs text-slate-400">
                          {[m.especialidade, m.telefone, m.local].filter(Boolean).join(' · ')}
                        </p>
                        {m.observacao && <p className="text-xs text-slate-500 mt-1">📝 {m.observacao}</p>}
                      </button>
                    ))}
                  </>
                )}

                {mostrarFormMedico && (
                  <>
                    <button onClick={() => setMostrarFormMedico(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="nome (ex: Dr. João Silva)"
                      value={novoNomeMedico}
                      onChange={(e) => setNovoNomeMedico(e.target.value)}
                    />
                    <select
                      className={inputClasse}
                      value={novaEspecialidadeMedico}
                      onChange={(e) => setNovaEspecialidadeMedico(e.target.value)}
                    >
                      <option value="">especialidade (opcional)</option>
                      {especialidadesMedicas.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    {novaEspecialidadeMedico === 'Outros' && (
                      <input
                        className={inputClasse}
                        placeholder="qual especialidade?"
                        value={especialidadeOutraMedico}
                        onChange={(e) => setEspecialidadeOutraMedico(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      placeholder="telefone (opcional)"
                      value={novoTelefoneMedico}
                      onChange={(e) => setNovoTelefoneMedico(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="local/clínica (opcional)"
                      value={novoLocalMedico}
                      onChange={(e) => setNovoLocalMedico(e.target.value)}
                    />
                    <textarea
                      className={inputClasse}
                      placeholder="observação (opcional)"
                      rows={2}
                      value={novaObsMedico}
                      onChange={(e) => setNovaObsMedico(e.target.value)}
                    />
                    {erroMedico && <p className="text-sm text-red-600">{erroMedico}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarMedico} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormMedico(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {medicoEditandoId && (
                      <button disabled={carregando} onClick={excluirMedico} className="w-full text-sm text-red-600 pt-1">
                        Excluir este médico
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            )}

            {telaDetalhe === 'exames' && (
              <div className="space-y-3">
                {!mostrarFormExame && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{exames.length} registrado{exames.length === 1 ? '' : 's'}</p>
                      <button
                        onClick={abrirNovoExame}
                        aria-label="Novo exame"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        novo
                      </button>
                    </div>
                    {exames.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhum exame registrado ainda.</p>
                    )}
                    {exames.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => abrirEdicaoExame(e)}
                        className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">{e.nome} ✎</p>
                          <span className="text-xs text-slate-400">{formatarData(e.data_realizacao)}</span>
                        </div>
                        {e.laboratorio && <p className="text-xs text-slate-400">{e.laboratorio}</p>}
                        {e.resultado_resumo && <p className="text-xs text-slate-500 mt-1">📋 {e.resultado_resumo}</p>}
                      </button>
                    ))}
                  </>
                )}

                {mostrarFormExame && (
                  <>
                    <button onClick={() => setMostrarFormExame(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input
                      className={inputClasse}
                      placeholder="nome do exame (ex: Hemograma completo)"
                      value={novoNomeExame}
                      onChange={(e) => setNovoNomeExame(e.target.value)}
                    />
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data de realização</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataExame}
                        onChange={(e) => setNovaDataExame(e.target.value)}
                      />
                    </div>
                    <input
                      className={inputClasse}
                      placeholder="laboratório (opcional)"
                      value={novoLaboratorioExame}
                      onChange={(e) => setNovoLaboratorioExame(e.target.value)}
                    />
                    <select className={inputClasse} value={novaCondicaoRelacionadaExame} onChange={(e) => setNovaCondicaoRelacionadaExame(e.target.value)}>
                      <option value="">relacionado a qual evento de saúde? (opcional)</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">resumo do resultado (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('resultadoExame', setNovoResultadoExame)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'resultadoExame' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'resultadoExame' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="resumo do resultado (opcional)"
                        rows={3}
                        value={novoResultadoExame}
                        onChange={(e) => setNovoResultadoExame(e.target.value)}
                      />
                    </div>
                    {erroExame && <p className="text-sm text-red-600">{erroExame}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarExame} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormExame(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {exameEditandoId && (
                      <button disabled={carregando} onClick={excluirExame} className="w-full text-sm text-red-600 pt-1">
                        Excluir este exame
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            )}

            {telaDetalhe === 'vacinas' && (
              <div className="space-y-3">
                {!mostrarFormVacina && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{vacinas.length} registrada{vacinas.length === 1 ? '' : 's'}</p>
                      <button
                        onClick={abrirNovaVacina}
                        aria-label="Nova vacina"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        nova
                      </button>
                    </div>
                    {vacinas.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma vacina registrada ainda.</p>
                    )}
                    {vacinas.map((v) => {
                      const proximaVencida = !!v.proxima_dose_data && v.proxima_dose_data < new Date().toISOString().slice(0, 10);
                      return (
                        <button
                          key={v.id}
                          onClick={() => abrirEdicaoVacina(v)}
                          className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800">{v.nome} ✎</p>
                            <span className="text-xs text-slate-400">{formatarData(v.data_aplicacao)}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {[v.dose, v.proxima_dose_data && `próxima dose: ${formatarData(v.proxima_dose_data)}`].filter(Boolean).join(' · ')}
                          </p>
                          {proximaVencida && (
                            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                              próxima dose atrasada
                            </span>
                          )}
                          {v.observacoes && <p className="text-xs text-slate-500 mt-1">📝 {v.observacoes}</p>}
                        </button>
                      );
                    })}
                  </>
                )}

                {mostrarFormVacina && (
                  <>
                    <button onClick={() => setMostrarFormVacina(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <select
                      className={inputClasse}
                      value={novoNomeVacina}
                      onChange={(e) => {
                        setNovoNomeVacina(e.target.value);
                        setVacinaOutroNome('');
                      }}
                    >
                      <option value="">selecione a vacina</option>
                      {vacinasComuns.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {novoNomeVacina === 'Outra (especificar)' && (
                      <input
                        className={inputClasse}
                        placeholder="qual vacina?"
                        value={vacinaOutroNome}
                        onChange={(e) => setVacinaOutroNome(e.target.value)}
                      />
                    )}
                    <input
                      className={inputClasse}
                      placeholder="dose (ex: 1ª dose, reforço)"
                      value={novaDoseVacina}
                      onChange={(e) => setNovaDoseVacina(e.target.value)}
                    />
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data de aplicação</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataVacina}
                        onChange={(e) => setNovaDataVacina(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">próxima dose (opcional)</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaProximaDoseVacina}
                        onChange={(e) => setNovaProximaDoseVacina(e.target.value)}
                      />
                    </div>
                    <select className={inputClasse} value={novaCondicaoRelacionadaVacina} onChange={(e) => setNovaCondicaoRelacionadaVacina(e.target.value)}>
                      <option value="">relacionada a qual evento de saúde? (opcional)</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">observações (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('obsVacina', setNovaObsVacina)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'obsVacina' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'obsVacina' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="observações (opcional)"
                        rows={2}
                        value={novaObsVacina}
                        onChange={(e) => setNovaObsVacina(e.target.value)}
                      />
                    </div>
                    {erroVacina && <p className="text-sm text-red-600">{erroVacina}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarVacina} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormVacina(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {vacinaEditandoId && (
                      <button disabled={carregando} onClick={excluirVacina} className="w-full text-sm text-red-600 pt-1">
                        Excluir esta vacina
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            )}

            {telaDetalhe === 'nascimento' && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-xl bg-[#FAFAF8] p-3 mb-2">
                  {membroSelecionado.foto_url ? (
                    <img
                      src={membroSelecionado.foto_url}
                      alt={membroSelecionado.nome}
                      className="h-16 w-16 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-xl">
                      {membroSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-slate-400">Foto do perfil</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-full bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700">
                        {enviandoFoto ? 'Enviando...' : membroSelecionado.foto_url ? 'Trocar foto' : 'Adicionar foto'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={enviandoFoto}
                          onChange={(e) => {
                            const arquivo = e.target.files?.[0];
                            if (arquivo) salvarFotoMembro(arquivo);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {membroSelecionado.foto_url && (
                        <button
                          type="button"
                          disabled={enviandoFoto}
                          onClick={removerFotoMembro}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    {erroFoto && <p className="text-xs text-red-600">{erroFoto}</p>}
                  </div>
                </div>

                <div className="space-y-3 mb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#FAFAF8] p-3">
                      <p className="text-xs text-slate-400">Data de nascimento</p>
                      <p className="text-sm font-medium text-slate-800">{formatarData(membroSelecionado.data_nascimento)}</p>
                    </div>
                    <div className="rounded-xl bg-[#FAFAF8] p-3">
                      <p className="text-xs text-slate-400">Sexo biológico</p>
                      <p className="text-sm font-medium text-slate-800 capitalize">{membroSelecionado.sexo_biologico}</p>
                    </div>

                    {!editandoTipo ? (
                      <button
                        onClick={() => {
                          setValorTipoEdit(membroSelecionado.tipo_sanguineo || '');
                          setEditandoTipo(true);
                        }}
                        className="rounded-xl bg-[#FAFAF8] p-3 text-left transition hover:bg-slate-100"
                      >
                        <p className="text-xs text-slate-400">Tipo sanguíneo ✎</p>
                        <p className="text-sm font-medium text-slate-800">{membroSelecionado.tipo_sanguineo || 'toque para informar'}</p>
                      </button>
                    ) : (
                      <div className="rounded-xl bg-[#FAFAF8] p-3">
                        <p className="text-xs text-slate-400 mb-1">Tipo sanguíneo</p>
                        <select
                          autoFocus
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                          value={valorTipoEdit}
                          onChange={(e) => salvarTipoSanguineo(e.target.value)}
                          onBlur={() => setEditandoTipo(false)}
                        >
                          <option value="">selecione</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    )}

                    <div className="rounded-xl bg-[#FAFAF8] p-3">
                      <p className="text-xs text-slate-400">Idade</p>
                      <p className="text-sm font-medium text-slate-800">{calcularIdade(membroSelecionado.data_nascimento)} anos</p>
                    </div>

                    {!editandoParentesco ? (
                      <button
                        onClick={() => {
                          setValorParentescoEdit(membroSelecionado.parentesco || '');
                          setEditandoParentesco(true);
                        }}
                        className="col-span-2 rounded-xl bg-[#FAFAF8] p-3 text-left transition hover:bg-slate-100"
                      >
                        <p className="text-xs text-slate-400">Grau de parentesco ✎</p>
                        <p className="text-sm font-medium text-slate-800">
                          {opcoesParentesco.find((p) => p.value === membroSelecionado.parentesco)?.label || 'toque para informar'}
                        </p>
                      </button>
                    ) : (
                      <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3">
                        <p className="text-xs text-slate-400 mb-1">Grau de parentesco</p>
                        <select
                          autoFocus
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-800"
                          value={valorParentescoEdit}
                          onChange={(e) => salvarParentesco(e.target.value)}
                          onBlur={() => setEditandoParentesco(false)}
                        >
                          <option value="">selecione</option>
                          {opcoesParentesco.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {!editandoObs ? (
                    <button
                      onClick={() => {
                        setValorObsEdit(membroSelecionado.observacoes_gerais || '');
                        setEditandoObs(true);
                      }}
                      className="w-full rounded-xl bg-[#FAFAF8] p-3 text-left transition hover:bg-slate-100"
                    >
                      <p className="text-xs text-slate-400">Observações ✎</p>
                      <p className="text-sm text-slate-700">{membroSelecionado.observacoes_gerais || 'toque para adicionar'}</p>
                    </button>
                  ) : (
                    <div className="rounded-xl bg-[#FAFAF8] p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">Observações</p>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('obsGeral', setValorObsEdit)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'obsGeral' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'obsGeral' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        autoFocus
                        className={inputClasse}
                        rows={3}
                        value={valorObsEdit}
                        onChange={(e) => setValorObsEdit(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button disabled={carregando} onClick={salvarObservacoes} className={botaoPrimario}>
                          {carregando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditandoObs(false)} className={botaoSecundario}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {erroEdicao && <p className="text-sm text-red-600">{erroEdicao}</p>}

                  {(() => {
                    const condicoesAtivas = condicoes.filter((c) => c.tipo !== 'cirurgia' && (c.status === 'ativa' || c.status === 'cronica'));
                    if (condicoesAtivas.length === 0) return null;
                    return (
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs text-amber-700 font-medium mb-1">Condições ativas/crônicas (de Evento de Saúde)</p>
                        <p className="text-sm text-amber-900">
                          {condicoesAtivas.map((c) => c.nome).join(', ')}
                        </p>
                      </div>
                    );
                  })()}

                  {!editandoAlergias ? (
                    <button
                      onClick={() => {
                        setValorAlergiasEdit(membroSelecionado.alergias || '');
                        setEditandoAlergias(true);
                      }}
                      className="w-full rounded-xl bg-red-50 p-3 text-left transition hover:bg-red-100"
                    >
                      <p className="text-xs text-red-600 font-medium">⚠️ Alergias e condições importantes ✎</p>
                      <p className="text-sm text-red-900">{membroSelecionado.alergias || 'toque para adicionar (ex: alergia a penicilina)'}</p>
                    </button>
                  ) : (
                    <div className="rounded-xl bg-red-50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-red-600 font-medium">⚠️ Alergias e condições importantes</p>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('alergiasMembro', setValorAlergiasEdit)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'alergiasMembro' ? 'bg-red-200 text-red-800 animate-pulse' : 'bg-white text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'alergiasMembro' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        autoFocus
                        className={inputClasse}
                        rows={2}
                        placeholder="ex: alergia a penicilina, alergia a amendoim..."
                        value={valorAlergiasEdit}
                        onChange={(e) => setValorAlergiasEdit(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button disabled={carregando} onClick={salvarAlergias} className={botaoPrimario}>
                          {carregando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditandoAlergias(false)} className={botaoSecundario}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {telaDetalhe === 'gestacao' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Informações sobre a gestação, o parto e o período neonatal — útil pra médicos entenderem o histórico desde o início.
                </p>
                {!mostrarFormNascimento ? (
                  <>
                    {!nascimento ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Pré-natal</p>
                          <p className="text-sm font-medium text-slate-800 capitalize">
                            {nascimento.pre_natal_adequado || '—'}
                            {nascimento.pre_natal_num_consultas != null ? ` · ${nascimento.pre_natal_num_consultas} consultas` : ''}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Peso ao nascer</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.peso_nascimento != null ? `${nascimento.peso_nascimento} kg` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Comprimento ao nascer</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.comprimento_nascimento != null ? `${nascimento.comprimento_nascimento} cm` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Perímetro cefálico</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.perimetro_cefalico != null ? `${nascimento.perimetro_cefalico} cm` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Idade gestacional</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.idade_gestacional_semanas != null ? `${nascimento.idade_gestacional_semanas} semanas` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Tipo de parto</p>
                          <p className="text-sm font-medium text-slate-800 capitalize">{nascimento.tipo_parto || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Apgar</p>
                          <p className="text-sm font-medium text-slate-800">
                            {nascimento.apgar_1min != null || nascimento.apgar_5min != null
                              ? `${nascimento.apgar_1min ?? '—'} / ${nascimento.apgar_5min ?? '—'}`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">UTI neonatal</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.uti_neonatal ? 'Sim' : 'Não'}</p>
                        </div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3">
                          <p className="text-xs text-slate-400">Local de nascimento</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.local_nascimento || '—'}</p>
                        </div>
                        {nascimento.uso_substancias_medicacoes && (
                          <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3">
                            <p className="text-xs text-slate-400">Uso de substâncias/medicações na gestação</p>
                            <p className="text-sm text-slate-700">{nascimento.uso_substancias_medicacoes}</p>
                          </div>
                        )}
                        {nascimento.intercorrencias_gestacionais && (
                          <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3">
                            <p className="text-xs text-slate-400">Intercorrências gestacionais</p>
                            <p className="text-sm text-slate-700">{nascimento.intercorrencias_gestacionais}</p>
                          </div>
                        )}
                        {nascimento.intercorrencias && (
                          <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3">
                            <p className="text-xs text-slate-400">Intercorrências neonatais</p>
                            <p className="text-sm text-slate-700">{nascimento.intercorrencias}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={abrirEdicaoNascimento} className={botaoPrimario}>
                      {nascimento ? 'Editar informações' : '+ Adicionar informações'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <p className="text-xs font-medium text-slate-500">Pré-natal</p>
                    <select
                      className={inputClasse}
                      value={novoPreNatalAdequado}
                      onChange={(e) => setNovoPreNatalAdequado(e.target.value)}
                    >
                      <option value="">pré-natal foi adequado?</option>
                      <option value="adequado">Adequado</option>
                      <option value="inadequado">Inadequado</option>
                    </select>
                    <input
                      className={inputClasse}
                      placeholder="número de consultas do pré-natal (opcional)"
                      value={novoPreNatalNumConsultas}
                      onChange={(e) => setNovoPreNatalNumConsultas(e.target.value)}
                    />
                    <textarea
                      className={inputClasse}
                      placeholder="intercorrências gestacionais (opcional)"
                      rows={2}
                      value={novasIntercorrenciasGestacionais}
                      onChange={(e) => setNovasIntercorrenciasGestacionais(e.target.value)}
                    />
                    <textarea
                      className={inputClasse}
                      placeholder="uso de substâncias/medicações na gestação (opcional)"
                      rows={2}
                      value={novoUsoSubstancias}
                      onChange={(e) => setNovoUsoSubstancias(e.target.value)}
                    />
                    <p className="text-xs font-medium text-slate-500 pt-1">Parto e nascimento</p>
                    <input
                      className={inputClasse}
                      placeholder="peso ao nascer (kg, ex: 3,250)"
                      value={novoPesoNascimento}
                      onChange={(e) => setNovoPesoNascimento(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="comprimento ao nascer (cm, ex: 49)"
                      value={novoComprimentoNascimento}
                      onChange={(e) => setNovoComprimentoNascimento(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="perímetro cefálico (cm, opcional)"
                      value={novoPerimetroCefalico}
                      onChange={(e) => setNovoPerimetroCefalico(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="idade gestacional (semanas)"
                      value={novaIdadeGestacional}
                      onChange={(e) => setNovaIdadeGestacional(e.target.value)}
                    />
                    <select
                      className={inputClasse}
                      value={novoTipoParto}
                      onChange={(e) => setNovoTipoParto(e.target.value)}
                    >
                      <option value="">tipo de parto</option>
                      <option value="normal">Normal</option>
                      <option value="cesarea">Cesárea</option>
                      <option value="forceps">Fórceps</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        className={inputClasse}
                        placeholder="Apgar 1º minuto"
                        value={novoApgar1}
                        onChange={(e) => setNovoApgar1(e.target.value)}
                      />
                      <input
                        className={inputClasse}
                        placeholder="Apgar 5º minuto"
                        value={novoApgar5}
                        onChange={(e) => setNovoApgar5(e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={novoUtiNeonatal}
                        onChange={(e) => setNovoUtiNeonatal(e.target.checked)}
                      />
                      Precisou de UTI neonatal
                    </label>
                    <input
                      className={inputClasse}
                      placeholder="hospital/local de nascimento (opcional)"
                      value={novoLocalNascimento}
                      onChange={(e) => setNovoLocalNascimento(e.target.value)}
                    />
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-slate-400">intercorrências neonatais (opcional)</label>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('intercorrencias', setNovasIntercorrencias)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'intercorrencias' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                        >
                          🎤 {gravandoCampo === 'intercorrencias' ? 'Ouvindo...' : 'Falar'}
                        </button>
                      </div>
                      <textarea
                        className={inputClasse}
                        placeholder="intercorrências neonatais (opcional)"
                        rows={3}
                        value={novasIntercorrencias}
                        onChange={(e) => setNovasIntercorrencias(e.target.value)}
                      />
                    </div>
                    {erroNascimento && <p className="text-sm text-red-600">{erroNascimento}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarNascimento} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormNascimento(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'menupessoal' && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500 mb-2">Escolha o que você quer ver ou preencher.</p>
                {itensMenuPessoal().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTelaDetalhe(item.id)}
                    className="w-full flex items-center gap-3 rounded-xl border border-[#E5E1DA] bg-white p-3 text-left transition hover:bg-[#FAFAF8]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-teal-700">
                      {iconeSecao(item.id, 18)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-400">{item.descricao}</p>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                ))}
              </div>
            )}

            {telaDetalhe === 'desenvolvimento' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Marcos do desenvolvimento neuropsicomotor — registre a idade ou período em que cada um aconteceu, quando souber.</p>
                {!mostrarFormDesenvolvimento ? (
                  <>
                    {!desenvolvimento ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Sustentou a cabeça</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.sustentou_cabeca || '—'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Sentou</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.sentou || '—'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Engatinhou</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.engatinhou || '—'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Andou</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.andou || '—'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Primeiras palavras</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.primeiras_palavras || '—'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Desenvolvimento adequado</p><p className="text-sm font-medium text-slate-800">{desenvolvimento.desenvolvimento_adequado == null ? '—' : desenvolvimento.desenvolvimento_adequado ? 'Sim' : 'Não'}</p></div>
                        {desenvolvimento.observacao && (
                          <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Observações</p><p className="text-sm text-slate-700">{desenvolvimento.observacao}</p></div>
                        )}
                      </div>
                    )}
                    <button onClick={abrirEdicaoDesenvolvimento} className={botaoPrimario}>{desenvolvimento ? 'Editar' : '+ Adicionar'}</button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input className={inputClasse} placeholder="sustentou a cabeça (ex: 3 meses)" value={formDesenvolvimento.sustentou_cabeca} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, sustentou_cabeca: e.target.value }))} />
                    <input className={inputClasse} placeholder="sentou (ex: 6 meses)" value={formDesenvolvimento.sentou} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, sentou: e.target.value }))} />
                    <input className={inputClasse} placeholder="engatinhou (ex: 8 meses)" value={formDesenvolvimento.engatinhou} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, engatinhou: e.target.value }))} />
                    <input className={inputClasse} placeholder="andou (ex: 1 ano)" value={formDesenvolvimento.andou} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, andou: e.target.value }))} />
                    <input className={inputClasse} placeholder="primeiras palavras (ex: 1 ano e 2 meses)" value={formDesenvolvimento.primeiras_palavras} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, primeiras_palavras: e.target.value }))} />
                    <select className={inputClasse} value={formDesenvolvimento.desenvolvimento_adequado} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, desenvolvimento_adequado: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">desenvolvimento adequado?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <textarea className={inputClasse} rows={2} placeholder="observações (opcional)" value={formDesenvolvimento.observacao} onChange={(e) => setFormDesenvolvimento((f) => ({ ...f, observacao: e.target.value }))} />
                    {erroDesenvolvimento && <p className="text-sm text-red-600">{erroDesenvolvimento}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarDesenvolvimento} className={botaoPrimario}>{carregando ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={() => setMostrarFormDesenvolvimento(false)} className={botaoSecundario}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'alimentacaoinfantil' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Aleitamento materno, fórmula e como foi a introdução alimentar.</p>
                {!mostrarFormAlimentacaoInfantil ? (
                  <>
                    {!alimentacaoInfantil ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Aleitamento materno</p><p className="text-sm font-medium text-slate-800">{alimentacaoInfantil.aleitamento_materno == null ? '—' : alimentacaoInfantil.aleitamento_materno ? 'Sim' : 'Não'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Exclusivo até</p><p className="text-sm font-medium text-slate-800">{alimentacaoInfantil.aleitamento_exclusivo_meses != null ? `${alimentacaoInfantil.aleitamento_exclusivo_meses} meses` : '—'}</p></div>
                        {alimentacaoInfantil.formula && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Fórmula</p><p className="text-sm text-slate-700">{alimentacaoInfantil.formula}</p></div>}
                        {alimentacaoInfantil.introducao_alimentar && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Introdução alimentar</p><p className="text-sm text-slate-700">{alimentacaoInfantil.introducao_alimentar}</p></div>}
                        {alimentacaoInfantil.aceitacao_alimentar && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Aceitação alimentar</p><p className="text-sm text-slate-700">{alimentacaoInfantil.aceitacao_alimentar}</p></div>}
                      </div>
                    )}
                    <button onClick={abrirEdicaoAlimentacaoInfantil} className={botaoPrimario}>{alimentacaoInfantil ? 'Editar' : '+ Adicionar'}</button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <select className={inputClasse} value={formAlimentacaoInfantil.aleitamento_materno} onChange={(e) => setFormAlimentacaoInfantil((f) => ({ ...f, aleitamento_materno: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">houve aleitamento materno?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <input className={inputClasse} placeholder="exclusivo até quantos meses (opcional)" value={formAlimentacaoInfantil.aleitamento_exclusivo_meses} onChange={(e) => setFormAlimentacaoInfantil((f) => ({ ...f, aleitamento_exclusivo_meses: e.target.value }))} />
                    <input className={inputClasse} placeholder="fórmula usada (opcional)" value={formAlimentacaoInfantil.formula} onChange={(e) => setFormAlimentacaoInfantil((f) => ({ ...f, formula: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="como foi a introdução alimentar (opcional)" value={formAlimentacaoInfantil.introducao_alimentar} onChange={(e) => setFormAlimentacaoInfantil((f) => ({ ...f, introducao_alimentar: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="aceitação alimentar (opcional)" value={formAlimentacaoInfantil.aceitacao_alimentar} onChange={(e) => setFormAlimentacaoInfantil((f) => ({ ...f, aceitacao_alimentar: e.target.value }))} />
                    {erroAlimentacaoInfantil && <p className="text-sm text-red-600">{erroAlimentacaoInfantil}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarAlimentacaoInfantil} className={botaoPrimario}>{carregando ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={() => setMostrarFormAlimentacaoInfantil(false)} className={botaoSecundario}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'puberdade' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Informações sobre puberdade e vida sexual — fica só entre você e quem tiver acesso a este perfil.</p>
                {!mostrarFormPuberdade ? (
                  <>
                    {!puberdadeSexualidade ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {puberdadeSexualidade.menarca_espermarca && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Menarca/espermarca</p><p className="text-sm text-slate-700">{puberdadeSexualidade.menarca_espermarca}</p></div>}
                        {puberdadeSexualidade.ciclo_menstrual && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Ciclo menstrual</p><p className="text-sm text-slate-700">{puberdadeSexualidade.ciclo_menstrual}</p></div>}
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Vida sexual ativa</p><p className="text-sm font-medium text-slate-800">{puberdadeSexualidade.vida_sexual_ativa == null ? '—' : puberdadeSexualidade.vida_sexual_ativa ? 'Sim' : 'Não'}</p></div>
                        {puberdadeSexualidade.metodos_contraceptivos && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Métodos contraceptivos</p><p className="text-sm text-slate-700">{puberdadeSexualidade.metodos_contraceptivos}</p></div>}
                        {puberdadeSexualidade.historico_ist && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Histórico de ISTs</p><p className="text-sm text-slate-700">{puberdadeSexualidade.historico_ist}</p></div>}
                      </div>
                    )}
                    <button onClick={abrirEdicaoPuberdade} className={botaoPrimario}>{puberdadeSexualidade ? 'Editar' : '+ Adicionar'}</button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input className={inputClasse} placeholder="menarca/espermarca (ex: 12 anos)" value={formPuberdade.menarca_espermarca} onChange={(e) => setFormPuberdade((f) => ({ ...f, menarca_espermarca: e.target.value }))} />
                    <input className={inputClasse} placeholder="ciclo menstrual (opcional)" value={formPuberdade.ciclo_menstrual} onChange={(e) => setFormPuberdade((f) => ({ ...f, ciclo_menstrual: e.target.value }))} />
                    <select className={inputClasse} value={formPuberdade.vida_sexual_ativa} onChange={(e) => setFormPuberdade((f) => ({ ...f, vida_sexual_ativa: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">vida sexual ativa?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <input className={inputClasse} placeholder="métodos contraceptivos (opcional)" value={formPuberdade.metodos_contraceptivos} onChange={(e) => setFormPuberdade((f) => ({ ...f, metodos_contraceptivos: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="histórico de ISTs (opcional)" value={formPuberdade.historico_ist} onChange={(e) => setFormPuberdade((f) => ({ ...f, historico_ist: e.target.value }))} />
                    {erroPuberdade && <p className="text-sm text-red-600">{erroPuberdade}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarPuberdade} className={botaoPrimario}>{carregando ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={() => setMostrarFormPuberdade(false)} className={botaoSecundario}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'saudemental' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Humor e pontos de atenção emocional.</p>
                {(saudeMental?.ideacao_suicida || saudeMental?.automutilacao) && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs text-amber-800">
                      Se isso ainda for uma preocupação atual, vale buscar apoio profissional (psicólogo/psiquiatra) o quanto antes — e, em caso de risco imediato, o CVV (188) atende 24h.
                    </p>
                  </div>
                )}
                {!mostrarFormSaudeMental ? (
                  <>
                    {!saudeMental ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {saudeMental.humor && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Humor</p><p className="text-sm text-slate-700">{saudeMental.humor}</p></div>}
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Ansiedade</p><p className="text-sm font-medium text-slate-800">{saudeMental.ansiedade == null ? '—' : saudeMental.ansiedade ? 'Sim' : 'Não'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Tristeza persistente</p><p className="text-sm font-medium text-slate-800">{saudeMental.tristeza_persistente == null ? '—' : saudeMental.tristeza_persistente ? 'Sim' : 'Não'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Ideação suicida</p><p className="text-sm font-medium text-slate-800">{saudeMental.ideacao_suicida == null ? '—' : saudeMental.ideacao_suicida ? 'Sim' : 'Não'}</p></div>
                        <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Automutilação</p><p className="text-sm font-medium text-slate-800">{saudeMental.automutilacao == null ? '—' : saudeMental.automutilacao ? 'Sim' : 'Não'}</p></div>
                        {saudeMental.observacao && <div className="col-span-2 rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Observações</p><p className="text-sm text-slate-700">{saudeMental.observacao}</p></div>}
                      </div>
                    )}
                    <button onClick={abrirEdicaoSaudeMental} className={botaoPrimario}>{saudeMental ? 'Editar' : '+ Adicionar'}</button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <input className={inputClasse} placeholder="como está o humor (opcional)" value={formSaudeMental.humor} onChange={(e) => setFormSaudeMental((f) => ({ ...f, humor: e.target.value }))} />
                    <select className={inputClasse} value={formSaudeMental.ansiedade} onChange={(e) => setFormSaudeMental((f) => ({ ...f, ansiedade: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">tem ansiedade?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <select className={inputClasse} value={formSaudeMental.tristeza_persistente} onChange={(e) => setFormSaudeMental((f) => ({ ...f, tristeza_persistente: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">tristeza persistente?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <select className={inputClasse} value={formSaudeMental.ideacao_suicida} onChange={(e) => setFormSaudeMental((f) => ({ ...f, ideacao_suicida: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">ideação suicida?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <select className={inputClasse} value={formSaudeMental.automutilacao} onChange={(e) => setFormSaudeMental((f) => ({ ...f, automutilacao: e.target.value as '' | 'sim' | 'nao' }))}>
                      <option value="">automutilação?</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                    <textarea className={inputClasse} rows={2} placeholder="observações (opcional)" value={formSaudeMental.observacao} onChange={(e) => setFormSaudeMental((f) => ({ ...f, observacao: e.target.value }))} />
                    {erroSaudeMental && <p className="text-sm text-red-600">{erroSaudeMental}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarSaudeMental} className={botaoPrimario}>{carregando ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={() => setMostrarFormSaudeMental(false)} className={botaoSecundario}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'habitosvida' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Alimentação do dia a dia, atividade física, sono e uso de telas.</p>
                {!mostrarFormHabitosVida ? (
                  <>
                    {!habitosVida ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação registrada ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {habitosVida.alimentacao && <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Alimentação</p><p className="text-sm text-slate-700">{habitosVida.alimentacao}</p></div>}
                        {habitosVida.atividade_fisica && <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Atividade física</p><p className="text-sm text-slate-700">{habitosVida.atividade_fisica}</p></div>}
                        {habitosVida.sono && <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Sono</p><p className="text-sm text-slate-700">{habitosVida.sono}</p></div>}
                        {habitosVida.uso_telas && <div className="rounded-xl bg-[#FAFAF8] p-3"><p className="text-xs text-slate-400">Uso de telas</p><p className="text-sm text-slate-700">{habitosVida.uso_telas}</p></div>}
                      </div>
                    )}
                    <button onClick={abrirEdicaoHabitosVida} className={botaoPrimario}>{habitosVida ? 'Editar' : '+ Adicionar'}</button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <textarea className={inputClasse} rows={2} placeholder="alimentação do dia a dia (opcional)" value={formHabitosVida.alimentacao} onChange={(e) => setFormHabitosVida((f) => ({ ...f, alimentacao: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="atividade física (opcional)" value={formHabitosVida.atividade_fisica} onChange={(e) => setFormHabitosVida((f) => ({ ...f, atividade_fisica: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="sono (opcional)" value={formHabitosVida.sono} onChange={(e) => setFormHabitosVida((f) => ({ ...f, sono: e.target.value }))} />
                    <textarea className={inputClasse} rows={2} placeholder="uso de telas (opcional)" value={formHabitosVida.uso_telas} onChange={(e) => setFormHabitosVida((f) => ({ ...f, uso_telas: e.target.value }))} />
                    {erroHabitosVida && <p className="text-sm text-red-600">{erroHabitosVida}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarHabitosVida} className={botaoPrimario}>{carregando ? 'Salvando...' : 'Salvar'}</button>
                      <button onClick={() => setMostrarFormHabitosVida(false)} className={botaoSecundario}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'crescimento' && (
              <div className="space-y-3">
                {!mostrarFormCrescimento && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{crescimento.length} registrada{crescimento.length === 1 ? '' : 's'}</p>
                    <button
                      onClick={abrirNovaMedicaoCrescimento}
                      aria-label="Nova medição"
                      className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                    >
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      nova
                    </button>
                  </div>
                )}
                {!mostrarFormCrescimento && crescimento.length >= 2 && (
                  <div className="rounded-xl border border-[#E5E1DA] p-3">
                    <p className="text-xs font-medium text-slate-500 mb-2">Peso (kg) ao longo do tempo</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={crescimento.map((m) => ({
                        data: formatarData(m.data_medicao),
                        peso: m.peso_kg,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="peso" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Peso (kg)" />
                      </LineChart>
                    </ResponsiveContainer>
                    <p className="text-xs font-medium text-slate-500 mb-2 mt-4">Altura (cm) ao longo do tempo</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={crescimento.map((m) => ({
                        data: formatarData(m.data_medicao),
                        altura: m.altura_cm,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="altura" stroke="#0369a1" strokeWidth={2} dot={{ r: 3 }} name="Altura (cm)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {!mostrarFormCrescimento && crescimento.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma medição registrada ainda.</p>
                )}

                {!mostrarFormCrescimento && [...crescimento].reverse().map((m) => {
                  const idadeMeses = calcularIdadeEmMeses(membroSelecionado.data_nascimento, m.data_medicao);
                  const zscores = calcularZScoresOMS(membroSelecionado.sexo_biologico, idadeMeses, m.peso_kg, m.altura_cm);
                  const imc = calcularIMC(m.peso_kg, m.altura_cm);
                  const ehAdulto = idadeMeses >= 216; // 18 anos — faixa em que a classificação de IMC de adulto vale
                  return (
                    <button
                      key={m.id}
                      onClick={() => abrirEdicaoCrescimento(m)}
                      className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800">{formatarData(m.data_medicao)} ✎</p>
                        <span className="text-xs text-slate-400">{formatarIdadeEmMeses(idadeMeses)}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {[m.peso_kg != null && `${m.peso_kg} kg`, m.altura_cm != null && `${m.altura_cm} cm`, imc != null && `IMC ${imc.toFixed(1)}`].filter(Boolean).join(' · ')}
                      </p>
                      {(zscores || (ehAdulto && imc != null)) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {zscores?.zPeso != null && (
                            <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                              {classificarZScorePeso(zscores.zPeso)} (z={zscores.zPeso.toFixed(2)})
                            </span>
                          )}
                          {zscores?.zAltura != null && (
                            <span className="text-xs bg-sky-50 text-sky-700 rounded-full px-2 py-0.5">
                              {classificarZScoreAltura(zscores.zAltura)} (z={zscores.zAltura.toFixed(2)})
                            </span>
                          )}
                          {ehAdulto && imc != null && (
                            <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                              {classificarIMC(imc)}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}

                {mostrarFormCrescimento && (
                  <>
                    <button onClick={() => setMostrarFormCrescimento(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">data da medição</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataCrescimento}
                        onChange={(e) => setNovaDataCrescimento(e.target.value)}
                      />
                    </div>
                    <input
                      className={inputClasse}
                      placeholder="peso (kg, opcional)"
                      value={novoPesoCrescimento}
                      onChange={(e) => setNovoPesoCrescimento(e.target.value)}
                    />
                    <input
                      className={inputClasse}
                      placeholder="altura (cm, opcional)"
                      value={novaAlturaCrescimento}
                      onChange={(e) => setNovaAlturaCrescimento(e.target.value)}
                    />
                    <select className={inputClasse} value={novaCondicaoRelacionadaCrescimento} onChange={(e) => setNovaCondicaoRelacionadaCrescimento(e.target.value)}>
                      <option value="">relacionada a qual evento de saúde? (opcional)</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    {erroCrescimento && <p className="text-sm text-red-600">{erroCrescimento}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={salvarMedicaoCrescimento} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormCrescimento(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                    {crescimentoEditandoId && (
                      <button disabled={carregando} onClick={excluirMedicaoCrescimento} className="w-full text-sm text-red-600 pt-1">
                        Excluir esta medição
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            )}

            {telaDetalhe === 'riscos' && (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs text-amber-800">
                    Estas são sugestões gerais com base no histórico da família, não um diagnóstico. Converse sempre com um médico antes de mudar sua rotina de exames.
                  </p>
                </div>

                {!membroSelecionado.parentesco && (
                  <p className="text-sm text-slate-400 text-center py-2">
                    Para calcular os cuidados preventivos, primeiro informe o grau de parentesco deste membro em “Dados pessoais” (nos três risquinhos no topo).
                  </p>
                )}

                {membroSelecionado.parentesco && riscos == null && (
                  <p className="text-sm text-slate-400 text-center py-2">Carregando...</p>
                )}

                {membroSelecionado.parentesco && riscos != null && historicoGeral != null && riscos.length === 0 && historicoGeral.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">
                    Nenhuma condição genética marcada na família até agora. Isso pode mudar conforme mais parentes de sangue tiverem seus parentescos e condições registrados.
                  </p>
                )}

                {membroSelecionado.parentesco && (riscos?.length || historicoGeral?.length) ? (
                  <select
                    className={inputClasse}
                    value={filtroEspecialidadeRisco}
                    onChange={(e) => setFiltroEspecialidadeRisco(e.target.value)}
                  >
                    <option value="">todas as especialidades</option>
                    {categoriasDoencas.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : null}

                {membroSelecionado.parentesco && riscos != null && riscos
                  .filter((r) => !filtroEspecialidadeRisco || r.categoria === filtroEspecialidadeRisco)
                  .map((r) => (
                  <div key={r.id} className="rounded-xl border border-[#E5E1DA] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block mb-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                          {r.categoria}
                        </span>
                        <p className="text-sm text-slate-800">{r.mensagem}</p>
                      </div>
                      {r.naIdadeRecomendada ? (
                        <span className="shrink-0 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">considerar agora</span>
                      ) : (
                        <span className="shrink-0 text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                          a partir dos {r.idadeRecomendada}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {membroSelecionado.parentesco && historicoGeral != null && historicoGeral.filter((nome) => !filtroEspecialidadeRisco || obterCategoriaDoenca(nome) === filtroEspecialidadeRisco).length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      Outras condições genéticas na família (sem uma orientação de rastreio específica, mas vale mencionar ao médico)
                    </p>
                    <div className="space-y-2">
                      {historicoGeral
                        .filter((nome) => !filtroEspecialidadeRisco || obterCategoriaDoenca(nome) === filtroEspecialidadeRisco)
                        .map((nome) => (
                        <div key={nome} className="rounded-xl border border-[#E5E1DA] p-3">
                          <span className="inline-block mb-1 text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            {obterCategoriaDoenca(nome)}
                          </span>
                          <p className="text-sm text-slate-800">{nome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {telaDetalhe === 'bemestar' && (() => {
              const consultasNutricionista = consultas.filter((c) => (c.especialidade?.nome || '') === 'Nutrição');
              return (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Escolha o que você quer acompanhar.</p>
                  <button
                    onClick={() => setTelaDetalhe('nutricionista')}
                    className="w-full flex items-center gap-3 rounded-xl border border-[#E5E1DA] bg-white p-3 text-left transition hover:bg-[#FAFAF8]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-teal-700">
                      {iconeSecao('nutricionista', 18)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Nutricionista</p>
                      <p className="text-xs text-slate-400">
                        {consultasNutricionista.length > 0
                          ? `${consultasNutricionista.length} consulta${consultasNutricionista.length > 1 ? 's' : ''} registrada${consultasNutricionista.length > 1 ? 's' : ''}`
                          : 'nenhuma consulta registrada ainda'}
                      </p>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                  <button
                    onClick={() => setTelaDetalhe('esportes')}
                    className="w-full flex items-center gap-3 rounded-xl border border-[#E5E1DA] bg-white p-3 text-left transition hover:bg-[#FAFAF8]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-teal-700">
                      {iconeSecao('esportes', 18)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Exercícios/Esportes</p>
                      <p className="text-xs text-slate-400">em breve</p>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              );
            })()}

            {telaDetalhe === 'esportes' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-dashed border-[#E5E1DA] bg-[#FAFAF8] p-4 text-center">
                  <p className="text-sm text-slate-600 mb-1">Ainda estamos construindo essa parte</p>
                  <p className="text-xs text-slate-400">
                    Em breve você vai poder registrar os esportes/exercícios de cada pessoa, com duração e nível.
                  </p>
                </div>
                <button onClick={() => setTelaDetalhe('bemestar')} className="text-sm text-teal-700">
                  ← Voltar pra Bem-estar
                </button>
              </div>
            )}
          </div>

        )}
      </div>
    </main>
  );
}
