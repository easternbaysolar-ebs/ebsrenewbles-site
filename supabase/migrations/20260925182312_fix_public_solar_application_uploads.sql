-- Keep public application uploads private while allowing the submitter to attach documents.
-- The private helper checks existence with owner privileges, so anonymous RLS checks do not
-- need SELECT access to application or lead rows.
create schema if not exists private;

create or replace function private.solar_application_exists(application_id_text text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.scheme_applications a
    where a.id::text = application_id_text
  );
$$;

revoke all on function private.solar_application_exists(text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.solar_application_exists(text) to anon, authenticated;

drop policy if exists application_documents_public_upload on public.application_documents;
create policy application_documents_public_upload
on public.application_documents
for insert to anon, authenticated
with check (
  private.solar_application_exists(application_id::text)
  and (auth.uid() is null or uploaded_by = auth.uid())
  and (
    auth.uid() is null
    or exists (
      select 1
      from public.scheme_applications a
      join public.leads l on l.id = a.lead_id
      where a.id = application_id
        and (public.is_admin(auth.uid()) or a.submitted_by = auth.uid() or l.assigned_to = auth.uid())
    )
  )
  and (storage_path is null or storage_path like application_id::text || '/%')
);

drop policy if exists customer_documents_upload on storage.objects;
create policy customer_documents_upload
on storage.objects
for insert to anon, authenticated
with check (
  bucket_id = 'customer-documents'
  and private.solar_application_exists((storage.foldername(objects.name))[1])
  and (
    auth.uid() is null
    or public.is_admin(auth.uid())
    or exists (
      select 1
      from public.scheme_applications a
      join public.leads l on l.id = a.lead_id
      where a.id::text = (storage.foldername(objects.name))[1]
        and (a.submitted_by = auth.uid() or l.assigned_to = auth.uid())
    )
  )
);
