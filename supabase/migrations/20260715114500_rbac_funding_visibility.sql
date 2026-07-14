drop policy if exists "funding_program_versions_admin_select" on public.funding_program_versions;
create policy "funding_program_versions_admin_select"
on public.funding_program_versions for select
to authenticated
using (private.current_user_role() in ('admin', 'founder'));

grant select on table public.funding_program_versions to authenticated;

