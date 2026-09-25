BEGIN;
-- Preserve assigned codes, generate stable IDs for missing codes and future profiles.
CREATE SEQUENCE IF NOT EXISTS public.employee_code_sequence;
REVOKE ALL ON SEQUENCE public.employee_code_sequence FROM PUBLIC, anon;
GRANT USAGE ON SEQUENCE public.employee_code_sequence TO authenticated, service_role;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_employee_code_unique
  ON public.profiles (lower(btrim(employee_code)))
  WHERE employee_code IS NOT NULL AND btrim(employee_code) <> '';

CREATE OR REPLACE FUNCTION public.assign_employee_code()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE number_value text;
BEGIN
  IF NEW.employee_code IS NULL OR btrim(NEW.employee_code) = '' THEN
    IF TG_OP = 'UPDATE' AND OLD.employee_code IS NOT NULL AND btrim(OLD.employee_code) <> '' THEN
      NEW.employee_code := OLD.employee_code;
    ELSE
      LOOP
        number_value := nextval('public.employee_code_sequence'::regclass)::text;
        NEW.employee_code := 'EBR-' || lpad(number_value, greatest(3,length(number_value)), '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(btrim(employee_code)) = lower(NEW.employee_code));
      END LOOP;
    END IF;
  ELSE
    NEW.employee_code := upper(btrim(NEW.employee_code));
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_employee_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_employee_code() TO authenticated, service_role;
DROP TRIGGER IF EXISTS profiles_assign_employee_code ON public.profiles;
CREATE TRIGGER profiles_assign_employee_code
  BEFORE INSERT OR UPDATE OF employee_code ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_employee_code();
UPDATE public.profiles SET employee_code = NULL
  WHERE (employee_code IS NULL OR btrim(employee_code) = '')
    AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = profiles.id AND r.role = 'super_admin');
COMMIT;
