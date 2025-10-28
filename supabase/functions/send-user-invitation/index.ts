import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { email, role, invitedBy } = await req.json();
    
    if (!email || !role || !invitedBy) {
      throw new Error('Missing required fields: email, role, or invitedBy');
    }

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Get farm name
    const { data: farmProfile } = await supabaseClient
      .from('farm_profiles')
      .select('farm_name')
      .single();
    
    // Get inviter name
    const { data: inviter } = await supabaseClient
      .from('app_users')
      .select('name')
      .eq('id', invitedBy)
      .single();
    
    // Store invitation
    const { error: inviteError } = await supabaseClient
      .from('user_invitations')
      .insert({
        email,
        role,
        invited_by: invitedBy,
        invitation_token: token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (inviteError) {
      throw inviteError;
    }
    
    // Send email via Resend
    const invitationLink = `${Deno.env.get('SUPABASE_URL')?.replace('https://ahwhtxygyzoadsmdrwwg.supabase.co', 'https://skyranch.lovable.app')}/accept-invitation/${token}`;
    
    const roleLabels = {
      'worker': 'Trabajador',
      'manager': 'Encargado',
      'admin': 'Administrador'
    };

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FARMIKA <noreply@skyranch.es>',
        to: email,
        subject: `Invitación a ${farmProfile?.farm_name || 'FARMIKA'}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">FARMIKA</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #16a34a; margin-top: 0;">Has sido invitado a ${farmProfile?.farm_name || 'una finca'}</h2>
                
                <p style="font-size: 16px; color: #555;">
                  <strong>${inviter?.name || 'El administrador'}</strong> te ha invitado a unirte a su equipo de gestión de finca en FARMIKA.
                </p>
                
                <div style="background: white; padding: 20px; border-left: 4px solid #16a34a; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #666;">Tu rol asignado:</p>
                  <p style="margin: 5px 0 0 0; font-size: 18px; color: #16a34a; font-weight: bold;">
                    ${roleLabels[role as keyof typeof roleLabels] || role}
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Aceptar Invitación
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  O copia este enlace en tu navegador:<br>
                  <a href="${invitationLink}" style="color: #16a34a; word-break: break-all;">${invitationLink}</a>
                </p>
                
                <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  Esta invitación expira en 7 días. Si no solicitaste esta invitación, puedes ignorar este correo.
                </p>
              </div>
            </body>
          </html>
        `
      })
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully',
        invitationLink 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
