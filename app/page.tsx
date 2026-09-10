'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

type Membro = {
  id: string;
  nome: string;
  data_nascimento: string;
  sexo_biologico: string;
  tipo_sanguineo: string | null;
  observacoes_gerais: string | null;
  data_falecimento: string | null;
};

type Condicao = {
  id: string;
  tipo: string;
  nome: string;
  data_diagnostico_ou_procedimento: string | null;
  status: string;
  relevante_geneticamente: boolean;
};

type Passo = 'login' | 'cadastro' | 'onboarding' | 'painel';
type Aba = 'geral' | 'condicoes' | 'medicacoes' | 'consultas' | 'exames' | 'vacinas';

function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
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
  const [erroMembro, setErroMembro] = useState('');

  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<Aba>('geral');

  const [condicoes, setCondicoes] = useState<Condicao[]>([]);
  const [mostrarFormCondicao, setMostrarFormCondicao] = useState(false);
  const [novoTipoCondicao, setNovoTipoCondicao] = useState('doenca');
  const [novoNomeCondicao, setNovoNomeCondicao] = useState('');
  const [novaDataCondicao, setNovaDataCondicao] = useState('');
  const [novoStatusCondicao, setNovoStatusCondicao] = useState('ativa');
  const [novoRelevanteGenetico, setNovoRelevanteGenetico] = useState(false);
  const [erroCondicao, setErroCondicao] = useState('');

  useEffect(() => {
    if (passo === 'painel') carregarMembros();
  }, [passo]);

  useEffect(() => {
    if (membroSelecionado) carregarCondicoes(membroSelecionado.id);
    else setCondicoes([]);
  }, [membroSelecionado]);

  async function carregarMembros() {
    const { data, error } = await supabase
      .from('membro')
      .select('id, nome, data_nascimento, sexo_biologico, tipo_sanguineo, observacoes_gerais, data_falecimento')
      .is('data_falecimento', null)
      .order('nome');
    if (!error && data) setMembros(data);
  }

  async function carregarCondicoes(membroId: string) {
    const { data, error } = await supabase
      .from('condicao')
      .select('id, tipo, nome, data_diagnostico_ou_procedimento, status, relevante_geneticamente')
      .eq('membro_id', membroId)
      .order('data_diagnostico_ou_procedimento', { ascending: false });
    if (!error && data) setCondicoes(data);
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
    setNovoFalecido(false);
    setNovaDataFalecimento('');
    setMostrarFormMembro(false);
    await carregarMembros();
  }

  async function adicionarCondicao() {
    setErroCondicao('');
    if (!novoNomeCondicao) {
      setErroCondicao('Preencha o nome da condição.');
      return;
    }
    if (!membroSelecionado) return;
    setCarregando(true);

    const { error } = await supabase.from('condicao').insert({
      membro_id: membroSelecionado.id,
      tipo: novoTipoCondicao,
      nome: novoNomeCondicao,
      data_diagnostico_ou_procedimento: novaDataCondicao || null,
      status: novoStatusCondicao,
      relevante_geneticamente: novoRelevanteGenetico,
    });

    setCarregando(false);
    if (error) {
      setErroCondicao(error.message);
      return;
    }
    setNovoTipoCondicao('doenca');
    setNovoNomeCondicao('');
    setNovaDataCondicao('');
    setNovoStatusCondicao('ativa');
    setNovoRelevanteGenetico(false);
    setMostrarFormCondicao(false);
    await carregarCondicoes(membroSelecionado.id);
  }

  const inputClasse =
    'w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const botaoPrimario =
    'w-full rounded-xl bg-teal-600 py-3 font-medium text-white transition hover:bg-teal-700 disabled:opacity-50';
  const botaoSecundario =
    'w-full rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50';

  const abas: { id: Aba; label: string; icone: string }[] = [
    { id: 'geral', label: 'Visão geral', icone: '👤' },
    { id: 'condicoes', label: 'Condições', icone: '🩺' },
    { id: 'medicacoes', label: 'Medicações', icone: '💊' },
    { id: 'consultas', label: 'Consultas', icone: '📅' },
    { id: 'exames', label: 'Exames', icone: '🧪' },
    { id: 'vacinas', label: 'Vacinas', icone: '💉' },
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
                  onClick={() => { setMembroSelecionado(m); setAbaAtiva('geral'); }}
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

        {passo === 'painel' && membroSelecionado && (
          <div>
            <button onClick={() => setMembroSelecionado(null)} className="mb-4 text-sm text-teal-700">
              ← Voltar
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-lg">
                {membroSelecionado.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{membroSelecionado.nome}</h2>
                <p className="text-xs text-slate-400">{calcularIdade(membroSelecionado.data_nascimento)} anos</p>
              </div>
            </div>

            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-100 pb-px">
              {abas.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAbaAtiva(a.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition ${abaAtiva === a.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <span>{a.icone}</span>
                  {a.label}
                </button>
              ))}
            </div>

            {abaAtiva === 'geral' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Data de nascimento</p>
                    <p className="text-sm font-medium text-slate-800">{formatarData(membroSelecionado.data_nascimento)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Sexo biológico</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">{membroSelecionado.sexo_biologico}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Tipo sanguíneo</p>
                    <p className="text-sm font-medium text-slate-800">{membroSelecionado.tipo_sanguineo || 'não informado'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Idade</p>
                    <p className="text-sm font-medium text-slate-800">{calcularIdade(membroSelecionado.data_nascimento)} anos</p>
                  </div>
                </div>
                {membroSelecionado.observacoes_gerais && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Observações</p>
                    <p className="text-sm text-slate-700">{membroSelecionado.observacoes_gerais}</p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'condicoes' && (
              <div className="space-y-3">
                {condicoes.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-2">Nenhuma condição registrada ainda.</p>
                )}
                {condicoes.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">{c.nome}</p>
                      {c.relevante_geneticamente && (
                        <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">genético</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {tipoCondicaoLabels[c.tipo] || c.tipo} · {statusCondicaoLabels[c.status] || c.status}
                      {c.data_diagnostico_ou_procedimento && ` · ${formatarData(c.data_diagnostico_ou_procedimento)}`}
                    </p>
                  </div>
                ))}

                {!mostrarFormCondicao ? (
                  <button onClick={() => setMostrarFormCondicao(true)} className={botaoPrimario}>
                    + Adicionar condição
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 p-4">
                    <select className={inputClasse} value={novoTipoCondicao} onChange={(e) => setNovoTipoCondicao(e.target.value)}>
                      <option value="doenca">Doença</option>
                      <option value="cirurgia">Cirurgia</option>
                    </select>
                    <input
                      className={inputClasse}
                      placeholder="nome (ex: Diabetes tipo 2)"
                      value={novoNomeCondicao}
                      onChange={(e) => setNovoNomeCondicao(e.target.value)}
                    />
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
                    {erroCondicao && <p className="text-sm text-red-600">{erroCondicao}</p>}
                    <div className="flex gap-2">
                      <button disabled={carregando} onClick={adicionarCondicao} className={botaoPrimario}>
                        {carregando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button onClick={() => setMostrarFormCondicao(false)} className={botaoSecundario}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {abaAtiva !== 'geral' && abaAtiva !== 'condicoes' && (
              <p className="text-sm text-slate-400 text-center py-8">Essa aba ainda está sendo construída.</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}