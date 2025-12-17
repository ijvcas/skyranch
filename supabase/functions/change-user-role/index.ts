import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify current user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
    
    if (!adminRole) {
      throw new Error('Only admins can change user roles')
    }

    const { targetUserId, newRole } = await req.json()

    // Validate inputs
    if (!['admin', 'manager', 'worker'].includes(newRole)) {
      throw new Error('Invalid role')
    }

    // Prevent removing admin from themselves
    if (targetUserId === user.id && newRole !== 'admin') {
      throw new Error('Cannot remove admin role from yourself')
    }

    // Remove all existing roles for the user
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId)

    // Add new role to user_roles table
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUserId,
        role: newRole,
        assigned_by: user.id
      })

    if (insertError) throw insertError

    // Also update app_users.role for consistency
    const { error: updateError } = await supabase
      .from('app_users')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Error updating app_users role:', updateError)
    }

    // Log the role change
    console.log(`Role changed: ${targetUserId} -> ${newRole} by ${user.id}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
