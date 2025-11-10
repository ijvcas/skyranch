import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Translation mappings for existing Spanish notifications
const translations = {
  es: {
    'Evento programado:': 'Evento programado:',
    'Tienes un evento programado': 'Tienes un evento programado',
    'Recordatorio de salud:': 'Recordatorio de salud:',
    'Actualización de reproducción': 'Actualización de reproducción',
    'tiene': 'tiene',
    'programado para': 'programado para',
    'Se ha registrado': 'Se ha registrado',
    'para': 'para',
    'El cruzamiento entre': 'El cruzamiento entre',
    'está': 'está'
  },
  en: {
    'Evento programado:': 'Scheduled Event:',
    'Tienes un evento programado': 'You have a scheduled event',
    'Recordatorio de salud:': 'Health Reminder:',
    'Actualización de reproducción': 'Breeding Update',
    'tiene': 'has',
    'programado para': 'scheduled for',
    'Se ha registrado': 'Has been recorded',
    'para': 'for',
    'El cruzamiento entre': 'The breeding between',
    'está': 'is'
  },
  pt: {
    'Evento programado:': 'Evento Agendado:',
    'Tienes un evento programado': 'Você tem um evento agendado',
    'Recordatorio de salud:': 'Lembrete de Saúde:',
    'Actualización de reproducción': 'Atualização de Reprodução',
    'tiene': 'tem',
    'programado para': 'agendado para',
    'Se ha registrado': 'Foi registrado',
    'para': 'para',
    'El cruzamiento entre': 'O cruzamento entre',
    'está': 'está'
  },
  fr: {
    'Evento programado:': 'Événement Programmé:',
    'Tienes un evento programado': 'Vous avez un événement programmé',
    'Recordatorio de salud:': 'Rappel de Santé:',
    'Actualización de reproducción': 'Mise à Jour de Reproduction',
    'tiene': 'a',
    'programado para': 'programmé pour',
    'Se ha registrado': 'A été enregistré',
    'para': 'pour',
    'El cruzamiento entre': 'L\'accouplement entre',
    'está': 'est'
  }
};

const translateText = (text: string, fromLang: string, toLang: string): string => {
  if (fromLang === toLang) return text;
  
  const sourceDict = translations[fromLang as keyof typeof translations];
  const targetDict = translations[toLang as keyof typeof translations];
  
  if (!sourceDict || !targetDict) return text;
  
  let translated = text;
  Object.keys(sourceDict).forEach(key => {
    if (text.includes(key)) {
      const targetKey = key as keyof typeof sourceDict;
      translated = translated.replace(new RegExp(key, 'g'), targetDict[targetKey]);
    }
  });
  
  return translated;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [NOTIFICATION MIGRATION] Starting migration...');
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: userData } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ [NOTIFICATION MIGRATION] Admin verified');

    // Get all users with their language preferences
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('id, preferred_language');

    if (usersError) {
      throw usersError;
    }

    console.log(`📊 [NOTIFICATION MIGRATION] Found ${users?.length || 0} users`);

    // Get all notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*');

    if (notificationsError) {
      throw notificationsError;
    }

    console.log(`📬 [NOTIFICATION MIGRATION] Found ${notifications?.length || 0} notifications`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each notification based on user's language preference
    for (const notification of notifications || []) {
      try {
        const user = users?.find(u => u.id === notification.user_id);
        const userLanguage = user?.preferred_language || 'es';
        
        // Only translate if not already in target language
        if (userLanguage !== 'es') {
          const translatedTitle = translateText(notification.title, 'es', userLanguage);
          const translatedMessage = translateText(notification.message, 'es', userLanguage);
          
          const { error: updateError } = await supabase
            .from('notifications')
            .update({
              title: translatedTitle,
              message: translatedMessage
            })
            .eq('id', notification.id);

          if (updateError) {
            console.error(`❌ Error updating notification ${notification.id}:`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Updated notification ${notification.id} to ${userLanguage}`);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ [NOTIFICATION MIGRATION] Migration complete: ${updatedCount} updated, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        errors: errorCount,
        total: notifications?.length || 0
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('❌ [NOTIFICATION MIGRATION] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
