-- Populate database with sample data

-- Insert Big Jobs
INSERT INTO big_jobs (slug, name, description, order_index) VALUES
('multicanal', 'Gerir operação multicanal', 'Gerenciar vendas e operações em múltiplos marketplaces simultaneamente', 0),
('gestao-financeira', 'Gestão financeira e rentabilidade', 'Controlar finanças e maximizar rentabilidade das operações', 1)
ON CONFLICT (slug) DO NOTHING;

-- Insert Little Jobs
INSERT INTO little_jobs (big_job_id, slug, name, description, order_index) VALUES
((SELECT id FROM big_jobs WHERE slug = 'multicanal'), 'preparar-listagem', 'Preparar produtos para listagem', 'Preparar informações e dados dos produtos para publicação nos marketplaces', 0),
((SELECT id FROM big_jobs WHERE slug = 'multicanal'), 'controlar-estoque', 'Controlar estoque', 'Gerenciar disponibilidade e quantidade de produtos', 1),
((SELECT id FROM big_jobs WHERE slug = 'gestao-financeira'), 'otimizar-custos', 'Otimizar custos operacionais', 'Reduzir custos e melhorar eficiência operacional', 0)
ON CONFLICT (slug) DO NOTHING;

-- Insert Outcomes
INSERT INTO outcomes (little_job_id, slug, name, description, order_index) VALUES
((SELECT id FROM little_jobs WHERE slug = 'preparar-listagem'), 'tempo-atributos', 'Reduzir tempo de preencher atributos obrigatórios', 'Minimizar o tempo necessário para preencher campos obrigatórios dos produtos', 0),
((SELECT id FROM little_jobs WHERE slug = 'preparar-listagem'), 'taxa-aprovacao', 'Aumentar taxa de aprovação de anúncios', 'Melhorar a taxa de anúncios aprovados na primeira tentativa', 1),
((SELECT id FROM little_jobs WHERE slug = 'controlar-estoque'), 'evitar-ruptura', 'Evitar ruptura de estoque', 'Prevenir falta de produtos em estoque', 0),
((SELECT id FROM little_jobs WHERE slug = 'controlar-estoque'), 'sincronizar-multiplos', 'Sincronizar estoque entre múltiplos canais', 'Manter estoque atualizado em todos os marketplaces simultaneamente', 1),
((SELECT id FROM little_jobs WHERE slug = 'otimizar-custos'), 'detectar-custos', 'Detectar custos ocultos automaticamente', 'Identificar custos não visíveis que impactam a margem', 0)
ON CONFLICT (slug) DO NOTHING;

-- Insert Surveys
INSERT INTO surveys (code, name, date, description) VALUES
('2024', 'Pesquisa 2024', '2024-12-01', 'Primeira rodada de pesquisa ODI com vendedores de marketplace'),
('2025', 'Pesquisa 2025', '2025-01-15', 'Segunda rodada de pesquisa ODI com maior amostra de vendedores'),
('2025-03', 'Pesquisa 2025.2', '2025-03-10', 'Terceira rodada com foco em eficiência operacional e catalogação')
ON CONFLICT (code) DO NOTHING;

-- Insert Outcome Results (sample data)
INSERT INTO outcome_results (survey_id, outcome_id, importance, satisfaction, opportunity_score) VALUES
-- 2024 Survey results
((SELECT id FROM surveys WHERE code = '2024'), (SELECT id FROM outcomes WHERE slug = 'tempo-atributos'), 9.2, 3.5, 14.9),
((SELECT id FROM surveys WHERE code = '2024'), (SELECT id FROM outcomes WHERE slug = 'taxa-aprovacao'), 8.8, 4.2, 13.4),
((SELECT id FROM surveys WHERE code = '2024'), (SELECT id FROM outcomes WHERE slug = 'evitar-ruptura'), 9.5, 5.1, 13.9),
((SELECT id FROM surveys WHERE code = '2024'), (SELECT id FROM outcomes WHERE slug = 'sincronizar-multiplos'), 8.9, 3.8, 14.0),
((SELECT id FROM surveys WHERE code = '2024'), (SELECT id FROM outcomes WHERE slug = 'detectar-custos'), 8.7, 3.2, 14.2),

-- 2025 Survey results
((SELECT id FROM surveys WHERE code = '2025'), (SELECT id FROM outcomes WHERE slug = 'tempo-atributos'), 9.4, 4.1, 14.7),
((SELECT id FROM surveys WHERE code = '2025'), (SELECT id FROM outcomes WHERE slug = 'taxa-aprovacao'), 9.0, 4.8, 13.2),
((SELECT id FROM surveys WHERE code = '2025'), (SELECT id FROM outcomes WHERE slug = 'evitar-ruptura'), 9.3, 5.5, 13.1),
((SELECT id FROM surveys WHERE code = '2025'), (SELECT id FROM outcomes WHERE slug = 'sincronizar-multiplos'), 9.1, 4.2, 14.0),
((SELECT id FROM surveys WHERE code = '2025'), (SELECT id FROM outcomes WHERE slug = 'detectar-custos'), 8.9, 3.8, 14.0),

-- 2025-03 Survey results  
((SELECT id FROM surveys WHERE code = '2025-03'), (SELECT id FROM outcomes WHERE slug = 'tempo-atributos'), 9.1, 4.5, 13.6),
((SELECT id FROM surveys WHERE code = '2025-03'), (SELECT id FROM outcomes WHERE slug = 'taxa-aprovacao'), 8.9, 5.2, 12.6),
((SELECT id FROM surveys WHERE code = '2025-03'), (SELECT id FROM outcomes WHERE slug = 'evitar-ruptura'), 9.4, 6.1, 12.7),
((SELECT id FROM surveys WHERE code = '2025-03'), (SELECT id FROM outcomes WHERE slug = 'sincronizar-multiplos'), 9.2, 4.8, 13.6),
((SELECT id FROM surveys WHERE code = '2025-03'), (SELECT id FROM outcomes WHERE slug = 'detectar-custos'), 8.8, 4.1, 13.5)
ON CONFLICT (survey_id, outcome_id) DO NOTHING;