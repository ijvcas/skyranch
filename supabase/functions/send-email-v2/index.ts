import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { EmailRequestV2 } from './types.ts';
import { EmailValidator } from './validator.ts';
import { PayloadBuilder } from './payloadBuilder.ts';
import { ResponseBuilder } from './responseBuilder.ts';
import { EmailErrorHandler } from './errorHandler.ts';

// Zod schema for runtime validation
const EmailRequestSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(100000),
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

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 [EMAIL V2] Function called');
    console.log('📧 [EMAIL V2] Method:', req.method);
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [EMAIL V2] Missing Authorization header');
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Authorization header required' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ [EMAIL V2] Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'unauthorized', message: 'Invalid authentication token' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ [EMAIL V2] User authenticated: ${user.id}`);

    // Check user is active
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_active) {
      console.error('❌ [EMAIL V2] User not active or not found');
      return new Response(JSON.stringify({ error: 'forbidden', message: 'User account is not active' }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ [EMAIL V2] User role: ${userData.role}, active: ${userData.is_active}`);
    
    // Check if RESEND_API_KEY is available
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('❌ [EMAIL V2] RESEND_API_KEY not found in environment');
      const errorResponse = EmailErrorHandler.createInvalidApiKeyError({ message: 'RESEND_API_KEY not configured' });
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    let requestData: EmailRequestV2;
    try {
      const rawData = await req.json();
      // Validate with Zod for type safety and security
      requestData = EmailRequestSchema.parse(rawData);
    } catch (parseError) {
      console.error('❌ [EMAIL V2] Failed to parse or validate request:', parseError);
      const errorMessage = parseError instanceof z.ZodError 
        ? `Validation failed: ${parseError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        : 'Invalid JSON in request body';
      const errorResponse = EmailErrorHandler.createValidationError(errorMessage, parseError);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    console.log(`📧 [EMAIL V2] Processing email request:`, {
      to: requestData.to,
      subject: requestData.subject?.substring(0, 50) + '...',
      senderName: requestData.senderName,
      organizationName: requestData.organizationName,
      hasMetadata: !!requestData.metadata
    });

    // Validate required fields
    const validation = EmailValidator.validate(requestData);
    if (!validation.isValid) {
      console.error('❌ [EMAIL V2] Validation failed:', validation.errors);
      const errorResponse = EmailErrorHandler.createValidationError(
        `Missing required fields: ${validation.errors.join(', ')}`,
        { 
          to: !!requestData.to, 
          subject: !!requestData.subject, 
          html: !!requestData.html 
        }
      );
      
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Extract domain for debugging
    const recipientDomain = requestData.to.split('@')[1];
    console.log(`📧 [EMAIL V2] Recipient domain: ${recipientDomain}`);

    // Build email payload
    const emailPayload = PayloadBuilder.build(requestData);

    console.log('📧 [EMAIL V2] Sending email with payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      headerCount: Object.keys(emailPayload.headers).length,
      tagCount: emailPayload.tags.length,
      recipientDomain
    });

    console.log('📧 [EMAIL V2] Final tags after deduplication:', emailPayload.tags);

    console.log('📧 [EMAIL V2] About to call Resend API...');
    const emailResponse = await resend.emails.send(emailPayload);
    console.log("📧 [EMAIL V2] Resend API response received:", emailResponse);

    // Handle Resend API errors
    if (emailResponse.error) {
      console.error("❌ [EMAIL V2] Resend API error:", emailResponse.error);
      
      let errorResponse;
      
      // Handle sandbox mode restrictions
      if (emailResponse.error.message?.includes('only send testing emails to your own email') ||
          emailResponse.error.message?.includes('sandbox')) {
        errorResponse = EmailErrorHandler.createSandboxModeError(
          emailResponse.error, 
          requestData.to, 
          recipientDomain
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Handle domain verification errors
      if (emailResponse.error.message?.includes('domain verification') || 
          emailResponse.error.message?.includes('verify a domain')) {
        errorResponse = EmailErrorHandler.createDomainVerificationError(
          emailResponse.error,
          requestData.to,
          recipientDomain
        );
        return new Response(JSON.stringify(errorResponse), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Handle rate limiting
      if (emailResponse.error.message?.includes('rate limit')) {
        errorResponse = EmailErrorHandler.createRateLimitError(emailResponse.error);
        return new Response(JSON.stringify(errorResponse), {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Handle invalid API key
      if (emailResponse.error.message?.includes('API key')) {
        errorResponse = EmailErrorHandler.createInvalidApiKeyError(emailResponse.error);
        return new Response(JSON.stringify(errorResponse), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Generic Resend error
      errorResponse = EmailErrorHandler.createGenericResendError(emailResponse.error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Success case
    if (emailResponse.data) {
      console.log("✅ [EMAIL V2] Email sent successfully:", emailResponse.data);
      console.log("✅ [EMAIL V2] Check your inbox (including spam folder) for email delivery");
      console.log("✅ [EMAIL V2] Also check your Resend dashboard at https://resend.com/emails for delivery status");
      
      // Log email send to audit log
      try {
        await supabase.from('email_audit_log').insert({
          user_id: user.id,
          recipient: requestData.to,
          subject: requestData.subject,
          status: 'success',
          message_id: emailResponse.data.id,
          sender_name: requestData.senderName,
          organization_name: requestData.organizationName
        });
      } catch (auditError) {
        console.error('⚠️ [EMAIL V2] Failed to log email audit:', auditError);
        // Don't fail the request if audit logging fails
      }
      
      const successResponse = ResponseBuilder.buildSuccessResponse(emailResponse.data, recipientDomain);
      
      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Unexpected case - no data and no error
    console.error("❌ [EMAIL V2] Unexpected Resend response - no data and no error");
    const errorResponse = EmailErrorHandler.createUnexpectedResponseError(emailResponse, recipientDomain);
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ [EMAIL V2] Error in send-email-v2 function:", error);
    console.error("❌ [EMAIL V2] Error stack:", error.stack);
    
    // Check if it's a network/connection error
    const isNetworkError = error.name === 'TypeError' && error.message?.includes('fetch');
    
    const errorResponse = isNetworkError 
      ? EmailErrorHandler.createNetworkError(error)
      : EmailErrorHandler.createFunctionError(error);
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
