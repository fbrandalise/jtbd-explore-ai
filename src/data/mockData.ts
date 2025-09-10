import { ResearchRound, calculateOpportunityScore } from '../types/jtbd';

// === BIG JOBS (padronizados para TODAS as pesquisas) ===
const BASE_JOBS = [
  {
    id: 'multicanal',
    name: 'Gerir operação multicanal',
    description: 'Gerenciar vendas e operações em múltiplos marketplaces simultaneamente',
    littleJobs: [
      {
        id: 'preparar-listagem',
        name: 'Preparar produtos para listagem',
        description: 'Preparar informações e dados dos produtos para publicação nos marketplaces',
        outcomes: [
          {
            id: 'tempo-atributos',
            name: 'Reduzir tempo de preencher atributos obrigatórios',
            description: 'Minimizar o tempo necessário para preencher campos obrigatórios dos produtos'
          },
          {
            id: 'taxa-aprovacao',
            name: 'Aumentar taxa de aprovação de anúncios',
            description: 'Melhorar a taxa de anúncios aprovados na primeira tentativa'
          },
          {
            id: 'visibilidade-busca',
            name: 'Melhorar visibilidade em buscas do marketplace',
            description: 'Otimizar anúncios para aparecer melhor nas buscas dos compradores'
          }
        ]
      },
      {
        id: 'controlar-estoque',
        name: 'Controlar estoque',
        description: 'Gerenciar disponibilidade e quantidade de produtos',
        outcomes: [
          {
            id: 'evitar-ruptura',
            name: 'Evitar ruptura de estoque',
            description: 'Prevenir falta de produtos em estoque'
          },
          {
            id: 'sincronizar-multiplos',
            name: 'Sincronizar estoque entre múltiplos canais',
            description: 'Manter estoque atualizado em todos os marketplaces simultaneamente'
          }
        ]
      }
    ]
  },
  {
    id: 'aumentar-vendas',
    name: 'Aumentar vendas',
    description: 'Maximizar receita e volume de vendas nos marketplaces',
    littleJobs: [
      {
        id: 'precificar-produtos',
        name: 'Precificar produtos',
        description: 'Definir preços competitivos e rentáveis',
        outcomes: [
          {
            id: 'competitividade-preco',
            name: 'Manter competitividade de preços',
            description: 'Garantir que os preços sejam competitivos no mercado'
          },
          {
            id: 'monitorar-concorrentes',
            name: 'Monitorar preços dos concorrentes',
            description: 'Acompanhar em tempo real os preços da concorrência'
          }
        ]
      }
    ]
  },
  {
    id: 'logistica-fulfillment',
    name: 'Otimizar logística e fulfillment',
    description: 'Equilibrar custo, prazo, SLA e preparo de pedidos',
    littleJobs: [
      {
        id: 'roteirizar-despacho',
        name: 'Roteirizar despacho',
        description: 'Selecionar transportadora/serviço ideal por CEP, peso e SLA',
        outcomes: [
          {
            id: 'custo-frete',
            name: 'Reduzir custo médio de frete',
            description: 'Escolher automaticamente a opção de menor custo'
          },
          {
            id: 'prazo-entrega',
            name: 'Melhorar prazo médio de entrega',
            description: 'Minimizar tempo de trânsito mantendo custo'
          }
        ]
      },
      {
        id: 'preparar-fulfillment',
        name: 'Preparar para fulfillment (FBA/FBM/3PL)',
        description: 'Planejar envios a centros e regras por canal',
        outcomes: [
          {
            id: 'rate-ocorrencias',
            name: 'Reduzir ocorrências logísticas',
            description: 'Diminuir extravios, avarias e devoluções por erro'
          },
          {
            id: 'tempo-picking',
            name: 'Reduzir tempo de picking e packing',
            description: 'Otimizar separação e embalagem por pedido'
          }
        ]
      }
    ]
  },
  {
    id: 'planejar-estoque',
    name: 'Planejar e reabastecer estoque',
    description: 'Prever demanda e repor com eficiência por SKU/canal',
    littleJobs: [
      {
        id: 'previsao-compra',
        name: 'Prever necessidade de compra',
        description: 'Sinalizar rupturas futuras por SKU/canal',
        outcomes: [
          {
            id: 'acuracia-previsao',
            name: 'Aumentar acurácia da previsão',
            description: 'Melhorar MAPE e reduzir excesso/ruptura'
          },
          {
            id: 'leadtime-fornecedor',
            name: 'Considerar lead time de fornecedor',
            description: 'Planejamento alinhado a prazos reais'
          }
        ]
      },
      {
        id: 'balancear-estoque',
        name: 'Balancear estoque entre canais',
        description: 'Redistribuir conforme demanda e margem',
        outcomes: [
          {
            id: 'saldo-multicanal',
            name: 'Balancear saldo multicanal',
            description: 'Evitar excesso num canal e ruptura em outro'
          },
          {
            id: 'priorizar-skus',
            name: 'Priorizar SKUs críticos',
            description: 'Focar top sellers e linhas com maior contribuição'
          }
        ]
      }
    ]
  },
  {
    id: 'pos-venda-reputacao',
    name: 'Operar pós-venda e reputação',
    description: 'Gerenciar SAC, devoluções e reviews',
    littleJobs: [
      {
        id: 'tratar-reclamacoes',
        name: 'Tratar reclamações rapidamente',
        description: 'Consolidar tickets e SLA por canal',
        outcomes: [
          {
            id: 'tempo-primeira-resposta',
            name: 'Reduzir tempo de primeira resposta',
            description: 'Responder compradores com mais agilidade'
          },
          {
            id: 'taxa-reabertura',
            name: 'Diminuir reabertura de chamados',
            description: 'Resolver na primeira interação'
          }
        ]
      },
      {
        id: 'reviews',
        name: 'Gerenciar avaliações e reputação',
        description: 'Solicitar, moderar e responder reviews',
        outcomes: [
          {
            id: 'nps',
            name: 'Aumentar NPS pós-entrega',
            description: 'Mensagens e fluxos personalizados'
          },
          {
            id: 'volume-nota-reviews',
            name: 'Aumentar volume e nota de reviews',
            description: 'Elevar prova social e SEO no canal'
          }
        ]
      }
    ]
  },
  {
    id: 'financeiro-repasses',
    name: 'Gestão financeira e repasses',
    description: 'Controlar receitas, taxas, impostos e margem líquida',
    littleJobs: [
      {
        id: 'conciliacao',
        name: 'Conciliar repasses e taxas',
        description: 'Conferir repasses dos canais e taxas aplicadas',
        outcomes: [
          {
            id: 'tempo-conciliacao',
            name: 'Reduzir tempo de conciliação',
            description: 'Automatizar baixas e divergências'
          },
          {
            id: 'lucro-por-pedido',
            name: 'Aumentar visibilidade do lucro por pedido',
            description: 'Ver margem líquida por SKU/canal'
          }
        ]
      },
      {
        id: 'precificacao-unitaria',
        name: 'Aprimorar precificação unitária',
        description: 'Incorporar impostos, comissões e custos ocultos',
        outcomes: [
          {
            id: 'simulador-preco',
            name: 'Simular preço e margem antes de publicar',
            description: 'Cenários com taxas e impostos'
          },
          {
            id: 'detectar-custos-ocultos',
            name: 'Detectar custos ocultos automaticamente',
            description: 'Identificar tarifas não previstas'
          }
        ]
      }
    ]
  }
] as const;

// === BASELINES por outcome ===
const BASELINE_SCORES: Record<string, { importance: number; satisfaction: number }> = {
  // originais
  'tempo-atributos': { importance: 9.3, satisfaction: 4.6 },
  'taxa-aprovacao': { importance: 9.0, satisfaction: 5.2 },
  'visibilidade-busca': { importance: 9.6, satisfaction: 3.9 },
  'evitar-ruptura': { importance: 9.2, satisfaction: 6.1 },
  'sincronizar-multiplos': { importance: 9.0, satisfaction: 3.7 },
  'competitividade-preco': { importance: 9.0, satisfaction: 5.1 },
  'monitorar-concorrentes': { importance: 8.6, satisfaction: 4.4 },

  // novos: logística/fulfillment
  'custo-frete': { importance: 9.1, satisfaction: 5.0 },
  'prazo-entrega': { importance: 8.8, satisfaction: 4.5 },
  'rate-ocorrencias': { importance: 8.4, satisfaction: 4.2 },
  'tempo-picking': { importance: 8.2, satisfaction: 4.8 },

  // novos: planejamento/estoque
  'acuracia-previsao': { importance: 9.0, satisfaction: 4.1 },
  'leadtime-fornecedor': { importance: 8.3, satisfaction: 3.8 },
  'saldo-multicanal': { importance: 8.6, satisfaction: 4.0 },
  'priorizar-skus': { importance: 8.5, satisfaction: 4.3 },

  // novos: pós-venda/reputação
  'tempo-primeira-resposta': { importance: 8.6, satisfaction: 5.0 },
  'taxa-reabertura': { importance: 8.1, satisfaction: 4.2 },
  'nps': { importance: 8.4, satisfaction: 4.7 },
  'volume-nota-reviews': { importance: 8.4, satisfaction: 4.1 },

  // novos: financeiro/repasses
  'tempo-conciliacao': { importance: 9.0, satisfaction: 4.6 },
  'lucro-por-pedido': { importance: 9.4, satisfaction: 4.4 },
  'simulador-preco': { importance: 9.1, satisfaction: 4.3 },
  'detectar-custos-ocultos': { importance: 8.5, satisfaction: 3.9 }
};

// === Variações por rodada ===
const ROUND_VARIATION: Record<string, { dImp: number; dSat: number }> = {
  '2024':   { dImp: -0.1, dSat: -0.2 },
  '2025':   { dImp: +0.0, dSat: +0.0 },
  '2025-03':{ dImp: -0.1, dSat: +0.2 },
  '2025-05':{ dImp: -0.1, dSat: +0.4 },
  '2025-07':{ dImp: -0.2, dSat: +0.7 },
  '2025-08':{ dImp: -0.2, dSat: +0.9 },
  '2025-09':{ dImp: -0.3, dSat: +1.1 }
};

// === Overrides exatos para 2024 e 2025 ===
const OVERRIDE_SCORES: Record<
  string,
  Record<string, { importance: number; satisfaction: number }>
> = {
  '2024': {
    'tempo-atributos': { importance: 9.2, satisfaction: 3.8 },
    'taxa-aprovacao': { importance: 8.7, satisfaction: 4.2 },
    'visibilidade-busca': { importance: 9.5, satisfaction: 3.1 },
    'evitar-ruptura': { importance: 9.1, satisfaction: 5.2 },
    'sincronizar-multiplos': { importance: 8.8, satisfaction: 2.9 },
    'competitividade-preco': { importance: 8.9, satisfaction: 4.1 },
    'monitorar-concorrentes': { importance: 8.3, satisfaction: 3.5 }
  },
  '2025': {
    'tempo-atributos': { importance: 9.4, satisfaction: 4.1 },
    'taxa-aprovacao': { importance: 8.9, satisfaction: 4.8 },
    'visibilidade-busca': { importance: 9.7, satisfaction: 3.4 },
    'evitar-ruptura': { importance: 9.3, satisfaction: 5.8 },
    'sincronizar-multiplos': { importance: 9.1, satisfaction: 3.2 },
    'competitividade-preco': { importance: 9.0, satisfaction: 4.7 },
    'monitorar-concorrentes': { importance: 8.5, satisfaction: 4.0 }
  }
};

// === Metadados das rodadas ===
const ROUNDS_META = [
  { id: '2024',    name: 'Pesquisa 2024',   date: '2024-12-01', desc: 'Primeira rodada de pesquisa ODI com vendedores de marketplace' },
  { id: '2025',    name: 'Pesquisa 2025',   date: '2025-01-15', desc: 'Segunda rodada de pesquisa ODI com maior amostra de vendedores' },
  { id: '2025-03', name: 'Pesquisa 2025.2', date: '2025-03-10', desc: 'Terceira rodada com foco em eficiência operacional e catalogação' },
  { id: '2025-05', name: 'Pesquisa 2025.3', date: '2025-05-25', desc: 'Quarta rodada com recorte em pricing dinâmico e promoções' },
  { id: '2025-07', name: 'Pesquisa 2025.4', date: '2025-07-30', desc: 'Quinta rodada com foco em finanças e rentabilidade' },
  { id: '2025-08', name: 'Pesquisa 2025.5', date: '2025-08-25', desc: 'Sexta rodada com foco em produtividade do time e automações' },
  { id: '2025-09', name: 'Pesquisa 2025.6', date: '2025-09-05', desc: 'Sétima rodada consolidando aprendizado e evolução longitudinal' }
] as const;

// === Funções auxiliares ===
function buildRoundScores(
  roundId: string, 
  baselines: Record<string, { importance: number; satisfaction: number }>,
  variations: Record<string, { dImp: number; dSat: number }>,
  overrides: Record<string, Record<string, { importance: number; satisfaction: number }>>
): Record<string, { importance: number; satisfaction: number; opportunityScore: number }> {
  const result: Record<string, { importance: number; satisfaction: number; opportunityScore: number }> = {};
  
  // Se há override para esta rodada, usar valores exatos
  if (overrides[roundId]) {
    Object.entries(overrides[roundId]).forEach(([outcomeId, scores]) => {
      result[outcomeId] = {
        ...scores,
        opportunityScore: calculateOpportunityScore(scores.importance, scores.satisfaction)
      };
    });
    return result;
  }
  
  // Caso contrário, aplicar variação sobre baseline
  const variation = variations[roundId] || { dImp: 0, dSat: 0 };
  
  Object.entries(baselines).forEach(([outcomeId, baseline]) => {
    const importance = Math.max(1, Math.min(10, baseline.importance + variation.dImp));
    const satisfaction = Math.max(1, Math.min(10, baseline.satisfaction + variation.dSat));
    
    result[outcomeId] = {
      importance,
      satisfaction,
      opportunityScore: calculateOpportunityScore(importance, satisfaction)
    };
  });
  
  return result;
}

function withScores(baseJobs: any[], scores: Record<string, { importance: number; satisfaction: number; opportunityScore: number }>) {
  return baseJobs.map(bigJob => ({
    ...bigJob,
    littleJobs: bigJob.littleJobs.map((littleJob: any) => ({
      ...littleJob,
      outcomes: littleJob.outcomes.map((outcome: any) => ({
        ...outcome,
        importance: scores[outcome.id]?.importance || 0,
        satisfaction: scores[outcome.id]?.satisfaction || 0,
        opportunityScore: scores[outcome.id]?.opportunityScore || 0
      }))
    }))
  }));
}

// === Exports for seeding ===
export { BASE_JOBS, ROUNDS_META };

// === Montagem final ===
export const mockResearchRounds: ResearchRound[] = ROUNDS_META.map(r => {
  const scores = buildRoundScores(r.id, BASELINE_SCORES, ROUND_VARIATION, OVERRIDE_SCORES);
  return {
    id: r.id,
    name: r.name,
    date: r.date,
    description: r.desc,
    data: { bigJobs: withScores(BASE_JOBS as any, scores) }
  };
});