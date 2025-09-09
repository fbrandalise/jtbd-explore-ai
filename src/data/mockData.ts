import { ResearchRound, calculateOpportunityScore } from '../types/jtbd';

export const mockResearchRounds: ResearchRound[] = [
  {
    id: '2024',
    name: 'Pesquisa 2024',
    date: '2024-12-01',
    description: 'Primeira rodada de pesquisa ODI com vendedores de marketplace',
    data: {
      bigJobs: [
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
                  description: 'Minimizar o tempo necessário para preencher campos obrigatórios dos produtos',
                  importance: 9.2,
                  satisfaction: 3.8,
                  opportunityScore: calculateOpportunityScore(9.2, 3.8)
                },
                {
                  id: 'taxa-aprovacao',
                  name: 'Aumentar taxa de aprovação de anúncios',
                  description: 'Melhorar a taxa de anúncios aprovados na primeira tentativa',
                  importance: 8.7,
                  satisfaction: 4.2,
                  opportunityScore: calculateOpportunityScore(8.7, 4.2)
                },
                {
                  id: 'visibilidade-busca',
                  name: 'Melhorar visibilidade em buscas do marketplace',
                  description: 'Otimizar anúncios para aparecer melhor nas buscas dos compradores',
                  importance: 9.5,
                  satisfaction: 3.1,
                  opportunityScore: calculateOpportunityScore(9.5, 3.1)
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
                  description: 'Prevenir falta de produtos em estoque',
                  importance: 9.1,
                  satisfaction: 5.2,
                  opportunityScore: calculateOpportunityScore(9.1, 5.2)
                },
                {
                  id: 'sincronizar-multiplos',
                  name: 'Sincronizar estoque entre múltiplos canais',
                  description: 'Manter estoque atualizado em todos os marketplaces simultaneamente',
                  importance: 8.8,
                  satisfaction: 2.9,
                  opportunityScore: calculateOpportunityScore(8.8, 2.9)
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
                  description: 'Garantir que os preços sejam competitivos no mercado',
                  importance: 8.9,
                  satisfaction: 4.1,
                  opportunityScore: calculateOpportunityScore(8.9, 4.1)
                },
                {
                  id: 'monitorar-concorrentes',
                  name: 'Monitorar preços dos concorrentes',
                  description: 'Acompanhar em tempo real os preços da concorrência',
                  importance: 8.3,
                  satisfaction: 3.5,
                  opportunityScore: calculateOpportunityScore(8.3, 3.5)
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    id: '2025',
    name: 'Pesquisa 2025',
    date: '2025-01-15',
    description: 'Segunda rodada de pesquisa ODI com maior amostra de vendedores',
    data: {
      bigJobs: [
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
                  description: 'Minimizar o tempo necessário para preencher campos obrigatórios dos produtos',
                  importance: 9.4,
                  satisfaction: 4.1,
                  opportunityScore: calculateOpportunityScore(9.4, 4.1)
                },
                {
                  id: 'taxa-aprovacao',
                  name: 'Aumentar taxa de aprovação de anúncios',
                  description: 'Melhorar a taxa de anúncios aprovados na primeira tentativa',
                  importance: 8.9,
                  satisfaction: 4.8,
                  opportunityScore: calculateOpportunityScore(8.9, 4.8)
                },
                {
                  id: 'visibilidade-busca',
                  name: 'Melhorar visibilidade em buscas do marketplace',
                  description: 'Otimizar anúncios para aparecer melhor nas buscas dos compradores',
                  importance: 9.7,
                  satisfaction: 3.4,
                  opportunityScore: calculateOpportunityScore(9.7, 3.4)
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
                  description: 'Prevenir falta de produtos em estoque',
                  importance: 9.3,
                  satisfaction: 5.8,
                  opportunityScore: calculateOpportunityScore(9.3, 5.8)
                },
                {
                  id: 'sincronizar-multiplos',
                  name: 'Sincronizar estoque entre múltiplos canais',
                  description: 'Manter estoque atualizado em todos os marketplaces simultaneamente',
                  importance: 9.1,
                  satisfaction: 3.2,
                  opportunityScore: calculateOpportunityScore(9.1, 3.2)
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
                  description: 'Garantir que os preços sejam competitivos no mercado',
                  importance: 9.0,
                  satisfaction: 4.7,
                  opportunityScore: calculateOpportunityScore(9.0, 4.7)
                },
                {
                  id: 'monitorar-concorrentes',
                  name: 'Monitorar preços dos concorrentes',
                  description: 'Acompanhar em tempo real os preços da concorrência',
                  importance: 8.5,
                  satisfaction: 4.0,
                  opportunityScore: calculateOpportunityScore(8.5, 4.0)
                }
              ]
            }
          ]
        }
      ]
    }
  }
];