-- Create email audit log table for tracking email sends (security compliance)
CREATE TABLE IF NOT EXISTS public.email_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'success',
  message_id TEXT,
  sender_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.email_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (for compliance and security review)
CREATE POLICY "Admins can view email audit logs"
ON public.email_audit_log
FOR SELECT
USING (get_current_app_role() = 'admin');

-- System can insert audit logs (edge function uses service role or authenticated context)
CREATE POLICY "System can insert email audit logs"
ON public.email_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_email_audit_log_user_id ON public.email_audit_log(user_id);
CREATE INDEX idx_email_audit_log_sent_at ON public.email_audit_log(sent_at DESC);

COMMENT ON TABLE public.email_audit_log IS 'Audit trail for all emails sent through the system for security and compliance tracking';