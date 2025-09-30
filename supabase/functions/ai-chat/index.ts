import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
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
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
    }

    const aiProvider = settings?.ai_provider || 'lovable';
    const systemPrompt = settings?.system_prompt || 'Eres un asistente experto en gestión de ranchos ganaderos.';
    const enableAnimalContext = settings?.enable_animal_context ?? true;
    const enableBreedingContext = settings?.enable_breeding_context ?? true;
    const enableLotsContext = settings?.enable_lots_context ?? true;

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

    // Call Lovable AI (default)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || 'No response from AI';

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
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
