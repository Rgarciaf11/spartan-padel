-- 03 · Área de clientes: permisos y corrección de fechas
-- Ejecutar JUSTO DESPUÉS de que la nueva versión esté desplegada en Vercel.

begin;

-- 1. La versión anterior guardaba las fechas en UTC (toISOString) y en España eso es el día anterior.
--    Las reservas antiguas (sin user_id) se mueven un día hacia delante.
--    El índice único se quita y se vuelve a crear para que no choque durante el cambio.
drop index if exists public.reservas_franja_unica;
update public.reservas set fecha = fecha + 1 where user_id is null;
create unique index reservas_franja_unica on public.reservas (pista_id, fecha, slot_inicio);

-- 2. Qué columnas puede leer cada rol (los datos personales solo los ve el admin vía reservas_admin)
revoke select on public.reservas from anon, authenticated;
grant select (id, pista_id, fecha, slot_inicio, slot_fin, es_clase)          on public.reservas to anon;
grant select (id, pista_id, fecha, slot_inicio, slot_fin, es_clase, user_id) on public.reservas to authenticated;

-- 3. Para reservar hay que tener cuenta, y solo un admin puede crear clases
drop policy if exists "Reservar pista" on public.reservas;
create policy "Reservar pista" on public.reservas
  for insert to authenticated
  with check (
    (es_clase = false and user_id = auth.uid())
    or public.es_admin()
  );

commit;
