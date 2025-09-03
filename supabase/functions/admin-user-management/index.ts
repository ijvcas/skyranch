import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Client for user authentication check (with user token)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Admin client for admin operations (with service role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated and get their role
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseUser
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      console.error('Admin authorization failed:', roleError);
      await supabaseUser
        .from('user_role_audit')
        .insert({
          user_id: user.id,
          changed_by: user.id,
          old_role: 'unauthorized_access_attempt',
          new_role: 'admin_function_blocked',
          reason: 'Non-admin user attempted admin operation',
          metadata: {
            operation: 'admin-user-management',
            timestamp: new Date().toISOString(),
            ip: req.headers.get('x-forwarded-for') || 'unknown'
          }
        });

      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, email, newPassword } = await req.json();

    console.log(`Admin ${user.email} performing action: ${action} for user: ${email}`);

    switch (action) {
      case 'force_password_update': {
        if (!email || !newPassword) {
          return new Response(
            JSON.stringify({ error: 'Email and newPassword required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find user by email using admin API
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Error listing users:', listError);
          return new Response(
            JSON.stringify({ error: 'Failed to find user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const targetUser = users?.find((u: any) => u.email === email);
        if (!targetUser) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
          password: newPassword
        });

        if (updateError) {
          console.error('Password update failed:', updateError);
          return new Response(
            JSON.stringify({ error: 'Password update failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Log the admin operation
        await supabaseUser
          .from('user_role_audit')
          .insert({
            user_id: targetUser.id,
            changed_by: user.id,
            old_role: 'password_force_update',
            new_role: 'password_updated',
            reason: 'Admin forced password update',
            metadata: {
              operation: 'force_password_update',
              admin_user: user.email,
              target_user: email,
              timestamp: new Date().toISOString(),
              ip: req.headers.get('x-forwarded-for') || 'unknown'
            }
          });

        console.log(`Password successfully updated for ${email} by admin ${user.email}`);
        
        return new Response(
          JSON.stringify({ success: true, message: 'Password updated successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Admin user management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});