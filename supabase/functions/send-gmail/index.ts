
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Schema validation for input security
const GmailRequestSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(998),
  html: z.string().max(10 * 1024 * 1024), // 10MB limit
  accessToken: z.string().optional(),
  senderName: z.string().max(100).optional(),
  organizationName: z.string().max(100).optional(),
  metadata: z.object({
    tags: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional(),
    headers: z.record(z.string()).optional()
  }).optional()
});

type GmailRequest = z.infer<typeof GmailRequestSchema>;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 [GMAIL SKYRANCH] Function called');
    
    // 🔒 SECURITY: Verify authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [GMAIL SKYRANCH] No authorization header provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'authentication_required',
        message: 'Authentication required to send emails'
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ [GMAIL SKYRANCH] Authentication failed:', authError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'invalid_authentication',
        message: 'Invalid authentication credentials'
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ [GMAIL SKYRANCH] Authenticated user: ${user.id}`);

    // 🔒 SECURITY: Check user role - only admin/manager can send emails
    const { data: userRole, error: roleError } = await supabase
      .from('app_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (roleError || !userRole || !userRole.is_active) {
      console.error('❌ [GMAIL SKYRANCH] Failed to fetch user role:', roleError?.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'user_not_found',
        message: 'User not found or inactive'
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!['admin', 'manager'].includes(userRole.role)) {
      console.error(`❌ [GMAIL SKYRANCH] Insufficient permissions. User role: ${userRole.role}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'insufficient_permissions',
        message: 'Only admin and manager roles can send emails'
      }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ [GMAIL SKYRANCH] User has ${userRole.role} role - permission granted`);
    
    // Parse and validate request data with Zod
    let requestData: GmailRequest;
    try {
      const rawData = await req.json();
      requestData = GmailRequestSchema.parse(rawData);
    } catch (parseError) {
      console.error('❌ [GMAIL SKYRANCH] Request validation failed:', parseError);
      
      if (parseError instanceof z.ZodError) {
        return new Response(JSON.stringify({
          success: false,
          error: 'validation_error',
          message: 'Invalid request data',
          details: parseError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      return new Response(JSON.stringify({
        success: false,
        error: 'invalid_json',
        message: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('📧 [GMAIL SKYRANCH] Request data received:', {
      to: requestData.to,
      subject: requestData.subject?.substring(0, 50),
      hasHtml: !!requestData.html,
      hasAccessToken: !!requestData.accessToken,
      senderName: requestData.senderName,
      organizationName: requestData.organizationName
    });

    // Validate required fields
    if (!requestData.to || !requestData.subject || !requestData.html) {
      console.error('❌ [GMAIL SKYRANCH] Missing required fields:', {
        hasTo: !!requestData.to,
        hasSubject: !!requestData.subject,
        hasHtml: !!requestData.html
      });
      return new Response(JSON.stringify({
        success: false,
        error: 'missing_required_fields',
        message: 'Missing required fields: to, subject, and html are required'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if we have an access token for Gmail API
    if (!requestData.accessToken) {
      console.error('❌ [GMAIL SKYRANCH] No access token provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'no_access_token',
        message: 'Gmail access token is required for sending emails'
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare Gmail API request
    const emailMessage = [
      `To: ${requestData.to}`,
      `Subject: ${requestData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      requestData.html
    ].join('\r\n');

    // Encode the email message in base64url format
    const encodedMessage = btoa(emailMessage)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    console.log('📧 [GMAIL SKYRANCH] Calling Gmail API...');

    // Call Gmail API to send the email
    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${requestData.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    const gmailData = await gmailResponse.json();

    console.log('📧 [GMAIL SKYRANCH] Gmail API response:', {
      status: gmailResponse.status,
      success: gmailResponse.ok,
      messageId: gmailData.id,
      threadId: gmailData.threadId
    });

    if (!gmailResponse.ok) {
      console.error('❌ [GMAIL SKYRANCH] Gmail API error:', gmailData);
      return new Response(JSON.stringify({
        success: false,
        error: 'gmail_api_error',
        message: gmailData.error?.message || 'Failed to send email via Gmail API',
        details: gmailData.error
      }), {
        status: gmailResponse.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ [GMAIL SKYRANCH] Email sent successfully via Gmail API');

    // 📝 AUDIT: Log email send for compliance and security tracking
    try {
      const { error: auditError } = await supabase
        .from('email_audit_log')
        .insert({
          user_id: user.id,
          recipient: requestData.to,
          subject: requestData.subject,
          sent_at: new Date().toISOString(),
          status: 'success',
          message_id: gmailData.id,
          sender_name: requestData.senderName || 'SkyRanch',
          organization_name: requestData.organizationName || 'SkyRanch'
        });
      
      if (auditError) {
        console.warn('⚠️ [GMAIL SKYRANCH] Failed to log audit trail:', auditError.message);
        // Don't fail the request if audit logging fails
      } else {
        console.log('✅ [GMAIL SKYRANCH] Audit log recorded');
      }
    } catch (auditErr) {
      console.warn('⚠️ [GMAIL SKYRANCH] Audit logging exception:', auditErr);
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: gmailData.id,
      threadId: gmailData.threadId,
      details: {
        recipient: requestData.to,
        subject: requestData.subject,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [GMAIL SKYRANCH] Unexpected error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: 'internal_error',
      message: `Internal server error: ${error.message}`,
      details: { errorType: error.name }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
