-- Seguimiento de presentaciones impositivas por cliente y período (mes).
-- Si no hay fila para (cliente, período, obligación), se considera "pending".
create table if not exists public.tax_filings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  period text not null check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  obligation text not null check (obligation in ('Mon/Aut', 'Muni', 'IIBB', 'CM', 'IVA', 'Libro IVA', 'SICORE')),
  state text not null default 'pending' check (state in ('pending', 'progress', 'done', 'muted')),
  due_date date,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (client_id, period, obligation)
);

create index if not exists tax_filings_period_idx on public.tax_filings (period);

alter table public.tax_filings enable row level security;

create policy "tax_filings_authenticated_all" on public.tax_filings
  for all to authenticated using (true) with check (true);
