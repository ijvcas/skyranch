-- Fix security definer views by converting to security_invoker
-- This ensures views use querying user's permissions, not view creator's permissions
-- The role-based masking will still work via get_current_app_role() SECURITY DEFINER function

-- Fix animal_sales_view
CREATE OR REPLACE VIEW animal_sales_view
WITH (security_invoker = true) AS
SELECT 
  id,
  animal_id,
  sale_date,
  sale_price,
  total_amount,
  amount_paid,
  amount_pending,
  payment_status,
  payment_method,
  buyer_name,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN buyer_contact
    ELSE '[RESTRICTED]'
  END as buyer_contact,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN buyer_email
    ELSE '[RESTRICTED]'
  END as buyer_email,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN sale_notes
    ELSE NULL
  END as sale_notes,
  user_id,
  created_at,
  updated_at
FROM animal_sales;

-- Fix parcel_owners_view
CREATE OR REPLACE VIEW public.parcel_owners_view
WITH (security_invoker = true) AS
SELECT
  id,
  parcel_id,
  owner_name,
  owner_type,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN contact_phone
    ELSE '***-****'
  END AS contact_phone,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN contact_email
    ELSE '***@***'
  END AS contact_email,
  CASE 
    WHEN get_current_app_role() IN ('admin', 'manager') THEN contact_address
    ELSE '[Contact admin for details]'
  END AS contact_address,
  identification_number,
  ownership_percentage,
  is_primary_contact,
  notes,
  created_at,
  updated_at
FROM public.parcel_owners;

COMMENT ON VIEW animal_sales_view IS 'Role-based view with security_invoker that masks buyer PII for worker role. Uses RLS from base table and get_current_app_role() for masking.';
COMMENT ON VIEW public.parcel_owners_view IS 'Role-based view with security_invoker that masks landowner PII for non-admin/manager users. Uses RLS from base table and get_current_app_role() for masking.';