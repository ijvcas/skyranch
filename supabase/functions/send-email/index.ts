
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for runtime validation
const EmailRequestSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(100000),
  senderName: z.string().max(100).optional(),
  organizationName: z.string().max(100).optional()
});

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  senderName?: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Email function called');
    
    // Parse and validate request with Zod
    let requestData: EmailRequest;
    try {
      const rawData = await req.json();
      requestData = EmailRequestSchema.parse(rawData);
    } catch (validationError) {
      console.error('❌ Validation failed:', validationError);
      const errorMessage = validationError instanceof z.ZodError
        ? `Validation failed: ${validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        : 'Invalid request data';
      return new Response(
        JSON.stringify({ 
          error: 'validation_error',
          message: errorMessage
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const { to, subject, html, senderName, organizationName } = requestData;
    console.log(`📧 Sending email to: ${to}, subject: ${subject}`);

    // Use verified skyranch.es domain
    const fromEmail = "noreply@skyranch.es";

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
      headers: {
        'X-Entity-Ref-ID': 'skyranch-sistema-ganadero',
        'Organization': organizationName || 'SkyRanch',
        'X-Mailer': 'SkyRanch Sistema de Gestión Ganadera'
      },
      tags: [
        {
          name: 'category',
          value: 'notification'
        },
        {
          name: 'sender',
          value: 'skyranch'
        }
      ]
    });

    console.log("📧 Resend response:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("❌ Resend API error:", emailResponse.error);
      
      return new Response(
        JSON.stringify({ 
          error: "resend_api_error",
          message: emailResponse.error.message || "Email service error",
          details: emailResponse.error
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Success case
    if (emailResponse.data) {
      console.log("✅ Email sent successfully:", emailResponse.data);
      return new Response(JSON.stringify(emailResponse.data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Unexpected case - no data and no error
    console.error("❌ Unexpected Resend response - no data and no error");
    return new Response(
      JSON.stringify({ error: "unexpected_response", message: "Unexpected email service response" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ Error in send-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "function_error",
        message: error.message || "Internal server error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
