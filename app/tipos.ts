export type Membro = {
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

export const opcoesParentesco: { value: string; label: string }[] = [
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

export const parentescosDeSangue = ['eu_mesmo', 'filho', 'pai', 'mae', 'irmao', 'avo', 'outro_sangue'];

export type Condicao = {
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

export type Medicacao = {
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

export const classesMedicamento: { value: string; label: string }[] = [
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

export const especialidadesMedicas: string[] = [
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

export const vacinasComuns: string[] = [
  'BCG', 'Hepatite B', 'Pentavalente (DTP+Hib+Hep B)', 'DTP (Difteria, Tétano e Coqueluche)',
  'DTPa (acelular)', 'dT (Dupla adulto)', 'dTpa (Tríplice bacteriana acelular do adulto)',
  'VIP (Poliomielite inativada)', 'VOP (Poliomielite oral)', 'Rotavírus',
  'Pneumocócica 10-valente', 'Pneumocócica 13-valente', 'Pneumocócica 23-valente',
  'Meningocócica C (conjugada)', 'Meningocócica ACWY', 'Meningocócica B',
  'Febre Amarela', 'Tríplice Viral (Sarampo, Caxumba e Rubéola)', 'Tetra Viral (SCR + Varicela)',
  'Varicela (Catapora)', 'Hepatite A', 'HPV', 'Influenza (Gripe)', 'Dengue', 'Covid-19',
  'Raiva', 'Herpes-zóster', 'Outra (especificar)',
];

export type Consulta = {
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
  lembrete?: boolean;
};

export type Exame = {
  id: string;
  nome: string;
  data_realizacao: string;
  laboratorio: string | null;
  resultado_resumo: string | null;
  condicao_relacionada_id: string | null;
  status?: string;
};

export type Vacina = {
  id: string;
  nome: string;
  dose: string | null;
  data_aplicacao: string;
  proxima_dose_data: string | null;
  observacoes: string | null;
  condicao_relacionada_id: string | null;
  status?: string;
};

export type InformacaoNascimento = {
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
export type Desenvolvimento = {
  id: string;
  sustentou_cabeca: string | null;
  sentou: string | null;
  engatinhou: string | null;
  andou: string | null;
  primeiras_palavras: string | null;
  desenvolvimento_adequado: boolean | null;
  observacao: string | null;
};

export type AlimentacaoInfantil = {
  id: string;
  aleitamento_materno: boolean | null;
  aleitamento_exclusivo_meses: number | null;
  formula: string | null;
  introducao_alimentar: string | null;
  aceitacao_alimentar: string | null;
};

export type PuberdadeSexualidade = {
  id: string;
  menarca_espermarca: string | null;
  ciclo_menstrual: string | null;
  vida_sexual_ativa: boolean | null;
  metodos_contraceptivos: string | null;
  historico_ist: string | null;
};

export type SaudeMental = {
  id: string;
  humor: string | null;
  ansiedade: boolean | null;
  tristeza_persistente: boolean | null;
  ideacao_suicida: boolean | null;
  automutilacao: boolean | null;
  observacao: string | null;
};

export type HabitosVida = {
  id: string;
  alimentacao: string | null;
  atividade_fisica: string | null;
  sono: string | null;
  uso_telas: string | null;
};

export type MedicaoCrescimento = {
  id: string;
  data_medicao: string;
  peso_kg: number | null;
  altura_cm: number | null;
  condicao_relacionada_id: string | null;
};

export type AtividadeFisica = {
  id: string;
  nome_atividade: string;
  data_inicio: string;
  data_fim: string | null;
  frequencia: string | null;
  local: string | null;
  instrutor: string | null;
  nivel: string | null;
  observacao: string | null;
};

export type Medico = {
  id: string;
  nome: string;
  especialidade: string | null;
  telefone: string | null;
  local: string | null;
  observacao: string | null;
};

export type Passo = 'login' | 'cadastro' | 'onboarding' | 'painel';
export type Aba = 'geral' | 'condicoes' | 'cirurgias' | 'medicacoes' | 'consultas' | 'odontologia' | 'exames' | 'vacinas' | 'nascimento' | 'menupessoal' | 'gestacao' | 'desenvolvimento' | 'alimentacaoinfantil' | 'puberdade' | 'saudemental' | 'habitosvida' | 'crescimento' | 'riscos' | 'medicos' | 'bemestar' | 'nutricionista' | 'esportes' | 'novoregistro' | 'onboardingvoz' | 'eventoresumo' | 'feedeventos' | 'terapias';

// ATENÇÃO: estas são orientações gerais de rastreamento, baseadas em diretrizes conhecidas
// (ex: sociedades de mastologia, coloproctologia, urologia, diabetes). Elas NÃO substituem
// avaliação médica individual — sempre recomendamos consultar um profissional de saúde.
export type RegraGenetica = {
  id: string;
  palavras: string[];
  aplicaSexo: 'masculino' | 'feminino' | null;
  idadeRecomendada: number | null;
  mensagem: string;
};

// Dica de saúde mostrada no carrossel da Home. idadeMin/idadeMax e sexo são critérios
// de aplicabilidade — quando ausentes, a dica vale pra qualquer idade/sexo (universal).
export type DicaSaude = {
  texto: string;
  icone: string;
  idadeMin?: number;
  idadeMax?: number;
  sexo?: 'masculino' | 'feminino';
};

export type RiscoGenetico = {
  id: string;
  mensagem: string;
  naIdadeRecomendada: boolean;
  idadeRecomendada: number | null;
  categoria: string;
};

// Rascunhos do bloco "O médico pediu algo?" no formulário de consulta.
export type MedRascunho = {
  nome: string;
  dose: string;
  freq: string; // id de frequenciasMedicacao
  primeira: string; // HH:MM da 1ª dose
  inicio: string; // yyyy-mm-dd
  duracao: string; // '5' | '7' | '10' | '14' | 'continuo' | 'data'
  duracaoData: string;
  como: string;
};
export type VacRascunho = { nome: string; outroNome: string; quando: string; quandoData: string; obs: string };

export const frequenciasMedicacao: { id: string; label: string; intervaloH: number }[] = [
  { id: '1x', label: '1x ao dia', intervaloH: 24 },
  { id: '12h', label: '12 em 12h', intervaloH: 12 },
  { id: '8h', label: '8 em 8h', intervaloH: 8 },
  { id: '6h', label: '6 em 6h', intervaloH: 6 },
  { id: 'sos', label: 'Se necessário', intervaloH: 0 },
];

export type Terapia = {
  id: string;
  tipo: string;
  frequencia: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  profissional: string | null;
  local: string | null;
  observacao: string | null;
  consulta_relacionada_id?: string | null;
};
export type TerapiaRascunho = { tipo: string; outroTipo: string; frequencia: string; inicio: string; fim: string; profissional: string; local: string; obs: string };
export const tiposTerapia: string[] = ['Fisioterapia', 'Fonoaudiologia', 'Psicologia', 'Terapia Ocupacional', 'Psicopedagogia', 'Acupuntura', 'Outra (especificar)'];

export type SessaoTerapia = { id: string; terapia_id: string; data_hora: string; lembrete: boolean };
