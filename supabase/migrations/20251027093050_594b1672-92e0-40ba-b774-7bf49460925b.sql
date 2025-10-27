-- Create secure view for parcel_owners that masks PII for non-admin/manager users
CREATE OR REPLACE VIEW public.parcel_owners_view AS
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

-- Grant access to authenticated users to view through the secure view
GRANT SELECT ON public.parcel_owners_view TO authenticated;

-- Comment explaining security design
COMMENT ON VIEW public.parcel_owners_view IS 'Secure view that masks landowner PII (contact_phone, contact_email, contact_address) for non-admin/manager users. Admins and managers see full contact details.';