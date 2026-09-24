BEGIN;
DROP POLICY customers_read ON public.customers;
CREATE POLICY customers_read ON public.customers FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR (public.is_staff(auth.uid()) AND (
 account_manager=auth.uid()
 OR EXISTS(SELECT 1 FROM public.leads l WHERE l.id=customers.lead_id AND l.assigned_to=auth.uid())
 OR EXISTS(SELECT 1 FROM public.projects p WHERE p.customer_id=customers.id AND p.site_engineer=auth.uid())
)));
ALTER TABLE public.leads ADD CONSTRAINT leads_valid_values CHECK (
 (monthly_units IS NULL OR monthly_units BETWEEN 0 AND 1000000000)
 AND (monthly_bill IS NULL OR monthly_bill BETWEEN 0 AND 1000000000)
 AND (desired_kw IS NULL OR desired_kw BETWEEN 0 AND 1000000)
 AND status IN ('new','contacted','site_visit','quote_sent','negotiation','confirmed','installation','completed','lost')
);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_valid_status CHECK(status IN ('pending','in_progress','completed','cancelled'));
ALTER TABLE public.projects ADD CONSTRAINT projects_valid_status CHECK(status IN ('planning','survey','installation','commissioning','completed','on_hold'));
ALTER TABLE public.material_prices ADD CONSTRAINT prices_valid_values CHECK(price BETWEEN 0 AND 1000000000 AND gst_percent BETWEEN 0 AND 100);
INSERT INTO public.site_content(key,section,label,value) VALUES
('homepage.hero','homepage','Homepage introduction','{"heading":"Your roof. A new source of power.","description":"Easternbay Renewables designs, supplies, installs and commissions solar systems for homes, businesses and industry, with support through net metering and applicable subsidy processes."}')
ON CONFLICT(key) DO NOTHING;
UPDATE public.site_content SET value=value-'hours' WHERE key='contact.details' AND value->>'hours'='Mon-Sat, 9:30am - 6:30pm IST';
COMMIT;
