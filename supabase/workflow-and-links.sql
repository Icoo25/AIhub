-- AI Компас — workflow за експерименти и връзки между обектите
-- Изпълнете целия файл в Supabase > SQL Editor след flexible-workspace.sql.
-- Миграцията е idempotent и може да бъде изпълнена повторно.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Пълна документация и Kanban workflow за експериментите
-- ---------------------------------------------------------------------------

alter table public.experiments
  add column if not exists status text not null default 'Идея',
  add column if not exists hypothesis text not null default '',
  add column if not exists prompt text not null default '',
  add column if not exists test_data text not null default '',
  add column if not exists model_settings text not null default '',
  add column if not exists evaluation numeric(3,1) not null default 0,
  add column if not exists decision text not null default '',
  add column if not exists comparison_model text not null default '',
  add column if not exists comparison_prompt text not null default '',
  add column if not exists comparison_result text not null default '',
  add column if not exists updated_at timestamptz not null default now();

update public.experiments
set status = coalesce(status, 'Идея'),
    hypothesis = coalesce(hypothesis, ''),
    prompt = coalesce(prompt, ''),
    test_data = coalesce(test_data, ''),
    model_settings = coalesce(model_settings, ''),
    evaluation = coalesce(evaluation, 0),
    decision = coalesce(decision, ''),
    comparison_model = coalesce(comparison_model, ''),
    comparison_prompt = coalesce(comparison_prompt, ''),
    comparison_result = coalesce(comparison_result, ''),
    updated_at = coalesce(updated_at, created_at, now());

alter table public.experiments
  drop constraint if exists experiments_status_check;
alter table public.experiments
  add constraint experiments_status_check
  check (status in (
    'Идея',
    'Планиран',
    'В процес',
    'Завършен',
    'За внедряване',
    'Отхвърлен'
  ));

alter table public.experiments
  drop constraint if exists experiments_evaluation_check;
alter table public.experiments
  add constraint experiments_evaluation_check
  check (evaluation >= 0 and evaluation <= 10);

create index if not exists experiments_status_idx
  on public.experiments(status);
create index if not exists experiments_updated_at_idx
  on public.experiments(updated_at desc);

create or replace function public.set_experiment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_experiment_updated_at_trigger on public.experiments;
create trigger set_experiment_updated_at_trigger
  before update on public.experiments
  for each row execute procedure public.set_experiment_updated_at();

-- ---------------------------------------------------------------------------
-- Разширени типове съдържание в AI библиотеката
-- ---------------------------------------------------------------------------

alter table public.knowledge_items
  drop constraint if exists knowledge_items_content_type_check;
alter table public.knowledge_items
  add constraint knowledge_items_content_type_check
  check (content_type in (
    'resource',
    'source',
    'note',
    'tool',
    'news',
    'experiment',
    'tip',
    'idea',
    'prompt',
    'course',
    'video'
  ));

-- Входящите записи се маркират като „Обработено“ след успешно преобразуване.
-- status е свободно текстово поле след library-enhancements.sql, което позволява
-- собствени етапи и не изисква нов check constraint.

-- ---------------------------------------------------------------------------
-- Полиморфни връзки между знания, инструменти, новини и експерименти
-- ---------------------------------------------------------------------------

create table if not exists public.entity_links (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relation text not null default 'related',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint entity_links_not_self
    check (source_type <> target_type or source_id <> target_id),
  constraint entity_links_unique
    unique (source_type, source_id, target_type, target_id, relation)
);

alter table public.entity_links
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists relation text default 'related',
  add column if not exists created_by uuid references auth.users(id) on delete set null default auth.uid(),
  add column if not exists created_at timestamptz default now();

alter table public.entity_links
  drop constraint if exists entity_links_not_self;
alter table public.entity_links
  add constraint entity_links_not_self
  check (source_type <> target_type or source_id <> target_id);

alter table public.entity_links
  drop constraint if exists entity_links_unique;
alter table public.entity_links
  add constraint entity_links_unique
  unique (source_type, source_id, target_type, target_id, relation);

alter table public.entity_links
  drop constraint if exists entity_links_source_type_check;
alter table public.entity_links
  add constraint entity_links_source_type_check
  check (source_type in ('knowledge', 'tool', 'news', 'experiment'));

alter table public.entity_links
  drop constraint if exists entity_links_target_type_check;
alter table public.entity_links
  add constraint entity_links_target_type_check
  check (target_type in ('knowledge', 'tool', 'news', 'experiment'));

alter table public.entity_links
  drop constraint if exists entity_links_relation_check;
alter table public.entity_links
  add constraint entity_links_relation_check
  check (relation in (
    'related',
    'uses',
    'result_of',
    'inspired_by',
    'supports',
    'compares'
  ));

create index if not exists entity_links_source_idx
  on public.entity_links(source_type, source_id);
create index if not exists entity_links_target_idx
  on public.entity_links(target_type, target_id);
create index if not exists entity_links_created_at_idx
  on public.entity_links(created_at desc);

alter table public.entity_links enable row level security;

drop policy if exists "Authenticated users can read entity links" on public.entity_links;
drop policy if exists "Contributors can insert entity links" on public.entity_links;
drop policy if exists "Contributors can update entity links" on public.entity_links;
drop policy if exists "Contributors can delete entity links" on public.entity_links;

create policy "Authenticated users can read entity links"
  on public.entity_links for select to authenticated
  using (true);

create policy "Contributors can insert entity links"
  on public.entity_links for insert to authenticated
  with check (public.can_contribute_knowledge());

create policy "Contributors can update entity links"
  on public.entity_links for update to authenticated
  using (public.can_contribute_knowledge())
  with check (public.can_contribute_knowledge());

create policy "Contributors can delete entity links"
  on public.entity_links for delete to authenticated
  using (public.can_contribute_knowledge());

-- При изтриване на бизнес обект се почистват полиморфните връзки.
create or replace function public.cleanup_entity_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mapped_type text;
begin
  mapped_type := case tg_table_name
    when 'knowledge_items' then 'knowledge'
    when 'ai_tools' then 'tool'
    when 'ai_news' then 'news'
    when 'experiments' then 'experiment'
    else null
  end;

  if mapped_type is not null then
    delete from public.entity_links
    where (source_type = mapped_type and source_id = old.id)
       or (target_type = mapped_type and target_id = old.id);
  end if;

  return old;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['knowledge_items', 'ai_tools', 'ai_news', 'experiments']
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'drop trigger if exists cleanup_entity_links_trigger on public.%I',
        table_name
      );
      execute format(
        'create trigger cleanup_entity_links_trigger after delete on public.%I for each row execute procedure public.cleanup_entity_links()',
        table_name
      );
    end if;
  end loop;
end $$;
