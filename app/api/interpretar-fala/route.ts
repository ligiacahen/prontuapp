import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FERRAMENTA = {
  name: 'registrar_itens',
  description: 'Registra os itens de saúde identificados no texto, já separados e classificados.',
  input_schema: {
    type: 'object' as const,
    properties: {
      itens: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['evento', 'alergia', 'cirurgia', 'medicamento'],
              description:
                'evento = doença/hipótese diagnóstica ou episódio de saúde; alergia = alergia a algo; cirurgia = cirurgia ou internação; medicamento = remédio usado (contínuo ou não)',
            },
            texto: {
              type: 'string',
              description:
                'O item descrito de forma clara e objetiva, em português, curto (uma frase), preservando os detalhes originais (datas, idades, nomes) sem inventar nada.',
            },
          },
          required: ['tipo', 'texto'],
        },
      },
    },
    required: ['itens'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { texto } = await req.json();
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      return NextResponse.json({ erro: 'Texto vazio.' }, { status: 400 });
    }

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:
        'Você separa um relato em português sobre a saúde de uma pessoa em itens distintos, ' +
        'para cadastro num prontuário de saúde familiar.\n\n' +
        'REGRA MAIS IMPORTANTE: cada fato separado vira um item À PARTE, mesmo que vários fatos ' +
        'apareçam na mesma frase ou frase corrida sem pontuação. NUNCA junte dois fatos diferentes ' +
        '(ex: uma doença e uma alergia, ou uma alergia e um remédio) dentro do mesmo item.\n\n' +
        'Tipos possíveis: evento (doença/hipótese diagnóstica ou episódio de saúde), alergia, ' +
        'cirurgia (cirurgia ou internação), medicamento (remédio usado, contínuo ou não).\n\n' +
        'Exemplo de entrada: "tem asma desde os 3 anos, é alérgico a amendoim, tomou amoxicilina ' +
        'semana passada por causa de uma otite"\n' +
        'Exemplo de saída correta (3 itens separados):\n' +
        '1. tipo=evento, texto="Asma desde os 3 anos"\n' +
        '2. tipo=alergia, texto="Alérgico a amendoim"\n' +
        '3. tipo=medicamento, texto="Amoxicilina (usada por causa de uma otite, semana passada)"\n\n' +
        'Não invente informações que não estejam no texto original. Mantenha cada item objetivo, ' +
        'em português, curto, preservando datas/idades mencionadas.',
      tools: [FERRAMENTA as any],
      tool_choice: { type: 'tool', name: 'registrar_itens' },
      messages: [{ role: 'user', content: texto }],
    });

    const blocoFerramenta = msg.content.find((b) => b.type === 'tool_use');
    if (!blocoFerramenta || blocoFerramenta.type !== 'tool_use') {
      return NextResponse.json({ erro: 'A IA não retornou um resultado estruturado.' }, { status: 502 });
    }

    const itens = (blocoFerramenta.input as any)?.itens || [];
    return NextResponse.json({ itens });
  } catch (e: any) {
    console.error('Erro em /api/interpretar-fala:', e);
    return NextResponse.json({ erro: 'Erro ao interpretar o texto com IA.' }, { status: 500 });
  }
}