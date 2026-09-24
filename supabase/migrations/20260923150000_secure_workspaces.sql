BEGIN;
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM user_roles r JOIN profiles p ON p.id=r.user_id WHERE r.user_id=_user_id AND r.role IN ('admin','super_admin') AND p.is_active);
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM user_roles r JOIN profiles p ON p.id=r.user_id WHERE r.user_id=_user_id AND p.is_active);
$$;
CREATE OR REPLACE FUNCTION public.can_work(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM user_roles r JOIN profiles p ON p.id=r.user_id WHERE r.user_id=_user_id AND p.is_active AND r.role NOT IN ('view_only','accountant'));
$$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
 BEGIN INSERT INTO profiles(id,full_name,email) VALUES(NEW.id,COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.email),NEW.email) ON CONFLICT DO NOTHING; RETURN NEW; END;
$$;
-- Replace permissive policies rather than combining them with restrictive ones.
DO $$ DECLARE r record; BEGIN FOR r IN SELECT tablename,policyname FROM pg_policies WHERE schemaname='public' LOOP
 EXECUTE format('DROP POLICY %I ON public.%I',r.policyname,r.tablename); END LOOP; END $$;
CREATE POLICY profiles_read ON profiles FOR SELECT TO authenticated USING(id=auth.uid() OR is_admin(auth.uid()));
CREATE POLICY profiles_admin ON profiles FOR UPDATE TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY roles_read ON user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR is_admin(auth.uid()));
-- Roles are managed only through the checked function, never raw client writes.
CREATE OR REPLACE FUNCTION public.set_employee_role(employee uuid, new_role public.app_role) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
 BEGIN
 IF NOT is_admin(auth.uid()) THEN RAISE EXCEPTION 'Administrator required'; END IF;
 IF employee=auth.uid() THEN RAISE EXCEPTION 'Cannot change your own role'; END IF;
 IF EXISTS(SELECT 1 FROM user_roles WHERE user_id=employee AND role='super_admin') THEN RAISE EXCEPTION 'Owner role is protected'; END IF;
 IF new_role IN ('super_admin','admin') AND NOT has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Owner required'; END IF;
 DELETE FROM user_roles WHERE user_id=employee;
 INSERT INTO user_roles(user_id,role) VALUES(employee,new_role);
 END;
$$;
REVOKE ALL ON FUNCTION public.set_employee_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_employee_role(uuid,public.app_role) TO authenticated;
CREATE POLICY leads_read ON leads FOR SELECT TO authenticated USING(is_admin(auth.uid()) OR (is_staff(auth.uid()) AND assigned_to=auth.uid()));
CREATE POLICY leads_admin ON leads FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY leads_work ON leads FOR UPDATE TO authenticated USING(can_work(auth.uid()) AND assigned_to=auth.uid()) WITH CHECK(can_work(auth.uid()) AND assigned_to=auth.uid());
REVOKE INSERT ON leads FROM anon;
CREATE OR REPLACE FUNCTION public.submit_enquiry(payload jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
 DECLARE new_id uuid; clean_mobile text := regexp_replace(payload->>'mobile','[^0-9]','','g');
 BEGIN
 IF length(trim(coalesce(payload->>'name','')))<2 OR length(payload->>'name')>120 OR clean_mobile !~ '^[0-9]{10,13}$' OR length(trim(coalesce(payload->>'location','')))<2 OR length(payload->>'location')>160 OR length(coalesce(payload->>'notes',''))>1000 OR length(coalesce(payload->>'email',''))>255 THEN RAISE EXCEPTION 'Please check your name, mobile, location and message'; END IF;
 IF coalesce(payload->>'customer_type','') NOT IN ('residential','commercial','industrial','agriculture') THEN RAISE EXCEPTION 'Invalid customer type'; END IF;
 IF (coalesce(nullif(payload->>'monthly_units',''),'0'))::numeric < 0 OR (coalesce(nullif(payload->>'monthly_bill',''),'0'))::numeric < 0 OR (coalesce(nullif(payload->>'desired_kw',''),'0'))::numeric < 0 THEN RAISE EXCEPTION 'Values must be positive'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(clean_mobile));
 IF (SELECT count(*) FROM leads WHERE mobile=clean_mobile AND created_at>now()-interval '1 hour')>=3 THEN RAISE EXCEPTION 'Please wait before submitting another enquiry'; END IF;
 INSERT INTO leads(name,mobile,email,location,customer_type,monthly_units,monthly_bill,desired_kw,notes,source,status)
 VALUES(trim(payload->>'name'),clean_mobile,nullif(payload->>'email',''),trim(payload->>'location'),payload->>'customer_type',nullif(payload->>'monthly_units','')::numeric,nullif(payload->>'monthly_bill','')::numeric,nullif(payload->>'desired_kw','')::numeric,payload->>'notes','website','new') RETURNING id INTO new_id;
 RETURN new_id;
 END;
$$;
REVOKE ALL ON FUNCTION public.submit_enquiry(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_enquiry(jsonb) TO anon,authenticated;
CREATE POLICY customers_read ON customers FOR SELECT TO authenticated USING(is_admin(auth.uid()) OR (is_staff(auth.uid()) AND (account_manager=auth.uid() OR EXISTS(SELECT 1 FROM leads l WHERE l.id=lead_id AND l.assigned_to=auth.uid()))));
CREATE POLICY customers_admin ON customers FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY activities_read ON lead_activities FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM leads l WHERE l.id=lead_id));
CREATE POLICY activities_add ON lead_activities FOR INSERT TO authenticated WITH CHECK(can_work(auth.uid()) AND created_by=auth.uid() AND EXISTS(SELECT 1 FROM leads l WHERE l.id=lead_id));
CREATE POLICY activities_admin ON lead_activities FOR DELETE TO authenticated USING(is_admin(auth.uid()));
CREATE POLICY projects_read ON projects FOR SELECT TO authenticated USING(is_admin(auth.uid()) OR (is_staff(auth.uid()) AND site_engineer=auth.uid()));
CREATE POLICY projects_admin ON projects FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY projects_work ON projects FOR UPDATE TO authenticated USING(can_work(auth.uid()) AND site_engineer=auth.uid()) WITH CHECK(can_work(auth.uid()) AND site_engineer=auth.uid());
REVOKE SELECT ON projects FROM anon;
CREATE OR REPLACE VIEW public.public_projects AS SELECT id,title,category,capacity_kw,location,description,status,commissioned_on,cover_image_url,is_placeholder,sort_order FROM projects WHERE is_published AND NOT is_placeholder;
GRANT SELECT ON public.public_projects TO anon,authenticated;
CREATE POLICY media_public ON project_media FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public_projects p WHERE p.id=project_id));
CREATE POLICY media_admin ON project_media FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY tasks_read ON tasks FOR SELECT TO authenticated USING(is_admin(auth.uid()) OR (is_staff(auth.uid()) AND assigned_to=auth.uid()));
CREATE POLICY tasks_admin ON tasks FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY tasks_work ON tasks FOR UPDATE TO authenticated USING(can_work(auth.uid()) AND assigned_to=auth.uid()) WITH CHECK(can_work(auth.uid()) AND assigned_to=auth.uid());
CREATE POLICY quotes_admin ON quotations FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY quotes_read ON quotations FOR SELECT TO authenticated USING(is_staff(auth.uid()) AND EXISTS(SELECT 1 FROM leads l WHERE l.id=lead_id AND l.assigned_to=auth.uid()));
CREATE POLICY prices_admin ON material_prices FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY products_public ON products FOR SELECT TO anon,authenticated USING(is_active);
CREATE POLICY products_admin ON products FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY schemes_public ON schemes FOR SELECT TO anon,authenticated USING(is_published);
CREATE POLICY schemes_admin ON schemes FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
CREATE POLICY content_public ON site_content FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY content_admin ON site_content FOR ALL TO authenticated USING(is_admin(auth.uid())) WITH CHECK(is_admin(auth.uid()));
-- Assigned employees can update progress, not ownership, publication, customer or commercial fields.
CREATE OR REPLACE FUNCTION public.guard_work_update() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
 DECLARE allowed text[];
 BEGIN
 IF is_admin(auth.uid()) OR auth.role()='service_role' OR current_user IN ('postgres','supabase_admin') THEN RETURN NEW; END IF;
 allowed := CASE TG_TABLE_NAME WHEN 'leads' THEN ARRAY['status','notes','next_follow_up','updated_at'] WHEN 'projects' THEN ARRAY['status','updated_at'] WHEN 'tasks' THEN ARRAY['status','completed_at','updated_at'] ELSE ARRAY[]::text[] END;
 IF (to_jsonb(NEW)-allowed) IS DISTINCT FROM (to_jsonb(OLD)-allowed) THEN RAISE EXCEPTION 'Only progress fields may be changed'; END IF;
 RETURN NEW;
 END;
$$;
CREATE TRIGGER guard_lead_fields BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION guard_work_update();
CREATE TRIGGER guard_project_fields BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION guard_work_update();
CREATE TRIGGER guard_task_fields BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION guard_work_update();
CREATE TABLE public.work_history(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor_id uuid REFERENCES auth.users(id),entity_type text NOT NULL,entity_id uuid NOT NULL,summary text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE work_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON work_history TO authenticated;
CREATE POLICY history_read ON work_history FOR SELECT TO authenticated USING(is_admin(auth.uid()) OR (is_staff(auth.uid()) AND actor_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.log_work_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
 BEGIN INSERT INTO work_history(actor_id,entity_type,entity_id,summary) VALUES(auth.uid(),TG_TABLE_NAME,NEW.id,'Status: '||NEW.status); RETURN NEW; END;
$$;
CREATE TRIGGER log_lead AFTER UPDATE OF status ON leads FOR EACH ROW WHEN(OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION log_work_change();
CREATE TRIGGER log_project AFTER UPDATE OF status ON projects FOR EACH ROW WHEN(OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION log_work_change();
CREATE TRIGGER log_task AFTER UPDATE OF status ON tasks FOR EACH ROW WHEN(OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION log_work_change();
CREATE TABLE public.documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,uploaded_by uuid NOT NULL REFERENCES auth.users(id),file_name text NOT NULL,storage_path text UNIQUE NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,DELETE ON documents TO authenticated;
CREATE POLICY documents_read ON documents FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM projects p WHERE p.id=project_id));
CREATE POLICY documents_insert ON documents FOR INSERT TO authenticated WITH CHECK(can_work(auth.uid()) AND uploaded_by=auth.uid() AND split_part(storage_path,'/',1)=project_id::text AND split_part(storage_path,'/',2)=auth.uid()::text AND EXISTS(SELECT 1 FROM projects p WHERE p.id=project_id));
CREATE POLICY documents_delete ON documents FOR DELETE TO authenticated USING(is_admin(auth.uid()) OR (can_work(auth.uid()) AND uploaded_by=auth.uid() AND EXISTS(SELECT 1 FROM projects p WHERE p.id=project_id)));
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('project-documents','project-documents',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf']) ON CONFLICT(id) DO NOTHING;
CREATE POLICY work_files_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='project-documents' AND EXISTS(SELECT 1 FROM projects p WHERE p.id::text=split_part(name,'/',1)));
CREATE POLICY work_files_add ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='project-documents' AND can_work(auth.uid()) AND split_part(name,'/',2)=auth.uid()::text AND EXISTS(SELECT 1 FROM projects p WHERE p.id::text=split_part(name,'/',1)));
CREATE POLICY work_files_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='project-documents' AND (is_admin(auth.uid()) OR (can_work(auth.uid()) AND split_part(name,'/',2)=auth.uid()::text AND EXISTS(SELECT 1 FROM projects p WHERE p.id::text=split_part(name,'/',1)))));
-- Disable fabricated installation entries; verified projects alone feed public statistics.
UPDATE products SET brand=NULL WHERE brand='Placeholder brand';
COMMIT;
