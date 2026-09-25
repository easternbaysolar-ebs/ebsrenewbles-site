-- Private PM Surya Ghar intake documents and employee field evidence.
create table if not exists public.scheme_applications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  consumer_number text not null,
  state text not null,
  discom text not null,
  application_reference text,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.scheme_applications add column if not exists submitted_by uuid references auth.users(id) on delete set null;
create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.scheme_applications(id) on delete cascade,
  document_type text not null check (document_type in ('electricity_bill','identity','roof_authorization','other')),
  storage_path text,
  file_name text,
  typed_details text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (storage_path is not null or nullif(trim(typed_details), '') is not null)
);
alter table public.scheme_applications enable row level security;
alter table public.application_documents enable row level security;
grant select on public.scheme_applications, public.application_documents to authenticated;
grant insert on public.application_documents to anon, authenticated;
drop policy if exists scheme_applications_staff_read on public.scheme_applications;
create policy scheme_applications_staff_read on public.scheme_applications for select to authenticated
  using (public.is_admin(auth.uid()) or submitted_by=auth.uid() or exists (select 1 from public.leads l where l.id=lead_id and l.assigned_to=auth.uid()));
drop policy if exists application_documents_staff_read on public.application_documents;
create policy application_documents_staff_read on public.application_documents for select to authenticated
  using (public.is_admin(auth.uid()) or exists (select 1 from public.scheme_applications a join public.leads l on l.id=a.lead_id where a.id=application_id and (a.submitted_by=auth.uid() or l.assigned_to=auth.uid())));
drop policy if exists application_documents_public_upload on public.application_documents;
create policy application_documents_public_upload on public.application_documents for insert to anon, authenticated with check (
  exists (select 1 from public.scheme_applications a where a.id=application_id)
  and (auth.uid() is null or uploaded_by=auth.uid())
  and (auth.uid() is null or exists(select 1 from public.scheme_applications a join public.leads l on l.id=a.lead_id where a.id=application_id and (public.is_admin(auth.uid()) or a.submitted_by=auth.uid() or l.assigned_to=auth.uid())))
  and (storage_path is null or (storage_path like application_id::text || '/%'))
);

create or replace function public.submit_solar_application(info jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare lead_uuid uuid; app_uuid uuid; mobile_value text;
begin
  mobile_value := regexp_replace(coalesce(info->>'mobile',''), '[^0-9]','','g');
  if length(coalesce(info->>'name','')) not between 2 and 120
     or length(mobile_value) not between 10 and 13
     or length(coalesce(info->>'consumer_number','')) not between 3 and 40
     or length(coalesce(info->>'state','')) not between 2 and 80
     or length(coalesce(info->>'discom','')) not between 2 and 120 then
    raise exception 'Please complete the required application details.' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtext(mobile_value));
  if (select count(*) from public.leads where mobile=mobile_value and created_at>now()-interval '1 hour') >= 3 then
    raise exception 'Please wait before submitting another application.' using errcode='22023';
  end if;
  insert into public.leads(name,mobile,email,location,customer_type,source,status,notes)
  values (left(info->>'name',120),mobile_value,nullif(left(info->>'email',254),''),left(coalesce(info->>'address',''),300),'residential','pm_surya_ghar','new',left(coalesce(info->>'notes',''),1000))
  returning id into lead_uuid;
  insert into public.scheme_applications(lead_id,consumer_number,state,discom,application_reference,submitted_by)
  values (lead_uuid,left(info->>'consumer_number',40),left(info->>'state',80),left(info->>'discom',120),nullif(left(info->>'application_reference',80),''),auth.uid())
  returning id into app_uuid;
  return app_uuid;
end $$;
revoke all on function public.submit_solar_application(jsonb) from public;
grant execute on function public.submit_solar_application(jsonb) to anon, authenticated;

create or replace function public.attach_solar_application(target_lead uuid, consumer text, state_name text, utility text, portal_ref text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare app_uuid uuid;
begin
  if not (public.is_admin(auth.uid()) or (public.can_work(auth.uid()) and exists(select 1 from public.leads where id=target_lead and assigned_to=auth.uid()))) then
    raise exception 'You may only add application details to an assigned lead.' using errcode='42501';
  end if;
  if length(trim(coalesce(consumer,''))) not between 3 and 40 or length(trim(coalesce(state_name,''))) not between 2 and 80 or length(trim(coalesce(utility,''))) not between 2 and 120 then
    raise exception 'Enter the consumer number, state and DISCOM.' using errcode='22023';
  end if;
  insert into public.scheme_applications(lead_id,consumer_number,state,discom,application_reference,submitted_by)
  values(target_lead,trim(consumer),trim(state_name),trim(utility),nullif(trim(portal_ref),''),auth.uid())
  on conflict(lead_id) do update set consumer_number=excluded.consumer_number,state=excluded.state,discom=excluded.discom,application_reference=excluded.application_reference,submitted_by=excluded.submitted_by
  returning id into app_uuid;
  return app_uuid;
end $$;
revoke all on function public.attach_solar_application(uuid,text,text,text,text) from public,anon;
grant execute on function public.attach_solar_application(uuid,text,text,text,text) to authenticated;

drop policy if exists leads_employee_insert on public.leads;
create policy leads_employee_insert on public.leads for insert to authenticated
  with check (public.can_work(auth.uid()) and assigned_to=auth.uid() and source='employee');

create or replace function public.guard_work_update() returns trigger language plpgsql set search_path=public as $$
declare allowed text[];
begin
  if public.is_admin(auth.uid()) or auth.role()='service_role' or current_user in ('postgres','supabase_admin') then return new; end if;
  allowed := case tg_table_name
    when 'leads' then array['status','notes','next_follow_up','updated_at']
    when 'projects' then array['status','updated_at']
    when 'tasks' then array['status','completed_at','visit_photo_path','visit_latitude','visit_longitude','visit_note','work_photo_paths','updated_at']
    else array[]::text[] end;
  if (to_jsonb(new)-allowed) is distinct from (to_jsonb(old)-allowed) then raise exception 'Only progress and field evidence may be changed'; end if;
  return new;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('customer-documents','customer-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists customer_documents_upload on storage.objects;
create policy customer_documents_upload on storage.objects for insert to anon,authenticated with check (
  bucket_id='customer-documents' and exists (select 1 from public.scheme_applications a where a.id::text=(storage.foldername(name))[1] and (auth.uid() is null or public.is_admin(auth.uid()) or a.submitted_by=auth.uid() or exists(select 1 from public.leads l where l.id=a.lead_id and l.assigned_to=auth.uid())))
);
drop policy if exists customer_documents_staff_read on storage.objects;
create policy customer_documents_staff_read on storage.objects for select to authenticated using (
  bucket_id='customer-documents' and (public.is_admin(auth.uid()) or exists (
    select 1 from public.scheme_applications a join public.leads l on l.id=a.lead_id
    where a.id::text=(storage.foldername(name))[1] and l.assigned_to=auth.uid()))
);
drop policy if exists customer_documents_admin_delete on storage.objects;
create policy customer_documents_admin_delete on storage.objects for delete to authenticated using (bucket_id='customer-documents' and public.is_admin(auth.uid()));

alter table public.tasks add column if not exists visit_photo_path text;
alter table public.tasks add column if not exists visit_latitude double precision;
alter table public.tasks add column if not exists visit_longitude double precision;
alter table public.tasks add column if not exists visit_note text;
alter table public.tasks add column if not exists work_photo_paths text[] not null default '{}';
create or replace function public.require_visit_evidence()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.task_type='site_visit' and new.status='completed' and
     (nullif(trim(new.visit_note),'') is null or new.visit_photo_path is null or new.visit_latitude is null or new.visit_longitude is null) then
    raise exception 'Add a visit photo, location, and short note before completing this site visit.' using errcode='23514';
  end if;
  return new;
end $$;
drop trigger if exists tasks_require_visit_evidence on public.tasks;
create trigger tasks_require_visit_evidence before insert or update on public.tasks for each row execute function public.require_visit_evidence();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('site-visit-evidence','site-visit-evidence',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists visit_evidence_upload on storage.objects;
create policy visit_evidence_upload on storage.objects for insert to authenticated with check (
  bucket_id='site-visit-evidence' and (storage.foldername(name))[2]=auth.uid()::text and exists (
    select 1 from public.tasks t where t.id::text=(storage.foldername(name))[1] and (t.assigned_to=auth.uid() or public.is_admin(auth.uid())) and t.task_type='site_visit')
);
drop policy if exists visit_evidence_staff_read on storage.objects;
create policy visit_evidence_staff_read on storage.objects for select to authenticated using (
  bucket_id='site-visit-evidence' and (public.is_admin(auth.uid()) or exists (
    select 1 from public.tasks t where t.id::text=(storage.foldername(name))[1] and t.assigned_to=auth.uid()))
);
drop policy if exists visit_evidence_admin_delete on storage.objects;
create policy visit_evidence_admin_delete on storage.objects for delete to authenticated using (bucket_id='site-visit-evidence' and public.is_admin(auth.uid()));

create or replace function public.remove_employee_access(employee uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Administrator access required.' using errcode='42501'; end if;
  if employee=auth.uid() then raise exception 'You cannot remove your own access.' using errcode='22023'; end if;
  if exists (select 1 from public.user_roles where user_id=employee and role='super_admin') then
    raise exception 'Super administrator access cannot be removed here.' using errcode='22023';
  end if;
  update public.profiles set is_active=false where id=employee;
  delete from public.user_roles where user_id=employee;
end $$;
revoke all on function public.remove_employee_access(uuid) from public;
grant execute on function public.remove_employee_access(uuid) to authenticated;

