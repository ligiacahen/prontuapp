import anthro_zscores from 'anthro-js';
import type { Membro, RiscoGenetico } from './tipos';
import { regrasGeneticas, doencasComuns } from './constantes';

export function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

export function calcularIdadeEmMeses(dataNascimento: string, dataReferencia: string) {
  const nasc = new Date(dataNascimento);
  const ref = new Date(dataReferencia);
  let meses = (ref.getFullYear() - nasc.getFullYear()) * 12 + (ref.getMonth() - nasc.getMonth());
  if (ref.getDate() < nasc.getDate()) meses--;
  return meses;
}

export function formatarIdadeEmMeses(totalMeses: number): string {
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

export function classificarZScorePeso(z: number): string {
  if (z < -3) return 'Peso muito baixo p/ idade';
  if (z < -2) return 'Peso baixo p/ idade';
  if (z <= 2) return 'Peso adequado p/ idade';
  return 'Peso elevado p/ idade';
}

export function classificarZScoreAltura(z: number): string {
  if (z < -3) return 'Estatura muito baixa p/ idade';
  if (z < -2) return 'Estatura baixa p/ idade';
  if (z <= 2) return 'Estatura adequada p/ idade';
  return 'Estatura alta p/ idade';
}

// A OMS só publica a referência de peso/altura por idade (Child Growth Standards) até os 5 anos (60 meses).
// Acima disso, mostramos a medida sem comparação com a OMS.
export function calcularZScoresOMS(
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
export function calcularIMC(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  if (alturaM <= 0) return null;
  return pesoKg / (alturaM * alturaM);
}

export function classificarIMC(imc: number): string {
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso adequado';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

export function formatarData(data: string) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Converte texto digitado em número, tolerando unidades (ex: "3,250 kg", "38 semanas")
// e vírgula decimal. Retorna null se o campo estiver vazio, e NaN se não for possível entender o número.
export function paraNumeroTolerante(valor: string): number | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  const apenasNumero = limpo.replace(/[^\d,.-]/g, '').replace(',', '.');
  if (!apenasNumero) return NaN;
  const num = Number(apenasNumero);
  return num;
}

export function obterCategoriaDoenca(nome: string): string {
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

export function calcularRiscosGeneticos(
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
