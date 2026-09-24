BEGIN;
INSERT INTO auth.users(id,email,aud,role) VALUES
('11111111-1111-4111-8111-111111111111','ebr-admin-test@example.invalid','authenticated','authenticated'),
('22222222-2222-4222-8222-222222222222','ebr-staff-test@example.invalid','authenticated','authenticated'),
('33333333-3333-4333-8333-333333333333','ebr-other-test@example.invalid','authenticated','authenticated'),
('44444444-4444-4444-8444-444444444444','ebr-view-test@example.invalid','authenticated','authenticated');
INSERT INTO user_roles(user_id,role) VALUES('11111111-1111-4111-8111-111111111111','super_admin'),('22222222-2222-4222-8222-222222222222','sales_employee'),('44444444-4444-4444-8444-444444444444','view_only');
INSERT INTO leads(id,name,mobile,status,assigned_to) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test assigned','0000000000','new','22222222-2222-4222-8222-222222222222'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Test unassigned','0000000001','new',NULL),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Test view-only','0000000002','new','44444444-4444-4444-8444-444444444444');
INSERT INTO customers(id,name,mobile) VALUES('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Assigned project customer','0000000044');
INSERT INTO projects(id,title,status,customer_id,site_engineer) VALUES('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Permission test project','planning','dddddddd-dddd-4ddd-8ddd-dddddddddddd','22222222-2222-4222-8222-222222222222');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true),set_config('request.jwt.claim.role','authenticated',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM leads WHERE id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))<>1 THEN RAISE EXCEPTION 'FAIL: assignment read isolation'; END IF;
 IF NOT EXISTS(SELECT 1 FROM customers WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd') THEN RAISE EXCEPTION 'FAIL: assigned project customer access'; END IF;
 BEGIN UPDATE projects SET is_published=true WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'; RAISE EXCEPTION 'FAIL: employee publish'; EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM profiles)<>1 THEN RAISE EXCEPTION 'FAIL: profile isolation'; END IF;
 UPDATE leads SET status='contacted' WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF NOT FOUND THEN RAISE EXCEPTION 'FAIL: assigned update'; END IF;
 BEGIN
 UPDATE leads SET assigned_to=NULL WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 RAISE EXCEPTION 'FAIL: employee reassignment allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF; END;
 BEGIN
 PERFORM set_employee_role('33333333-3333-4333-8333-333333333333','admin');
 RAISE EXCEPTION 'FAIL: employee role escalation allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF; END;
END $$;
SELECT set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM leads) THEN RAISE EXCEPTION 'FAIL: new signup can read leads'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
DO $$ BEGIN UPDATE leads SET status='contacted' WHERE id='cccccccc-cccc-4ccc-8ccc-cccccccccccc'; IF FOUND THEN RAISE EXCEPTION 'FAIL: view-only can write'; END IF; END $$;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM leads WHERE id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'))<>2 THEN RAISE EXCEPTION 'FAIL: admin access'; END IF;
 INSERT INTO quotations(quote_number,line_items,subsidy_amount) VALUES('TEST-ROLLBACK','[{"description":"Module","quantity":2,"rate":100,"gst":18}]',10);
 IF (SELECT total_amount FROM quotations WHERE quote_number='TEST-ROLLBACK')<>226 THEN RAISE EXCEPTION 'FAIL: quote arithmetic'; END IF;
 UPDATE profiles SET is_active=false WHERE id='22222222-2222-4222-8222-222222222222';
END $$;
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
DO $$ BEGIN IF EXISTS(SELECT 1 FROM leads) THEN RAISE EXCEPTION 'FAIL: disabled staff access'; END IF; END $$;
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claim.role','anon',true);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM leads) THEN RAISE EXCEPTION 'FAIL: anonymous read'; END IF;
 BEGIN INSERT INTO leads(name,mobile) VALUES('Bad insert','0000000000'); RAISE EXCEPTION 'FAIL: anonymous raw insert'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM submit_enquiry('{"name":"Test enquiry","mobile":"0000000003","location":"Test city","customer_type":"residential","status":"completed","assigned_to":"11111111-1111-4111-8111-111111111111"}');
 PERFORM * FROM public_projects;
END $$;
RESET ROLE;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM leads WHERE mobile='0000000003' AND status='new' AND assigned_to IS NULL) THEN RAISE EXCEPTION 'FAIL: public field injection'; END IF; END $$;
ROLLBACK;


