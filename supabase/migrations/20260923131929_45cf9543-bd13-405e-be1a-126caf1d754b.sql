-- ROLES ---------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','sales_manager','sales_employee','site_engineer','installation_team','accountant','view_only');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  designation text,
  employee_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','admin'));
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'view_only')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles_admin_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "profiles_admin_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- LEADS ---------------------------------------------------------------
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  email text,
  location text,
  customer_type text NOT NULL DEFAULT 'residential',
  monthly_units numeric,
  monthly_bill numeric,
  desired_kw numeric,
  notes text,
  source text NOT NULL DEFAULT 'website',
  status text NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_follow_up date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_public_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "leads_staff_select" ON public.leads FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR assigned_to = auth.uid()) WITH CHECK (public.is_admin(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "leads_admin_delete" ON public.leads FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note',
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_activities_staff_select" ON public.lead_activities FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "lead_activities_staff_insert" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "lead_activities_admin_delete" ON public.lead_activities FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- CUSTOMERS -----------------------------------------------------------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  customer_type text NOT NULL DEFAULT 'residential',
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  account_manager uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_staff_select" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "customers_staff_insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "customers_update" ON public.customers FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR account_manager = auth.uid()) WITH CHECK (public.is_admin(auth.uid()) OR account_manager = auth.uid());
CREATE POLICY "customers_admin_delete" ON public.customers FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRODUCTS ------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  brand text,
  description text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  unit text,
  indicative_price numeric,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_select" ON public.products FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MATERIAL PRICES -----------------------------------------------------
CREATE TABLE public.material_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'module',
  unit text NOT NULL DEFAULT 'per_watt',
  price numeric NOT NULL DEFAULT 0,
  gst_percent numeric NOT NULL DEFAULT 13.8,
  effective_from date NOT NULL DEFAULT current_date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_prices TO authenticated;
GRANT ALL ON public.material_prices TO service_role;
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "material_prices_staff_select" ON public.material_prices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "material_prices_admin_write" ON public.material_prices FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER material_prices_updated_at BEFORE UPDATE ON public.material_prices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PROJECTS ------------------------------------------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'residential',
  capacity_kw numeric,
  location text,
  description text,
  status text NOT NULL DEFAULT 'completed',
  commissioned_on date,
  cover_image_url text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  site_engineer uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT false,
  is_placeholder boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_select" ON public.projects FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "projects_admin_write" ON public.projects FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "projects_engineer_update" ON public.projects FOR UPDATE TO authenticated USING (site_engineer = auth.uid()) WITH CHECK (site_engineer = auth.uid());
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url text,
  caption text,
  is_placeholder boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO authenticated;
GRANT SELECT ON public.project_media TO anon;
GRANT ALL ON public.project_media TO service_role;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_media_public_select" ON public.project_media FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.is_published OR public.is_staff(auth.uid()))));
CREATE POLICY "project_media_admin_write" ON public.project_media FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- TASKS / SITE VISITS -------------------------------------------------
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'task',
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR assigned_to = auth.uid() OR created_by = auth.uid());
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR assigned_to = auth.uid()) WITH CHECK (public.is_admin(auth.uid()) OR assigned_to = auth.uid());
CREATE POLICY "tasks_admin_delete" ON public.tasks FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- QUOTATIONS ----------------------------------------------------------
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  capacity_kw numeric,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  gst_amount numeric NOT NULL DEFAULT 0,
  subsidy_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  valid_until date,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotations TO authenticated;
GRANT ALL ON public.quotations TO service_role;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()) OR created_by = auth.uid()) WITH CHECK (public.is_admin(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "quotations_admin_delete" ON public.quotations FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCHEMES -------------------------------------------------------------
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  authority text,
  short_description text,
  details text,
  benefits text[] NOT NULL DEFAULT '{}',
  eligibility text[] NOT NULL DEFAULT '{}',
  applies_to text[] NOT NULL DEFAULT '{}',
  official_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schemes TO authenticated;
GRANT SELECT ON public.schemes TO anon;
GRANT ALL ON public.schemes TO service_role;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schemes_public_select" ON public.schemes FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "schemes_admin_write" ON public.schemes FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER schemes_updated_at BEFORE UPDATE ON public.schemes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SITE CONTENT --------------------------------------------------------
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  section text NOT NULL DEFAULT 'general',
  label text,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT SELECT ON public.site_content TO anon;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content_public_select" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_content_admin_write" ON public.site_content FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEED ----------------------------------------------------------------
INSERT INTO public.schemes (slug, name, authority, short_description, details, benefits, eligibility, applies_to, official_url, sort_order) VALUES
('pm-surya-ghar','PM Surya Ghar: Muft Bijli Yojana','Ministry of New and Renewable Energy, Government of India',
 'Central financial assistance for residential rooftop solar, with subsidy credited to the homeowner''s bank account after installation and inspection.',
 'PM Surya Ghar is the Government of India rooftop solar programme for residential consumers. Applications are made on the National Portal, the system is installed by a registered vendor, and subsidy is released after net-metering and inspection by the DISCOM. Subsidy slabs, timelines and documentation are set by MNRE and may be revised — we confirm the applicable amount for your sanctioned load before quoting.',
 ARRAY['Central financial assistance for residential rooftop systems','Subsidy credited directly to the applicant bank account','Net metering allows export of surplus generation','Applies to grid-connected rooftop systems installed by registered vendors'],
 ARRAY['Residential electricity consumer with a valid connection','Roof owned by the applicant or with owner consent','System installed by a vendor registered on the National Portal','Subsidy claimed once per eligible connection'],
 ARRAY['residential'],'https://pmsuryaghar.gov.in',1),
('pm-kusum','PM-KUSUM','Ministry of New and Renewable Energy, Government of India',
 'Support for solar pumps and decentralised solar plants for farmers and agricultural feeders.',
 'PM-KUSUM supports farmers with standalone solar agricultural pumps, solarisation of existing grid-connected pumps, and small decentralised solar power plants on barren or fallow land. Components, subsidy share and application routes are administered by the state nodal agency; we assist with sizing, documentation and installation.',
 ARRAY['Support for standalone solar agriculture pumps','Solarisation of existing grid-connected agricultural pumps','Decentralised ground-mounted plants on unused farm land','Reduces diesel dependence and irrigation running cost'],
 ARRAY['Farmer, farmer group, cooperative or panchayat as defined by the scheme component','Land or connection ownership documents','Application through the designated state nodal agency'],
 ARRAY['agriculture','industrial'],'https://pmkusum.mnre.gov.in',2);

INSERT INTO public.products (name, category, brand, description, specs, unit, sort_order) VALUES
('Mono PERC Solar Module','modules','Placeholder brand','High-efficiency monocrystalline PERC modules for rooftop and ground-mount systems.','{"Cell type":"Mono PERC","Typical wattage":"400-550 Wp","Warranty":"Manufacturer product and performance warranty"}','per module',1),
('N-Type TOPCon Solar Module','modules','Placeholder brand','Next-generation N-type modules offering higher efficiency and lower degradation.','{"Cell type":"N-Type TOPCon","Typical wattage":"550-620 Wp","Warranty":"Manufacturer product and performance warranty"}','per module',2),
('On-Grid String Inverter','inverters','Placeholder brand','Grid-tied string inverters with MPPT tracking and remote monitoring.','{"Range":"3 kW - 100 kW","Phases":"Single and three phase","Monitoring":"Wi-Fi / LAN"}','per unit',3),
('Hybrid Solar Inverter','inverters','Placeholder brand','Hybrid inverters supporting battery backup along with grid export.','{"Range":"3 kW - 15 kW","Battery support":"Lithium and lead acid","Backup":"Essential load backup"}','per unit',4),
('Lithium Battery Bank (LFP)','batteries','Placeholder brand','Lithium iron phosphate storage for backup and load shifting.','{"Chemistry":"LFP","Typical capacity":"5 kWh - 30 kWh","Cycle life":"As per manufacturer datasheet"}','per kWh',5),
('Elevated Mounting Structure','mounting','Placeholder brand','Hot-dip galvanised structures for RCC rooftops, tin sheds and elevated walkways.','{"Material":"Hot-dip galvanised MS / aluminium","Wind load":"Designed to site wind zone","Types":"RCC ballast, tin shed, elevated"}','per kW',6),
('Balance of System Kit','bos','Placeholder brand','DC and AC cables, combiner boxes, lightning arrestor, earthing kit and protection devices.','{"Cables":"DC solar cable and AC copper cable","Protection":"SPD, MCB/MCCB, fuses","Earthing":"Chemical earthing kit"}','per system',7);

INSERT INTO public.material_prices (item_name, category, unit, price, gst_percent, notes) VALUES
('Mono PERC module','module','per_watt',22,13.8,'Indicative placeholder rate — update with current supplier pricing'),
('N-Type TOPCon module','module','per_watt',24,13.8,'Indicative placeholder rate'),
('On-grid string inverter','inverter','per_kw',5500,13.8,'Indicative placeholder rate'),
('Hybrid inverter','inverter','per_kw',12000,13.8,'Indicative placeholder rate'),
('Mounting structure (RCC rooftop)','structure','per_kw',4500,18,'Indicative placeholder rate'),
('Installation and commissioning','installation','per_kw',4000,18,'Indicative placeholder rate'),
('DC solar cable','cable','per_metre',45,18,'Indicative placeholder rate'),
('AC copper cable','cable','per_metre',120,18,'Indicative placeholder rate'),
('Earthing and lightning protection','bos','per_system',12000,18,'Indicative placeholder rate');

INSERT INTO public.projects (title, category, capacity_kw, location, description, status, is_published, is_placeholder, sort_order) VALUES
('Residential rooftop — placeholder','residential',5,'Location to be confirmed','Placeholder gallery entry. Replace with a real Easternbay residential installation, photos and commissioning details.','completed',true,true,1),
('Residential villa rooftop — placeholder','residential',10,'Location to be confirmed','Placeholder gallery entry awaiting project photographs.','completed',true,true,2),
('Commercial rooftop — placeholder','commercial',50,'Location to be confirmed','Placeholder gallery entry for a commercial rooftop system.','completed',true,true,3),
('Retail complex rooftop — placeholder','commercial',75,'Location to be confirmed','Placeholder gallery entry awaiting project photographs.','completed',true,true,4),
('Industrial shed rooftop — placeholder','industrial',250,'Location to be confirmed','Placeholder gallery entry for an industrial tin-shed system.','completed',true,true,5),
('Factory ground-mount — placeholder','industrial',500,'Location to be confirmed','Placeholder gallery entry awaiting project photographs.','completed',true,true,6);

INSERT INTO public.site_content (key, section, label, value) VALUES
('company.profile','general','Company profile','{"name":"Easternbay Renewables","tagline":"Rooftop solar EPC, engineered end to end.","about":"Easternbay Renewables designs, supplies, installs and commissions grid-connected rooftop and ground-mount solar systems for homes, businesses and industry, and supports customers through Government of India subsidy and net-metering processes."}'),
('contact.details','contact','Contact details','{"phone":"Placeholder — add official number","email":"Placeholder — add official email","address":"Placeholder — add registered office address","hours":"Mon-Sat, 9:30am - 6:30pm IST"}'),
('calculator.assumptions','calculator','Calculator assumptions','{"units_per_kw_per_day":4,"cost_per_kw":60000,"tariff_per_unit":8,"panel_wattage":550}');

