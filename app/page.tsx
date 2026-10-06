'use client';

import { useState, useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type {
  Membro,
  Condicao,
  DicaSaude,
  Medicacao,
  Consulta,
  Exame,
  Vacina,
  InformacaoNascimento,
  Desenvolvimento,
  AlimentacaoInfantil,
  PuberdadeSexualidade,
  SaudeMental,
  HabitosVida,
  MedicaoCrescimento,
  AtividadeFisica,
  Medico,
  Passo,
  Aba,
  RiscoGenetico,
  MedRascunho,
  VacRascunho,
  Terapia,
  TerapiaRascunho,
  SessaoTerapia,
} from './tipos';
import {
  opcoesParentesco,
  parentescosDeSangue,
  classesMedicamento,
  especialidadesMedicas,
  vacinasComuns,
  frequenciasMedicacao,
  tiposTerapia,
} from './tipos';
import {
  tipoCondicaoLabels,
  statusCondicaoLabels,
  doencasComuns,
  categoriasDoencas,
  regrasGeneticas,
  dicasDeSaude,
  atividadesFisicasComuns,
} from './constantes';
import {
  calcularHorariosMedicacao,
  somarDias,
  calcularIdade,
  calcularIdadeEmMeses,
  formatarIdadeEmMeses,
  classificarZScorePeso,
  classificarZScoreAltura,
  calcularZScoresOMS,
  calcularIMC,
  classificarIMC,
  formatarData,
  paraNumeroTolerante,
  obterCategoriaDoenca,
  calcularRiscosGeneticos,
} from './utils';


// Ícones de linha (substituem os emojis pequenos espalhados pela tela).
const caminhosIcone: Record<string, ReactNode> = {
  mic: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></>,
  nota: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></>,
  editar: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  lampada: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" /></>,
  cal: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  pilula: <><path d="M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7z" /><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" /></>,
  exame: <><path d="M9 2v6L4 19a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3L15 8V2" /><line x1="8" y1="2" x2="16" y2="2" /></>,
  vacina: <><path d="M18 2l4 4" /><path d="M17 7l3-3" /><path d="M19 9l-7.5 7.5-4-4L15 5z" /><path d="M5 19l3.5-3.5" /><path d="M2 22l3-3" /></>,
  grafico: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  prancheta: <><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>,
  mais: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  alerta: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  sino: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  impressora: <><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  relogio: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />,
};
function Ic({ n, size = 14 }: { n: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: 4 }}>
      {caminhosIcone[n]}
    </svg>
  );
}
// Lupa embutida no campo de busca (os placeholders não aceitam ícone).
const estiloBusca: CSSProperties = {
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: '12px center',
  backgroundSize: '16px',
  paddingLeft: 36,
};

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
  // Permissões e papéis
  type PapelUsuario = 'admin' | 'familiar' | 'cuidador';
  type LinhaAcesso = { usuario_id: string; nome: string; email: string; papel: PapelUsuario; da_familia: boolean; membro_id: string | null; nivel_acesso: string | null };
  type ConvitePendente = { id: string; codigo: string; papel: PapelUsuario; apelido: string | null; criado_em: string };
  const [meuPapel, setMeuPapel] = useState<PapelUsuario | null>(null);
  const [souDono, setSouDono] = useState(false);
  const [meuUsuarioId, setMeuUsuarioId] = useState<string | null>(null);
  const [linhasAcesso, setLinhasAcesso] = useState<LinhaAcesso[]>([]);
  const [convitesPendentes, setConvitesPendentes] = useState<ConvitePendente[]>([]);
  const [mostrarFormConvite, setMostrarFormConvite] = useState(false);
  const [conviteApelido, setConviteApelido] = useState('');
  const [convitePapel, setConvitePapel] = useState<PapelUsuario>('familiar');
  const [conviteAcessos, setConviteAcessos] = useState<Record<string, string>>({});
  const [erroAcessos, setErroAcessos] = useState('');
  const [confirmandoRemoverId, setConfirmandoRemoverId] = useState<string | null>(null);

  // Menu inferior fixo: home (pendências + dicas), incluir/consultar (grade de
  // categorias — cada uma abre direto no modo certo), compartilhar (PDF) e
  // configuração (conta/senha). Trocar de membro agora é feito dentro da própria Home.
  const [abaInferior, setAbaInferior] = useState<'home' | 'incluir' | 'consultar' | 'compartilhar' | 'configuracao'>('home');

  const [secoesCompartilhar, setSecoesCompartilhar] = useState<Record<string, boolean>>({
    nascimento: true,
    condicoes: true,
    cirurgias: true,
    medicacoes: true,
    consultas: true,
    odontologia: true,
    exames: true,
    vacinas: true,
    crescimento: true,
    anamnese: true,
  });
  const [mostrarResumoImpressao, setMostrarResumoImpressao] = useState(false);
  const [pendenciasFamiliares, setPendenciasFamiliares] = useState<{ membroId: string; membroNome: string; itens: { id: string; tipo: 'consulta' | 'vacina' | 'medicacao' | 'exame' | 'terapia'; titulo: string; detalhe: string; refId?: string; quando?: string }[] }[]>([]);
  const [mostrarAvisos, setMostrarAvisos] = useState(false);
  const [avisoDest, setAvisoDest] = useState<{ usuario_id: string; membro_id: string; recebe: boolean }[]>([]);

  const [contaEmail, setContaEmail] = useState('');
  const [novaSenhaConfig, setNovaSenhaConfig] = useState('');
  const [confirmarSenhaConfig, setConfirmarSenhaConfig] = useState('');
  const [erroConfigSenha, setErroConfigSenha] = useState('');
  const [sucessoConfigSenha, setSucessoConfigSenha] = useState(false);
  const [carregandoSenha, setCarregandoSenha] = useState(false);

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
  const [novoMedicoCondicao, setNovoMedicoCondicao] = useState('');
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
  const [novoLembreteConsulta, setNovoLembreteConsulta] = useState(false);
  const medVazia = (): MedRascunho => ({ nome: '', dose: '', freq: '8h', primeira: '08:00', inicio: new Date().toISOString().slice(0, 10), duracao: '7', duracaoData: '', duracaoDias: '', como: '' });
  const vacVazia = (): VacRascunho => ({ nome: '', outroNome: '', quando: 'mes', quandoData: '', obs: '' });
  const [medsConsulta, setMedsConsulta] = useState<MedRascunho[]>([]);
  const [examesConsulta, setExamesConsulta] = useState<string[]>([]);
  const [exameNovoConsulta, setExameNovoConsulta] = useState('');
  const [exAbertoConsulta, setExAbertoConsulta] = useState(false);
  const [exPrazoConsulta, setExPrazoConsulta] = useState('30d');
  const [exPrazoDataConsulta, setExPrazoDataConsulta] = useState('');
  const [exLembreteConsulta, setExLembreteConsulta] = useState(true);
  const [vacsConsulta, setVacsConsulta] = useState<VacRascunho[]>([]);
  const [vacLembreteConsulta, setVacLembreteConsulta] = useState(true);
  const terapiaVazia = (): TerapiaRascunho => ({ tipo: '', outroTipo: '', frequencia: '', inicio: new Date().toISOString().slice(0, 10), fim: '', profissional: '', local: '', obs: '', sessoes: [], novaSessao: '', novaSessaoAlerta: true });
  const [terapiasConsulta, setTerapiasConsulta] = useState<TerapiaRascunho[]>([]);
  const [anexosNovosConsulta, setAnexosNovosConsulta] = useState<File[]>([]);
  const [anexosConsulta, setAnexosConsulta] = useState<{ id: string; caminho: string; nome: string | null; url: string | null }[]>([]);
  const [terapias, setTerapias] = useState<Terapia[]>([]);
  const [mostrarFormTerapia, setMostrarFormTerapia] = useState(false);
  const [terapiaEditandoId, setTerapiaEditandoId] = useState<string | null>(null);
  const [formTerapia, setFormTerapia] = useState<TerapiaRascunho>(terapiaVazia());
  const [erroTerapia, setErroTerapia] = useState('');
  const [erroCarregarTerapias, setErroCarregarTerapias] = useState('');
  const [sessoesTerapia, setSessoesTerapia] = useState<SessaoTerapia[]>([]);
  const [sessoesNovas, setSessoesNovas] = useState<{ data_hora: string; lembrete: boolean }[]>([]);
  const [novaSessaoDataHora, setNovaSessaoDataHora] = useState('');
  const [novaSessaoAlerta, setNovaSessaoAlerta] = useState(true);
  const [exameStatusOriginal, setExameStatusOriginal] = useState('realizado');
  const [exameMarcarRealizado, setExameMarcarRealizado] = useState(false);
  const [vacinaStatusOriginal, setVacinaStatusOriginal] = useState('realizado');
  const [vacinaMarcarRealizada, setVacinaMarcarRealizada] = useState(false);
  // Alvo de uma pendência clicada na Home: abre a edição do item quando ele estiver carregado.
  const [alvoPendencia, setAlvoPendencia] = useState<{ tipo: string; refId: string; membroId: string } | null>(null);
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

  // Menu dos "3 risquinhos": antes abria uma tela cheia ("menupessoal"); agora abre
  // como um menu suspenso por cima da própria tela do hub, e cada item leva direto
  // pra tela daquela seção (sem tela intermediária).
  const [mostrarMenuPessoal, setMostrarMenuPessoal] = useState(false);

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

  const [atividadesFisicas, setAtividadesFisicas] = useState<AtividadeFisica[]>([]);
  const [mostrarFormAtividadeFisica, setMostrarFormAtividadeFisica] = useState(false);
  const [atividadeEditandoId, setAtividadeEditandoId] = useState<string | null>(null);
  const [novoNomeAtividade, setNovoNomeAtividade] = useState('');
  const [atividadeOutroNome, setAtividadeOutroNome] = useState('');
  const [novaDataInicioAtividade, setNovaDataInicioAtividade] = useState('');
  const [novaDataFimAtividade, setNovaDataFimAtividade] = useState('');
  const [novaFrequenciaAtividade, setNovaFrequenciaAtividade] = useState('');
  const [novoLocalAtividade, setNovoLocalAtividade] = useState('');
  const [novoInstrutorAtividade, setNovoInstrutorAtividade] = useState('');
  const [novoNivelAtividade, setNovoNivelAtividade] = useState('');
  const [novaObsAtividade, setNovaObsAtividade] = useState('');
  const [erroAtividadeFisica, setErroAtividadeFisica] = useState('');

  // Feed unificado (aba Consultar → "Ver tudo em uma linha do tempo"): junta todos os
  // tipos de evento num só lugar, coloridos por categoria, com filtros simples.
  const [filtroFeedTipo, setFiltroFeedTipo] = useState<string>('todos');
  const [filtroFeedDataInicio, setFiltroFeedDataInicio] = useState('');
  const [filtroFeedDataFim, setFiltroFeedDataFim] = useState('');

  // Carrossel de dicas de saúde na Home: troca de dica sozinho a cada 10s, com um
  // fade suave (opacidade) na transição.
  const [dicaIndex, setDicaIndex] = useState(0);
  const [dicaVisivel, setDicaVisivel] = useState(true);

  // Mostrar/esconder a seção "Pendências da família" na Home — fica ligado por padrão.
  const [mostrarPendenciasFamilia, setMostrarPendenciasFamilia] = useState(true);
  const [filtroFeedMedico, setFiltroFeedMedico] = useState('todos');

  const [editandoParentesco, setEditandoParentesco] = useState(false);
  const [valorParentescoEdit, setValorParentescoEdit] = useState('');

  const [riscos, setRiscos] = useState<RiscoGenetico[] | null>(null);
  const [historicoGeral, setHistoricoGeral] = useState<string[] | null>(null);
  const [filtroEspecialidadeRisco, setFiltroEspecialidadeRisco] = useState('');

  useEffect(() => {
    if (passo === 'painel') carregarMembros();
  }, [passo]);

  // Filtra as dicas de saúde pela idade e sexo biológico do membro selecionado.
  // Dicas sem idadeMin/idadeMax/sexo são universais (valem pra qualquer um). Se nada
  // bater (ou não houver membro selecionado), cai de volta nas dicas universais.
  function obterDicasFiltradas(): DicaSaude[] {
    if (!membroSelecionado) return dicasDeSaude.filter((d) => !d.idadeMin && !d.idadeMax && !d.sexo);
    const idade = calcularIdade(membroSelecionado.data_nascimento);
    const aplicaveis = dicasDeSaude.filter((d) => {
      if (d.idadeMin != null && idade < d.idadeMin) return false;
      if (d.idadeMax != null && idade > d.idadeMax) return false;
      if (d.sexo && d.sexo !== membroSelecionado.sexo_biologico) return false;
      return true;
    });
    return aplicaveis.length > 0 ? aplicaveis : dicasDeSaude.filter((d) => !d.idadeMin && !d.idadeMax && !d.sexo);
  }

  // Lista de dicas "ativa" no carrossel pra esse membro — embaralhada (senão a 1ª dica
  // universal da lista, tipo "beber água", sempre aparecia primeiro pra todo mundo,
  // dando a impressão de que a personalização não funcionava) e com uma dica específica
  // daquele membro (não-universal) puxada pro início, quando existir, pra já mostrar de
  // cara que é personalizado.
  const [dicasParaMembro, setDicasParaMembro] = useState<DicaSaude[]>(() => obterDicasFiltradas());

  useEffect(() => {
    const filtradas = obterDicasFiltradas();
    const embaralhadas = [...filtradas];
    for (let i = embaralhadas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]];
    }
    const indiceEspecifica = embaralhadas.findIndex((d) => d.idadeMin != null || d.idadeMax != null || d.sexo);
    if (indiceEspecifica > 0) {
      const [especifica] = embaralhadas.splice(indiceEspecifica, 1);
      embaralhadas.unshift(especifica);
    }
    setDicasParaMembro(embaralhadas);
    setDicaIndex(0);
    setDicaVisivel(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membroSelecionado?.id, membroSelecionado?.data_nascimento, membroSelecionado?.sexo_biologico]);

  // Troca de dica sozinha a cada 10s: some com um fade curto, avança pra próxima
  // (voltando pra primeira no fim) e aparece de novo.
  useEffect(() => {
    const intervalo = setInterval(() => {
      setDicaVisivel(false);
      setTimeout(() => {
        setDicaIndex((i) => (i + 1) % dicasParaMembro.length);
        setDicaVisivel(true);
      }, 300);
    }, 10000);
    return () => clearInterval(intervalo);
  }, [dicasParaMembro]);

  useEffect(() => {
    if (passo === 'painel' && abaInferior === 'configuracao') {
      supabase.auth.getUser().then(({ data }) => setContaEmail(data.user?.email || ''));
    }
  }, [passo, abaInferior]);

  // Papel do usuário logado (admin / familiar / cuidador) e se é o dono da conta.
  useEffect(() => {
    if (passo !== 'painel') return;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      setMeuUsuarioId(uid);
      const { data: u } = await supabase.from('usuario').select('papel').eq('id', uid).maybeSingle();
      setMeuPapel((u?.papel as PapelUsuario) || 'admin');
      const { data: f } = await supabase.from('familia').select('dono_id').maybeSingle();
      setSouDono(!!f && f.dono_id === uid);
    })();
  }, [passo]);

  useEffect(() => {
    if (passo === 'painel' && abaInferior === 'configuracao' && meuPapel === 'admin') { carregarAcessos(); carregarAvisoDest(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, abaInferior, meuPapel]);

  useEffect(() => {
    if (passo === 'painel' && abaInferior === 'home') { carregarPendenciasFamiliares(membros); carregarAvisoDest(); }
  }, [passo, abaInferior, membros]);

  // Sempre que a tela muda (incluindo cada passo do onboarding), volta pro topo.
  // Sem isso, quem rola a página pra baixo pra preencher um formulário mais longo
  // (como o de Cirurgia/Internação) e depois salva ou avança, continua com a
  // rolagem no mesmo lugar — a tela já trocou, mas por fora da vista, dando a
  // impressão de que o app travou ou não avançou.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [telaDetalhe, onboardingPasso, abaInferior]);

  useEffect(() => {
    if (membroSelecionado) {
      carregarCondicoes(membroSelecionado.id);
      carregarMedicacoes(membroSelecionado.id);
      carregarConsultas(membroSelecionado.id);
      carregarExames(membroSelecionado.id);
      carregarVacinas(membroSelecionado.id);
      carregarAtividadesFisicas(membroSelecionado.id);
      carregarTerapias(membroSelecionado.id);
      carregarSessoesTerapia(membroSelecionado.id);
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
      .select('id, data_hora, local, motivo, anotacoes, status, especialidade(nome), profissional_saude(nome), data_retorno_sugerida, forma_atendimento, valor_pago, solicitou_reembolso, valor_reembolsado, incluir_ir, obs_financeira, condicao_relacionada_id, lembrete')
      .eq('membro_id', membroId)
      .order('data_hora', { ascending: true });
    if (!error && data && membroAtualRef.current === membroId) setConsultas(data as any);
  }

  async function carregarExames(membroId: string) {
    const { data, error } = await supabase
      .from('exame')
      .select('id, nome, data_realizacao, laboratorio, resultado_resumo, condicao_relacionada_id, status, consulta_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_realizacao', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setExames(data);
  }

  async function carregarVacinas(membroId: string) {
    const { data, error } = await supabase
      .from('vacina')
      .select('id, nome, dose, data_aplicacao, proxima_dose_data, observacoes, condicao_relacionada_id, status, consulta_relacionada_id')
      .eq('membro_id', membroId)
      .order('data_aplicacao', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setVacinas(data);
  }

  async function carregarTerapias(membroId: string) {
    // select('*') de propósito: não quebra se a tabela tiver colunas a mais/menos.
    const { data, error } = await supabase
      .from('terapia')
      .select('*')
      .eq('membro_id', membroId);
    if (membroAtualRef.current !== membroId) return;
    if (error) {
      setErroCarregarTerapias(error.message);
      return;
    }
    setErroCarregarTerapias('');
    const lista = ((data || []) as any[]).sort((a, b) => String(b.data_inicio || '').localeCompare(String(a.data_inicio || '')));
    setTerapias(lista as Terapia[]);
  }

  async function carregarSessoesTerapia(membroId: string) {
    const { data, error } = await supabase
      .from('sessao_terapia')
      .select('*')
      .eq('membro_id', membroId);
    if (membroAtualRef.current !== membroId) return;
    if (error) {
      setErroCarregarTerapias(error.message);
      return;
    }
    const lista = ((data || []) as any[]).sort((a, b) => String(a.data_hora).localeCompare(String(b.data_hora)));
    setSessoesTerapia(lista as SessaoTerapia[]);
  }

  async function carregarAtividadesFisicas(membroId: string) {
    const { data, error } = await supabase
      .from('atividade_fisica')
      .select('id, nome_atividade, data_inicio, data_fim, frequencia, local, instrutor, nivel, observacao')
      .eq('membro_id', membroId)
      .order('data_inicio', { ascending: false });
    if (!error && data && membroAtualRef.current === membroId) setAtividadesFisicas(data);
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
    // Garante que nenhuma sessão antiga (de outra conta) continue ativa durante o cadastro —
    // senão o app pode achar que a conta nova já tem família e pular o passo do código de convite.
    await supabase.auth.signOut();
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    setCarregando(false);
    if (error) return setErro(error.message);
    if (!data.session) {
      setErro('Conta criada! Confirme o e-mail que enviamos e depois entre com seu e-mail e senha para continuar.');
      return;
    }
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

  async function trocarSenha() {
    setErroConfigSenha('');
    setSucessoConfigSenha(false);
    if (novaSenhaConfig.length < 6) {
      setErroConfigSenha('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenhaConfig !== confirmarSenhaConfig) {
      setErroConfigSenha('As senhas não são iguais.');
      return;
    }
    setCarregandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenhaConfig });
    setCarregandoSenha(false);
    if (error) {
      setErroConfigSenha(error.message);
      return;
    }
    setNovaSenhaConfig('');
    setConfirmarSenhaConfig('');
    setSucessoConfigSenha(true);
  }

  async function carregarAcessos() {
    const { data, error } = await supabase.rpc('listar_acessos');
    if (error) {
      setErroAcessos(error.message);
    } else {
      setErroAcessos('');
      setLinhasAcesso((data || []) as LinhaAcesso[]);
    }
    const { data: convs } = await supabase
      .from('convite')
      .select('id, codigo, papel, apelido, criado_em')
      .is('usado_por', null)
      .order('criado_em', { ascending: false });
    setConvitesPendentes((convs || []) as ConvitePendente[]);
  }

  async function definirAcesso(usuarioId: string, membroId: string, nivel: string) {
    setErroAcessos('');
    const { error } = await supabase.rpc('definir_acesso', { p_usuario: usuarioId, p_membro: membroId, p_nivel: nivel });
    if (error) setErroAcessos(error.message);
    await carregarAcessos();
  }

  async function definirPapelUsuario(usuarioId: string, papel: 'admin' | 'familiar') {
    setErroAcessos('');
    const { error } = await supabase.rpc('definir_papel', { p_usuario: usuarioId, p_papel: papel });
    if (error) setErroAcessos(error.message);
    await carregarAcessos();
  }

  async function removerAcessosUsuario(usuarioId: string) {
    setErroAcessos('');
    const { error } = await supabase.rpc('remover_acessos', { p_usuario: usuarioId });
    if (error) setErroAcessos(error.message);
    setConfirmandoRemoverId(null);
    await carregarAcessos();
  }

  async function apagarConvite(id: string) {
    await supabase.from('convite').delete().eq('id', id);
    await carregarAcessos();
  }

  function abrirFormConvite() {
    setErroAcessos('');
    setCodigoGerado('');
    setConviteApelido('');
    setConvitePapel('familiar');
    setConviteAcessos({});
    setMostrarFormConvite(true);
  }

  async function gerarConvite() {
    setErroAcessos('');
    const { data: userData } = await supabase.auth.getUser();
    const { data: meuUsuario } = await supabase
      .from('usuario')
      .select('familia_id')
      .eq('id', userData.user?.id)
      .single();

    const acessos = Object.entries(conviteAcessos)
      .filter(([, nivel]) => nivel === 'visualizar' || nivel === 'editar')
      .map(([membro_id, nivel]) => ({ membro_id, nivel }));
    if (convitePapel !== 'admin' && acessos.length === 0) {
      setErroAcessos('Escolha pelo menos um membro que essa pessoa poderá ver.');
      return;
    }

    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from('convite').insert({
      familia_id: meuUsuario?.familia_id,
      codigo,
      criado_por: userData.user?.id,
      papel: convitePapel,
      apelido: conviteApelido.trim() || null,
      acessos: convitePapel === 'admin' ? [] : acessos,
    });

    if (error) return setErroAcessos(error.message);
    setCodigoGerado(codigo);
    setMostrarFormConvite(false);
    await carregarAcessos();
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
    setNovoMedicoCondicao('');
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
    setNovoMedicoCondicao(c.medico || '');
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

    const ehCirurgiaOuInternacao = novoTipoCondicao === 'cirurgia' || novoTipoCondicao === 'internacao';
    const dados = {
      tipo: novoTipoCondicao,
      nome: nomeFinal,
      data_diagnostico_ou_procedimento: novaDataCondicao || null,
      status: novoStatusCondicao,
      relevante_geneticamente: novoRelevanteGenetico,
      observacao: novaObservacaoCondicao || null,
      orientacoes: novaOrientacaoCondicao || null,
      medico: ehCirurgiaOuInternacao ? (novoMedicoCondicao.trim() || null) : null,
    };

    const ehRegistroNovo = !condicaoEditandoId;
    let error;
    let idSalvo: string | null = condicaoEditandoId;
    if (condicaoEditandoId) {
      const resultado = await supabase.from('condicao').update(dados).eq('id', condicaoEditandoId);
      error = resultado.error;
    } else {
      const resultado = await supabase
        .from('condicao')
        .insert({ membro_id: membroSelecionado.id, ...dados })
        .select('id')
        .single();
      error = resultado.error;
      idSalvo = resultado.data?.id ?? null;
    }

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
    setNovoMedicoCondicao('');
    setMostrarFormCondicao(false);
    await carregarCondicoes(membroSelecionado.id);
    // Depois de criar uma cirurgia/internação nova, já abre o resumo do evento —
    // é de lá que dá pra ligar exames e medicamentos a ela (ela normalmente gera
    // esse tipo de item), sem precisar procurar o item na lista pra abrir de novo.
    if (ehRegistroNovo && idSalvo && ehCirurgiaOuInternacao && telaDetalhe === 'cirurgias') {
      setCondicaoResumoId(idSalvo);
      setTelaDetalhe('eventoresumo');
    }
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
    setAnexosNovosConsulta([]);
    setAnexosConsulta([]);
    setNovaEspecialidadeConsulta(especialidadePadrao);
    setEspecialidadeOutroConsulta('');
    setNovoProfissionalConsulta('');
    setNovaDataHoraConsulta('');
    setNovoLocalConsulta('');
    setNovoMotivoConsulta('');
    setNovoStatusConsulta('agendada');
    setNovoLembreteConsulta(false);
    setMedsConsulta([]);
    setExamesConsulta([]);
    setExameNovoConsulta('');
    setExAbertoConsulta(false);
    setExPrazoConsulta('30d');
    setExPrazoDataConsulta('');
    setExLembreteConsulta(true);
    setVacsConsulta([]);
    setVacLembreteConsulta(true);
    setTerapiasConsulta([]);
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
    setNovoStatusConsulta(c.status === 'cancelada' ? 'cancelada' : 'agendada');
    setNovoLembreteConsulta(c.lembrete || false);
    setAnexosNovosConsulta([]);
    setAnexosConsulta([]);
    carregarAnexosConsulta(c.id);
    setMedsConsulta([]);
    setExamesConsulta([]);
    setExameNovoConsulta('');
    setExAbertoConsulta(false);
    setExPrazoConsulta('30d');
    setExPrazoDataConsulta('');
    setExLembreteConsulta(true);
    setVacsConsulta([]);
    setVacLembreteConsulta(true);
    setTerapiasConsulta([]);
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

  // Data de término de uma medicação gerada na consulta. N dias contam o dia de início
  // (3 dias a partir de 06/10 terminam em 08/10). Uso contínuo = sem data de término.
  function dataFimMedicacao(m: MedRascunho, inicio: string): string | null {
    if (m.duracao === 'continuo') return null;
    if (m.duracao === 'data') return m.duracaoData || null;
    const dias = m.duracao === 'dias' ? Number(m.duracaoDias) : Number(m.duracao);
    if (!dias || dias < 1) return null;
    return somarDias(inicio, dias - 1);
  }

  // Itens (medicação, exames, vacinas, terapias) registrados a partir de uma consulta.
  function itensDaConsulta(consultaId: string) {
    return {
      meds: medicacoes.filter((m) => m.consulta_relacionada_id === consultaId),
      exames: exames.filter((e) => e.consulta_relacionada_id === consultaId),
      vacinas: vacinas.filter((v) => v.consulta_relacionada_id === consultaId),
      terapias: terapias.filter((t) => t.consulta_relacionada_id === consultaId),
    };
  }

  async function carregarAnexosConsulta(consultaId: string) {
    const { data } = await supabase
      .from('consulta_anexo')
      .select('id, caminho, nome')
      .eq('consulta_id', consultaId)
      .order('criado_em', { ascending: true });
    const lista = (data || []) as { id: string; caminho: string; nome: string | null }[];
    const comUrl = await Promise.all(lista.map(async (a) => {
      const { data: u } = await supabase.storage.from('anexos-consulta').createSignedUrl(a.caminho, 3600);
      return { ...a, url: u?.signedUrl || null };
    }));
    setAnexosConsulta(comUrl);
  }

  function escolherAnexosConsulta(arquivos: FileList | null) {
    if (!arquivos) return;
    const validos: File[] = [];
    for (const f of Array.from(arquivos)) {
      if (!(f.type.startsWith('image/') || f.type === 'application/pdf')) { setErroConsulta('Anexe apenas fotos ou PDF.'); continue; }
      if (f.size > 10 * 1024 * 1024) { setErroConsulta('Cada arquivo deve ter no máximo 10MB.'); continue; }
      validos.push(f);
    }
    if (validos.length) setAnexosNovosConsulta((l) => [...l, ...validos]);
  }

  async function enviarAnexosConsulta(consultaId: string, membroId: string) {
    for (const arquivo of anexosNovosConsulta) {
      const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase();
      const caminho = `${membroId}/${consultaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: erroUp } = await supabase.storage.from('anexos-consulta').upload(caminho, arquivo);
      if (erroUp) throw new Error('Não consegui enviar o anexo: ' + erroUp.message);
      const { error } = await supabase.from('consulta_anexo').insert({ consulta_id: consultaId, membro_id: membroId, caminho, nome: arquivo.name });
      if (error) throw error;
    }
  }

  async function excluirAnexoConsulta(a: { id: string; caminho: string }) {
    await supabase.storage.from('anexos-consulta').remove([a.caminho]);
    await supabase.from('consulta_anexo').delete().eq('id', a.id);
    setAnexosConsulta((l) => l.filter((x) => x.id !== a.id));
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
    // Valida as medicações ANTES de salvar qualquer coisa, para nunca virar "uso contínuo" sem querer.
    for (const m of medsConsulta) {
      if (!m.nome.trim()) continue;
      if (m.duracao === 'data' && !m.duracaoData) {
        setErroConsulta(`Informe a data de término de ${m.nome.trim()} (ou escolha outra duração).`);
        return;
      }
      if (m.duracao === 'dias' && !(Number(m.duracaoDias) >= 1)) {
        setErroConsulta(`Informe por quantos dias usar ${m.nome.trim()}.`);
        return;
      }
    }
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
        status: novoStatusConsulta === 'cancelada' ? 'cancelada' : (new Date(novaDataHoraConsulta) > new Date() ? 'agendada' : 'realizada'),
        lembrete: new Date(novaDataHoraConsulta) > new Date() ? novoLembreteConsulta : false,
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

      let consultaIdSalva: string | null = consultaEditandoId;
      if (consultaEditandoId) {
        const { error } = await supabase.from('consulta').update(dados).eq('id', consultaEditandoId);
        if (error) throw error;
      } else {
        const { data: criada, error } = await supabase
          .from('consulta')
          .insert({ membro_id: membroSelecionado.id, origem_agendamento: 'manual', ...dados })
          .select('id')
          .single();
        if (error) throw error;
        consultaIdSalva = criada?.id || null;
      }

      if (consultaIdSalva && anexosNovosConsulta.length) await enviarAnexosConsulta(consultaIdSalva, membroSelecionado.id);

      // Itens gerados pela consulta ("O médico pediu algo?")
      const dataConsultaISO = novaDataHoraConsulta.slice(0, 10);
      const condicaoLigada = novaCondicaoRelacionadaConsulta || null;
      for (const m of medsConsulta) {
        if (!m.nome.trim()) continue;
        const f = frequenciasMedicacao.find((x) => x.id === m.freq);
        const horarios = f ? calcularHorariosMedicacao(m.primeira, f.intervaloH) : [];
        const inicio = m.inicio || dataConsultaISO;
        const dataFim = dataFimMedicacao(m, inicio);
        const { error } = await supabase.from('medicacao').insert({
          membro_id: membroSelecionado.id,
          nome: m.nome.trim(),
          dosagem: m.dose.trim() || null,
          frequencia: f?.label || null,
          horario: horarios.length ? horarios.join(' · ') : null,
          data_inicio: inicio,
          data_fim: dataFim,
          condicao_relacionada_id: condicaoLigada,
          consulta_relacionada_id: consultaIdSalva,
          observacao: m.como.trim() || null,
        });
        if (error) throw error;
      }
      if (examesConsulta.length > 0) {
        const hoje = new Date().toISOString().slice(0, 10);
        const prazo =
          exPrazoConsulta === 'data' && exPrazoDataConsulta ? exPrazoDataConsulta
          : exPrazoConsulta === 'retorno' && novaDataRetornoConsulta ? somarDias(novaDataRetornoConsulta, -7)
          : exPrazoConsulta === '7d' ? somarDias(hoje, 7)
          : somarDias(hoje, 30);
        for (const nome of examesConsulta) {
          const { error } = await supabase.from('exame').insert({
            membro_id: membroSelecionado.id,
            nome,
            data_realizacao: prazo,
            status: 'solicitado',
            lembrete: exLembreteConsulta,
            consulta_relacionada_id: consultaIdSalva,
            condicao_relacionada_id: condicaoLigada,
          });
          if (error) throw error;
        }
      }
      for (const t of terapiasConsulta) {
        const tipoFinal = t.tipo === 'Outra (especificar)' ? t.outroTipo.trim() : t.tipo;
        if (!tipoFinal) continue;
        const { data: terCriada, error } = await supabase.from('terapia').insert({
          membro_id: membroSelecionado.id,
          tipo: tipoFinal,
          frequencia: t.frequencia.trim() || null,
          data_inicio: t.inicio || dataConsultaISO,
          data_fim: t.fim || null,
          profissional: t.profissional.trim() || null,
          local: t.local.trim() || null,
          observacao: t.obs.trim() || null,
          consulta_relacionada_id: consultaIdSalva,
          condicao_relacionada_id: condicaoLigada,
        }).select('id').single();
        if (error) throw error;
        const sessoesT = (t.sessoes || []).filter((x) => x.data_hora);
        if (terCriada && sessoesT.length > 0) {
          const { error: erroSes } = await supabase.from('sessao_terapia').insert(
            sessoesT.map((x) => ({ membro_id: membroSelecionado.id, terapia_id: terCriada.id, data_hora: x.data_hora, lembrete: x.lembrete }))
          );
          if (erroSes) throw erroSes;
        }
      }
      for (const v of vacsConsulta) {
        const nomeVac = v.nome === 'Outra (especificar)' ? v.outroNome.trim() : v.nome;
        if (!nomeVac) continue;
        const hoje = new Date().toISOString().slice(0, 10);
        const quando =
          v.quando === 'agora' ? hoje
          : v.quando === '3m' ? somarDias(hoje, 90)
          : v.quando === 'data' && v.quandoData ? v.quandoData
          : somarDias(hoje, 30);
        const { error } = await supabase.from('vacina').insert({
          membro_id: membroSelecionado.id,
          nome: nomeVac,
          data_aplicacao: quando,
          observacoes: v.obs.trim() || null,
          status: 'indicada',
          lembrete: vacLembreteConsulta,
          consulta_relacionada_id: consultaIdSalva,
          condicao_relacionada_id: condicaoLigada,
        });
        if (error) throw error;
      }

      // Retorno vira uma consulta agendada de verdade (com lembrete), ligada a esta consulta.
      if (consultaIdSalva && novoStatusConsulta !== 'cancelada') {
        const { data: retornoExistente } = await supabase
          .from('consulta')
          .select('id, data_hora, status')
          .eq('retorno_de_consulta_id', consultaIdSalva)
          .maybeSingle();
        if (novaDataRetornoConsulta) {
          if (!retornoExistente) {
            const { error } = await supabase.from('consulta').insert({
              membro_id: membroSelecionado.id,
              origem_agendamento: 'manual',
              especialidade_id: especialidadeId,
              profissional_id: profissionalId,
              data_hora: `${novaDataRetornoConsulta}T09:00`,
              local: novoLocalConsulta || null,
              motivo: 'Retorno',
              status: 'agendada',
              lembrete: true,
              condicao_relacionada_id: condicaoLigada,
              retorno_de_consulta_id: consultaIdSalva,
            });
            if (error) throw error;
          } else if (retornoExistente.status === 'agendada' && String(retornoExistente.data_hora).slice(0, 10) !== novaDataRetornoConsulta) {
            const horaAtual = String(retornoExistente.data_hora).slice(11, 16) || '09:00';
            const { error } = await supabase.from('consulta')
              .update({ data_hora: `${novaDataRetornoConsulta}T${horaAtual}` })
              .eq('id', retornoExistente.id);
            if (error) throw error;
          }
        } else if (retornoExistente && retornoExistente.status === 'agendada') {
          await supabase.from('consulta').delete().eq('id', retornoExistente.id);
        }
      }

      setAnexosNovosConsulta([]);
      setAnexosConsulta([]);
      setConsultaEditandoId(null);
      setNovaEspecialidadeConsulta('');
      setEspecialidadeOutroConsulta('');
      setNovoProfissionalConsulta('');
      setNovaDataHoraConsulta('');
      setNovoLocalConsulta('');
      setNovoMotivoConsulta('');
      setNovoStatusConsulta('agendada');
      setNovoLembreteConsulta(false);
      setMedsConsulta([]);
      setExamesConsulta([]);
      setExameNovoConsulta('');
    setExAbertoConsulta(false);
      setExPrazoConsulta('30d');
      setExPrazoDataConsulta('');
      setExLembreteConsulta(true);
      setVacsConsulta([]);
      setVacLembreteConsulta(true);
      setTerapiasConsulta([]);
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
      if (medsConsulta.length) await carregarMedicacoes(membroSelecionado.id);
      if (examesConsulta.length) await carregarExames(membroSelecionado.id);
      if (vacsConsulta.length) await carregarVacinas(membroSelecionado.id);
      if (terapiasConsulta.length) { await carregarTerapias(membroSelecionado.id); await carregarSessoesTerapia(membroSelecionado.id); }
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
    setExameStatusOriginal('realizado');
    setExameMarcarRealizado(false);
    setExameEditandoId(null);
    setNovoNomeExame('');
    setNovaDataExame('');
    setNovoLaboratorioExame('');
    setNovoResultadoExame('');
    setNovaCondicaoRelacionadaExame('');
    setErroExame('');
    setMostrarFormExame(true);
  }

  function abrirEdicaoExame(e: Exame, marcarRealizado: boolean = false) {
    setExameEditandoId(e.id);
    setExameStatusOriginal(e.status || 'realizado');
    setExameMarcarRealizado(marcarRealizado);
    setNovoNomeExame(e.nome);
    setNovaDataExame(marcarRealizado ? new Date().toISOString().slice(0, 10) : e.data_realizacao);
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
      ...(exameEditandoId ? { status: exameMarcarRealizado ? 'realizado' : exameStatusOriginal } : {}),
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
    setVacinaStatusOriginal('realizado');
    setVacinaMarcarRealizada(false);
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

  function abrirEdicaoVacina(v: Vacina, marcarTomada: boolean = false) {
    setVacinaEditandoId(v.id);
    setVacinaStatusOriginal(v.status || 'realizado');
    setVacinaMarcarRealizada(marcarTomada);
    if (vacinasComuns.includes(v.nome)) {
      setNovoNomeVacina(v.nome);
      setVacinaOutroNome('');
    } else {
      setNovoNomeVacina('Outra (especificar)');
      setVacinaOutroNome(v.nome);
    }
    setNovaDoseVacina(v.dose || '');
    setNovaDataVacina(marcarTomada ? new Date().toISOString().slice(0, 10) : v.data_aplicacao);
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
      ...(vacinaEditandoId ? { status: vacinaMarcarRealizada ? 'realizado' : vacinaStatusOriginal } : {}),
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

  function abrirNovaAtividadeFisica() {
    setAtividadeEditandoId(null);
    setNovoNomeAtividade('');
    setAtividadeOutroNome('');
    setNovaDataInicioAtividade('');
    setNovaDataFimAtividade('');
    setNovaFrequenciaAtividade('');
    setNovoLocalAtividade('');
    setNovoInstrutorAtividade('');
    setNovoNivelAtividade('');
    setNovaObsAtividade('');
    setErroAtividadeFisica('');
    setMostrarFormAtividadeFisica(true);
  }

  function abrirEdicaoAtividadeFisica(a: AtividadeFisica) {
    setAtividadeEditandoId(a.id);
    if (atividadesFisicasComuns.some((g) => g.itens.includes(a.nome_atividade))) {
      setNovoNomeAtividade(a.nome_atividade);
      setAtividadeOutroNome('');
    } else {
      setNovoNomeAtividade('Outra (especificar)');
      setAtividadeOutroNome(a.nome_atividade);
    }
    setNovaDataInicioAtividade(a.data_inicio);
    setNovaDataFimAtividade(a.data_fim || '');
    setNovaFrequenciaAtividade(a.frequencia || '');
    setNovoLocalAtividade(a.local || '');
    setNovoInstrutorAtividade(a.instrutor || '');
    setNovoNivelAtividade(a.nivel || '');
    setNovaObsAtividade(a.observacao || '');
    setErroAtividadeFisica('');
    setMostrarFormAtividadeFisica(true);
  }

  async function salvarAtividadeFisica() {
    setErroAtividadeFisica('');
    const nomeFinal = novoNomeAtividade === 'Outra (especificar)' ? atividadeOutroNome.trim() : novoNomeAtividade;
    if (!nomeFinal || !novaDataInicioAtividade) {
      setErroAtividadeFisica('Preencha ao menos a atividade e a data de início.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const dados = {
      nome_atividade: nomeFinal,
      data_inicio: novaDataInicioAtividade,
      data_fim: novaDataFimAtividade || null,
      frequencia: novaFrequenciaAtividade || null,
      local: novoLocalAtividade || null,
      instrutor: novoInstrutorAtividade || null,
      nivel: novoNivelAtividade || null,
      observacao: novaObsAtividade || null,
    };

    const { error } = atividadeEditandoId
      ? await supabase.from('atividade_fisica').update(dados).eq('id', atividadeEditandoId)
      : await supabase.from('atividade_fisica').insert({ membro_id: membroSelecionado.id, ...dados });

    setCarregando(false);
    if (error) {
      setErroAtividadeFisica(error.message);
      return;
    }
    setAtividadeEditandoId(null);
    setMostrarFormAtividadeFisica(false);
    await carregarAtividadesFisicas(membroSelecionado.id);
  }

  async function excluirAtividadeFisica() {
    if (!atividadeEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('atividade_fisica').delete().eq('id', atividadeEditandoId);
    setCarregando(false);
    if (error) {
      setErroAtividadeFisica(error.message);
      return;
    }
    setAtividadeEditandoId(null);
    setMostrarFormAtividadeFisica(false);
    await carregarAtividadesFisicas(membroSelecionado.id);
  }

  function abrirNovaTerapia() {
    setTerapiaEditandoId(null);
    setFormTerapia(terapiaVazia());
    setSessoesNovas([]);
    setNovaSessaoDataHora('');
    setNovaSessaoAlerta(true);
    setErroTerapia('');
    setMostrarFormTerapia(true);
  }

  function abrirEdicaoTerapia(t: Terapia) {
    setTerapiaEditandoId(t.id);
    setSessoesNovas([]);
    setNovaSessaoDataHora('');
    setNovaSessaoAlerta(true);
    const conhecida = tiposTerapia.includes(t.tipo) && t.tipo !== 'Outra (especificar)';
    setFormTerapia({
      tipo: conhecida ? t.tipo : 'Outra (especificar)',
      outroTipo: conhecida ? '' : t.tipo,
      frequencia: t.frequencia || '',
      inicio: t.data_inicio || '',
      fim: t.data_fim || '',
      profissional: t.profissional || '',
      local: t.local || '',
      obs: t.observacao || '',
    });
    setErroTerapia('');
    setMostrarFormTerapia(true);
  }

  async function salvarTerapia() {
    setErroTerapia('');
    const tipoFinal = formTerapia.tipo === 'Outra (especificar)' ? formTerapia.outroTipo.trim() : formTerapia.tipo;
    if (!tipoFinal) {
      setErroTerapia('Escolha o tipo de terapia.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);
    const dados = {
      tipo: tipoFinal,
      frequencia: formTerapia.frequencia.trim() || null,
      data_inicio: formTerapia.inicio || null,
      data_fim: formTerapia.fim || null,
      profissional: formTerapia.profissional.trim() || null,
      local: formTerapia.local.trim() || null,
      observacao: formTerapia.obs.trim() || null,
    };
    let erroSalvar: { message: string } | null = null;
    if (terapiaEditandoId) {
      const { error } = await supabase.from('terapia').update(dados).eq('id', terapiaEditandoId);
      erroSalvar = error;
    } else {
      const { data: criada, error } = await supabase
        .from('terapia')
        .insert({ membro_id: membroSelecionado.id, ...dados })
        .select('id')
        .single();
      erroSalvar = error;
      if (!error && criada && sessoesNovas.length > 0) {
        const { error: erroSessoes } = await supabase.from('sessao_terapia').insert(
          sessoesNovas.map((s) => ({ membro_id: membroSelecionado.id, terapia_id: criada.id, data_hora: s.data_hora, lembrete: s.lembrete }))
        );
        if (erroSessoes) erroSalvar = erroSessoes;
      }
    }
    setCarregando(false);
    if (erroSalvar) {
      setErroTerapia(erroSalvar.message);
      return;
    }
    setTerapiaEditandoId(null);
    setSessoesNovas([]);
    setMostrarFormTerapia(false);
    await carregarTerapias(membroSelecionado.id);
    await carregarSessoesTerapia(membroSelecionado.id);
  }

  async function excluirTerapia() {
    if (!terapiaEditandoId || !membroSelecionado) return;
    setCarregando(true);
    const { error } = await supabase.from('terapia').delete().eq('id', terapiaEditandoId);
    setCarregando(false);
    if (error) {
      setErroTerapia(error.message);
      return;
    }
    setTerapiaEditandoId(null);
    setMostrarFormTerapia(false);
    await carregarTerapias(membroSelecionado.id);
  }

  // Datas das sessões: numa terapia já salva, adicionar/remover/alternar alerta grava na hora;
  // numa terapia nova, as datas ficam na lista e são gravadas junto com ela ao salvar.
  async function adicionarSessaoTerapia() {
    if (!novaSessaoDataHora || !membroSelecionado) return;
    if (terapiaEditandoId) {
      const { error } = await supabase.from('sessao_terapia').insert({
        membro_id: membroSelecionado.id,
        terapia_id: terapiaEditandoId,
        data_hora: novaSessaoDataHora,
        lembrete: novaSessaoAlerta,
      });
      if (error) { setErroTerapia(error.message); return; }
      await carregarSessoesTerapia(membroSelecionado.id);
    } else {
      setSessoesNovas((l) => [...l, { data_hora: novaSessaoDataHora, lembrete: novaSessaoAlerta }].sort((a, b) => a.data_hora.localeCompare(b.data_hora)));
    }
    setNovaSessaoDataHora('');
  }

  async function removerSessaoTerapia(id: string) {
    if (!membroSelecionado) return;
    const { error } = await supabase.from('sessao_terapia').delete().eq('id', id);
    if (error) { setErroTerapia(error.message); return; }
    await carregarSessoesTerapia(membroSelecionado.id);
  }

  async function alternarAlertaSessaoTerapia(s: SessaoTerapia) {
    if (!membroSelecionado) return;
    const { error } = await supabase.from('sessao_terapia').update({ lembrete: !s.lembrete }).eq('id', s.id);
    if (error) { setErroTerapia(error.message); return; }
    await carregarSessoesTerapia(membroSelecionado.id);
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
  type ItemPendencia = { id: string; tipo: 'consulta' | 'vacina' | 'medicacao' | 'exame' | 'terapia'; titulo: string; detalhe: string; refId?: string; quando?: string };
  function iconePendencia(tipo: ItemPendencia['tipo']) {
    const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: '#0F766E', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    switch (tipo) {
      case 'consulta':
        return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
      case 'vacina':
        return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
      case 'terapia':
        return <svg {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /><line x1="12" y1="9" x2="12" y2="15" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
      case 'exame':
        return <svg {...props}><path d="M9 3h6" /><path d="M10 3v6.5L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5-9.5V3" /><path d="M7.5 15h9" /></svg>;
      case 'medicacao':
        return <svg {...props}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></svg>;
      default:
        return null;
    }
  }
  // Texto curto das próximas sessões de uma terapia: "12/10 às 15:00 · 19/10 às 15:00 · +2".
  function textoProximasSessoes(datas: string[]): string {
    const futuras = datas.map((d) => new Date(d)).filter((d) => d.getTime() >= Date.now()).sort((a, b) => a.getTime() - b.getTime());
    const fmt = (d: Date) => `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const txt = futuras.slice(0, 5).map(fmt).join('\n');
    return futuras.length > 5 ? `${txt}\n+${futuras.length - 5} sessões` : txt;
  }

  function obterPendencias(): ItemPendencia[] {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const itens: ItemPendencia[] = [];

    // Mostra TODAS as consultas agendadas futuras (não só a próxima), da mais próxima
    // pra mais distante.
    const consultasFuturas = consultas
      .filter((c) => c.status === 'agendada' && new Date(c.data_hora) >= new Date())
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    for (const c of consultasFuturas) {
      const dh = new Date(c.data_hora);
      itens.push({
        id: `consulta-${c.id}`,
        refId: c.id,
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
        refId: v.id,
        tipo: 'vacina',
        titulo: `Vacina: ${v.nome}${v.dose ? ' — ' + v.dose : ''}`,
        detalhe: diasRestantes < 0 ? `atrasada desde ${dv.toLocaleDateString('pt-BR')}` : diasRestantes === 0 ? 'hoje' : `vence em ${diasRestantes} dias`,
      });
    }

    // Exames solicitados em consulta e ainda não realizados.
    for (const e of exames.filter((x) => x.status === 'solicitado')) {
      const dp = new Date(e.data_realizacao + 'T12:00:00');
      const dias = Math.round((dp.getTime() - hoje.getTime()) / 86400000);
      itens.push({
        id: `exame-${e.id}`,
        refId: e.id,
        tipo: 'exame',
        titulo: `Exame: ${e.nome}`,
        detalhe: dias < 0 ? `prazo vencido em ${dp.toLocaleDateString('pt-BR')}` : dias === 0 ? 'fazer até hoje' : `fazer até ${dp.toLocaleDateString('pt-BR')}`,
      });
    }

    // Vacinas indicadas em consulta e ainda não tomadas.
    for (const v of vacinas.filter((x) => x.status === 'indicada')) {
      const dv = new Date(v.data_aplicacao + 'T12:00:00');
      itens.push({
        id: `vacina-ind-${v.id}`,
        refId: v.id,
        tipo: 'vacina',
        titulo: `Vacina indicada: ${v.nome}`,
        detalhe: `tomar em ${dv.toLocaleDateString('pt-BR')}`,
      });
    }

    // Mostra TODAS as medicações de uso contínuo/ainda ativas, não só a primeira.
    const medicacoesAtivas = medicacoes.filter((m) => !m.data_fim || new Date(m.data_fim) >= hoje);
    for (const m of medicacoesAtivas) {
      itens.push({
        id: `medicacao-${m.id}`,
        refId: m.id,
        tipo: 'medicacao',
        titulo: `Medicação: ${m.nome}`,
        detalhe: m.horario ? `hoje às ${m.horario}` : 'uso contínuo',
        quando: m.data_fim || undefined,
      });
    }

    // Terapias em andamento: mostra as datas/horários das próximas sessões com alerta ligado
    // (sessões que já passaram saem da Home sozinhas).
    for (const t of terapias.filter((x) => !x.data_fim || new Date(x.data_fim) >= hoje)) {
      const proximas = textoProximasSessoes(sessoesTerapia.filter((s) => s.terapia_id === t.id && s.lembrete).map((s) => s.data_hora));
      itens.push({
        id: `terapia-${t.id}`,
        refId: t.id,
        tipo: 'terapia',
        titulo: `Terapia: ${t.tipo}`,
        detalhe: proximas || t.frequencia || 'em andamento',
      });
    }

    return itens;
  }

  // Toque numa pendência da Home: vai para "Consultar", na tela da categoria, e abre os
  // detalhes do item (dose/horário do remédio, prazo do exame etc.). Para um familiar,
  // troca o membro selecionado primeiro; o efeito abaixo abre o item quando ele carregar.
  const telaDaPendencia: Record<string, Aba> = { consulta: 'consultas', vacina: 'vacinas', medicacao: 'medicacoes', exame: 'exames', terapia: 'terapias' };
  function abrirPendencia(p: ItemPendencia, membroId: string) {
    if (!p.refId) return;
    const alvoMembro = membros.find((m) => m.id === membroId);
    irParaAbaInferior('consultar');
    if (alvoMembro && alvoMembro.id !== membroSelecionado?.id) setMembroSelecionado(alvoMembro);
    setTelaDetalhe(telaDaPendencia[p.tipo]);
    setAlvoPendencia({ tipo: p.tipo, refId: p.refId, membroId });
  }

  useEffect(() => {
    if (!alvoPendencia || !membroSelecionado || membroSelecionado.id !== alvoPendencia.membroId) return;
    const { tipo, refId } = alvoPendencia;
    if (tipo === 'consulta') {
      const c = consultas.find((x) => x.id === refId);
      if (c) { abrirEdicaoConsulta(c); setAlvoPendencia(null); }
    } else if (tipo === 'medicacao') {
      const m = medicacoes.find((x) => x.id === refId);
      if (m) { abrirEdicaoMedicacao(m); setAlvoPendencia(null); }
    } else if (tipo === 'exame') {
      const e = exames.find((x) => x.id === refId);
      if (e) { abrirEdicaoExame(e); setAlvoPendencia(null); }
    } else if (tipo === 'vacina') {
      const v = vacinas.find((x) => x.id === refId);
      if (v) { abrirEdicaoVacina(v); setAlvoPendencia(null); }
    } else if (tipo === 'terapia') {
      const t = terapias.find((x) => x.id === refId);
      if (t) { abrirEdicaoTerapia(t); setAlvoPendencia(null); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alvoPendencia, membroSelecionado?.id, consultas, medicacoes, exames, vacinas, terapias]);

  function dataLocalISO(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dia}`;
  }

  // ---- Avisos (sino) ----
  async function carregarAvisoDest() {
    const { data } = await supabase.from('aviso_destinatario').select('usuario_id, membro_id, recebe');
    setAvisoDest((data || []) as { usuario_id: string; membro_id: string; recebe: boolean }[]);
  }
  function recebeAviso(usuarioId: string | null, membroId: string): boolean {
    if (!usuarioId) return true;
    const linha = avisoDest.find((a) => a.usuario_id === usuarioId && a.membro_id === membroId);
    return linha ? linha.recebe : true;
  }
  async function definirRecebeAviso(usuarioId: string, membroId: string, recebe: boolean) {
    setAvisoDest((l) => [...l.filter((a) => !(a.usuario_id === usuarioId && a.membro_id === membroId)), { usuario_id: usuarioId, membro_id: membroId, recebe }]);
    await supabase.from('aviso_destinatario').upsert({ usuario_id: usuarioId, membro_id: membroId, recebe }, { onConflict: 'usuario_id,membro_id' });
  }
  // Avisos de hoje: o que é para hoje/amanhã (ou já passou do prazo), dos membros que EU recebo.
  function obterAvisos() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 2);
    const hojeStr = dataLocalISO(hoje);
    const limiteStr = dataLocalISO(limite);
    const lista: { chave: string; membroId: string; membroNome: string; item: ItemPendencia; rotulo: string; atrasado: boolean }[] = [];
    for (const f of pendenciasFamiliares) {
      if (!recebeAviso(meuUsuarioId, f.membroId)) continue;
      for (const p of f.itens) {
        if (!p.quando) continue;
        if (p.quando >= limiteStr) continue;
        const dias = Math.round((new Date(p.quando + 'T00:00:00').getTime() - hoje.getTime()) / 86400000);
        const atrasado = p.quando < hojeStr;
        if (atrasado && (p.tipo === 'consulta' || p.tipo === 'terapia' || p.tipo === 'medicacao')) continue;
        let rotulo = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : atrasado ? `atrasado há ${-dias} dia${-dias > 1 ? 's' : ''}` : `em ${dias} dias`;
        if (p.tipo === 'medicacao') rotulo = `termina ${rotulo}`;
        lista.push({ chave: p.id, membroId: f.membroId, membroNome: f.membroNome, item: p, rotulo, atrasado });
      }
    }
    return lista.sort((a, b) => (a.item.quando || '').localeCompare(b.item.quando || ''));
  }

  // Pendências de TODA a família, mostradas na Home (diferente de obterPendencias(),
  // que só olha o membro selecionado e os dados já carregados no estado). Como esse
  // resumo precisa dos dados de todo mundo — não só de quem está selecionado agora —
  // ele faz suas próprias consultas no Supabase com .in('membro_id', ids).
  async function carregarPendenciasFamiliares(lista: Membro[]) {
    if (lista.length === 0) {
      setPendenciasFamiliares([]);
      return;
    }
    const ids = lista.map((m) => m.id);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeStr = hoje.toISOString().slice(0, 10);

    const [{ data: consultasData }, { data: vacinasData }, { data: medicacoesData }, { data: examesData }, { data: vacinasIndData }, { data: terapiasData }, { data: sessoesData }] = await Promise.all([
      supabase.from('consulta').select('id, membro_id, data_hora, status, especialidade(nome), profissional_saude(nome), local').in('membro_id', ids).eq('status', 'agendada').gte('data_hora', new Date().toISOString()),
      supabase.from('vacina').select('id, membro_id, nome, dose, proxima_dose_data').in('membro_id', ids).not('proxima_dose_data', 'is', null),
      supabase.from('medicacao').select('id, membro_id, nome, data_fim, horario').in('membro_id', ids),
      supabase.from('exame').select('id, membro_id, nome, data_realizacao').in('membro_id', ids).eq('status', 'solicitado'),
      supabase.from('vacina').select('id, membro_id, nome, data_aplicacao').in('membro_id', ids).eq('status', 'indicada'),
      supabase.from('terapia').select('*').in('membro_id', ids),
      supabase.from('sessao_terapia').select('*').in('membro_id', ids).eq('lembrete', true),
    ]);

    const porMembro: Record<string, ItemPendencia[]> = {};
    const adicionar = (membroId: string, item: ItemPendencia) => {
      if (!porMembro[membroId]) porMembro[membroId] = [];
      porMembro[membroId].push(item);
    };

    (consultasData || []).forEach((c: any) => {
      adicionar(c.membro_id, {
        id: `consulta-${c.id}`,
        refId: c.id,
        tipo: 'consulta',
        titulo: `Consulta: ${c.especialidade?.nome || 'a confirmar'}${c.profissional_saude?.nome ? ' — ' + c.profissional_saude.nome : ''}`,
        detalhe: `${new Date(c.data_hora).toLocaleDateString('pt-BR')}${c.local ? ' · ' + c.local : ''}`,
        quando: dataLocalISO(new Date(c.data_hora)),
      });
    });
    (vacinasData || []).forEach((v: any) => {
      adicionar(v.membro_id, {
        id: `vacina-${v.id}`,
        refId: v.id,
        tipo: 'vacina',
        titulo: `Vacina: ${v.nome}${v.dose ? ' — ' + v.dose : ''}`,
        detalhe: `próxima dose: ${formatarData(v.proxima_dose_data)}`,
        quando: v.proxima_dose_data,
      });
    });
    (examesData || []).forEach((e: any) => {
      adicionar(e.membro_id, {
        id: `exame-${e.id}`,
        refId: e.id,
        tipo: 'exame',
        titulo: `Exame: ${e.nome}`,
        detalhe: `fazer até ${formatarData(e.data_realizacao)}`,
        quando: e.data_realizacao,
      });
    });
    (vacinasIndData || []).forEach((v: any) => {
      adicionar(v.membro_id, {
        id: `vacina-ind-${v.id}`,
        refId: v.id,
        tipo: 'vacina',
        titulo: `Vacina indicada: ${v.nome}`,
        detalhe: `tomar em ${formatarData(v.data_aplicacao)}`,
        quando: v.data_aplicacao,
      });
    });
    (medicacoesData || []).filter((m: any) => !m.data_fim || m.data_fim >= hojeStr).forEach((m: any) => {
      adicionar(m.membro_id, {
        id: `medicacao-${m.id}`,
        refId: m.id,
        tipo: 'medicacao',
        titulo: `Medicação: ${m.nome}`,
        detalhe: m.horario ? `hoje às ${m.horario}` : 'uso contínuo',
      });
    });
    const sessoesPorTerapia: Record<string, string[]> = {};
    (sessoesData || []).forEach((s: any) => {
      if (!sessoesPorTerapia[s.terapia_id]) sessoesPorTerapia[s.terapia_id] = [];
      sessoesPorTerapia[s.terapia_id].push(s.data_hora);
    });
    (terapiasData || []).filter((t: any) => !t.data_fim || t.data_fim >= hojeStr).forEach((t: any) => {
      adicionar(t.membro_id, {
        id: `terapia-${t.id}`,
        refId: t.id,
        tipo: 'terapia',
        titulo: `Terapia: ${t.tipo}`,
        detalhe: textoProximasSessoes(sessoesPorTerapia[t.id] || []) || t.frequencia || 'em andamento',
        quando: (sessoesPorTerapia[t.id] || []).map((d) => new Date(d)).filter((d) => d.getTime() >= hoje.getTime()).sort((a, b) => a.getTime() - b.getTime()).map(dataLocalISO)[0],
      });
    });

    const resultado = lista
      .map((m) => ({ membroId: m.id, membroNome: m.nome, itens: porMembro[m.id] || [] }))
      .filter((r) => r.itens.length > 0);
    setPendenciasFamiliares(resultado);
  }

  // Passos do wizard de onboarding (estilo "configuração inicial do iPhone"), mostrado
  // só uma vez, logo depois de criar um membro novo. Cada passo reaproveita a tela e o
  // formulário que já existem pra aquela categoria — o wizard só guia a navegação entre
  // elas, com uma explicação rápida e opção de pular.
  const passosOnboarding: { aba: Aba; titulo: string; explicacao: string }[] = [
    { aba: 'nascimento', titulo: 'Dados pessoais', explicacao: 'Confira os dados básicos e complete o que quiser: tipo sanguíneo, parentesco, alergias e observações gerais.' },
    { aba: 'gestacao', titulo: 'Gestação e Nascimento', explicacao: 'Pré-natal, tipo de parto, semanas de gestação, Apgar e intercorrências. Pule se não souber agora.' },
    { aba: 'condicoes', titulo: 'Evento de Saúde', explicacao: 'Registre doenças ou condições de saúde que esta pessoa já teve ou tem atualmente.' },
    { aba: 'cirurgias', titulo: 'Cirurgia/Internação', explicacao: 'Registre cirurgias ou internações pelas quais esta pessoa já passou.' },
    { aba: 'consultas', titulo: 'Consultas', explicacao: 'Registre consultas médicas já feitas ou marcadas para esta pessoa.' },
    { aba: 'odontologia', titulo: 'Odontologia', explicacao: 'Registre visitas ao dentista ou ortodontista.' },
    { aba: 'exames', titulo: 'Exames', explicacao: 'Registre exames já realizados, pra manter um histórico e os resultados à mão.' },
    { aba: 'medicacoes', titulo: 'Medicações', explicacao: 'Registre os medicamentos que esta pessoa usa ou já usou, incluindo os de uso contínuo.' },
    { aba: 'vacinas', titulo: 'Vacinas', explicacao: 'Registre as vacinas já tomadas e as próximas doses previstas.' },
    { aba: 'crescimento', titulo: 'Peso e Crescimento', explicacao: 'Registre o peso e a altura mais recentes, pra acompanhar a curva de crescimento ou o IMC.' },
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
    setMostrarFormNascimento(false);
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
    { id: 'odontologia', label: 'Odontologia' },
    { id: 'exames', label: 'Exames' },
    { id: 'vacinas', label: 'Vacinas' },
    { id: 'terapias', label: 'Terapias' },
    { id: 'crescimento', label: 'Peso e Crescimento' },
    { id: 'riscos', label: 'Cuidados Preventivos', labelCurto: 'Cuidados Prev.' },
    { id: 'bemestar', label: 'Bem-estar' },
    { id: 'medicos', label: 'Médicos' },
  ];

  // Ao tocar numa categoria dentro de "Incluir" ou "Consultar", já abre ela no modo
  // certo: em "Incluir" pula direto pro formulário de novo registro (sem precisar
  // tocar em "+ nova" de novo); em "Consultar" só mostra a lista (o botão de "+ nova"
  // de cada tela já fica escondido nesse modo, via abaInferior !== 'consultar').
  // Feed unificado: um item normalizado por evento, de qualquer categoria, pra poder
  // listar tudo junto, ordenado por data, colorido por tipo e filtrável.
  type EventoFeed = {
    id: string;
    categoria: 'doenca' | 'cirurgia' | 'medicamento' | 'consulta' | 'odontologia' | 'exame' | 'vacina' | 'crescimento' | 'atividade' | 'terapia';
    titulo: string;
    subtitulo: string | null;
    data: string | null; // formato YYYY-MM-DD, pode ser null se o evento não tiver data
    medico: string | null;
    aba: Aba;
  };

  const categoriaFeedInfo: Record<EventoFeed['categoria'], { label: string; cor: string }> = {
    doenca: { label: 'Evento de Saúde', cor: 'bg-sky-100 text-sky-700 border-sky-200' },
    cirurgia: { label: 'Cirurgia/Internação', cor: 'bg-blue-100 text-blue-700 border-blue-200' },
    medicamento: { label: 'Medicamento', cor: 'bg-amber-100 text-amber-700 border-amber-200' },
    consulta: { label: 'Consulta', cor: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    odontologia: { label: 'Odontologia', cor: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    exame: { label: 'Exame', cor: 'bg-purple-100 text-purple-700 border-purple-200' },
    vacina: { label: 'Vacina', cor: 'bg-orange-100 text-orange-700 border-orange-200' },
    crescimento: { label: 'Peso e Crescimento', cor: 'bg-slate-200 text-slate-700 border-slate-300' },
    atividade: { label: 'Atividade Física', cor: 'bg-lime-100 text-lime-700 border-lime-200' },
    terapia: { label: 'Terapia', cor: 'bg-pink-100 text-pink-700 border-pink-200' },
  };

  function obterEventosBrutos(): EventoFeed[] {
    const eventos: EventoFeed[] = [];

    for (const c of condicoes) {
      if (c.tipo === 'cirurgia' || c.tipo === 'internacao') {
        eventos.push({
          id: `condicao-${c.id}`,
          categoria: 'cirurgia',
          titulo: c.nome,
          subtitulo: statusCondicaoLabels[c.status] ?? null,
          data: c.data_diagnostico_ou_procedimento,
          medico: c.medico,
          aba: 'cirurgias',
        });
      } else {
        eventos.push({
          id: `condicao-${c.id}`,
          categoria: 'doenca',
          titulo: c.nome,
          subtitulo: statusCondicaoLabels[c.status] ?? null,
          data: c.data_diagnostico_ou_procedimento,
          medico: c.medico,
          aba: 'condicoes',
        });
      }
    }

    for (const m of medicacoes) {
      eventos.push({
        id: `medicacao-${m.id}`,
        categoria: 'medicamento',
        titulo: m.nome,
        subtitulo: m.dosagem ?? m.frequencia ?? null,
        data: m.data_inicio,
        medico: m.medico_receitou,
        aba: 'medicacoes',
      });
    }

    for (const c of consultas) {
      const ehOdontologia = c.especialidade?.nome === 'Odontologia';
      eventos.push({
        id: `consulta-${c.id}`,
        categoria: ehOdontologia ? 'odontologia' : 'consulta',
        titulo: c.especialidade?.nome ?? c.motivo ?? 'Consulta',
        subtitulo: c.local ?? c.motivo ?? null,
        data: c.data_hora ? c.data_hora.slice(0, 10) : null,
        medico: c.profissional_saude?.nome ?? null,
        aba: ehOdontologia ? 'odontologia' : 'consultas',
      });
    }

    for (const e of exames) {
      eventos.push({
        id: `exame-${e.id}`,
        categoria: 'exame',
        titulo: e.nome,
        subtitulo: e.laboratorio ?? null,
        data: e.data_realizacao,
        medico: null,
        aba: 'exames',
      });
    }

    for (const v of vacinas) {
      eventos.push({
        id: `vacina-${v.id}`,
        categoria: 'vacina',
        titulo: v.nome,
        subtitulo: v.dose ?? null,
        data: v.data_aplicacao,
        medico: null,
        aba: 'vacinas',
      });
    }

    for (const m of crescimento) {
      const partes: string[] = [];
      if (m.peso_kg != null) partes.push(`${m.peso_kg} kg`);
      if (m.altura_cm != null) partes.push(`${m.altura_cm} cm`);
      eventos.push({
        id: `crescimento-${m.id}`,
        categoria: 'crescimento',
        titulo: 'Peso e Crescimento',
        subtitulo: partes.length ? partes.join(' · ') : null,
        data: m.data_medicao,
        medico: null,
        aba: 'crescimento',
      });
    }

    for (const a of atividadesFisicas) {
      eventos.push({
        id: `atividade-${a.id}`,
        categoria: 'atividade',
        titulo: a.nome_atividade,
        subtitulo: a.frequencia ?? a.local ?? null,
        data: a.data_inicio,
        medico: null,
        aba: 'esportes',
      });
    }

    for (const t of terapias) {
      eventos.push({
        id: `terapia-${t.id}`,
        categoria: 'terapia',
        titulo: t.tipo,
        subtitulo: t.frequencia ?? t.local ?? null,
        data: t.data_inicio,
        medico: t.profissional,
        aba: 'terapias',
      });
    }

    return eventos.sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''));
  }

  function obterMedicosDoFeed(): string[] {
    const nomes = obterEventosBrutos()
      .map((ev) => ev.medico)
      .filter((nome): nome is string => !!nome && nome.trim().length > 0);
    return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b));
  }

  function obterEventosUnificados(): EventoFeed[] {
    return obterEventosBrutos()
      .filter((ev) => filtroFeedTipo === 'todos' || ev.categoria === filtroFeedTipo)
      .filter((ev) => !filtroFeedDataInicio || (ev.data && ev.data >= filtroFeedDataInicio))
      .filter((ev) => !filtroFeedDataFim || (ev.data && ev.data <= filtroFeedDataFim))
      .filter((ev) => filtroFeedMedico === 'todos' || ev.medico === filtroFeedMedico);
  }

  function abrirCategoriaNoModo(id: Aba) {
    setTelaDetalhe(id);
    if (abaInferior !== 'incluir') return;
    switch (id) {
      case 'condicoes':
        abrirNovaCondicao('doenca');
        break;
      case 'cirurgias':
        abrirNovaCondicao('cirurgia');
        break;
      case 'medicacoes':
        abrirNovaMedicacao();
        break;
      case 'consultas':
        abrirNovaConsulta();
        break;
      case 'odontologia':
        abrirNovaConsulta('Odontologia');
        break;
      case 'exames':
        abrirNovoExame();
        break;
      case 'vacinas':
        abrirNovaVacina();
        break;
      case 'terapias':
        abrirNovaTerapia();
        break;
      case 'crescimento':
        abrirNovaMedicaoCrescimento();
        break;
      default:
        break;
    }
  }

  // Itens do menu que abre ao tocar nos 3 risquinhos (pedido da Roberta: uma anamnese
  // mais completa, organizada em seções). Cada seção só aparece pra idade em que faz
  // sentido perguntar aquilo — mas nunca desaparece se já tiver dado salvo, pra não
  // sumir uma informação que já foi preenchida quando o membro "sai" da faixa etária.
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
      case 'terapias':
        return <svg {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /><line x1="12" y1="9" x2="12" y2="15" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
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
      case 'feedeventos':
        return <svg {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
      default:
        return null;
    }
  }

  // Tela de resumo pra impressão/PDF (gerada em "Compartilhar"). Fica fora do layout
  // normal do app (sem menu inferior, sem card centralizado) pra imprimir só o
  // conteúdo médico — "Imprimir/Salvar PDF" usa o diálogo de impressão do navegador,
  // onde dá pra escolher "Salvar como PDF" em vez de uma impressora física.
  if (mostrarResumoImpressao && membroSelecionado) {
    const consultasGerais = consultas.filter((c) => !['Odontologia', 'Ortodontia'].includes(c.especialidade?.nome || ''));
    const consultasOdonto = consultas.filter((c) => ['Odontologia', 'Ortodontia'].includes(c.especialidade?.nome || ''));
    const eventosSaude = condicoes.filter((c) => c.tipo === 'doenca');
    const cirurgiasInternacoes = condicoes.filter((c) => c.tipo !== 'doenca');
    return (
      <main className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <button onClick={() => setMostrarResumoImpressao(false)} className="text-sm text-teal-700">← Voltar</button>
          <button onClick={() => window.print()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            <Ic n="impressora" /> Imprimir / Salvar PDF
          </button>
        </div>

        <h1 className="text-xl font-semibold text-slate-800">Resumo de saúde — {membroSelecionado.nome}</h1>
        <p className="text-xs text-slate-400 mb-6">
          {calcularIdade(membroSelecionado.data_nascimento)} anos · gerado em {new Date().toLocaleDateString('pt-BR')}
        </p>

        {secoesCompartilhar.nascimento && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Dados pessoais</h2>
            <p className="text-sm text-slate-700">
              Nascimento: {formatarData(membroSelecionado.data_nascimento)} · Sexo biológico: {membroSelecionado.sexo_biologico || '—'} · Tipo sanguíneo: {membroSelecionado.tipo_sanguineo || '—'}
            </p>
            {membroSelecionado.alergias && <p className="text-sm text-slate-700 mt-1">Alergias: {membroSelecionado.alergias}</p>}
            {membroSelecionado.observacoes_gerais && <p className="text-sm text-slate-700 mt-1">Observações: {membroSelecionado.observacoes_gerais}</p>}
            {nascimento?.tipo_parto && <p className="text-sm text-slate-700 mt-1">Tipo de parto: {nascimento.tipo_parto}</p>}
          </section>
        )}

        {secoesCompartilhar.condicoes && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Eventos de saúde</h2>
            {eventosSaude.length === 0 ? <p className="text-sm text-slate-400">Nenhum registrado.</p> : eventosSaude.map((c) => (
              <p key={c.id} className="text-sm text-slate-700 mb-1">
                {c.nome} — {statusCondicaoLabels[c.status] || c.status}{c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                {c.observacao && ` · ${c.observacao}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.cirurgias && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Cirurgias/Internações</h2>
            {cirurgiasInternacoes.length === 0 ? <p className="text-sm text-slate-400">Nenhuma registrada.</p> : cirurgiasInternacoes.map((c) => (
              <p key={c.id} className="text-sm text-slate-700 mb-1">
                {c.nome}{c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}{c.medico && ` · Dr(a). ${c.medico}`}
                {c.observacao && ` · ${c.observacao}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.medicacoes && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Medicações</h2>
            {medicacoes.length === 0 ? <p className="text-sm text-slate-400">Nenhuma registrada.</p> : medicacoes.map((m) => (
              <p key={m.id} className="text-sm text-slate-700 mb-1">
                {m.nome}{m.dosagem && ` · ${m.dosagem}`} · {m.data_fim ? `até ${formatarData(m.data_fim)}` : 'uso contínuo'}
                {m.medico_receitou && ` · receitado por ${m.medico_receitou}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.consultas && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Consultas</h2>
            {consultasGerais.length === 0 ? <p className="text-sm text-slate-400">Nenhuma registrada.</p> : consultasGerais.map((c) => (
              <p key={c.id} className="text-sm text-slate-700 mb-1">
                {c.especialidade?.nome || 'Especialidade'} · {new Date(c.data_hora).toLocaleDateString('pt-BR')}
                {c.profissional_saude?.nome && ` · ${c.profissional_saude.nome}`}{c.anotacoes && ` · ${c.anotacoes}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.odontologia && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Odontologia</h2>
            {consultasOdonto.length === 0 ? <p className="text-sm text-slate-400">Nenhuma registrada.</p> : consultasOdonto.map((c) => (
              <p key={c.id} className="text-sm text-slate-700 mb-1">
                {new Date(c.data_hora).toLocaleDateString('pt-BR')}{c.profissional_saude?.nome && ` · ${c.profissional_saude.nome}`}{c.anotacoes && ` · ${c.anotacoes}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.exames && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Exames</h2>
            {exames.length === 0 ? <p className="text-sm text-slate-400">Nenhum registrado.</p> : exames.map((e) => (
              <p key={e.id} className="text-sm text-slate-700 mb-1">
                {e.nome} · {formatarData(e.data_realizacao)}{e.laboratorio && ` · ${e.laboratorio}`}{e.resultado_resumo && ` · ${e.resultado_resumo}`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.vacinas && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Vacinas</h2>
            {vacinas.length === 0 ? <p className="text-sm text-slate-400">Nenhuma registrada.</p> : vacinas.map((v) => (
              <p key={v.id} className="text-sm text-slate-700 mb-1">
                {v.nome}{v.dose && ` — ${v.dose}`} · {formatarData(v.data_aplicacao)}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.crescimento && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Peso e crescimento</h2>
            {crescimento.length === 0 ? <p className="text-sm text-slate-400">Nenhuma medição registrada.</p> : crescimento.map((m) => (
              <p key={m.id} className="text-sm text-slate-700 mb-1">
                {formatarData(m.data_medicao)}{m.peso_kg != null && ` · ${m.peso_kg} kg`}{m.altura_cm != null && ` · ${m.altura_cm} cm`}
              </p>
            ))}
          </section>
        )}

        {secoesCompartilhar.anamnese && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">Anamnese</h2>
            {nascimento && (nascimento.pre_natal_adequado || nascimento.intercorrencias_gestacionais) && (
              <p className="text-sm text-slate-700 mb-1">
                Pré-natal: {nascimento.pre_natal_adequado || '—'}{nascimento.intercorrencias_gestacionais && ` · ${nascimento.intercorrencias_gestacionais}`}
              </p>
            )}
            {desenvolvimento && (
              <p className="text-sm text-slate-700 mb-1">
                Desenvolvimento: sentou {desenvolvimento.sentou || '—'} · andou {desenvolvimento.andou || '—'} · 1ªs palavras {desenvolvimento.primeiras_palavras || '—'}
              </p>
            )}
            {alimentacaoInfantil && (
              <p className="text-sm text-slate-700 mb-1">
                Alimentação: aleitamento materno {alimentacaoInfantil.aleitamento_materno ? 'sim' : 'não'}{alimentacaoInfantil.introducao_alimentar && ` · ${alimentacaoInfantil.introducao_alimentar}`}
              </p>
            )}
            {puberdadeSexualidade && (puberdadeSexualidade.menarca_espermarca || puberdadeSexualidade.historico_ist) && (
              <p className="text-sm text-slate-700 mb-1">
                Puberdade: {puberdadeSexualidade.menarca_espermarca || '—'}
              </p>
            )}
            {saudeMental && saudeMental.humor && (
              <p className="text-sm text-slate-700 mb-1">Saúde mental: humor {saudeMental.humor}</p>
            )}
            {habitosVida && (
              <p className="text-sm text-slate-700 mb-1">
                Hábitos de vida: sono {habitosVida.sono || '—'} · atividade física {habitosVida.atividade_fisica || '—'} · uso de telas {habitosVida.uso_telas || '—'}
              </p>
            )}
            {!nascimento?.pre_natal_adequado && !desenvolvimento && !alimentacaoInfantil && !puberdadeSexualidade && !saudeMental?.humor && !habitosVida && (
              <p className="text-sm text-slate-400">Nenhuma informação registrada ainda.</p>
            )}
          </section>
        )}
      </main>
    );
  }

  const larguraContainer = membroSelecionado ? 'max-w-2xl' : 'max-w-sm';

  // Troca de aba do menu inferior sempre volta pra tela "raiz" daquela aba (fecha
  // qualquer categoria/formulário que estivesse aberto na aba anterior), pra nunca
  // aparecer uma tela de uma aba enquanto o menu mostra outra selecionada.
  function irParaAbaInferior(aba: 'home' | 'incluir' | 'consultar' | 'compartilhar' | 'configuracao') {
    setAlvoPendencia(null);
    setMostrarFormTerapia(false);
    setAbaInferior(aba);
    setTelaDetalhe(null);
    setMostrarMenuPessoal(false);
    // Fecha qualquer formulário que tivesse ficado aberto, pra nunca entrar em
    // "Consultar" e cair de surpresa dentro de um formulário de inclusão.
    setMostrarFormCondicao(false);
    setMostrarFormMedicacao(false);
    setMostrarFormConsulta(false);
    setMostrarFormExame(false);
    setMostrarFormVacina(false);
    setMostrarFormCrescimento(false);
  }

  const itensMenuInferior: { id: 'home' | 'incluir' | 'consultar' | 'compartilhar' | 'configuracao'; label: string; icone: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icone: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" />
        </svg>
      ),
    },
    {
      id: 'incluir',
      label: 'Incluir',
      icone: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      id: 'consultar',
      label: 'Consultar',
      icone: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: 'compartilhar',
      label: 'Compartilhar',
      icone: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
        </svg>
      ),
    },
    {
      id: 'configuracao',
      label: 'Configuração',
      icone: (
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.44.7.73 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className={`w-full ${larguraContainer} rounded-2xl bg-white p-8 shadow-sm border border-[#E5E1DA] transition-all ${passo === 'painel' ? 'pb-24' : ''}`}>
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

        {passo === 'painel' && abaInferior === 'home' && !membroSelecionado && (
          <div className="space-y-4">
            <div className="space-y-2">
              {membros.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-2">Nenhum membro cadastrado ainda.</p>
              )}
              {membros.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMembroSelecionado(m); setTelaDetalhe(null); setAbaInferior('home'); }}
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

            {meuPapel === 'cuidador' ? null : !mostrarFormMembro ? (
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
          </div>
        )}

        {passo === 'painel' && abaInferior === 'home' && membroSelecionado && telaDetalhe === null && (
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setMostrarMenuPessoal((v) => !v)}
                aria-label="Mais informações"
                aria-expanded={mostrarMenuPessoal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-[#FAFAF8] hover:text-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setMostrarAvisos((v) => !v); setMostrarMenuPessoal(false); }}
                  aria-label="Avisos"
                  aria-expanded={mostrarAvisos}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-[#FAFAF8] hover:text-slate-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {obterAvisos().length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{obterAvisos().length}</span>
                  )}
                </button>
              </div>
            </div>

            {mostrarAvisos && (() => {
              const avisos = obterAvisos();
              return (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMostrarAvisos(false)} />
                  <div className="absolute right-0 top-10 z-50 w-[92%] max-w-sm overflow-hidden rounded-xl border border-[#E5E1DA] bg-white shadow-lg">
                    <p className="border-b border-[#F2F0EC] px-4 py-3 text-sm font-semibold text-slate-800">Avisos</p>
                    {avisos.length === 0 && <p className="px-4 py-4 text-sm text-slate-400">Nada para hoje ou amanhã.</p>}
                    {avisos.map((a) => (
                      <button
                        key={a.chave}
                        onClick={() => { setMostrarAvisos(false); abrirPendencia(a.item, a.membroId); }}
                        className="flex w-full items-center gap-3 border-b border-[#F2F0EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAFAF8]"
                      >
                        <span className="shrink-0">{iconePendencia(a.item.tipo)}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">{a.item.titulo}</span>
                          <span className="block truncate text-xs text-slate-400">{a.membroNome} · <span className={a.atrasado ? 'font-semibold text-red-600' : ''}>{a.rotulo}</span></span>
                        </span>
                      </button>
                    ))}
                    {membros.length > 0 && (
                      <div className="space-y-1.5 border-t border-[#E5E1DA] bg-[#FAFAF8] px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500">Receber avisos de:</p>
                        {membros.map((m) => (
                          <label key={m.id} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                            <span className="truncate">{m.nome}</span>
                            <input type="checkbox" checked={recebeAviso(meuUsuarioId, m.id)} onChange={(e) => meuUsuarioId && definirRecebeAviso(meuUsuarioId, m.id, e.target.checked)} />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {mostrarMenuPessoal && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMostrarMenuPessoal(false)}
                />
                <div className="absolute left-0 top-10 z-50 w-[85%] max-w-sm overflow-hidden rounded-xl border border-[#E5E1DA] bg-white shadow-lg">
                  {itensMenuPessoal().map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMostrarMenuPessoal(false);
                        setTelaDetalhe(item.id);
                      }}
                      className="flex w-full items-center gap-3 border-b border-[#F2F0EC] px-4 py-3 text-left last:border-b-0 hover:bg-[#FAFAF8]"
                    >
                      <span className="shrink-0 text-teal-700">{iconeSecao(item.id, 18)}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400">{item.descricao}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setMembroSelecionado(null)}
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
                <p className="text-xs text-slate-400">{calcularIdade(membroSelecionado.data_nascimento)} anos · toque para trocar de membro</p>
              </div>
            </button>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Pendências de {membroSelecionado.nome}</h3>
              {(() => {
                const pendencias = obterPendencias();
                if (pendencias.length === 0) {
                  return <p className="text-sm text-slate-400 py-2">Nada pendente por aqui no momento.</p>;
                }
                return (
                  <div className="space-y-2">
                    {pendencias.map((p) => (
                      <button key={p.id} onClick={() => abrirPendencia(p, membroSelecionado.id)} className="flex w-full items-center gap-3 rounded-xl border border-[#E5E1DA] bg-white p-3 text-left transition hover:bg-[#FAFAF8]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1]">
                          {iconePendencia(p.tipo)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{p.titulo}</p>
                          <p className="whitespace-pre-line text-xs text-slate-400">{p.detalhe}</p>
                        </div>
                        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-slate-300"><path d="M9 18l6-6-6-6" /></svg>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {meuPapel === 'admin' && pendenciasFamiliares.filter((f) => f.membroId !== membroSelecionado?.id).length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setMostrarPendenciasFamilia((v) => !v)}
                  className="mb-3 flex w-full items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-slate-800">Pendências da família</h3>
                  <span className="text-xs text-teal-700">{mostrarPendenciasFamilia ? 'ocultar ▲' : 'mostrar ▼'}</span>
                </button>
                {mostrarPendenciasFamilia && (
                  <div className="space-y-3">
                    {pendenciasFamiliares
                      .filter((f) => f.membroId !== membroSelecionado?.id)
                      .map((f) => (
                        <div key={f.membroId} className="rounded-xl border border-[#E5E1DA] bg-white p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-500">{f.membroNome}</p>
                          <div className="space-y-1.5">
                            {f.itens.map((p) => (
                              <button key={p.id} onClick={() => abrirPendencia(p, f.membroId)} className="flex w-full items-center gap-2 text-left">
                                <span className="shrink-0">{iconePendencia(p.tipo)}</span>
                                {p.detalhe.includes('\n') ? (
                                  <div className="min-w-0 text-sm text-slate-700">
                                    <p className="truncate">{p.titulo}</p>
                                    <p className="whitespace-pre-line text-xs text-slate-400">{p.detalhe}</p>
                                  </div>
                                ) : (
                                  <p className="min-w-0 truncate text-sm text-slate-700">{p.titulo} · <span className="text-slate-400">{p.detalhe}</span></p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Dicas de saúde e bem-estar</h3>
              <div
                className={`relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 transition-opacity duration-300 ${dicaVisivel ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 text-2xl leading-none">{dicasParaMembro[dicaIndex % dicasParaMembro.length].icone}</span>
                  <p className="text-sm text-teal-800">{dicasParaMembro[dicaIndex % dicasParaMembro.length].texto}</p>
                </div>
              </div>
              <div className="mt-2 flex justify-center gap-1.5">
                {dicasParaMembro.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDicaVisivel(false); setTimeout(() => { setDicaIndex(i); setDicaVisivel(true); }, 150); }}
                    aria-label={`dica ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === (dicaIndex % dicasParaMembro.length) ? 'w-4 bg-teal-600' : 'w-1.5 bg-teal-200'}`}
                  />
                ))}
              </div>
            </div>

            {meuPapel === 'admin' && (
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
            )}
          </div>
        )}

        {passo === 'painel' && abaInferior === 'configuracao' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Configuração</h2>

            <div className="space-y-2 rounded-xl border border-[#E5E1DA] p-4">
              <p className="text-xs text-slate-400">Conta</p>
              <p className="text-sm font-medium text-slate-800">{contaEmail || '—'}</p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
              <p className="text-sm font-medium text-slate-800">Trocar senha</p>
              <input
                className={inputClasse}
                type="password"
                placeholder="nova senha (mín. 6 caracteres)"
                value={novaSenhaConfig}
                onChange={(e) => { setNovaSenhaConfig(e.target.value); setSucessoConfigSenha(false); }}
              />
              <input
                className={inputClasse}
                type="password"
                placeholder="confirmar nova senha"
                value={confirmarSenhaConfig}
                onChange={(e) => { setConfirmarSenhaConfig(e.target.value); setSucessoConfigSenha(false); }}
              />
              {erroConfigSenha && <p className="text-sm text-red-600">{erroConfigSenha}</p>}
              {sucessoConfigSenha && <p className="text-sm text-teal-700">Senha atualizada com sucesso.</p>}
              <button disabled={carregandoSenha} onClick={trocarSenha} className={botaoPrimario}>
                {carregandoSenha ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </div>

            {meuPapel !== null && meuPapel !== 'admin' && (
              <div className="space-y-1 rounded-xl border border-[#E5E1DA] p-4">
                <p className="text-sm font-medium text-slate-800">
                  Seu acesso: {meuPapel === 'cuidador' ? 'Cuidador(a)' : 'Familiar'}
                </p>
                <p className="text-xs text-slate-500">
                  O administrador da conta escolhe quais membros você pode ver{meuPapel === 'cuidador' ? ' ou editar' : ' e editar'}. Para mudar isso, fale com ele.
                </p>
              </div>
            )}

            {meuPapel === 'admin' && (() => {
              const rotuloPapel: Record<PapelUsuario, string> = { admin: 'Administrador', familiar: 'Familiar', cuidador: 'Cuidador (fora da família)' };
              const pessoas = new Map<string, { nome: string; email: string; papel: PapelUsuario; da_familia: boolean; acessos: Record<string, string> }>();
              for (const l of linhasAcesso) {
                if (!pessoas.has(l.usuario_id)) pessoas.set(l.usuario_id, { nome: l.nome, email: l.email, papel: l.papel, da_familia: l.da_familia, acessos: {} });
                if (l.membro_id && l.nivel_acesso) pessoas.get(l.usuario_id)!.acessos[l.membro_id] = l.nivel_acesso;
              }
              const listaPessoas = Array.from(pessoas.entries()).filter(([id]) => id !== meuUsuarioId);
              return (
                <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Acessos e convites</p>
                    <p className="text-xs text-slate-500">
                      Você é administrador{souDono ? ' (dono da conta)' : ''}: vê tudo da família e decide o que cada pessoa pode ver ou editar.
                    </p>
                  </div>
                  {erroAcessos && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{erroAcessos}</p>}

                  {listaPessoas.length === 0 && (
                    <p className="text-xs text-slate-400">Ninguém além de você tem acesso ainda.</p>
                  )}
                  {listaPessoas.map(([id, pessoa]) => (
                    <div key={id} className="space-y-2 rounded-xl bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{pessoa.nome}</p>
                          <p className="truncate text-xs text-slate-400">{pessoa.email}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${pessoa.papel === 'admin' ? 'bg-teal-100 text-teal-800' : pessoa.papel === 'cuidador' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                          {rotuloPapel[pessoa.papel]}
                        </span>
                      </div>
                      <div className="space-y-1 rounded-lg bg-white p-2">
                        <p className="text-xs font-semibold text-slate-500">Recebe avisos de:</p>
                        {membros.filter((m) => pessoa.papel === 'admin' || (pessoa.acessos[m.id] && pessoa.acessos[m.id] !== 'nenhum')).map((m) => (
                          <label key={m.id} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                            <span className="truncate">{m.nome}</span>
                            <input type="checkbox" checked={recebeAviso(id, m.id)} onChange={(e) => definirRecebeAviso(id, m.id, e.target.checked)} />
                          </label>
                        ))}
                      </div>
                      {pessoa.papel === 'admin' ? (
                        <p className="text-xs text-slate-500">Acesso total a todos os membros da família.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {membros.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm text-slate-700">{m.nome}</span>
                              <select
                                className="shrink-0 rounded-lg border border-[#E5E1DA] bg-white px-2 py-1 text-xs"
                                value={pessoa.acessos[m.id] || 'nenhum'}
                                onChange={(e) => definirAcesso(id, m.id, e.target.value)}
                              >
                                <option value="nenhum">sem acesso</option>
                                <option value="visualizar">só visualizar</option>
                                <option value="editar">visualizar e editar</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {souDono && pessoa.da_familia && pessoa.papel !== 'cuidador' && (
                          <button
                            onClick={() => definirPapelUsuario(id, pessoa.papel === 'admin' ? 'familiar' : 'admin')}
                            className="text-xs font-semibold text-teal-700"
                          >
                            {pessoa.papel === 'admin' ? 'Tirar de administrador' : 'Tornar administrador'}
                          </button>
                        )}
                        {(pessoa.papel !== 'admin' || souDono) && (
                          confirmandoRemoverId === id ? (
                            <span className="flex items-center gap-2 text-xs">
                              <span className="text-red-700">Remover todo o acesso?</span>
                              <button onClick={() => removerAcessosUsuario(id)} className="font-semibold text-red-700">sim</button>
                              <button onClick={() => setConfirmandoRemoverId(null)} className="text-slate-500">não</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmandoRemoverId(id)} className="text-xs text-red-600">Remover acessos</button>
                          )
                        )}
                      </div>
                    </div>
                  ))}

                  {convitesPendentes.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Convites pendentes</p>
                      {convitesPendentes.map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                          <span className="min-w-0 truncate">
                            <span className="font-mono font-semibold tracking-widest text-teal-700">{c.codigo}</span>
                            <span className="text-xs text-slate-500"> · {c.apelido || rotuloPapel[c.papel]}</span>
                          </span>
                          <button onClick={() => apagarConvite(c.id)} aria-label="Cancelar convite" className="shrink-0 text-xs text-red-600">cancelar</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {codigoGerado && !mostrarFormConvite && (
                    <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-center">
                      <p className="mb-1 text-xs text-slate-500">Compartilhe este código (a pessoa usa ao criar a conta):</p>
                      <p className="font-mono text-xl font-semibold tracking-widest text-teal-700">{codigoGerado}</p>
                    </div>
                  )}

                  {!mostrarFormConvite ? (
                    <button onClick={abrirFormConvite} className={botaoPrimario}>+ Convidar alguém</button>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-3">
                      <input className={inputClasse} placeholder="nome ou apelido (ex: Babá Maria)" value={conviteApelido} onChange={(e) => setConviteApelido(e.target.value)} />
                      <select className={inputClasse} value={convitePapel} onChange={(e) => setConvitePapel(e.target.value as PapelUsuario)}>
                        <option value="familiar">Familiar (entra na família)</option>
                        <option value="cuidador">Cuidador(a) (não entra na família)</option>
                        {souDono && <option value="admin">Administrador (acesso total)</option>}
                      </select>
                      {convitePapel === 'admin' ? (
                        <p className="text-xs text-slate-500">Administradores veem e editam todos os membros e podem convidar e gerenciar acessos.</p>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-500">Quem essa pessoa poderá acessar:</p>
                          {membros.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm text-slate-700">{m.nome}</span>
                              <select
                                className="shrink-0 rounded-lg border border-[#E5E1DA] bg-white px-2 py-1 text-xs"
                                value={conviteAcessos[m.id] || 'nenhum'}
                                onChange={(e) => setConviteAcessos((a) => ({ ...a, [m.id]: e.target.value }))}
                              >
                                <option value="nenhum">sem acesso</option>
                                <option value="visualizar">só visualizar</option>
                                <option value="editar">visualizar e editar</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={gerarConvite} className={botaoPrimario}>Gerar código</button>
                        <button onClick={() => setMostrarFormConvite(false)} className={botaoSecundario}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <button onClick={sair} className="block w-full text-sm text-slate-400">
              Sair da conta
            </button>
          </div>
        )}

        {passo === 'painel' && abaInferior === 'compartilhar' && (() => {
          const secoesDisponiveis: { id: string; label: string }[] = [
            { id: 'nascimento', label: 'Dados pessoais e nascimento' },
            { id: 'condicoes', label: 'Eventos de saúde' },
            { id: 'cirurgias', label: 'Cirurgias/Internações' },
            { id: 'medicacoes', label: 'Medicações' },
            { id: 'consultas', label: 'Consultas' },
            { id: 'odontologia', label: 'Odontologia' },
            { id: 'exames', label: 'Exames' },
            { id: 'vacinas', label: 'Vacinas' },
            { id: 'crescimento', label: 'Peso e crescimento' },
            { id: 'anamnese', label: 'Anamnese (gestação, desenvolvimento, alimentação, puberdade, saúde mental, hábitos de vida)' },
          ];
          return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Compartilhar</h2>
            {!membroSelecionado ? (
              <div className="rounded-xl border border-[#E5E1DA] p-4 text-center space-y-2">
                <p className="text-sm text-slate-500">Selecione um membro da família primeiro pra gerar o resumo dele.</p>
                <button onClick={() => irParaAbaInferior('home')} className="text-sm font-semibold text-teal-700">
                  Escolher membro
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Gere um resumo em PDF do prontuário de <strong>{membroSelecionado.nome}</strong>, pra enviar pra um médico ou guardar.
                </p>
                <div className="space-y-2 rounded-xl border border-[#E5E1DA] p-4">
                  <p className="text-xs text-slate-400 mb-1">O que incluir no resumo</p>
                  {secoesDisponiveis.map((s) => (
                    <label key={s.id} className="flex items-start gap-2 text-sm text-slate-600 py-0.5">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={!!secoesCompartilhar[s.id]}
                        onChange={(e) => setSecoesCompartilhar((atual) => ({ ...atual, [s.id]: e.target.checked }))}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <button onClick={() => setMostrarResumoImpressao(true)} className={botaoPrimario}>
                  Gerar resumo
                </button>
              </>
            )}
          </div>
          );
        })()}

        {passo === 'painel' && (abaInferior === 'incluir' || abaInferior === 'consultar') && !membroSelecionado && (
          <div className="rounded-xl border border-[#E5E1DA] p-4 text-center space-y-2">
            <p className="text-sm text-slate-500">Selecione um membro da família primeiro.</p>
            <button onClick={() => setAbaInferior('home')} className="text-sm font-semibold text-teal-700">
              Escolher membro
            </button>
          </div>
        )}

        {passo === 'painel' && (abaInferior === 'incluir' || abaInferior === 'consultar') && membroSelecionado && telaDetalhe === null && (
          <div>
            <h2 className="mb-1 text-lg font-semibold text-slate-800">
              {abaInferior === 'incluir' ? 'Incluir registro' : 'Consultar registros'}
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              {abaInferior === 'incluir'
                ? `Escolha a categoria do que você quer adicionar pra ${membroSelecionado.nome}.`
                : `Escolha o que você quer consultar de ${membroSelecionado.nome}.`}
            </p>
            {abaInferior === 'consultar' && (
              <button
                onClick={() => setTelaDetalhe('feedeventos')}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100"
              >
                <Ic n="relogio" /> Ver tudo em uma linha do tempo
              </button>
            )}
            <div className="grid grid-cols-3 gap-2">
              {secoes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => abrirCategoriaNoModo(s.id)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-[#E5E1DA] bg-white px-1 py-3 text-teal-700 transition hover:bg-[#FAFAF8]"
                >
                  {iconeSecao(s.id, 22)}
                  <span className="w-full text-[10px] font-medium text-slate-600 text-center leading-tight">
                    {s.labelCurto ?? s.label}
                  </span>
                </button>
              ))}
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
                    <Ic n="mic" /> prefiro contar por voz
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
                      : telaDetalhe === 'terapias'
                      ? 'Terapias'
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
                      : telaDetalhe === 'feedeventos'
                      ? 'Linha do tempo'
                      : secoes.find((s) => s.id === telaDetalhe)?.label}
                  </h2>
                </div>
              </>
            )}

            {telaDetalhe === 'onboardingvoz' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
                  <p className="text-xs text-teal-700">
                    <Ic n="spark" /> Usando IA pra interpretar o que você contar — sempre confira e corrija antes de salvar.
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
                      <Ic n="mic" /> {gravandoCampo === 'ovFala' ? 'Ouvindo...' : 'Falar'}
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
                      placeholder="Buscar evento de saúde já cadastrado" style={estiloBusca}
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
                          <Ic n="mic" /> {gravandoCampo === 'nrEventoRelato' ? 'Ouvindo...' : 'Falar'}
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
                      placeholder="Buscar cirurgia/internação já cadastrada" style={estiloBusca}
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
                          <Ic n="mic" /> {gravandoCampo === 'nrCirurgiaRelato' ? 'Ouvindo...' : 'Falar'}
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
                      placeholder="Buscar consulta já cadastrada" style={estiloBusca}
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
                          <Ic n="mic" /> {gravandoCampo === 'nrConsultaObs' ? 'Ouvindo...' : 'Falar'}
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
                      placeholder="Buscar medicamento já cadastrado" style={estiloBusca}
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
                          <Ic n="mic" /> {gravandoCampo === 'nrMedObs' ? 'Ouvindo...' : 'Falar'}
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
                    {abaInferior !== 'consultar' && (
                      <button
                        onClick={() => abrirNovaCondicao(ehCirurgias ? 'cirurgia' : 'doenca')}
                        aria-label={ehCirurgias ? 'Nova cirurgia ou internação' : 'Novo evento de saúde'}
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        {ehCirurgias ? 'nova' : 'novo'}
                      </button>
                    )}
                  </div>
                )}
                {!mostrarFormCondicao && condicoesDaTela.length > 0 && (
                  <input
                    className={inputClasse}
                    placeholder="Buscar por nome, tipo ou status" style={estiloBusca}
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
                          <Ic n="editar" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {tipoCondicaoLabels[c.tipo] || c.tipo} · {statusCondicaoLabels[c.status] || c.status}
                      {c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                      {c.medico && ` · Dr(a). ${c.medico}`}
                    </p>
                    {c.observacao && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {c.observacao}</p>}
                    {c.orientacoes && <p className="text-xs text-teal-700 mt-1"><Ic n="lampada" /> {c.orientacoes}</p>}
                    {(consultasLigadas.length > 0 || medicacoesLigadas.length > 0) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {consultasLigadas.length > 0 && (
                          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            <Ic n="cal" /> {consultasLigadas.length} consulta{consultasLigadas.length > 1 ? 's' : ''}
                          </span>
                        )}
                        {medicacoesLigadas.length > 0 && (
                          <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                            <Ic n="pilula" /> {medicacoesLigadas.length} medicação{medicacoesLigadas.length > 1 ? 'ões' : ''}
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
                      {!ehCirurgias && <option value="doenca">Hipótese diagnóstica</option>}
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
                    {ehCirurgias && (
                      <input
                        className={inputClasse}
                        placeholder="nome do médico (opcional)"
                        value={novoMedicoCondicao}
                        onChange={(e) => setNovoMedicoCondicao(e.target.value)}
                      />
                    )}
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
                          <Ic n="mic" /> {gravandoCampo === 'obsCondicao' ? 'Ouvindo...' : 'Falar'}
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
                          <Ic n="mic" /> {gravandoCampo === 'orientacaoCondicao' ? 'Ouvindo...' : 'Falar'}
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
                        {evento.medico && ` · Dr(a). ${evento.medico}`}
                      </p>
                    </div>
                    <button
                      onClick={() => { setTelaDetalhe(telaDeOrigem); abrirEdicaoCondicao(evento); }}
                      className="shrink-0 rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-[#FAFAF8] hover:text-teal-700"
                      aria-label="Editar evento"
                    >
                      <Ic n="editar" /> editar
                    </button>
                  </div>

                  {evento.observacao && <p className="text-sm text-slate-500"><Ic n="nota" /> {evento.observacao}</p>}
                  {evento.orientacoes && <p className="text-sm text-teal-700"><Ic n="lampada" /> {evento.orientacoes}</p>}

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800"><Ic n="pilula" /> Medicações</h3>
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
                      <h3 className="text-sm font-semibold text-slate-800"><Ic n="cal" /> Consultas</h3>
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
                      <h3 className="text-sm font-semibold text-slate-800"><Ic n="exame" /> Exames</h3>
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
                      <h3 className="text-sm font-semibold text-slate-800"><Ic n="vacina" /> Vacinas</h3>
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
                      <h3 className="text-sm font-semibold text-slate-800"><Ic n="grafico" /> Crescimento</h3>
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
                      {abaInferior !== 'consultar' && (
                        <button
                          onClick={abrirNovaMedicacao}
                          aria-label="Nova medicação"
                          className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          nova
                        </button>
                      )}
                    </div>
                    {medicacoes.length > 0 && (
                      <input
                        className={inputClasse}
                        placeholder="Buscar por nome ou classe (ex: antibiótico)" style={estiloBusca}
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
                            <p className="font-medium text-slate-800">{m.nome} <Ic n="editar" /></p>
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
                          {m.observacao && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {m.observacao}</p>}
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
                          <Ic n="mic" /> {gravandoCampo === 'obsMedicacao' ? 'Ouvindo...' : 'Falar'}
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
                      {abaInferior !== 'consultar' && (
                        <button
                          onClick={() => abrirNovaConsulta(especialidadePadraoTela)}
                          aria-label="Nova consulta"
                          className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          nova
                        </button>
                      )}
                    </div>
                    {consultasDaTela.length > 0 && (
                      <input
                        className={inputClasse}
                        placeholder="Buscar por especialidade ou profissional" style={estiloBusca}
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
                            <p className="font-medium text-slate-800">{c.especialidade?.nome || 'Especialidade'} <Ic n="editar" /></p>
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
                          {c.anotacoes && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {c.anotacoes}</p>}
                          {(() => {
                            const it = itensDaConsulta(c.id);
                            const partes = [
                              it.meds.length > 0 && `${it.meds.length} medicação${it.meds.length > 1 ? 'ões' : ''}`,
                              it.exames.length > 0 && `${it.exames.length} exame${it.exames.length > 1 ? 's' : ''}`,
                              it.vacinas.length > 0 && `${it.vacinas.length} vacina${it.vacinas.length > 1 ? 's' : ''}`,
                              it.terapias.length > 0 && `${it.terapias.length} terapia${it.terapias.length > 1 ? 's' : ''}`,
                            ].filter(Boolean);
                            return partes.length > 0 ? <p className="text-xs text-teal-700 mt-1">Gerou: {partes.join(' · ')}</p> : null;
                          })()}
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
                    {(() => {
                      const ehFutura = !!novaDataHoraConsulta && new Date(novaDataHoraConsulta) > new Date();
                      const ehPassada = !!novaDataHoraConsulta && !ehFutura;
                      const cartao = 'space-y-3 rounded-2xl bg-white border border-[#E5E1DA] p-4';
                      const titulo = 'text-xs font-bold uppercase tracking-wider text-teal-800';
                      const retornoAtalhos: { label: string; meses?: number; dias?: number }[] = [
                        { label: 'Em 30 dias', dias: 30 },
                        { label: 'Em 3 meses', meses: 3 },
                        { label: 'Em 6 meses', meses: 6 },
                      ];
                      const calcRetorno = (a: { meses?: number; dias?: number }) => {
                        const base = novaDataHoraConsulta ? new Date(novaDataHoraConsulta) : new Date();
                        if (a.meses) base.setMonth(base.getMonth() + a.meses);
                        if (a.dias) base.setDate(base.getDate() + a.dias);
                        return base.toISOString().slice(0, 10);
                      };
                      return (
                        <div className="space-y-3">
                          <div className={cartao}>
                            <p className={titulo}>Quando e onde</p>
                            <div>
                              <label className="text-xs text-slate-500 mb-1 block">Data e horário <span className="text-red-600">*</span></label>
                              <input
                                className={inputClasse}
                                type="datetime-local"
                                value={novaDataHoraConsulta}
                                onChange={(e) => setNovaDataHoraConsulta(e.target.value)}
                              />
                            </div>
                            {ehFutura && (
                              <label className="flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={novoLembreteConsulta}
                                  onChange={(e) => setNovoLembreteConsulta(e.target.checked)}
                                />
                                <span>
                                  <span className="font-medium">Quero um lembrete desta consulta</span>
                                  <span className="block text-xs text-slate-500">Ela aparece como pendência na Home até acontecer.</span>
                                </span>
                              </label>
                            )}
                            <input
                              className={inputClasse}
                              placeholder="Local (opcional)"
                              value={novoLocalConsulta}
                              onChange={(e) => setNovoLocalConsulta(e.target.value)}
                            />
                          </div>

                          <div className={cartao}>
                            <p className={titulo}>Com quem</p>
                            <select
                              className={inputClasse}
                              value={novaEspecialidadeConsulta}
                              onChange={(e) => setNovaEspecialidadeConsulta(e.target.value)}
                            >
                              <option value="">Especialidade *</option>
                              {especialidadesMedicas.map((esp) => (
                                <option key={esp} value={esp}>{esp}</option>
                              ))}
                            </select>
                            {novaEspecialidadeConsulta === 'Outros' && (
                              <input
                                className={inputClasse}
                                placeholder="Qual especialidade?"
                                value={especialidadeOutroConsulta}
                                onChange={(e) => setEspecialidadeOutroConsulta(e.target.value)}
                              />
                            )}
                            <input
                              className={inputClasse}
                              placeholder="Profissional (opcional, ex: Dr. João Silva)"
                              list="lista-medicos-cadastrados"
                              value={novoProfissionalConsulta}
                              onChange={(e) => setNovoProfissionalConsulta(e.target.value)}
                            />
                            <datalist id="lista-medicos-cadastrados">
                              {medicos.map((m) => (
                                <option key={m.id} value={m.nome} />
                              ))}
                            </datalist>
                            {novoProfissionalConsulta.trim() && !medicos.some((m) => m.nome.toLowerCase() === novoProfissionalConsulta.trim().toLowerCase()) && (
                              <p className="text-xs text-teal-700 -mt-1"><Ic n="mais" /> “{novoProfissionalConsulta.trim()}” será cadastrado como novo médico.</p>
                            )}
                            {medicos.length > 0 && !novoProfissionalConsulta.trim() && (
                              <p className="text-xs text-slate-400 -mt-1">
                                <Ic n="lampada" /> Comece a digitar para escolher entre seus médicos já cadastrados.
                              </p>
                            )}
                          </div>

                          <div className={cartao}>
                            <p className={titulo}>Sobre o quê</p>
                            <input
                              className={inputClasse}
                              placeholder="Motivo (opcional)"
                              value={novoMotivoConsulta}
                              onChange={(e) => setNovoMotivoConsulta(e.target.value)}
                            />
                            <select
                              className={inputClasse}
                              value={novaCondicaoRelacionadaConsulta}
                              onChange={(e) => setNovaCondicaoRelacionadaConsulta(e.target.value)}
                            >
                              <option value="">Relacionar a um problema de saúde (opcional)</option>
                              {condicoes.map((c) => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                              ))}
                            </select>
                          </div>

                          {ehPassada && (
                            <div className={cartao}>
                              <p className={titulo}>Depois da consulta</p>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-xs text-slate-500">Anotações: o que o médico disse, o que acompanhar...</label>
                                  <button
                                    type="button"
                                    onClick={() => alternarReconhecimentoVoz('anotacaoConsulta', setNovaAnotacaoConsulta)}
                                    className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'anotacaoConsulta' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}
                                  >
                                    <Ic n="mic" /> {gravandoCampo === 'anotacaoConsulta' ? 'Ouvindo...' : 'Falar'}
                                  </button>
                                </div>
                                <textarea
                                  className={inputClasse}
                                  placeholder="Anotações (opcional)"
                                  rows={3}
                                  value={novaAnotacaoConsulta}
                                  onChange={(e) => setNovaAnotacaoConsulta(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">Retorno (opcional)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <button
                                    type="button"
                                    onClick={() => setNovaDataRetornoConsulta('')}
                                    className={`rounded-full border px-3 py-2 text-sm ${!novaDataRetornoConsulta ? 'bg-teal-700 border-teal-700 text-white font-semibold' : 'border-slate-300 text-slate-700'}`}
                                  >
                                    Sem retorno
                                  </button>
                                  {retornoAtalhos.map((a) => (
                                    <button
                                      key={a.label}
                                      type="button"
                                      onClick={() => setNovaDataRetornoConsulta(calcRetorno(a))}
                                      className={`rounded-full border px-3 py-2 text-sm ${novaDataRetornoConsulta === calcRetorno(a) ? 'bg-teal-700 border-teal-700 text-white font-semibold' : 'border-slate-300 text-slate-700'}`}
                                    >
                                      {a.label}
                                    </button>
                                  ))}
                                </div>
                                <input
                                  className={inputClasse}
                                  type="date"
                                  value={novaDataRetornoConsulta}
                                  onChange={(e) => setNovaDataRetornoConsulta(e.target.value)}
                                />
                                {novaDataRetornoConsulta && (
                                  <p className="mt-1 text-xs text-slate-400">Ao salvar, o retorno entra como consulta agendada às 09:00, com lembrete. Depois você ajusta o horário na própria consulta.</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className={cartao}>
                            <p className={titulo}>Foto do pedido médico</p>
                            <p className="text-xs text-slate-400">Pedido de exame, receita ou laudo. Fica guardado só para quem tem acesso a este membro.</p>
                            {anexosConsulta.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {anexosConsulta.map((a) => (
                                  <div key={a.id} className="relative">
                                    {a.url && /\.pdf$/i.test(a.caminho) ? (
                                      <a href={a.url} target="_blank" rel="noreferrer" className="flex h-24 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-600">PDF</a>
                                    ) : a.url ? (
                                      <a href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.nome || 'anexo'} className="h-24 w-full rounded-xl object-cover" /></a>
                                    ) : (
                                      <div className="flex h-24 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">indisponível</div>
                                    )}
                                    <button type="button" aria-label="Remover anexo" onClick={() => excluirAnexoConsulta(a)} className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-red-600">✕</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {anexosNovosConsulta.length > 0 && (
                              <div className="space-y-1">
                                {anexosNovosConsulta.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                    <span className="min-w-0 truncate text-slate-700">{f.name}</span>
                                    <button type="button" onClick={() => setAnexosNovosConsulta((l) => l.filter((_, idx) => idx !== i))} className="text-xs text-red-600">remover</button>
                                  </div>
                                ))}
                                <p className="text-xs text-slate-400">Será enviado ao salvar a consulta.</p>
                              </div>
                            )}
                            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-teal-700/40 bg-white px-4 py-3 text-sm font-semibold text-teal-800">
                              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                              Tirar foto ou escolher arquivo
                              <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => { escolherAnexosConsulta(e.target.files); e.target.value = ''; }} />
                            </label>
                          </div>

                          {consultaEditandoId && (() => {
                            const it = itensDaConsulta(consultaEditandoId);
                            const linhas: { chave: string; rotulo: string; detalhe: string; abrir: () => void }[] = [
                              ...it.meds.map((m) => ({
                                chave: `m${m.id}`, rotulo: 'Medicação', detalhe: `${m.nome}${m.dosagem ? ' · ' + m.dosagem : ''}${m.data_fim ? ' · até ' + formatarData(m.data_fim) : ' · uso contínuo'}`,
                                abrir: () => { setMostrarFormConsulta(false); setTelaDetalhe('medicacoes'); abrirEdicaoMedicacao(m); },
                              })),
                              ...it.exames.map((e) => ({
                                chave: `e${e.id}`, rotulo: 'Exame', detalhe: `${e.nome}${e.status === 'solicitado' ? ' · solicitado, fazer até ' + formatarData(e.data_realizacao) : ' · ' + formatarData(e.data_realizacao)}`,
                                abrir: () => { setMostrarFormConsulta(false); setTelaDetalhe('exames'); abrirEdicaoExame(e); },
                              })),
                              ...it.vacinas.map((v) => ({
                                chave: `v${v.id}`, rotulo: 'Vacina', detalhe: `${v.nome}${v.status === 'indicada' ? ' · indicada para ' + formatarData(v.data_aplicacao) : ' · ' + formatarData(v.data_aplicacao)}`,
                                abrir: () => { setMostrarFormConsulta(false); setTelaDetalhe('vacinas'); abrirEdicaoVacina(v); },
                              })),
                              ...it.terapias.map((t) => ({
                                chave: `t${t.id}`, rotulo: 'Terapia', detalhe: `${t.tipo}${t.frequencia ? ' · ' + t.frequencia : ''}`,
                                abrir: () => { setMostrarFormConsulta(false); setTelaDetalhe('terapias'); abrirEdicaoTerapia(t); },
                              })),
                            ];
                            if (linhas.length === 0) return null;
                            return (
                              <div className={cartao}>
                                <p className={titulo}>Registrado a partir desta consulta</p>
                                {linhas.map((l) => (
                                  <button key={l.chave} type="button" onClick={l.abrir} className="flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left text-sm">
                                    <span className="min-w-0">
                                      <span className="block text-xs text-slate-400">{l.rotulo}</span>
                                      <span className="block truncate text-slate-800">{l.detalhe}</span>
                                    </span>
                                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-300"><path d="M9 18l6-6-6-6" /></svg>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}

                          {ehPassada && (() => {
                            const algoAberto = medsConsulta.length > 0 || examesConsulta.length > 0 || vacsConsulta.length > 0 || terapiasConsulta.length > 0 || exameNovoConsulta !== '';
                            const chip = (ativo: boolean) => `rounded-full border px-3 py-2 text-sm ${ativo ? 'bg-teal-700 border-teal-700 text-white font-semibold' : 'border-slate-300 text-slate-700'}`;
                            const botaoAdd = 'flex w-full items-center gap-3 rounded-2xl border border-dashed border-teal-700/40 bg-white px-4 py-3 text-left text-base font-semibold text-teal-800';
                            const atualizaMed = (i: number, patch: Partial<MedRascunho>) =>
                              setMedsConsulta((lista) => lista.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
                            const atualizaVac = (i: number, patch: Partial<VacRascunho>) =>
                              setVacsConsulta((lista) => lista.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
                            const atualizaTer = (i: number, patch: Partial<TerapiaRascunho>) =>
                              setTerapiasConsulta((lista) => lista.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
                            const adicionarExame = () => {
                              const nome = exameNovoConsulta.trim();
                              if (!nome) return;
                              setExamesConsulta((l) => [...l, nome]);
                              setExameNovoConsulta('');
                            };
                            const exAberto = examesConsulta.length > 0 || exameNovoConsulta !== '' || exAbertoConsulta;
                            return (
                              <div className="space-y-3">
                                <div>
                                  <p className={titulo}>{algoAberto || exAberto ? 'Mais alguma coisa?' : 'O médico pediu algo?'}</p>
                                  <p className="text-sm text-slate-500">{algoAberto || exAberto ? 'Adicione o que mais a consulta gerou.' : 'Toque só no que esta consulta gerou.'}</p>
                                </div>

                                {medsConsulta.length > 0 && (
                                  <div className={cartao}>
                                    <div className="flex items-center justify-between">
                                      <p className={titulo}>Medicação</p>
                                      <button type="button" aria-label="Remover medicação" onClick={() => setMedsConsulta([])} className="text-slate-400 text-lg leading-none">✕</button>
                                    </div>
                                    {medsConsulta.map((m, i) => {
                                      const f = frequenciasMedicacao.find((x) => x.id === m.freq);
                                      const horarios = f ? calcularHorariosMedicacao(m.primeira, f.intervaloH) : [];
                                      return (
                                        <div key={i} className="space-y-3 border-t border-[#E5E1DA] pt-3 first:border-t-0 first:pt-0">
                                          {medsConsulta.length > 1 && (
                                            <div className="flex items-center justify-between">
                                              <p className="text-xs text-slate-500">Medicação {i + 1}</p>
                                              <button type="button" onClick={() => setMedsConsulta((l) => l.filter((_, idx) => idx !== i))} className="text-xs text-red-600">remover</button>
                                            </div>
                                          )}
                                          <input className={inputClasse} placeholder="Remédio *" value={m.nome} onChange={(e) => atualizaMed(i, { nome: e.target.value })} />
                                          <input className={inputClasse} placeholder="Dose (ex: 5 ml, 1 comprimido)" value={m.dose} onChange={(e) => atualizaMed(i, { dose: e.target.value })} />
                                          <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Frequência</label>
                                            <div className="flex flex-wrap gap-2">
                                              {frequenciasMedicacao.map((fo) => (
                                                <button key={fo.id} type="button" onClick={() => atualizaMed(i, { freq: fo.id })} className={chip(m.freq === fo.id)}>{fo.label}</button>
                                              ))}
                                            </div>
                                          </div>
                                          {horarios.length > 0 && (
                                            <div className="flex items-center gap-2">
                                              <label className="text-xs text-slate-500 shrink-0">1ª dose às</label>
                                              <input type="time" className={inputClasse} value={m.primeira} onChange={(e) => atualizaMed(i, { primeira: e.target.value })} />
                                            </div>
                                          )}
                                          {horarios.length > 0 && <p className="text-xs text-teal-800">Horários: {horarios.join(' · ')}</p>}
                                          <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Início</label>
                                            <input type="date" className={inputClasse} value={m.inicio} onChange={(e) => atualizaMed(i, { inicio: e.target.value })} />
                                          </div>
                                          <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Duração</label>
                                            <div className="flex flex-wrap gap-2">
                                              {[['3', '3 dias'], ['5', '5 dias'], ['7', '7 dias'], ['10', '10 dias'], ['14', '14 dias'], ['continuo', 'Uso contínuo'], ['dias', 'Outro (nº de dias)'], ['data', 'Escolher data de término']].map(([id, label]) => (
                                                <button key={id} type="button" onClick={() => atualizaMed(i, { duracao: id })} className={chip(m.duracao === id)}>{label}</button>
                                              ))}
                                            </div>
                                            {m.duracao === 'dias' && (
                                              <input type="number" min={1} inputMode="numeric" className={`${inputClasse} mt-2`} placeholder="quantos dias?" value={m.duracaoDias} onChange={(e) => atualizaMed(i, { duracaoDias: e.target.value })} />
                                            )}
                                            {m.duracao === 'data' && (
                                              <input type="date" className={`${inputClasse} mt-2`} value={m.duracaoData} onChange={(e) => atualizaMed(i, { duracaoData: e.target.value })} />
                                            )}
                                            {(() => {
                                              const fim = dataFimMedicacao(m, m.inicio || new Date().toISOString().slice(0, 10));
                                              return (
                                                <p className="mt-1 text-xs text-teal-800">
                                                  {m.duracao === 'continuo' ? 'Uso contínuo: sem data de término.' : fim ? `Termina em ${formatarData(fim)}.` : 'Informe a duração para calcular o término.'}
                                                </p>
                                              );
                                            })()}
                                          </div>
                                          <input className={inputClasse} placeholder="Como tomar (ex: após as refeições)" value={m.como} onChange={(e) => atualizaMed(i, { como: e.target.value })} />
                                        </div>
                                      );
                                    })}
                                    <button type="button" onClick={() => setMedsConsulta((l) => [...l, medVazia()])} className="text-sm font-semibold text-teal-800">+ Adicionar outra medicação</button>
                                  </div>
                                )}

                                {exAberto && (
                                  <div className={cartao}>
                                    <div className="flex items-center justify-between">
                                      <p className={titulo}>Exames solicitados</p>
                                      <button type="button" aria-label="Remover exames" onClick={() => { setExamesConsulta([]); setExameNovoConsulta(''); setExAbertoConsulta(false); }} className="text-slate-400 text-lg leading-none">✕</button>
                                    </div>
                                    {examesConsulta.map((nome, i) => (
                                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                        <span>{nome}</span>
                                        <button type="button" aria-label={`Remover ${nome}`} onClick={() => setExamesConsulta((l) => l.filter((_, idx) => idx !== i))} className="text-slate-400">✕</button>
                                      </div>
                                    ))}
                                    <div className="flex gap-2">
                                      <input
                                        className={inputClasse}
                                        placeholder="Nome do exame (ex: hemograma)"
                                        value={exameNovoConsulta}
                                        onChange={(e) => setExameNovoConsulta(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarExame(); } }}
                                      />
                                      <button type="button" onClick={adicionarExame} className="shrink-0 rounded-xl border border-teal-700 px-4 text-sm font-semibold text-teal-800">Adicionar</button>
                                    </div>
                                    <div>
                                      <label className="text-xs text-slate-500 mb-1 block">Fazer até</label>
                                      <div className="flex flex-wrap gap-2">
                                        {[['retorno', 'Antes do retorno'], ['7d', 'Em 7 dias'], ['30d', 'Em 30 dias'], ['data', 'Escolher data']].map(([id, label]) => (
                                          <button key={id} type="button" onClick={() => setExPrazoConsulta(id)} className={chip(exPrazoConsulta === id)}>{label}</button>
                                        ))}
                                      </div>
                                      {exPrazoConsulta === 'data' && (
                                        <input type="date" className={`${inputClasse} mt-2`} value={exPrazoDataConsulta} onChange={(e) => setExPrazoDataConsulta(e.target.value)} />
                                      )}
                                      {exPrazoConsulta === 'retorno' && (
                                        <p className="text-xs text-slate-500 mt-1">
                                          {novaDataRetornoConsulta ? 'Prazo: 7 dias antes do retorno, para o resultado chegar a tempo.' : 'Defina um retorno acima para calcular o prazo (senão usa 30 dias).'}
                                        </p>
                                      )}
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                      <input type="checkbox" checked={exLembreteConsulta} onChange={(e) => setExLembreteConsulta(e.target.checked)} />
                                      Lembrete para agendar os exames
                                    </label>
                                  </div>
                                )}

                                {vacsConsulta.length > 0 && (
                                  <div className={cartao}>
                                    <div className="flex items-center justify-between">
                                      <p className={titulo}>Vacinas indicadas</p>
                                      <button type="button" aria-label="Remover vacinas" onClick={() => setVacsConsulta([])} className="text-slate-400 text-lg leading-none">✕</button>
                                    </div>
                                    {vacsConsulta.map((v, i) => (
                                      <div key={i} className="space-y-3 border-t border-[#E5E1DA] pt-3 first:border-t-0 first:pt-0">
                                        {vacsConsulta.length > 1 && (
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-500">Vacina {i + 1}</p>
                                            <button type="button" onClick={() => setVacsConsulta((l) => l.filter((_, idx) => idx !== i))} className="text-xs text-red-600">remover</button>
                                          </div>
                                        )}
                                        <select className={inputClasse} value={v.nome} onChange={(e) => atualizaVac(i, { nome: e.target.value })}>
                                          <option value="">Vacina * (mesma lista da carteirinha)</option>
                                          {vacinasComuns.map((vc) => (
                                            <option key={vc} value={vc}>{vc}</option>
                                          ))}
                                          <option value="Outra (especificar)">Outra (especificar)</option>
                                        </select>
                                        {v.nome === 'Outra (especificar)' && (
                                          <input className={inputClasse} placeholder="Qual vacina?" value={v.outroNome} onChange={(e) => atualizaVac(i, { outroNome: e.target.value })} />
                                        )}
                                        <div>
                                          <label className="text-xs text-slate-500 mb-1 block">Quando tomar</label>
                                          <div className="flex flex-wrap gap-2">
                                            {[['agora', 'Agora'], ['mes', 'No próximo mês'], ['3m', 'Em 3 meses'], ['data', 'Escolher data']].map(([id, label]) => (
                                              <button key={id} type="button" onClick={() => atualizaVac(i, { quando: id })} className={chip(v.quando === id)}>{label}</button>
                                            ))}
                                          </div>
                                          {v.quando === 'data' && (
                                            <input type="date" className={`${inputClasse} mt-2`} value={v.quandoData} onChange={(e) => atualizaVac(i, { quandoData: e.target.value })} />
                                          )}
                                        </div>
                                        <input className={inputClasse} placeholder="Observação (opcional)" value={v.obs} onChange={(e) => atualizaVac(i, { obs: e.target.value })} />
                                      </div>
                                    ))}
                                    <button type="button" onClick={() => setVacsConsulta((l) => [...l, vacVazia()])} className="text-sm font-semibold text-teal-800">+ Adicionar outra vacina</button>
                                    <label className="flex items-center gap-2 text-sm text-slate-700">
                                      <input type="checkbox" checked={vacLembreteConsulta} onChange={(e) => setVacLembreteConsulta(e.target.checked)} />
                                      Lembrete da vacina
                                    </label>
                                  </div>
                                )}

                                {terapiasConsulta.length > 0 && (
                                  <div className={cartao}>
                                    <div className="flex items-center justify-between">
                                      <p className={titulo}>Terapias</p>
                                      <button type="button" aria-label="Remover terapias" onClick={() => setTerapiasConsulta([])} className="text-slate-400 text-lg leading-none">✕</button>
                                    </div>
                                    {terapiasConsulta.map((t, i) => (
                                      <div key={i} className="space-y-3 border-t border-[#E5E1DA] pt-3 first:border-t-0 first:pt-0">
                                        {terapiasConsulta.length > 1 && (
                                          <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-500">Terapia {i + 1}</p>
                                            <button type="button" onClick={() => setTerapiasConsulta((l) => l.filter((_, idx) => idx !== i))} className="text-xs text-red-600">remover</button>
                                          </div>
                                        )}
                                        <select className={inputClasse} value={t.tipo} onChange={(e) => atualizaTer(i, { tipo: e.target.value })}>
                                          <option value="">Tipo de terapia *</option>
                                          {tiposTerapia.map((tt) => (
                                            <option key={tt} value={tt}>{tt}</option>
                                          ))}
                                        </select>
                                        {t.tipo === 'Outra (especificar)' && (
                                          <input className={inputClasse} placeholder="Qual terapia?" value={t.outroTipo} onChange={(e) => atualizaTer(i, { outroTipo: e.target.value })} />
                                        )}
                                        <input className={inputClasse} placeholder="Frequência (ex: 2x por semana)" value={t.frequencia} onChange={(e) => atualizaTer(i, { frequencia: e.target.value })} />
                                        <div>
                                          <label className="text-xs text-slate-500 mb-1 block">Início</label>
                                          <input type="date" className={inputClasse} value={t.inicio} onChange={(e) => atualizaTer(i, { inicio: e.target.value })} />
                                        </div>
                                        <input className={inputClasse} placeholder="Profissional/clínica (opcional)" value={t.profissional} onChange={(e) => atualizaTer(i, { profissional: e.target.value })} />
                                        <div className="space-y-2">
                                          <label className="text-xs text-slate-500 block">Datas das sessões (opcional)</label>
                                          {(t.sessoes || []).map((s, si) => (
                                            <div key={si} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                                              <span className="text-slate-800">{formatarData(s.data_hora.slice(0, 10))} às {s.data_hora.slice(11, 16)}</span>
                                              <span className="flex items-center gap-3">
                                                <button type="button" onClick={() => atualizaTer(i, { sessoes: (t.sessoes || []).map((x, xi) => (xi === si ? { ...x, lembrete: !x.lembrete } : x)) })} className={`text-xs ${s.lembrete ? 'text-teal-700 font-semibold' : 'text-slate-400'}`}>{s.lembrete ? 'com alerta' : 'sem alerta'}</button>
                                                <button type="button" aria-label="Remover sessão" onClick={() => atualizaTer(i, { sessoes: (t.sessoes || []).filter((_, xi) => xi !== si) })} className="text-xs text-red-600">✕</button>
                                              </span>
                                            </div>
                                          ))}
                                          <input type="datetime-local" className={inputClasse} value={t.novaSessao || ''} onChange={(e) => atualizaTer(i, { novaSessao: e.target.value })} />
                                          <label className="flex items-center gap-2 text-sm text-slate-700">
                                            <input type="checkbox" checked={t.novaSessaoAlerta !== false} onChange={(e) => atualizaTer(i, { novaSessaoAlerta: e.target.checked })} />
                                            Gerar alerta (aparece na Home)
                                          </label>
                                          <button
                                            type="button"
                                            disabled={!t.novaSessao}
                                            onClick={() => atualizaTer(i, { sessoes: [...(t.sessoes || []), { data_hora: t.novaSessao || '', lembrete: t.novaSessaoAlerta !== false }].sort((a, b) => a.data_hora.localeCompare(b.data_hora)), novaSessao: '' })}
                                            className="text-sm font-semibold text-teal-800 disabled:opacity-40"
                                          >
                                            + Adicionar data
                                          </button>
                                        </div>
                                        <input className={inputClasse} placeholder="Observação (opcional)" value={t.obs} onChange={(e) => atualizaTer(i, { obs: e.target.value })} />
                                      </div>
                                    ))}
                                    <button type="button" onClick={() => setTerapiasConsulta((l) => [...l, terapiaVazia()])} className="text-sm font-semibold text-teal-800">+ Adicionar outra terapia</button>
                                  </div>
                                )}

                                {medsConsulta.length === 0 && (
                                  <button type="button" onClick={() => setMedsConsulta([medVazia()])} className={botaoAdd}>
                                    <span className="text-xl leading-none">+</span> Medicação
                                  </button>
                                )}
                                {!exAberto && (
                                  <button type="button" onClick={() => setExAbertoConsulta(true)} className={botaoAdd}>
                                    <span className="text-xl leading-none">+</span> Exames
                                  </button>
                                )}
                                {vacsConsulta.length === 0 && (
                                  <button type="button" onClick={() => setVacsConsulta([vacVazia()])} className={botaoAdd}>
                                    <span className="text-xl leading-none">+</span> Vacinas
                                  </button>
                                )}
                                {terapiasConsulta.length === 0 && (
                                  <button type="button" onClick={() => setTerapiasConsulta([terapiaVazia()])} className={botaoAdd}>
                                    <span className="text-xl leading-none">+</span> Terapias
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {ehFutura && (
                            <p className="rounded-xl bg-[#EEF4F1] p-3 text-sm text-slate-700">
                              <Ic n="info" /> Como a data é futura, a consulta fica como agendada. Depois que acontecer, volte aqui para registrar as anotações e o retorno.
                            </p>
                          )}

                    <details className="rounded-2xl bg-white border border-[#E5E1DA] p-4 space-y-3">
                      <summary className="text-xs font-bold uppercase tracking-wider text-teal-800 cursor-pointer">Financeiro / reembolso (opcional)</summary>
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
                    </details>

                          {consultaEditandoId && (
                            <label className="flex items-center gap-2 text-sm text-slate-600 px-1">
                              <input
                                type="checkbox"
                                checked={novoStatusConsulta === 'cancelada'}
                                onChange={(e) => setNovoStatusConsulta(e.target.checked ? 'cancelada' : 'agendada')}
                              />
                              Consulta cancelada
                            </label>
                          )}
                          <p className="text-xs text-slate-500"><span className="text-red-600">*</span> Campos obrigatórios</p>
                          {erroConsulta && <p className="text-sm text-red-600">{erroConsulta}</p>}
                          <div className="flex gap-2">
                            <button disabled={carregando} onClick={salvarConsulta} className={botaoPrimario}>
                              {carregando ? 'Salvando...' : 'Salvar consulta'}
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
                      );
                    })()}
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
                        <p className="font-medium text-slate-800">{m.nome} <Ic n="editar" /></p>
                        <p className="text-xs text-slate-400">
                          {[m.especialidade, m.telefone, m.local].filter(Boolean).join(' · ')}
                        </p>
                        {m.observacao && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {m.observacao}</p>}
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
                      {abaInferior !== 'consultar' && (
                        <button
                          onClick={abrirNovoExame}
                          aria-label="Novo exame"
                          className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          novo
                        </button>
                      )}
                    </div>
                    {exames.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhum exame registrado ainda.</p>
                    )}
                    {exames.map((e) => (
                      <div key={e.id} className="space-y-1">
                        <button
                          onClick={() => abrirEdicaoExame(e)}
                          className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-slate-800">{e.nome} <Ic n="editar" /></p>
                            <span className="text-xs text-slate-400 text-right">{e.status === 'solicitado' ? `⏳ solicitado · fazer até ${formatarData(e.data_realizacao)}` : formatarData(e.data_realizacao)}</span>
                          </div>
                          {e.laboratorio && <p className="text-xs text-slate-400">{e.laboratorio}</p>}
                          {e.resultado_resumo && <p className="text-xs text-slate-500 mt-1"><Ic n="prancheta" /> {e.resultado_resumo}</p>}
                        </button>
                        {e.status === 'solicitado' && (
                          <button
                            onClick={() => abrirEdicaoExame(e, true)}
                            className="w-full rounded-xl bg-teal-50 py-2 text-sm font-semibold text-teal-800"
                          >
                            ✓ Marcar como realizado
                          </button>
                        )}
                      </div>
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
                      <label className="text-xs text-slate-400 mb-1 block">{exameStatusOriginal === 'solicitado' && !exameMarcarRealizado ? 'fazer até' : 'data de realização'}</label>
                      <input
                        className={inputClasse}
                        type="date"
                        value={novaDataExame}
                        onChange={(e) => setNovaDataExame(e.target.value)}
                      />
                    </div>
                    {exameEditandoId && exameStatusOriginal === 'solicitado' && (
                      <label className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-sm text-slate-700">
                        <input type="checkbox" checked={exameMarcarRealizado} onChange={(e) => setExameMarcarRealizado(e.target.checked)} />
                        Já realizei este exame (informe a data de realização acima)
                      </label>
                    )}
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
                          <Ic n="mic" /> {gravandoCampo === 'resultadoExame' ? 'Ouvindo...' : 'Falar'}
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
                      {abaInferior !== 'consultar' && (
                        <button
                          onClick={abrirNovaVacina}
                          aria-label="Nova vacina"
                          className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          nova
                        </button>
                      )}
                    </div>
                    {vacinas.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma vacina registrada ainda.</p>
                    )}
                    {vacinas.map((v) => {
                      const proximaVencida = !!v.proxima_dose_data && v.proxima_dose_data < new Date().toISOString().slice(0, 10);
                      return (
                        <div key={v.id} className="space-y-1">
                        <button
                          onClick={() => abrirEdicaoVacina(v)}
                          className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800">{v.nome} <Ic n="editar" /></p>
                            <span className="text-xs text-slate-400">{v.status === 'indicada' ? `⏳ indicada · tomar em ${formatarData(v.data_aplicacao)}` : formatarData(v.data_aplicacao)}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {[v.dose, v.proxima_dose_data && `próxima dose: ${formatarData(v.proxima_dose_data)}`].filter(Boolean).join(' · ')}
                          </p>
                          {proximaVencida && (
                            <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                              próxima dose atrasada
                            </span>
                          )}
                          {v.observacoes && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {v.observacoes}</p>}
                        </button>
                        {v.status === 'indicada' && (
                          <button
                            onClick={() => abrirEdicaoVacina(v, true)}
                            className="w-full rounded-xl bg-teal-50 py-2 text-sm font-semibold text-teal-800"
                          >
                            ✓ Marcar como tomada
                          </button>
                        )}
                        </div>
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
                      <label className="text-xs text-slate-400 mb-1 block">{vacinaStatusOriginal === 'indicada' && !vacinaMarcarRealizada ? 'data prevista' : 'data de aplicação'}</label>
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
                    {vacinaEditandoId && vacinaStatusOriginal === 'indicada' && (
                      <label className="flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-sm text-slate-700">
                        <input type="checkbox" checked={vacinaMarcarRealizada} onChange={(e) => setVacinaMarcarRealizada(e.target.checked)} />
                        Já tomei esta vacina (informe a data de aplicação acima)
                      </label>
                    )}
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
                          <Ic n="mic" /> {gravandoCampo === 'obsVacina' ? 'Ouvindo...' : 'Falar'}
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
                        <p className="text-xs text-slate-400">Tipo sanguíneo <Ic n="editar" /></p>
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
                        <p className="text-xs text-slate-400">Grau de parentesco <Ic n="editar" /></p>
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
                      <p className="text-xs text-slate-400">Observações <Ic n="editar" /></p>
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
                          <Ic n="mic" /> {gravandoCampo === 'obsGeral' ? 'Ouvindo...' : 'Falar'}
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
                      <p className="text-xs text-red-600 font-medium"><Ic n="alerta" /> Alergias e condições importantes <Ic n="editar" /></p>
                      <p className="text-sm text-red-900">{membroSelecionado.alergias || 'toque para adicionar (ex: alergia a penicilina)'}</p>
                    </button>
                  ) : (
                    <div className="rounded-xl bg-red-50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-red-600 font-medium"><Ic n="alerta" /> Alergias e condições importantes</p>
                        <button
                          type="button"
                          onClick={() => alternarReconhecimentoVoz('alergiasMembro', setValorAlergiasEdit)}
                          className={`shrink-0 rounded-full px-2 py-1 text-xs ${gravandoCampo === 'alergiasMembro' ? 'bg-red-200 text-red-800 animate-pulse' : 'bg-white text-slate-600'}`}
                        >
                          <Ic n="mic" /> {gravandoCampo === 'alergiasMembro' ? 'Ouvindo...' : 'Falar'}
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
                          <Ic n="mic" /> {gravandoCampo === 'intercorrencias' ? 'Ouvindo...' : 'Falar'}
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
                    {abaInferior !== 'consultar' && (
                      <button
                        onClick={abrirNovaMedicaoCrescimento}
                        aria-label="Nova medição"
                        className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        nova
                      </button>
                    )}
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
                        <p className="font-medium text-slate-800">{formatarData(m.data_medicao)} <Ic n="editar" /></p>
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

            {telaDetalhe === 'feedeventos' && (() => {
              const eventosFiltrados = obterEventosUnificados();
              const medicosDisponiveis = obterMedicosDoFeed();
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={inputClasse}
                      value={filtroFeedTipo}
                      onChange={(e) => setFiltroFeedTipo(e.target.value)}
                    >
                      <option value="todos">Todos os tipos</option>
                      {(Object.keys(categoriaFeedInfo) as EventoFeed['categoria'][]).map((cat) => (
                        <option key={cat} value={cat}>{categoriaFeedInfo[cat].label}</option>
                      ))}
                    </select>
                    <select
                      className={inputClasse}
                      value={filtroFeedMedico}
                      onChange={(e) => setFiltroFeedMedico(e.target.value)}
                    >
                      <option value="todos">Todos os médicos</option>
                      {medicosDisponiveis.map((nome) => (
                        <option key={nome} value={nome}>{nome}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className={inputClasse}
                      value={filtroFeedDataInicio}
                      onChange={(e) => setFiltroFeedDataInicio(e.target.value)}
                    />
                    <input
                      type="date"
                      className={inputClasse}
                      value={filtroFeedDataFim}
                      onChange={(e) => setFiltroFeedDataFim(e.target.value)}
                    />
                  </div>
                  {(filtroFeedTipo !== 'todos' || filtroFeedMedico !== 'todos' || filtroFeedDataInicio || filtroFeedDataFim) && (
                    <button
                      onClick={() => {
                        setFiltroFeedTipo('todos');
                        setFiltroFeedMedico('todos');
                        setFiltroFeedDataInicio('');
                        setFiltroFeedDataFim('');
                      }}
                      className="text-xs text-teal-700 underline"
                    >
                      limpar filtros
                    </button>
                  )}

                  {eventosFiltrados.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">Nenhum evento encontrado com esses filtros.</p>
                  )}

                  {eventosFiltrados.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => setTelaDetalhe(ev.aba)}
                      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition hover:brightness-95 ${categoriaFeedInfo[ev.categoria].cor}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                          {categoriaFeedInfo[ev.categoria].label}
                        </p>
                        <p className="text-sm font-medium truncate">{ev.titulo}</p>
                        <p className="text-xs opacity-70">
                          {ev.data ? formatarData(ev.data) : 'sem data'}
                          {ev.subtitulo && ` · ${ev.subtitulo}`}
                          {ev.medico && ` · Dr(a). ${ev.medico}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}

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
                      <p className="text-xs text-slate-400">{atividadesFisicas.length > 0 ? `${atividadesFisicas.length} registrada${atividadesFisicas.length > 1 ? 's' : ''}` : 'nenhuma atividade registrada ainda'}</p>
                    </div>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </div>
              );
            })()}

            {telaDetalhe === 'terapias' && (
              <div className="space-y-3">
                {!mostrarFormTerapia && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{terapias.length} registrada{terapias.length === 1 ? '' : 's'}</p>
                      {abaInferior !== 'consultar' && (
                        <button onClick={abrirNovaTerapia} aria-label="Nova terapia" className="flex items-center gap-1 text-sm font-semibold text-teal-700">
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          nova
                        </button>
                      )}
                    </div>
                    {erroCarregarTerapias && (
                      <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">Não consegui carregar as terapias: {erroCarregarTerapias}</p>
                    )}
                    {terapias.length === 0 && !erroCarregarTerapias && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma terapia registrada ainda.</p>
                    )}
                    {terapias.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => abrirEdicaoTerapia(t)}
                        className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">{t.tipo} <Ic n="editar" /></p>
                          {!t.data_fim && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 shrink-0">em andamento</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {[
                            t.data_inicio && `desde ${formatarData(t.data_inicio)}`,
                            t.data_fim && `até ${formatarData(t.data_fim)}`,
                            t.frequencia,
                            t.profissional,
                            t.local,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        {t.observacao && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {t.observacao}</p>}
                      </button>
                    ))}
                  </>
                )}

                {mostrarFormTerapia && (
                  <>
                    <button onClick={() => setMostrarFormTerapia(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                      <select className={inputClasse} value={formTerapia.tipo} onChange={(e) => setFormTerapia({ ...formTerapia, tipo: e.target.value, outroTipo: '' })}>
                        <option value="">tipo de terapia</option>
                        {tiposTerapia.map((tt) => (
                          <option key={tt} value={tt}>{tt}</option>
                        ))}
                      </select>
                      {formTerapia.tipo === 'Outra (especificar)' && (
                        <input className={inputClasse} placeholder="qual terapia?" value={formTerapia.outroTipo} onChange={(e) => setFormTerapia({ ...formTerapia, outroTipo: e.target.value })} />
                      )}
                      <input className={inputClasse} placeholder="frequência (ex: 2x por semana)" value={formTerapia.frequencia} onChange={(e) => setFormTerapia({ ...formTerapia, frequencia: e.target.value })} />
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de início</label>
                        <input className={inputClasse} type="date" value={formTerapia.inicio} onChange={(e) => setFormTerapia({ ...formTerapia, inicio: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de término (deixe em branco se ainda estiver em andamento)</label>
                        <input className={inputClasse} type="date" value={formTerapia.fim} onChange={(e) => setFormTerapia({ ...formTerapia, fim: e.target.value })} />
                      </div>
                      <input className={inputClasse} placeholder="profissional (opcional)" value={formTerapia.profissional} onChange={(e) => setFormTerapia({ ...formTerapia, profissional: e.target.value })} />
                      <input className={inputClasse} placeholder="clínica/local (opcional)" value={formTerapia.local} onChange={(e) => setFormTerapia({ ...formTerapia, local: e.target.value })} />
                      <textarea className={inputClasse} placeholder="observações (opcional)" rows={2} value={formTerapia.obs} onChange={(e) => setFormTerapia({ ...formTerapia, obs: e.target.value })} />
                      <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Datas das sessões</p>
                        {(() => {
                          const lista: { chave: string; id?: string; data_hora: string; lembrete: boolean; idx?: number }[] = terapiaEditandoId
                            ? sessoesTerapia.filter((s) => s.terapia_id === terapiaEditandoId).map((s) => ({ chave: s.id, id: s.id, data_hora: s.data_hora, lembrete: s.lembrete }))
                            : sessoesNovas.map((s, idx) => ({ chave: `n${idx}`, idx, data_hora: s.data_hora, lembrete: s.lembrete }));
                          if (lista.length === 0) return <p className="text-xs text-slate-400">Nenhuma data adicionada.</p>;
                          return lista.map((s) => {
                            const d = new Date(s.data_hora);
                            const passou = d.getTime() < Date.now();
                            return (
                              <div key={s.chave} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                                <span className={passou ? 'text-slate-400' : 'text-slate-800'}>
                                  {d.toLocaleDateString('pt-BR')} às {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="flex items-center gap-3">
                                  {!passou && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (s.id) {
                                          const original = sessoesTerapia.find((x) => x.id === s.id);
                                          if (original) alternarAlertaSessaoTerapia(original);
                                        } else if (s.idx !== undefined) {
                                          setSessoesNovas((l) => l.map((x, i) => (i === s.idx ? { ...x, lembrete: !x.lembrete } : x)));
                                        }
                                      }}
                                      className={`text-xs rounded-full px-2 py-1 ${s.lembrete ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                      {s.lembrete ? <><Ic n="sino" /> alerta</> : 'sem alerta'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    aria-label="Remover data"
                                    onClick={() => {
                                      if (s.id) removerSessaoTerapia(s.id);
                                      else if (s.idx !== undefined) setSessoesNovas((l) => l.filter((_, i) => i !== s.idx));
                                    }}
                                    className="text-slate-400"
                                  >
                                    ✕
                                  </button>
                                </span>
                              </div>
                            );
                          });
                        })()}
                        <input className={inputClasse} type="datetime-local" value={novaSessaoDataHora} onChange={(e) => setNovaSessaoDataHora(e.target.value)} />
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={novaSessaoAlerta} onChange={(e) => setNovaSessaoAlerta(e.target.checked)} />
                          Gerar alerta (aparece na Home até a sessão acontecer)
                        </label>
                        <button type="button" onClick={adicionarSessaoTerapia} disabled={!novaSessaoDataHora} className="w-full rounded-xl border border-teal-700 py-2 text-sm font-semibold text-teal-800 disabled:opacity-40">
                          + Adicionar data
                        </button>
                      </div>
                      {erroTerapia && <p className="text-sm text-red-600">{erroTerapia}</p>}
                      <div className="flex gap-2">
                        <button disabled={carregando} onClick={salvarTerapia} className={botaoPrimario}>
                          {carregando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setMostrarFormTerapia(false)} className={botaoSecundario}>
                          Cancelar
                        </button>
                      </div>
                      {terapiaEditandoId && (
                        <button disabled={carregando} onClick={excluirTerapia} className="w-full text-sm text-red-600 pt-1">
                          Excluir esta terapia
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {telaDetalhe === 'esportes' && (
              <div className="space-y-3">
                {!mostrarFormAtividadeFisica && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{atividadesFisicas.length} registrada{atividadesFisicas.length === 1 ? '' : 's'}</p>
                      {abaInferior !== 'consultar' && (
                        <button
                          onClick={abrirNovaAtividadeFisica}
                          aria-label="Nova atividade"
                          className="flex items-center gap-1 text-sm font-semibold text-teal-700"
                        >
                          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          nova
                        </button>
                      )}
                    </div>
                    {atividadesFisicas.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-2">Nenhuma atividade registrada ainda.</p>
                    )}
                    {atividadesFisicas.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => abrirEdicaoAtividadeFisica(a)}
                        className="w-full rounded-xl border border-[#E5E1DA] p-3 text-left transition hover:bg-[#FAFAF8]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-slate-800">{a.nome_atividade} <Ic n="editar" /></p>
                          {!a.data_fim && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 shrink-0">em andamento</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {[
                            `desde ${formatarData(a.data_inicio)}`,
                            a.data_fim && `até ${formatarData(a.data_fim)}`,
                            a.frequencia,
                            a.local,
                          ].filter(Boolean).join(' · ')}
                        </p>
                        {a.instrutor && <p className="text-xs text-slate-500 mt-1">Instrutor(a): {a.instrutor}</p>}
                        {a.nivel && <p className="text-xs text-slate-500">Nível: {a.nivel}</p>}
                        {a.observacao && <p className="text-xs text-slate-500 mt-1"><Ic n="nota" /> {a.observacao}</p>}
                      </button>
                    ))}
                  </>
                )}

                {mostrarFormAtividadeFisica && (
                  <>
                    <button onClick={() => setMostrarFormAtividadeFisica(false)} className="text-sm text-teal-700">
                      ← Voltar
                    </button>
                    <div className="space-y-3 rounded-xl border border-[#E5E1DA] p-4">
                      <select
                        className={inputClasse}
                        value={novoNomeAtividade}
                        onChange={(e) => {
                          setNovoNomeAtividade(e.target.value);
                          setAtividadeOutroNome('');
                        }}
                      >
                        <option value="">selecione a atividade</option>
                        {atividadesFisicasComuns.map((grupo) => (
                          <optgroup key={grupo.categoria} label={grupo.categoria}>
                            {grupo.itens.map((nome) => (
                              <option key={nome} value={nome}>{nome}</option>
                            ))}
                          </optgroup>
                        ))}
                        <option value="Outra (especificar)">Outra (especificar)</option>
                      </select>
                      {novoNomeAtividade === 'Outra (especificar)' && (
                        <input
                          className={inputClasse}
                          placeholder="qual atividade?"
                          value={atividadeOutroNome}
                          onChange={(e) => setAtividadeOutroNome(e.target.value)}
                        />
                      )}
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de início</label>
                        <input
                          className={inputClasse}
                          type="date"
                          value={novaDataInicioAtividade}
                          onChange={(e) => setNovaDataInicioAtividade(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">data de término (deixe em branco se ainda estiver praticando)</label>
                        <input
                          className={inputClasse}
                          type="date"
                          value={novaDataFimAtividade}
                          onChange={(e) => setNovaDataFimAtividade(e.target.value)}
                        />
                      </div>
                      <input
                        className={inputClasse}
                        placeholder="frequência (ex: 2x por semana)"
                        value={novaFrequenciaAtividade}
                        onChange={(e) => setNovaFrequenciaAtividade(e.target.value)}
                      />
                      <input
                        className={inputClasse}
                        placeholder="local/escola/clube (opcional)"
                        value={novoLocalAtividade}
                        onChange={(e) => setNovoLocalAtividade(e.target.value)}
                      />
                      <input
                        className={inputClasse}
                        placeholder="professor(a)/instrutor(a) (opcional)"
                        value={novoInstrutorAtividade}
                        onChange={(e) => setNovoInstrutorAtividade(e.target.value)}
                      />
                      <input
                        className={inputClasse}
                        placeholder="nível/graduação (ex: iniciante, faixa branca) (opcional)"
                        value={novoNivelAtividade}
                        onChange={(e) => setNovoNivelAtividade(e.target.value)}
                      />
                      <textarea
                        className={inputClasse}
                        placeholder="observações (opcional)"
                        rows={2}
                        value={novaObsAtividade}
                        onChange={(e) => setNovaObsAtividade(e.target.value)}
                      />
                      {erroAtividadeFisica && <p className="text-sm text-red-600">{erroAtividadeFisica}</p>}
                      <div className="flex gap-2">
                        <button disabled={carregando} onClick={salvarAtividadeFisica} className={botaoPrimario}>
                          {carregando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setMostrarFormAtividadeFisica(false)} className={botaoSecundario}>
                          Cancelar
                        </button>
                      </div>
                      {atividadeEditandoId && (
                        <button disabled={carregando} onClick={excluirAtividadeFisica} className="w-full text-sm text-red-600 pt-1">
                          Excluir esta atividade
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        )}
      </div>

      {passo === 'painel' && (
        <nav className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E1DA] bg-white`}>
          <div className={`mx-auto flex w-full ${larguraContainer} items-stretch justify-between`}>
            {itensMenuInferior.map((item) => (
              <button
                key={item.id}
                onClick={() => irParaAbaInferior(item.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${abaInferior === item.id ? 'text-teal-700' : 'text-slate-400'}`}
              >
                {item.icone}
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}
    </main>
  );
}
