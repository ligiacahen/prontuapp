import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Lê fotos, PDFs e textos de saúde (pedido médico, receita, resultado de exame, carteirinha de
// vacinação, relato falado) e devolve um RASCUNHO de registros. Nada é salvo aqui: a pessoa confere
// e confirma na tela antes de salvar.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FERRAMENTA = {
  name: 'montar_rascunho',
  description: 'Devolve os registros de saúde encontrados no material, já separados por tipo.',
  input_schema: {
    type: 'object' as const,
    properties: {
      itens: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: { type: 'string', enum: ['consulta', 'exame', 'medicamento', 'vacina', 'evento', 'cirurgia'], description: 'consulta = ida a médico ou dentista; exame = exame pedido ou resultado; medicamento = remédio receitado ou em uso; vacina = vacina aplicada ou indicada; evento = doença, sintoma ou episódio de saúde; cirurgia = cirurgia ou internação.' },
            titulo: { type: 'string', description: 'Nome curto: especialidade da consulta, nome do exame, nome do remédio com a dose (ex.: Losartana 50 mg), nome da vacina, nome do evento.' },
            data: { type: 'string', description: 'Data no formato AAAA-MM-DD. Vazio se o material não disser.' },
            status: { type: 'string', enum: ['realizado', 'solicitado', 'agendada'], description: 'realizado = já aconteceu / resultado em mãos; solicitado = exame pedido sem resultado ainda; agendada = consulta ainda por vir.' },
            profissional: { type: 'string', description: 'Nome do médico ou profissional, se houver.' },
            local: { type: 'string', description: 'Laboratório, clínica ou hospital, se houver.' },
            detalhe: { type: 'string', description: 'Dose e frequência (remédio), dose da vacina, resultado resumido com os valores principais (exame) ou anotações (consulta). Curto, só o que está no material.' },
            duvida: { type: 'boolean', description: 'true se algo neste item ficou ilegível, ambíguo ou incerto.' },
            motivo_duvida: { type: 'string', description: 'Explique em uma frase o que ficou em dúvida. Vazio se duvida for false.' },
          },
          required: ['tipo', 'titulo', 'duvida'],
        },
      },
      resumo: { type: 'string', description: 'Uma frase dizendo o que o material é (ex.: "Receita da Dra. Marta com 2 remédios e 1 pedido de exame").' },
    },
    required: ['itens'],
  },
};

type Arquivo = { nome: string; mime: string; dados: string };

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ erro: 'A leitura automática ainda não está ligada (falta a chave da IA no servidor).' }, { status: 503 });
    }
    const { texto, arquivos, hoje } = (await req.json()) as { texto?: string; arquivos?: Arquivo[]; hoje?: string };
    const lista = Array.isArray(arquivos) ? arquivos.slice(0, 6) : [];
    const textoLimpo = typeof texto === 'string' ? texto.trim().slice(0, 6000) : '';
    if (lista.length === 0 && !textoLimpo) {
      return NextResponse.json({ erro: 'Nada para ler.' }, { status: 400 });
    }

    const content: Anthropic.ContentBlockParam[] = [];
    for (const a of lista) {
      if (a.mime === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: a.dados } });
      } else if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(a.mime)) {
        content.push({ type: 'image', source: { type: 'base64', media_type: a.mime as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: a.dados } });
      }
    }
    content.push({
      type: 'text',
      text: (textoLimpo ? `Relato da pessoa:\n${textoLimpo}\n\n` : '') + 'Monte o rascunho dos registros de saúde que aparecem neste material.',
    });

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system:
        'Você ajuda a cadastrar informações num prontuário de saúde familiar, em português do Brasil. ' +
        `Hoje é ${hoje || new Date().toISOString().slice(0, 10)}.\n\n` +
        'REGRAS:\n' +
        '- Use SOMENTE o que está no material. Nunca invente nomes, datas, doses ou valores.\n' +
        '- Cada coisa distinta vira um item à parte: cada remédio da receita, cada exame pedido, cada vacina.\n' +
        '- Pedido médico de exame, sem resultado: tipo exame, status solicitado. Resultado de exame em mãos: tipo exame, status realizado, com os valores principais no detalhe.\n' +
        '- Receita: um item medicamento por remédio (título com a dose). Se a receita é de uma consulta, inclua também um item consulta.\n' +
        '- Carteirinha de vacinação: um item vacina por vacina aplicada, com a dose e a data.\n' +
        '- Datas como AAAA-MM-DD. Se só há dia e mês, assuma o ano mais provável pela data de hoje. Se não há data, deixe vazio.\n' +
        '- Letra difícil, trecho cortado ou número duvidoso: marque duvida=true e explique em motivo_duvida. Prefira marcar dúvida a chutar.\n' +
        '- Ignore CPF, RG, endereço, telefone, número de carteirinha e dados de pagamento. Não os copie para nenhum campo.\n' +
        '- Se o material não tem nada de saúde, devolva a lista de itens vazia.',
      tools: [FERRAMENTA],
      tool_choice: { type: 'tool', name: FERRAMENTA.name },
      messages: [{ role: 'user', content }],
    });

    const bloco = msg.content.find((b) => b.type === 'tool_use');
    if (!bloco || bloco.type !== 'tool_use') {
      return NextResponse.json({ erro: 'Não consegui entender o material.' }, { status: 502 });
    }
    const entrada = bloco.input as { itens?: unknown[]; resumo?: string };
    return NextResponse.json({ itens: Array.isArray(entrada.itens) ? entrada.itens : [], resumo: entrada.resumo || '' });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao ler o material.';
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
