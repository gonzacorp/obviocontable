-- Impuestos que presenta cada cliente (se cruzan después con los vencimientos de Errepar).
-- Valores: autonomos, muni, iibb, cm, iva, sicore.
alter table public.clients
  add column if not exists taxes text[] not null default '{}';

alter table public.clients
  add constraint clients_taxes_check
  check (taxes <@ array['autonomos', 'muni', 'iibb', 'cm', 'iva', 'sicore']);
