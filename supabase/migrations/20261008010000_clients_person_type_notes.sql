-- Notas opcionales y tipo de persona calculado a partir del prefijo del CUIT.
alter table public.clients add column if not exists notes text;

alter table public.clients
  add column if not exists person_type text
  generated always as (
    case
      when left(regexp_replace(cuit, '\D', '', 'g'), 2) in ('20', '23', '24', '27') then 'fisica'
      when left(regexp_replace(cuit, '\D', '', 'g'), 2) in ('30', '33', '34') then 'juridica'
      else 'revisar'
    end
  ) stored;
