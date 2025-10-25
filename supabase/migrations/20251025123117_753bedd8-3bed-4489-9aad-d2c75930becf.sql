-- Fix 1: Create role-based view for animal_sales to restrict buyer PII access
-- Only admin/manager roles can see full buyer contact details

CREATE OR REPLACE VIEW animal_sales_view AS
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

-- Grant access to the view for authenticated users
GRANT SELECT ON animal_sales_view TO authenticated;

-- Add helpful comment
COMMENT ON VIEW animal_sales_view IS 'Role-based view that masks buyer PII (contact, email, notes) for worker role. Only admin/manager can see full contact details.';