-- Habilitar extensão para slugs/uuid
create extension if not exists "uuid-ossp";

-- Big Jobs
create table if not exists big_jobs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,            -- ex: 'multicanal'
  name text not null,
  description text,
  tags text[] default '{}',
  order_index int default 0,
  status text default 'active' check (status in ('active','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Little Jobs
create table if not exists little_jobs (
  id uuid primary key default uuid_generate_v4(),
  big_job_id uuid not null references big_jobs(id) on delete cascade,
  slug text unique not null,            -- ex: 'preparar-listagem'
  name text not null,
  description text,
  order_index int default 0,
  status text default 'active' check (status in ('active','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Outcomes
create table if not exists outcomes (
  id uuid primary key default uuid_generate_v4(),
  little_job_id uuid not null references little_jobs(id) on delete cascade,
  slug text unique not null,            -- ex: 'tempo-atributos'
  name text not null,
  description text,
  tags text[] default '{}',
  order_index int default 0,
  status text default 'active' check (status in ('active','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pesquisas / Rodadas ODI
create table if not exists surveys (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,            -- ex: '2025-07'
  name text not null,                   -- ex: 'Pesquisa 2025.4'
  date date not null,                   -- ex: '2025-07-30'
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resultados por Outcome e Pesquisa
create table if not exists outcome_results (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references surveys(id) on delete cascade,
  outcome_id uuid not null references outcomes(id) on delete cascade,
  importance numeric(3,1) not null check (importance between 0 and 10),
  satisfaction numeric(3,1) not null check (satisfaction between 0 and 10),
  -- opportunity_score calculado também no app; aqui persistimos para ordenações/queries
  opportunity_score numeric(4,1) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (survey_id, outcome_id)
);

-- Auditoria simples
create table if not exists change_logs (
  id uuid primary key default uuid_generate_v4(),
  entity text not null check (entity in ('big_job','little_job','outcome','survey','outcome_result')),
  entity_id uuid not null,
  action text not null check (action in ('create','update','delete','archive','reorder','import')),
  before jsonb,
  after jsonb,
  actor text, -- e-mail/uid do usuário autenticado
  created_at timestamptz default now()
);

-- Triggers de updated_at
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger t_bj_updated before update on big_jobs for each row execute procedure set_updated_at();
create trigger t_lj_updated before update on little_jobs for each row execute procedure set_updated_at();
create trigger t_oc_updated before update on outcomes for each row execute procedure set_updated_at();
create trigger t_su_updated before update on surveys for each row execute procedure set_updated_at();
create trigger t_or_updated before update on outcome_results for each row execute procedure set_updated_at();

-- Índices
create index if not exists idx_lj_big on little_jobs(big_job_id);
create index if not exists idx_oc_little on outcomes(little_job_id);
create index if not exists idx_or_survey_outcome on outcome_results(survey_id, outcome_id);
create index if not exists idx_or_score on outcome_results(opportunity_score desc);

-- RLS Policies
alter table big_jobs enable row level security;
alter table little_jobs enable row level security;
alter table outcomes enable row level security;
alter table surveys enable row level security;
alter table outcome_results enable row level security;
alter table change_logs enable row level security;

-- Leituras públicas, gravação apenas autenticado
create policy "read_all" on big_jobs for select using (true);
create policy "read_all" on little_jobs for select using (true);
create policy "read_all" on outcomes for select using (true);
create policy "read_all" on surveys for select using (true);
create policy "read_all" on outcome_results for select using (true);
create policy "read_all" on change_logs for select using (true);

-- Write policies for big_jobs
create policy "write_auth" on big_jobs for insert with check (auth.uid() is not null);
create policy "write_auth_u" on big_jobs for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "write_auth_d" on big_jobs for delete using (auth.uid() is not null);

-- Write policies for little_jobs
create policy "write_auth" on little_jobs for insert with check (auth.uid() is not null);
create policy "write_auth_u" on little_jobs for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "write_auth_d" on little_jobs for delete using (auth.uid() is not null);

-- Write policies for outcomes
create policy "write_auth" on outcomes for insert with check (auth.uid() is not null);
create policy "write_auth_u" on outcomes for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "write_auth_d" on outcomes for delete using (auth.uid() is not null);

-- Write policies for surveys
create policy "write_auth" on surveys for insert with check (auth.uid() is not null);
create policy "write_auth_u" on surveys for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "write_auth_d" on surveys for delete using (auth.uid() is not null);

-- Write policies for outcome_results
create policy "write_auth" on outcome_results for insert with check (auth.uid() is not null);
create policy "write_auth_u" on outcome_results for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "write_auth_d" on outcome_results for delete using (auth.uid() is not null);

-- Write policies for change_logs
create policy "write_auth" on change_logs for insert with check (auth.uid() is not null);

-- Views úteis para o front
create or replace view vw_outcomes_long as
select
  su.code as survey_code,
  su.date as survey_date,
  bj.slug as big_job_slug, bj.name as big_job_name,
  lj.slug as little_job_slug, lj.name as little_job_name,
  oc.slug as outcome_slug, oc.name as outcome_name,
  orr.importance, orr.satisfaction, orr.opportunity_score
from outcome_results orr
join surveys su on su.id = orr.survey_id
join outcomes oc on oc.id = orr.outcome_id
join little_jobs lj on lj.id = oc.little_job_id
join big_jobs bj on bj.id = lj.big_job_id;