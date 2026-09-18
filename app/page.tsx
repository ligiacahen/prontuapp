'use client';

import { useState, useEffect } from 'react';
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
  classe: string | null;
  observacao: string | null;
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
  'Neurocirurgia', 'Neurologia', 'Nutrição', 'Nutrologia', 'Odontologia', 'Oftalmologia',
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
};

type Exame = {
  id: string;
  nome: string;
  data_realizacao: string;
  laboratorio: string | null;
  resultado_resumo: string | null;
};

type Vacina = {
  id: string;
  nome: string;
  dose: string | null;
  data_aplicacao: string;
  proxima_dose_data: string | null;
  observacoes: string | null;
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
};

type MedicaoCrescimento = {
  id: string;
  data_medicao: string;
  peso_kg: number | null;
  altura_cm: number | null;
};

type Passo = 'login' | 'cadastro' | 'onboarding' | 'painel';
type Aba = 'geral' | 'condicoes' | 'medicacoes' | 'consultas' | 'exames' | 'vacinas' | 'nascimento' | 'crescimento' | 'riscos';

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
  doenca: 'Doença',
  cirurgia: 'Cirurgia',
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
  const [erroEdicao, setErroEdicao] = useState('');

  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [telaDetalhe, setTelaDetalhe] = useState<Aba | null>(null);

  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  const [mostrarFormCondicao, setMostrarFormCondicao] = useState(false);
  const [novoTipoCondicao, setNovoTipoCondicao] = useState('doenca');
  const [novoNomeCondicao, setNovoNomeCondicao] = useState('');
  const [novaDataCondicao, setNovaDataCondicao] = useState('');
  const [novoStatusCondicao, setNovoStatusCondicao] = useState('ativa');
  const [novoRelevanteGenetico, setNovoRelevanteGenetico] = useState(false);
  const [novaObservacaoCondicao, setNovaObservacaoCondicao] = useState('');
  const [doencaOutraNome, setDoencaOutraNome] = useState('');
  const [erroCondicao, setErroCondicao] = useState('');
  const [condicaoEditandoId, setCondicaoEditandoId] = useState<string | null>(null);

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
  const [erroConsulta, setErroConsulta] = useState('');
  const [gravandoCampo, setGravandoCampo] = useState<string | null>(null);
  const [consultaEditandoId, setConsultaEditandoId] = useState<string | null>(null);
  const [buscaConsulta, setBuscaConsulta] = useState('');

  const [confirmandoExclusaoMembro, setConfirmandoExclusaoMembro] = useState(false);

  const [exames, setExames] = useState<Exame[]>([]);
  const [mostrarFormExame, setMostrarFormExame] = useState(false);
  const [novoNomeExame, setNovoNomeExame] = useState('');
  const [novaDataExame, setNovaDataExame] = useState('');
  const [novoLaboratorioExame, setNovoLaboratorioExame] = useState('');
  const [novoResultadoExame, setNovoResultadoExame] = useState('');
  const [erroExame, setErroExame] = useState('');
  const [exameEditandoId, setExameEditandoId] = useState<string | null>(null);

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
  const [erroNascimento, setErroNascimento] = useState('');

  const [crescimento, setCrescimento] = useState<MedicaoCrescimento[]>([]);
  const [mostrarFormCrescimento, setMostrarFormCrescimento] = useState(false);
  const [novaDataCrescimento, setNovaDataCrescimento] = useState('');
  const [novoPesoCrescimento, setNovoPesoCrescimento] = useState('');
  const [novaAlturaCrescimento, setNovaAlturaCrescimento] = useState('');
  const [erroCrescimento, setErroCrescimento] = useState('');
  const [crescimentoEditandoId, setCrescimentoEditandoId] = useState<string | null>(null);

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
      carregarCrescimento(membroSelecionado.id);
      carregarRiscosGeneticos(membroSelecionado);
    } else {
      setCondicoes([]);
      setMedicacoes([]);
      setConsultas([]);
      setExames([]);
      setVacinas([]);
      setNascimento(null);
      setCrescimento([]);
      setRiscos(null);
      setHistoricoGeral(null);
    }
    setEditandoTipo(false);
    setEditandoObs(false);
    setEditandoParentesco(false);
  }, [membroSelecionado]);

  async function carregarMembros() {
    const { data, error } = await supabase
      .from('membro')
      .select('id, nome, data_nascimento, sexo_biologico, tipo_sanguineo, observacoes_gerais, data_falecimento, parentesco')
      .is('data_falecimento', null)
      .order('nome');
    if (!error && data) setMembros(data);
  }

  async function carregarCondicoes(membroId: string) {
    const { data, error } = await supabase
      .from('condicao')
      .select('id, tipo, nome, data_diagnostico_ou_procedimento, status, relevante_geneticamente, observacao')
      .eq('membro_id', membroId)
      .order('data_diagnostico_ou_procedimento', { ascending: false });
    if (!error && data) setCondicoes(data);
  }

  async function carregarMedicacoes(membroId: string) {
    const { data, error } = await supabase
      .from('medicacao')
      .select('id, nome, dosagem, frequencia, horario, data_inicio, data_fim, condicao_relacionada_id, classe, observacao')
      .eq('membro_id', membroId)
      .order('data_inicio', { ascending: false });
    if (!error && data) setMedicacoes(data);
  }

  async function carregarConsultas(membroId: string) {
    const { data, error } = await supabase
      .from('consulta')
      .select('id, data_hora, local, motivo, anotacoes, status, especialidade(nome), profissional_saude(nome), data_retorno_sugerida, forma_atendimento, valor_pago, solicitou_reembolso, valor_reembolsado, incluir_ir, obs_financeira')
      .eq('membro_id', membroId)
      .order('data_hora', { ascending: true });
    if (!error && data) setConsultas(data as any);
  }

  async function carregarExames(membroId: string) {
    const { data, error } = await supabase
      .from('exame')
      .select('id, nome, data_realizacao, laboratorio, resultado_resumo')
      .eq('membro_id', membroId)
      .order('data_realizacao', { ascending: false });
    if (!error && data) setExames(data);
  }

  async function carregarVacinas(membroId: string) {
    const { data, error } = await supabase
      .from('vacina')
      .select('id, nome, dose, data_aplicacao, proxima_dose_data, observacoes')
      .eq('membro_id', membroId)
      .order('data_aplicacao', { ascending: false });
    if (!error && data) setVacinas(data);
  }

  async function carregarNascimento(membroId: string) {
    const { data, error } = await supabase
      .from('informacao_nascimento')
      .select('id, peso_nascimento, comprimento_nascimento, perimetro_cefalico, idade_gestacional_semanas, tipo_parto, apgar_1min, apgar_5min, uti_neonatal, intercorrencias, local_nascimento')
      .eq('membro_id', membroId)
      .maybeSingle();
    if (!error) setNascimento(data);
  }

  async function carregarCrescimento(membroId: string) {
    const { data, error } = await supabase
      .from('medicao_crescimento')
      .select('id, data_medicao, peso_kg, altura_cm')
      .eq('membro_id', membroId)
      .order('data_medicao', { ascending: true });
    if (!error && data) setCrescimento(data);
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
    await carregarMembros();
  }

  function abrirNovaCondicao() {
    setCondicaoEditandoId(null);
    setNovoTipoCondicao('doenca');
    setNovoNomeCondicao('');
    setDoencaOutraNome('');
    setNovaDataCondicao('');
    setNovoStatusCondicao('ativa');
    setNovoRelevanteGenetico(false);
    setNovaObservacaoCondicao('');
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
    setErroCondicao('');
    setMostrarFormCondicao(true);
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
      data_fim: usoContinuo ? null : (novaDataFimMed || null),
      condicao_relacionada_id: novaCondicaoRelacionada || null,
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
    setNovaClasseMedicacao('');
    setNovaObservacaoMedicacao('');
    setMostrarFormMedicacao(false);
    await carregarMedicacoes(membroSelecionado.id);
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

  function abrirNovaConsulta() {
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
      setMostrarFormConsulta(false);
      await carregarConsultas(membroSelecionado.id);
    } catch (e: any) {
      setErroConsulta(e.message || 'Erro ao salvar consulta.');
    }
    setCarregando(false);
  }

  async function excluirMembro() {
    if (!membroSelecionado) return;
    setCarregando(true);
    const membroId = membroSelecionado.id;
    // Apaga registros relacionados primeiro, caso o banco não tenha ON DELETE CASCADE configurado.
    await supabase.from('condicao').delete().eq('membro_id', membroId);
    await supabase.from('medicacao').delete().eq('membro_id', membroId);
    await supabase.from('consulta').delete().eq('membro_id', membroId);
    await supabase.from('exame').delete().eq('membro_id', membroId);
    await supabase.from('vacina').delete().eq('membro_id', membroId);
    const { error } = await supabase.from('membro').delete().eq('id', membroId);
    setCarregando(false);
    if (error) {
      setErro(error.message);
      setConfirmandoExclusaoMembro(false);
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
    setErroExame('');
    setMostrarFormExame(true);
  }

  function abrirEdicaoExame(e: Exame) {
    setExameEditandoId(e.id);
    setNovoNomeExame(e.nome);
    setNovaDataExame(e.data_realizacao);
    setNovoLaboratorioExame(e.laboratorio || '');
    setNovoResultadoExame(e.resultado_resumo || '');
    setErroExame('');
    setMostrarFormExame(true);
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
    setMostrarFormExame(false);
    await carregarExames(membroSelecionado.id);
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
    setErroVacina('');
    setMostrarFormVacina(true);
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
    setMostrarFormVacina(false);
    await carregarVacinas(membroSelecionado.id);
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

    const camposInvalidos: string[] = [];
    if (Number.isNaN(peso)) camposInvalidos.push('peso ao nascer');
    if (Number.isNaN(comprimento)) camposInvalidos.push('comprimento ao nascer');
    if (Number.isNaN(perimetro)) camposInvalidos.push('perímetro cefálico');
    if (Number.isNaN(idadeGestacional)) camposInvalidos.push('idade gestacional');
    if (Number.isNaN(apgar1)) camposInvalidos.push('Apgar 1º minuto');
    if (Number.isNaN(apgar5)) camposInvalidos.push('Apgar 5º minuto');

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

  function abrirNovaMedicaoCrescimento() {
    setCrescimentoEditandoId(null);
    setNovaDataCrescimento('');
    setNovoPesoCrescimento('');
    setNovaAlturaCrescimento('');
    setErroCrescimento('');
    setMostrarFormCrescimento(true);
  }

  function abrirEdicaoCrescimento(m: MedicaoCrescimento) {
    setCrescimentoEditandoId(m.id);
    setNovaDataCrescimento(m.data_medicao);
    setNovoPesoCrescimento(m.peso_kg != null ? String(m.peso_kg) : '');
    setNovaAlturaCrescimento(m.altura_cm != null ? String(m.altura_cm) : '');
    setErroCrescimento('');
    setMostrarFormCrescimento(true);
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
    setMostrarFormCrescimento(false);
    await carregarCrescimento(membroSelecionado.id);
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

  async function carregarRiscosGeneticos(membro: Membro) {
    if (!membro.parentesco) {
      setRiscos(null);
      setHistoricoGeral(null);
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
      setRiscos([]);
      setHistoricoGeral([]);
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
      setRiscos([]);
      setHistoricoGeral([]);
      return;
    }

    const { data: condicoesFamilia } = await supabase
      .from('condicao')
      .select('nome')
      .in('membro_id', idsDeSangue)
      .eq('relevante_geneticamente', true);

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

  const inputClasse =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const botaoPrimario =
    'w-full rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50';
  const botaoSecundario =
    'w-full rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50';

  const secoes: { id: Aba; label: string; icone: string }[] = [
    { id: 'condicoes', label: 'Condições', icone: '🩺' },
    { id: 'medicacoes', label: 'Medicações', icone: '💊' },
    { id: 'consultas', label: 'Consultas', icone: '📅' },
    { id: 'exames', label: 'Exames', icone: '🧪' },
    { id: 'vacinas', label: 'Vacinas', icone: '💉' },
    { id: 'nascimento', label: 'Ficha Pessoal', icone: '🪪' },
    { id: 'crescimento', label: 'Crescimento', icone: '📈' },
    { id: 'riscos', label: 'Cuidados Preventivos', icone: '🧬' },
  ];

  const larguraContainer = membroSelecionado ? 'max-w-2xl' : 'max-w-sm';

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className={`w-full ${larguraContainer} rounded-2xl bg-white p-8 shadow-sm border border-slate-100 transition-all`}>
        {!membroSelecionado && (
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white text-xl font-bold">
              P
            </div>
            <h1 className="text-xl font-semibold text-slate-800">ProntuApp</h1>
            <p className="text-sm text-slate-400 mt-1">Saúde da sua família, organizada</p>
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
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold">
                    {m.nome.charAt(0).toUpperCase()}
                  </div>
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
              <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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

            <div className="border-t border-slate-100 pt-4 text-center space-y-2">
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
            <button onClick={() => setMembroSelecionado(null)} className="mb-4 text-sm text-teal-700">
              ← Voltar
            </button>

            <button
              onClick={() => setTelaDetalhe('nascimento')}
              className="mb-6 flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-lg">
                {membroSelecionado.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{membroSelecionado.nome}</h2>
                <p className="text-xs text-slate-400">{calcularIdade(membroSelecionado.data_nascimento)} anos · toque para ver a ficha pessoal</p>
              </div>
            </button>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {secoes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setTelaDetalhe(s.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl transition group-hover:bg-teal-100">
                    {s.icone}
                  </div>
                  <span className="text-xs font-medium text-slate-600 text-center">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 border-t border-slate-100 pt-4">
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
                    <button onClick={() => setConfirmandoExclusaoMembro(false)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
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
            <button onClick={() => setTelaDetalhe(null)} className="mb-4 text-sm text-teal-700">
              ← Voltar
            </button>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{secoes.find((s) => s.id === telaDetalhe)?.icone}</span>
              <h2 className="text-lg font-semibold text-slate-800">
                {secoes.find((s) => s.id === telaDetalhe)?.label}
              </h2>
            </div>

            {telaDetalhe === 'condicoes' && (
              <div className="space-y-3">
                {condicoes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma condição registrada ainda.</p>
                )}
                {condicoes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => abrirEdicaoCondicao(c)}
                    className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{c.nome} ✎</p>
                      {c.relevante_geneticamente && (
                        <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">genético</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {tipoCondicaoLabels[c.tipo] || c.tipo} · {statusCondicaoLabels[c.status] || c.status}
                      {c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                    </p>
                    {c.observacao && <p className="text-xs text-slate-500 mt-1">📝 {c.observacao}</p>}
                  </button>
                ))}

                {!mostrarFormCondicao ? (
                  <button onClick={abrirNovaCondicao} className={botaoPrimario}>
                    + Adicionar condição
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                    <select
                      className={inputClasse}
                      value={novoTipoCondicao}
                      onChange={(e) => {
                        setNovoTipoCondicao(e.target.value);
                        setNovoNomeCondicao('');
                        setDoencaOutraNome('');
                      }}
                    >
                      <option value="doenca">Doença</option>
                      <option value="cirurgia">Cirurgia</option>
                    </select>
                    {novoTipoCondicao === 'doenca' ? (
                      <>
                        <select
                          className={inputClasse}
                          value={novoNomeCondicao}
                          onChange={(e) => setNovoNomeCondicao(e.target.value)}
                        >
                          <option value="">selecione a doença</option>
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
                            placeholder="qual doença?"
                            value={doencaOutraNome}
                            onChange={(e) => setDoencaOutraNome(e.target.value)}
                          />
                        )}
                      </>
                    ) : (
                      <input
                        className={inputClasse}
                        placeholder="nome da cirurgia (ex: Apendicectomia)"
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
                        <label className="text-xs text-slate-400">observação (opcional)</label>
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
                        placeholder="observação (opcional)"
                        rows={2}
                        value={novaObservacaoCondicao}
                        onChange={(e) => setNovaObservacaoCondicao(e.target.value)}
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
                )}
              </div>
            )}

            {telaDetalhe === 'medicacoes' && (
              <div className="space-y-3">
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
                  .map((m) => {
                  const ativa = !m.data_fim || m.data_fim >= new Date().toISOString().slice(0, 10);
                  const condicaoNome = condicoes.find((c) => c.id === m.condicao_relacionada_id)?.nome;
                  const labelClasse = classesMedicamento.find((c) => c.value === m.classe)?.label;
                  return (
                    <button
                      key={m.id}
                      onClick={() => abrirEdicaoMedicacao(m)}
                      className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800">{m.nome} ✎</p>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${ativa ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                          {ativa ? 'ativa' : 'encerrada'}
                        </span>
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
                      {m.observacao && <p className="text-xs text-slate-500 mt-1">📝 {m.observacao}</p>}
                    </button>
                  );
                })}

                {!mostrarFormMedicacao ? (
                  <button onClick={abrirNovaMedicacao} className={botaoPrimario}>
                    + Adicionar medicação
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                        <label className="text-xs text-slate-400 mb-1 block">data de término</label>
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
                      onChange={(e) => setNovaCondicaoRelacionada(e.target.value)}
                    >
                      <option value="">não relacionado a nenhuma condição específica</option>
                      {condicoes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
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
                )}
              </div>
            )}

            {telaDetalhe === 'consultas' && (
              <div className="space-y-3">
                {consultas.length > 0 && (
                  <input
                    className={inputClasse}
                    placeholder="🔎 buscar por especialidade ou profissional"
                    value={buscaConsulta}
                    onChange={(e) => setBuscaConsulta(e.target.value)}
                  />
                )}
                {consultas.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma consulta registrada ainda.</p>
                )}
                {consultas
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
                  return (
                    <button
                      key={c.id}
                      onClick={() => abrirEdicaoConsulta(c)}
                      className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
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

                {!mostrarFormConsulta ? (
                  <button onClick={abrirNovaConsulta} className={botaoPrimario}>
                    + Adicionar consulta
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                      value={novoProfissionalConsulta}
                      onChange={(e) => setNovoProfissionalConsulta(e.target.value)}
                    />
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

                    <div className="rounded-xl border border-slate-100 p-3 space-y-3">
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
                )}
              </div>
            )}

            {telaDetalhe === 'exames' && (
              <div className="space-y-3">
                {exames.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhum exame registrado ainda.</p>
                )}
                {exames.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => abrirEdicaoExame(e)}
                    className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{e.nome} ✎</p>
                      <span className="text-xs text-slate-400">{formatarData(e.data_realizacao)}</span>
                    </div>
                    {e.laboratorio && <p className="text-xs text-slate-400">{e.laboratorio}</p>}
                    {e.resultado_resumo && <p className="text-xs text-slate-500 mt-1">📋 {e.resultado_resumo}</p>}
                  </button>
                ))}

                {!mostrarFormExame ? (
                  <button onClick={abrirNovoExame} className={botaoPrimario}>
                    + Adicionar exame
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                )}
              </div>
            )}

            {telaDetalhe === 'vacinas' && (
              <div className="space-y-3">
                {vacinas.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma vacina registrada ainda.</p>
                )}
                {vacinas.map((v) => {
                  const proximaVencida = !!v.proxima_dose_data && v.proxima_dose_data < new Date().toISOString().slice(0, 10);
                  return (
                    <button
                      key={v.id}
                      onClick={() => abrirEdicaoVacina(v)}
                      className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
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

                {!mostrarFormVacina ? (
                  <button onClick={abrirNovaVacina} className={botaoPrimario}>
                    + Adicionar vacina
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                )}
              </div>
            )}

            {telaDetalhe === 'nascimento' && (
              <div className="space-y-3">
                <div className="space-y-3 mb-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Data de nascimento</p>
                      <p className="text-sm font-medium text-slate-800">{formatarData(membroSelecionado.data_nascimento)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Sexo biológico</p>
                      <p className="text-sm font-medium text-slate-800 capitalize">{membroSelecionado.sexo_biologico}</p>
                    </div>

                    {!editandoTipo ? (
                      <button
                        onClick={() => {
                          setValorTipoEdit(membroSelecionado.tipo_sanguineo || '');
                          setEditandoTipo(true);
                        }}
                        className="rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                      >
                        <p className="text-xs text-slate-400">Tipo sanguíneo ✎</p>
                        <p className="text-sm font-medium text-slate-800">{membroSelecionado.tipo_sanguineo || 'toque para informar'}</p>
                      </button>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-3">
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

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Idade</p>
                      <p className="text-sm font-medium text-slate-800">{calcularIdade(membroSelecionado.data_nascimento)} anos</p>
                    </div>

                    {!editandoParentesco ? (
                      <button
                        onClick={() => {
                          setValorParentescoEdit(membroSelecionado.parentesco || '');
                          setEditandoParentesco(true);
                        }}
                        className="col-span-2 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                      >
                        <p className="text-xs text-slate-400">Grau de parentesco ✎</p>
                        <p className="text-sm font-medium text-slate-800">
                          {opcoesParentesco.find((p) => p.value === membroSelecionado.parentesco)?.label || 'toque para informar'}
                        </p>
                      </button>
                    ) : (
                      <div className="col-span-2 rounded-xl bg-slate-50 p-3">
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
                      className="w-full rounded-xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                    >
                      <p className="text-xs text-slate-400">Observações ✎</p>
                      <p className="text-sm text-slate-700">{membroSelecionado.observacoes_gerais || 'toque para adicionar'}</p>
                    </button>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-3 space-y-2">
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
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Informações de nascimento</p>
                </div>

                {!mostrarFormNascimento ? (
                  <>
                    {!nascimento ? (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma informação de nascimento registrada ainda.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Peso ao nascer</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.peso_nascimento != null ? `${nascimento.peso_nascimento} kg` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Comprimento ao nascer</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.comprimento_nascimento != null ? `${nascimento.comprimento_nascimento} cm` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Perímetro cefálico</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.perimetro_cefalico != null ? `${nascimento.perimetro_cefalico} cm` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Idade gestacional</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.idade_gestacional_semanas != null ? `${nascimento.idade_gestacional_semanas} semanas` : '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Tipo de parto</p>
                          <p className="text-sm font-medium text-slate-800 capitalize">{nascimento.tipo_parto || '—'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Apgar</p>
                          <p className="text-sm font-medium text-slate-800">
                            {nascimento.apgar_1min != null || nascimento.apgar_5min != null
                              ? `${nascimento.apgar_1min ?? '—'} / ${nascimento.apgar_5min ?? '—'}`
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">UTI neonatal</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.uti_neonatal ? 'Sim' : 'Não'}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Local de nascimento</p>
                          <p className="text-sm font-medium text-slate-800">{nascimento.local_nascimento || '—'}</p>
                        </div>
                        {nascimento.intercorrencias && (
                          <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-400">Intercorrências</p>
                            <p className="text-sm text-slate-700">{nascimento.intercorrencias}</p>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={abrirEdicaoNascimento} className={botaoPrimario}>
                      {nascimento ? 'Editar informações de nascimento' : '+ Adicionar informações de nascimento'}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                        <label className="text-xs text-slate-400">intercorrências (opcional)</label>
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
                        placeholder="intercorrências (opcional)"
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

            {telaDetalhe === 'crescimento' && (
              <div className="space-y-3">
                {crescimento.length >= 2 && (
                  <div className="rounded-xl border border-slate-100 p-3">
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

                {crescimento.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma medição registrada ainda.</p>
                )}

                {[...crescimento].reverse().map((m) => {
                  const idadeMeses = calcularIdadeEmMeses(membroSelecionado.data_nascimento, m.data_medicao);
                  const zscores = calcularZScoresOMS(membroSelecionado.sexo_biologico, idadeMeses, m.peso_kg, m.altura_cm);
                  return (
                    <button
                      key={m.id}
                      onClick={() => abrirEdicaoCrescimento(m)}
                      className="w-full rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-800">{formatarData(m.data_medicao)} ✎</p>
                        <span className="text-xs text-slate-400">{formatarIdadeEmMeses(idadeMeses)}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {[m.peso_kg != null && `${m.peso_kg} kg`, m.altura_cm != null && `${m.altura_cm} cm`].filter(Boolean).join(' · ')}
                      </p>
                      {zscores && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {zscores.zPeso != null && (
                            <span className="text-xs bg-teal-50 text-teal-700 rounded-full px-2 py-0.5">
                              {classificarZScorePeso(zscores.zPeso)} (z={zscores.zPeso.toFixed(2)})
                            </span>
                          )}
                          {zscores.zAltura != null && (
                            <span className="text-xs bg-sky-50 text-sky-700 rounded-full px-2 py-0.5">
                              {classificarZScoreAltura(zscores.zAltura)} (z={zscores.zAltura.toFixed(2)})
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}

                {!mostrarFormCrescimento ? (
                  <button onClick={abrirNovaMedicaoCrescimento} className={botaoPrimario}>
                    + Adicionar medição
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
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
                    Para calcular os cuidados preventivos, primeiro informe o grau de parentesco deste membro na “Ficha Pessoal”.
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
                  <div key={r.id} className="rounded-xl border border-slate-100 p-3">
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
                        <div key={nome} className="rounded-xl border border-slate-100 p-3">
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
          </div>

        )}
      </div>
    </main>
  );
}
