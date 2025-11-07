import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId, receiptData } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: 'Missing transaction ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: In production, validate receipt with Apple's App Store Server API
    // https://developer.apple.com/documentation/appstoreserverapi
    // For now, we'll accept the transaction and update the database
    
    // Determine tier based on product ID (extracted from receipt)
    let tier: 'pro' | 'team' = 'pro';
    let expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // Monthly subscription
    
    // Update or create subscription
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        tier,
        status: 'active',
        apple_transaction_id: transactionId,
        expires_at: expiresAt.toISOString(),
        auto_renew_status: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error updating subscription:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        tier,
        expiresAt: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Receipt validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/* Edge Function Notes:
 * 
 * IMPORTANT: This is a placeholder implementation for Apple IAP receipt validation.
 * 
 * For production, you MUST:
 * 1. Integrate with Apple's App Store Server API
 * 2. Validate receipt signatures
 * 3. Check transaction dates and expiration
 * 4. Handle subscription renewals, cancellations, refunds
 * 5. Implement proper error handling for all edge cases
 * 6. Add webhook endpoint for App Store Server Notifications
 * 
 * Apple Documentation:
 * - App Store Server API: https://developer.apple.com/documentation/appstoreserverapi
 * - Server Notifications: https://developer.apple.com/documentation/appstoreservernotifications
 * 
 * Security considerations:
 * - Never trust client-provided data without validation
 * - Always verify receipts with Apple's servers
 * - Use HTTPS only
 * - Implement rate limiting
 */
