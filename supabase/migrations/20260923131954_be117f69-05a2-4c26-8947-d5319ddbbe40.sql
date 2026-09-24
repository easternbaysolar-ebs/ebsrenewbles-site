-- Split anon/authenticated read policies so anon never calls helper functions
DROP POLICY "products_public_select" ON public.products;
CREATE POLICY "products_anon_select" ON public.products FOR SELECT TO anon USING (is_active);
CREATE POLICY "products_auth_select" ON public.products FOR SELECT TO authenticated USING (is_active OR public.is_staff(auth.uid()));

DROP POLICY "projects_public_select" ON public.projects;
CREATE POLICY "projects_anon_select" ON public.projects FOR SELECT TO anon USING (is_published);
CREATE POLICY "projects_auth_select" ON public.projects FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));

DROP POLICY "project_media_public_select" ON public.project_media;
CREATE POLICY "project_media_anon_select" ON public.project_media FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_published));
CREATE POLICY "project_media_auth_select" ON public.project_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.is_published OR public.is_staff(auth.uid()))));

DROP POLICY "schemes_public_select" ON public.schemes;
CREATE POLICY "schemes_anon_select" ON public.schemes FOR SELECT TO anon USING (is_published);
CREATE POLICY "schemes_auth_select" ON public.schemes FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));

-- Lock down SECURITY DEFINER helpers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;

