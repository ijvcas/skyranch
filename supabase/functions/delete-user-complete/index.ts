
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Resolve env vars once and validate
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL secret')
    if (!SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY secret')
    if (!ANON_KEY) throw new Error('Missing SUPABASE_ANON_KEY secret')

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Create client for auth token inspection only
    const supabase = createClient(
      SUPABASE_URL,
      ANON_KEY
    )

    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log(`🗑️ Starting complete deletion for user: ${userId}`)

    // Get current authenticated user to verify permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !currentUser) {
      throw new Error('Authentication failed')
    }

    // Verify current user is admin
    const { data: currentAppUser, error: roleError } = await supabaseAdmin
      .from('app_users')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (roleError || currentAppUser?.role !== 'admin') {
      throw new Error('Only admin users can delete other users')
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      throw new Error('Cannot delete your own account')
    }

    console.log(`✅ Admin verification passed for user: ${currentUser.id}`)

    // Step 1: Delete from app_users table first
    const { error: appUserError } = await supabaseAdmin
      .from('app_users')
      .delete()
      .eq('id', userId)

    if (appUserError) {
      console.error('❌ Error deleting from app_users:', appUserError)
      throw new Error(`Failed to delete from app_users: ${appUserError.message}`)
    }

    console.log('✅ Deleted from app_users table')

    // Step 2: Delete from auth.users using admin client
    const { error: authUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authUserError) {
      console.error('❌ Error deleting from auth.users:', authUserError)
      
      // If auth deletion fails, we should log it but not fail completely
      // since the user is already removed from app_users
      console.log('⚠️ Auth user deletion failed, but app_users deletion succeeded')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'User removed from app but auth deletion failed. User may reappear on next sync.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log('✅ Deleted from auth.users table')
    console.log(`🎉 Complete deletion successful for user: ${userId}`)

    return new Response(
      JSON.stringify({ success: true, message: 'User completely deleted' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Complete user deletion error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
