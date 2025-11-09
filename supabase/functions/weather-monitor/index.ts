import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with weather settings
    const { data: settings } = await supabaseClient
      .from('weather_settings')
      .select('user_id, latitude, longitude');

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const WEATHER_API_KEY = Deno.env.get('GOOGLE_WEATHER_API_KEY');
    const alerts: any[] = [];

    for (const setting of settings) {
      // Fetch current weather
      const weatherRes = await fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${setting.latitude},${setting.longitude}?unitGroup=metric&key=${WEATHER_API_KEY}&contentType=json`
      );

      if (!weatherRes.ok) continue;

      const weatherData = await weatherRes.json();
      const current = weatherData.currentConditions;

      // Get user's automation rules
      const { data: rules } = await supabaseClient
        .from('weather_automation_rules')
        .select('*')
        .eq('user_id', setting.user_id)
        .eq('is_active', true);

      if (!rules) continue;

      // Check each rule
      for (const rule of rules) {
        let shouldTrigger = false;
        let alertMessage = '';
        let severity = 'info';

        if (rule.rule_type === 'temperature') {
          const temp = current.temp;
          if (rule.condition === 'above' && temp > rule.threshold) {
            shouldTrigger = true;
            alertMessage = `High temperature alert: ${temp}°C (threshold: ${rule.threshold}°C)`;
            severity = temp > rule.threshold + 5 ? 'danger' : 'warning';
          } else if (rule.condition === 'below' && temp < rule.threshold) {
            shouldTrigger = true;
            alertMessage = `Low temperature alert: ${temp}°C (threshold: ${rule.threshold}°C)`;
            severity = temp < rule.threshold - 5 ? 'danger' : 'warning';
          }
        } else if (rule.rule_type === 'precipitation') {
          const precip = current.precip || 0;
          if (rule.condition === 'above' && precip > rule.threshold) {
            shouldTrigger = true;
            alertMessage = `Heavy precipitation alert: ${precip}mm (threshold: ${rule.threshold}mm)`;
            severity = precip > rule.threshold * 2 ? 'danger' : 'warning';
          }
        } else if (rule.rule_type === 'wind') {
          const wind = current.windspeed || 0;
          if (rule.condition === 'above' && wind > rule.threshold) {
            shouldTrigger = true;
            alertMessage = `Strong wind alert: ${wind}km/h (threshold: ${rule.threshold}km/h)`;
            severity = wind > rule.threshold * 1.5 ? 'danger' : 'warning';
          }
        }

        if (shouldTrigger) {
          // Create alert
          const { data: alert } = await supabaseClient
            .from('weather_alerts')
            .insert([{
              user_id: setting.user_id,
              alert_type: rule.rule_type,
              severity,
              message: alertMessage,
              weather_data: current
            }])
            .select()
            .single();

          alerts.push(alert);

          // Execute actions based on rule config
          if (rule.action_type === 'create_task') {
            const taskConfig = rule.action_config as any;
            await supabaseClient
              .from('tasks')
              .insert([{
                user_id: setting.user_id,
                title: taskConfig.title || alertMessage,
                description: taskConfig.description || `Auto-generated from weather alert: ${alertMessage}`,
                task_type: taskConfig.task_type || 'custom',
                priority: severity === 'danger' ? 'urgent' : 'high',
                status: 'pending',
                due_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                metadata: { auto_generated: true, weather_alert: true }
              }]);
          }

          // Create notification
          await supabaseClient
            .from('notifications')
            .insert([{
              user_id: setting.user_id,
              title: 'Weather Alert',
              message: alertMessage,
              type: 'weather',
              priority: severity === 'danger' ? 'high' : 'medium',
              read: false
            }]);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alerts.length,
        alerts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Weather monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
