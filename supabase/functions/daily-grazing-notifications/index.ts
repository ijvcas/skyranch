import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrazingNotification {
  lotId: string;
  lotName: string;
  currentAnimalsCount: number;
  expectedExitDate: string;
  daysUntilExit: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Starting daily grazing notifications check...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all lots with animals that need exit notifications (1 day before suggested exit)
    const { data: lotsWithAnimals, error: lotsError } = await supabase
      .from('lots')
      .select(`
        id,
        name,
        user_id,
        capacity,
        max_grazing_days,
        animal_lot_assignments!inner(
          id,
          animal_id,
          assigned_date,
          removed_date
        )
      `)
      .is('animal_lot_assignments.removed_date', null);

    if (lotsError) {
      console.error('❌ Error fetching lots with animals:', lotsError);
      throw lotsError;
    }

    console.log(`📊 Found ${lotsWithAnimals?.length || 0} lots with animals`);

    const notificationsToSend: GrazingNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const lot of lotsWithAnimals || []) {
      const assignments = lot.animal_lot_assignments || [];
      if (assignments.length === 0) continue;

      // Get earliest assignment date for this lot
      const earliestAssignment = assignments.reduce((earliest, current) => {
        const currentDate = new Date(current.assigned_date);
        const earliestDate = new Date(earliest.assigned_date);
        return currentDate < earliestDate ? current : earliest;
      });

      const entryDate = new Date(earliestAssignment.assigned_date);
      entryDate.setHours(0, 0, 0, 0);

      // Calculate expected exit date (entry date + max grazing days)
      const maxGrazingDays = lot.max_grazing_days || 15;
      const expectedExitDate = new Date(entryDate);
      expectedExitDate.setDate(expectedExitDate.getDate() + maxGrazingDays);

      // Calculate days until exit
      const timeDiff = expectedExitDate.getTime() - today.getTime();
      const daysUntilExit = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Send notification 1 day before exit
      if (daysUntilExit === 1) {
        notificationsToSend.push({
          lotId: lot.id,
          lotName: lot.name,
          currentAnimalsCount: assignments.length,
          expectedExitDate: expectedExitDate.toISOString().split('T')[0],
          daysUntilExit
        });
      }
    }

    console.log(`🔔 ${notificationsToSend.length} lots need exit notifications`);

    // Send notifications to all active users
    const { data: activeUsers, error: usersError } = await supabase
      .from('app_users')
      .select('id, email, name')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching active users:', usersError);
      throw usersError;
    }

    console.log(`👥 Found ${activeUsers?.length || 0} active users`);

    let notificationsSent = 0;

    for (const notification of notificationsToSend) {
      for (const user of activeUsers || []) {
        try {
          // Create in-app notification
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'grazing_exit_reminder',
              priority: 'high',
              title: 'Rotación de Lote Próxima',
              message: `El lote "${notification.lotName}" con ${notification.currentAnimalsCount} animales debe rotar mañana (${new Date(notification.expectedExitDate).toLocaleDateString()}).`,
              action_required: true,
              metadata: {
                lot_id: notification.lotId,
                lot_name: notification.lotName,
                animals_count: notification.currentAnimalsCount,
                expected_exit_date: notification.expectedExitDate,
                days_until_exit: notification.daysUntilExit
              }
            });

          if (notifError) {
            console.error(`❌ Error creating notification for user ${user.id}:`, notifError);
          } else {
            notificationsSent++;
            console.log(`✅ Notification sent to user ${user.email} for lot ${notification.lotName}`);
          }

          // Send browser push notification
          try {
            const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: user.id,
                title: 'Rotación de Lote Próxima',
                body: `El lote "${notification.lotName}" debe rotar mañana.`
              }
            });

            if (pushError) {
              console.error(`❌ Error sending push notification to user ${user.id}:`, pushError);
            } else {
              console.log(`📱 Push notification sent to user ${user.email}`);
            }
          } catch (pushError) {
            console.error(`❌ Error in push notification for user ${user.id}:`, pushError);
          }

        } catch (error) {
          console.error(`❌ Error processing notification for user ${user.id}:`, error);
        }
      }
    }

    const result = {
      success: true,
      lotsChecked: lotsWithAnimals?.length || 0,
      notificationsRequired: notificationsToSend.length,
      notificationsSent,
      activeUsers: activeUsers?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Daily grazing notifications completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in daily grazing notifications:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);