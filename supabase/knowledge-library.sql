-- AI Библиотека — изпълнете в Supabase SQL Editor
create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Източници',
  source_url text not null default '',
  status text not null default 'Ново' check (status in ('Ново', 'За преглед', 'За тестване', 'Полезно', 'Архив')),
  priority text not null default 'Среден' check (priority in ('Нисък', 'Среден', 'Висок')),
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  tags text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists knowledge_items_status_idx on public.knowledge_items(status);
create index if not exists knowledge_items_category_idx on public.knowledge_items(category);
create index if not exists knowledge_items_created_at_idx on public.knowledge_items(created_at desc);
alter table public.knowledge_items enable row level security;

create policy "Authenticated users can read knowledge" on public.knowledge_items for select to authenticated using (true);
create policy "Authenticated users can insert knowledge" on public.knowledge_items for insert to authenticated with check (true);
create policy "Authenticated users can update knowledge" on public.knowledge_items for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete knowledge" on public.knowledge_items for delete to authenticated using (true);

insert into public.knowledge_items (title, description, category, source_url, status, priority, rating, tags, notes) values
('Llama 3: Fine-tuning Guide', 'Детайлно ръководство за адаптиране на Llama 3 модели за специфични задачи.', 'LLMs', 'https://example.com/llama', 'Ново', 'Среден', 4.8, array['Модели','Open Source'], ''),
('AutoGPT Next Gen', 'Нов подход за автономни агенти с подобрена памет и планиране.', 'Агенти', 'https://example.com/autogpt', 'Ново', 'Висок', 4.2, array['Агенти'], 'Да се сравни с текущия процес.'),
('AI Safety Paper 2024', 'Анализ на рисковете при мащабно внедряване на автономни системи.', 'Етика', 'https://example.com/safety', 'За преглед', 'Висок', 4.9, array['Проучване','Етика'], ''),
('LangSmith Cloud', 'Платформа за наблюдение и контрол на LLM вериги.', 'Инструменти', 'https://example.com/langsmith', 'За тестване', 'Среден', 4.5, array['Tools','LLM'], '');
