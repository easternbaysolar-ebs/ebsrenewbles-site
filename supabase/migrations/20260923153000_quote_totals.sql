BEGIN;
CREATE OR REPLACE FUNCTION public.calculate_quotation() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE item jsonb; amount numeric; qty numeric; rate numeric; tax numeric;
BEGIN
 NEW.subtotal:=0; NEW.gst_amount:=0;
 IF jsonb_typeof(NEW.line_items)!='array' OR jsonb_array_length(NEW.line_items)>200 THEN RAISE EXCEPTION 'Invalid quotation items'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
 qty:=(item->>'quantity')::numeric; rate:=(item->>'rate')::numeric; tax:=(item->>'gst')::numeric;
 IF qty IS NULL OR rate IS NULL OR tax IS NULL OR qty<=0 OR rate<0 OR tax<0 OR tax>100 OR length(trim(coalesce(item->>'description','')))=0 THEN RAISE EXCEPTION 'Check item, quantity, price and tax'; END IF;
 amount:=round(qty*rate,2); NEW.subtotal:=NEW.subtotal+amount; NEW.gst_amount:=NEW.gst_amount+round(amount*tax/100,2);
 END LOOP;
 NEW.subsidy_amount:=coalesce(NEW.subsidy_amount,0);
 IF NEW.subsidy_amount<0 OR NEW.subsidy_amount>NEW.subtotal+NEW.gst_amount THEN RAISE EXCEPTION 'Invalid subsidy'; END IF;
 NEW.total_amount:=NEW.subtotal+NEW.gst_amount-NEW.subsidy_amount;
 RETURN NEW;
END; $$;
CREATE TRIGGER quotation_totals BEFORE INSERT OR UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION calculate_quotation();
CREATE OR REPLACE FUNCTION public.guard_profile_admin() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF auth.uid()=OLD.id AND NOT NEW.is_active THEN RAISE EXCEPTION 'You cannot deactivate your own account'; END IF;
 IF EXISTS(SELECT 1 FROM user_roles WHERE user_id=OLD.id AND role='super_admin') AND NOT has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Owner profile is protected'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER profile_admin_guard BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_admin();
COMMIT;
