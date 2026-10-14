-- 01 · Seguridad básica (YA APLICADO)
-- Solo los administradores borran/modifican reservas o crean clases; cada usuario ve solo su perfil.

create or replace function public.es_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select es_admin from public.perfiles where id = auth.uid()), false)
$$;

drop policy if exists "Borrar reservas"          on public.reservas;
drop policy if exists "Actualizar reservas"      on public.reservas;
drop policy if exists "Insertar reservas"        on public.reservas;
drop policy if exists "Lectura pública perfiles" on public.perfiles;

create policy "Admins borran reservas" on public.reservas
  for delete using (public.es_admin());

create policy "Admins modifican reservas" on public.reservas
  for update using (public.es_admin()) with check (public.es_admin());

create policy "Ver mi perfil" on public.perfiles
  for select to authenticated using (id = auth.uid());

create unique index if not exists reservas_franja_unica
  on public.reservas (pista_id, fecha, slot_inicio);
