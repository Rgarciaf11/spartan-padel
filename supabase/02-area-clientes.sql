-- 02 · Área de clientes: estructura
-- Ejecutar ANTES de desplegar la nueva versión. Solo añade cosas: la web actual sigue funcionando.

begin;

-- Datos del cliente en su perfil
alter table public.perfiles
  add column if not exists nombre    text,
  add column if not exists apellidos text,
  add column if not exists telefono  text;

-- Cada reserva sabe qué cliente la ha hecho
alter table public.reservas
  add column if not exists user_id uuid references public.perfiles(id) on delete set null;
create index if not exists reservas_user_id_idx on public.reservas (user_id);

-- Al registrarse se crea su perfil con los datos del formulario (nunca como admin)
create or replace function public.crear_perfil()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre, apellidos, telefono, es_admin)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'apellidos',
    new.raw_user_meta_data ->> 'telefono',
    false
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- El cliente puede editar nombre, apellidos y teléfono de SU perfil (nunca es_admin ni email)
drop policy if exists "Editar mi perfil" on public.perfiles;
create policy "Editar mi perfil" on public.perfiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.perfiles from anon, authenticated;
grant update (nombre, apellidos, telefono) on public.perfiles to authenticated;

-- El cliente puede cancelar sus propias reservas futuras
drop policy if exists "Cancelar mis reservas" on public.reservas;
create policy "Cancelar mis reservas" on public.reservas
  for delete to authenticated
  using (user_id = auth.uid() and fecha >= current_date);

-- Vista del administrador: reservas de un día con nombre y teléfono del cliente.
-- Si quien llama no es admin, devuelve una lista vacía.
create or replace function public.reservas_admin(p_fecha date)
returns json
language sql stable security definer set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
           'id',          r.id,
           'pista_id',    r.pista_id,
           'fecha',       r.fecha,
           'slot_inicio', r.slot_inicio,
           'slot_fin',    r.slot_fin,
           'es_clase',    r.es_clase,
           'user_id',     r.user_id,
           'nombre',      coalesce(nullif(trim(concat_ws(' ', p.nombre, p.apellidos)), ''), r.nombre_jugador),
           'telefono',    coalesce(p.telefono, r.telefono)
         ) order by r.pista_id, r.slot_inicio), '[]'::json)
  from public.reservas r
  left join public.perfiles p on p.id = r.user_id
  where r.fecha = p_fecha
    and public.es_admin()
$$;
revoke execute on function public.reservas_admin(date) from public, anon;
grant execute on function public.reservas_admin(date) to authenticated;

commit;
