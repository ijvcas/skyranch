import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🤖 AI Chat function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Parsing request body...');
    const { message } = await req.json();
    console.log('📝 Message received:', message);
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get AI settings
    console.log('⚙️ Fetching AI settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('❌ Error fetching AI settings:', settingsError);
      // Continue with defaults even if settings fetch fails
    }
    console.log('✅ Settings loaded:', settings ? 'found' : 'using defaults');

    const aiProvider = settings?.ai_provider || 'lovable';
    const defaultPrompt = `Eres un asistente experto en gestión de ranchos ganaderos. 

Cuando tengas acceso a información meteorológica, proporciona advertencias y recomendaciones específicas sobre:
- Impacto de condiciones climáticas extremas (calor, frío, lluvia, viento) en el ganado
- Precauciones necesarias según el clima actual (refugio, agua adicional, protección)
- Riesgos de enfermedades asociados al clima (estrés térmico, hipotermia, enfermedades respiratorias)
- Ajustes recomendados en el manejo de pastoreo según las condiciones meteorológicas
- Preparación anticipada para eventos climáticos significativos

Siempre que menciones el clima, incluye recomendaciones prácticas y accionables para proteger la salud y bienestar de los animales.`;
    
    const systemPrompt = settings?.system_prompt || defaultPrompt;
    const enableAnimalContext = settings?.enable_animal_context ?? true;
    const enableBreedingContext = settings?.enable_breeding_context ?? true;
    const enableLotsContext = settings?.enable_lots_context ?? true;
    const enableWeatherContext = settings?.enable_weather_context ?? true;

    // Build context based on settings
    let contextData: any = {};

    if (enableAnimalContext) {
      const { data: animals } = await supabase
        .from('animals')
        .select('species, count')
        .eq('user_id', user.id)
        .eq('lifecycle_status', 'active');
      
      if (animals) {
        contextData.animals = {
          total: animals.length,
          bySpecies: animals.reduce((acc: any, a: any) => {
            acc[a.species] = (acc[a.species] || 0) + 1;
            return acc;
          }, {}),
        };
      }
    }

    if (enableBreedingContext) {
      const { data: breeding } = await supabase
        .from('breeding_records')
        .select('status, count')
        .eq('user_id', user.id);
      
      if (breeding) {
        contextData.breeding = {
          total: breeding.length,
          active: breeding.filter((b: any) => b.status === 'confirmed').length,
        };
      }
    }

    if (enableLotsContext) {
      const { data: lots } = await supabase
        .from('lots')
        .select('status, count')
        .eq('user_id', user.id);
      
      if (lots) {
        contextData.lots = {
          total: lots.length,
          active: lots.filter((l: any) => l.status === 'active').length,
        };
      }
    }

    if (enableWeatherContext) {
      console.log('🌤️ Fetching weather context...');
      
      try {
        // Get weather settings (location) with timeout
        const weatherSettingsPromise = supabase
          .from('weather_settings')
          .select('lat, lng, display_name')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Weather settings timeout')), 3000)
        );

        const { data: weatherSettings } = await Promise.race([weatherSettingsPromise, timeout]) as any;

        if (weatherSettings?.lat && weatherSettings?.lng) {
          // Call weather-current edge function with timeout
          const weatherPromise = fetch(`${supabaseUrl}/functions/v1/weather-current`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lat: weatherSettings.lat,
              lng: weatherSettings.lng,
              language: 'es',
              unitSystem: 'metric'
            }),
          });

          const weatherTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Weather API timeout')), 5000)
          );

          const weatherResponse = await Promise.race([weatherPromise, weatherTimeout]) as Response;

          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            contextData.weather = {
              location: weatherSettings.display_name,
              coordinates: { lat: weatherSettings.lat, lng: weatherSettings.lng },
              current: {
                temperature: weatherData.temperatureC ? `${weatherData.temperatureC}°C` : null,
                condition: weatherData.conditionText,
                humidity: weatherData.humidity ? `${weatherData.humidity}%` : null,
                wind: weatherData.windKph ? `${weatherData.windKph} km/h` : null,
                precipitation: weatherData.precipitationChance ? `${weatherData.precipitationChance}%` : null,
              },
            };
            console.log('✅ Weather context added');
          } else {
            console.log('⚠️ Weather API non-OK status, continuing without weather');
          }
        }
      } catch (weatherError) {
        console.log('⚠️ Weather context skipped:', weatherError.message);
        // Continue without weather - don't block AI chat
      }
    }

    // Prepare messages for AI
    const messages = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nContexto del rancho del usuario:\n${JSON.stringify(contextData, null, 2)}`,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // Call OpenAI
    console.log('🔑 Checking for OPENAI_API_KEY...');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ API key found, calling OpenAI...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OpenAI API error:', aiResponse.status, errorText);
      
      let errorMessage = 'Error del servicio de OpenAI';
      if (aiResponse.status === 429) {
        errorMessage = 'Límite de solicitudes de OpenAI excedido. Por favor, intenta más tarde.';
      } else if (aiResponse.status === 402) {
        errorMessage = 'Se requiere pago en OpenAI para continuar.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: errorText }),
        { status: aiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ AI response received');
    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || 'No response from AI';
    console.log('📤 Sending response back to client');

    return new Response(
      JSON.stringify({
        response: responseText,
        metadata: {
          model: aiData.model,
          provider: aiProvider,
          contextIncluded: Object.keys(contextData),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error in ai-chat function:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
