-- Run only as the trusted database owner, after the real owner confirms their email.
-- In the SAME session first set: SET app.owner_email = 'confirmed-owner-email';
-- This script is intentionally not exposed as an RPC or website endpoint.
DO $$
DECLARE owner_id uuid; requested_email text := current_setting('app.owner_email',true);
BEGIN
 IF current_user NOT IN ('postgres','supabase_admin') THEN RAISE EXCEPTION 'Database owner required'; END IF;
 IF nullif(trim(requested_email),'') IS NULL THEN RAISE EXCEPTION 'Set app.owner_email to the confirmed owner email'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE role IN ('super_admin','admin')) THEN RAISE EXCEPTION 'Administrator already exists; use the approved admin workflow'; END IF;
 SELECT id INTO owner_id FROM auth.users WHERE lower(email)=lower(requested_email) AND email_confirmed_at IS NOT NULL;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'No confirmed account matches that email'; END IF;
 UPDATE public.profiles SET is_active=true WHERE id=owner_id;
 INSERT INTO public.user_roles(user_id,role) VALUES(owner_id,'super_admin');
END $$;


