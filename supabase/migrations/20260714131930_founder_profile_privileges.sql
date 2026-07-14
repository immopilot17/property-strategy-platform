revoke all on table public.profiles from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (id, full_name, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (full_name, updated_at)
  on table public.profiles to authenticated;
