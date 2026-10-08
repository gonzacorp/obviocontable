-- Nuevos datos de cliente: localidad, contacto, categoría y responsable de contabilidad.
alter table public.clients
  add column if not exists locality text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists category text,
  add column if not exists accounting_owner text;

alter table public.clients
  add constraint clients_category_check
  check (category is null or category in ('Agropecuarias', 'Comercial', 'Servicios', 'Industrial', 'Droguerías'));

-- "tipo" y "ejercicio" ya no se cargan: se dejan opcionales para no perder datos existentes.
alter table public.clients alter column type drop not null;
alter table public.clients alter column exercise drop not null;
alter table public.clients alter column owner drop not null;
