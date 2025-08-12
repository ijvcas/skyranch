
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

    // Pre-step: Clear FK references that may block auth deletion
    try {
      console.log('🔗 Clearing FK references to auth.users (app_version.created_by)...')
      const { error: fkErr } = await supabaseAdmin
        .from('app_version')
        .update({ created_by: null })
        .eq('created_by', userId)
      if (fkErr) {
        console.warn('⚠️ Could not clear app_version.created_by FK:', fkErr)
      } else {
        console.log('✅ Cleared app_version.created_by references (if any)')
      }
    } catch (fkCatchErr) {
      console.warn('⚠️ Exception clearing FK references:', fkCatchErr)
    }

    // Step 1: Delete from auth.users FIRST using admin client
    console.log('🧹 Deleting from auth.users first...')
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('❌ Error deleting from auth.users:', authDeleteError)
      const msg = (authDeleteError as any)?.message?.toString().toLowerCase() || ''
      const status = (authDeleteError as any)?.status
      // Treat "not found" as already deleted; proceed with app cleanup
      const notFound = status === 404 || msg.includes('not found') || msg.includes('no user')
      if (!notFound) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Auth deletion failed: ${(authDeleteError as any)?.message || 'Unknown error'}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      console.log('ℹ️ Auth user not found; proceeding with application cleanup')
    }

    // Step 2: Clean up user-specific artifacts in app schema (no farm-owned data)
    const counts: Record<string, number> = {}
    const warnings: string[] = []

    const deleteAndCount = async (table: string, filter: Record<string, any>) => {
      const { data, error } = await supabaseAdmin
        .from(table)
        .delete()
        .match(filter)
        .select('id')
      if (error) {
        console.warn(`⚠️ Error deleting from ${table}:`, error)
        warnings.push(`${table}: ${error.message}`)
        return 0
      }
      return (data?.length ?? 0)
    }

    // Delete direct user-owned records
    counts.user_connection_logs = await deleteAndCount('user_connection_logs', { user_id: userId })
    counts.notifications = await deleteAndCount('notifications', { user_id: userId })
    counts.reports = await deleteAndCount('reports', { user_id: userId })
    counts.backup_metadata = await deleteAndCount('backup_metadata', { user_id: userId })

    // Calendar events and related notifications
    console.log('🧹 Deleting calendar events and related notifications...')
    const { data: userEvents, error: eventsQueryErr } = await supabaseAdmin
      .from('calendar_events')
      .select('id')
      .eq('user_id', userId)
    if (eventsQueryErr) {
      console.warn('⚠️ Error fetching calendar events:', eventsQueryErr)
      warnings.push(`calendar_events(select): ${eventsQueryErr.message}`)
    } else {
      const eventIds = (userEvents ?? []).map((e: any) => e.id)
      if (eventIds.length > 0) {
        const { data: enDeleted, error: enErr } = await supabaseAdmin
          .from('event_notifications')
          .delete()
          .in('event_id', eventIds)
          .select('id')
        if (enErr) {
          console.warn('⚠️ Error deleting related event_notifications:', enErr)
          warnings.push(`event_notifications(by event_id): ${enErr.message}`)
          counts.event_notifications_related = 0
        } else {
          counts.event_notifications_related = enDeleted?.length ?? 0
        }
      }
    }
    // Also delete event notifications directly tied to the user
    counts.event_notifications_user = await deleteAndCount('event_notifications', { user_id: userId })

    // Delete calendar events themselves
    counts.calendar_events = await deleteAndCount('calendar_events', { user_id: userId })

    // Step 3: Delete profile and app_user last
    console.log('🧹 Deleting profile and app_user...')
    counts.profiles = await deleteAndCount('profiles', { id: userId })
    counts.app_users = await deleteAndCount('app_users', { id: userId })

    console.log('✅ Cleanup completed for user:', userId, counts)

    const payload: Record<string, any> = {
      success: true,
      message: 'User completely deleted',
      counts,
    }
    if (warnings.length > 0) {
      payload.warning = warnings.join(' | ')
    }

    return new Response(
      JSON.stringify(payload),
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
