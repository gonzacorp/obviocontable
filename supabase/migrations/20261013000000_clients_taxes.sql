-- Impuestos que se le presentan a cada cliente (se reflejan en el panel de Resumen).
alter table public.clients
  add column if not exists taxes text[] not null default '{}';

alter table public.clients
  add constraint clients_taxes_valid
  check (taxes <@ array['autonomo', 'muni', 'iibb', 'cm', 'iva', 'sicore']::text[]);

-- IIBB y Convenio Multilateral son excluyentes.
alter table public.clients
  add constraint clients_taxes_iibb_cm_exclusive
  check (not ('iibb' = any(taxes) and 'cm' = any(taxes)));

-- Las empresas (CUIT 30/33/34) no pagan autónomos.
alter table public.clients
  add constraint clients_taxes_autonomo_fisica
  check (not ('autonomo' = any(taxes) and person_type = 'juridica'));
