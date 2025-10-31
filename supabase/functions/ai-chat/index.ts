import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema validation for input security
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(50000), // 50K character limit
});

serve(async (req) => {
  console.log('🤖 AI Chat - Simple ChatGPT-like assistant');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request
    let message: string;
    let file: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const rawMessage = formData.get('message') as string;
      file = formData.get('file') as File;
      
      // Validate message with Zod
      try {
        const validated = ChatRequestSchema.parse({ message: rawMessage });
        message = validated.message;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation error',
              details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw validationError;
      }
    } else {
      try {
        const body = await req.json();
        const validated = ChatRequestSchema.parse(body);
        message = validated.message;
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation error',
              details: validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw validationError;
      }
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Process file if uploaded (for vision/document analysis)
    let fileContent: any = null;
    if (file) {
      console.log('📎 File uploaded:', file.name, file.type);
      
      if (file.type.startsWith('image/')) {
        // Convert image to base64 for vision analysis
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64 = btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
        fileContent = {
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`
          }
        };
        console.log('🖼️ Image prepared for vision analysis');
      } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        // Extract text from document
        const text = await file.text();
        message = `${message}\n\nDocumento adjunto (${file.name}):\n${text}`;
        console.log('📄 Text extracted from document');
      }
    }

    // Get conversation history (last 30 messages for context)
    const { data: history } = await supabase
      .from('chat_history')
      .select('role, message')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    // Build messages array
    const conversationHistory = (history || []).reverse().map(h => ({
      role: h.role,
      content: h.message
    }));

    // Enhanced system prompt with tool access
    const systemPrompt = `You are a versatile AI assistant for Skyranch farm management system, without topic restrictions.

Available capabilities:
- Answer any question on any topic
- Analyze images (photos, diagrams, documents, screenshots)
- Process and analyze documents (PDF, text, data)
- Get REAL-TIME WEATHER data for any location
- Geocode locations (convert addresses to coordinates)
- Provide detailed contextual analysis

Tools at your disposal:
- get_current_weather: Get live weather conditions (temperature, humidity, wind, precipitation) for any location
- geocode_location: Convert location names/addresses to coordinates
- web_search: Search for current information (placeholder for now)

When users ask about weather, climate, or location data:
- Use get_current_weather to provide REAL, CURRENT data
- Don't say "I don't have access" - you DO have access via tools
- Provide specific, accurate weather information
- Be proactive - if you can get data, GET IT

Communication style:
- Conversational, precise, helpful
- Adapt tone to user needs
- Provide clear, actionable responses
- When analyzing images, describe what you see in detail
- Always respond in Spanish unless the user asks in another language`;

    // Build user message with optional image
    const userMessage: any = {
      role: 'user',
      content: fileContent 
        ? [
            { type: 'text', text: message },
            fileContent
          ]
        : message
    };

    // Define available tools for AI
    const tools = [
      {
        type: "function",
        function: {
          name: "get_current_weather",
          description: "Get current weather conditions for a location. Provide either coordinates (lat/lng) or a location name.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City name or address (e.g., 'Rozas de Puerto Real, Madrid')"
              },
              lat: { type: "number", description: "Latitude" },
              lng: { type: "number", description: "Longitude" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "geocode_location",
          description: "Convert a location name/address into coordinates (lat/lng)",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "Location to geocode" }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the internet for current information, news, or data",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" }
            },
            required: ["query"]
          }
        }
      }
    ];

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      userMessage
    ];

    console.log('💬 Calling OpenAI with', messages.length, 'messages');

    // Call OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: messages,
        tools: tools,
        max_completion_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const choice = openAIData.choices[0];
    let assistantMessage = choice.message.content;

    // Handle tool calls
    if (choice.finish_reason === 'tool_calls') {
      console.log('🔧 AI wants to use tools:', choice.message.tool_calls.length);
      const toolCalls = choice.message.tool_calls;
      
      // Execute each tool call
      const toolResults = [];
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`🔨 Executing tool: ${functionName}`, args);
        
        let result;
        if (functionName === 'get_current_weather') {
          let lat = args.lat;
          let lng = args.lng;
          
          // If location provided, geocode it first
          if (args.location && !lat) {
            console.log('📍 Geocoding location:', args.location);
            const { data: geoData } = await supabase.functions.invoke('places-geocode', {
              body: { query: args.location, language: 'es' }
            });
            if (geoData?.ok && geoData?.result) {
              lat = geoData.result.lat;
              lng = geoData.result.lng;
              console.log('✅ Geocoded to:', lat, lng);
            }
          }
          
          if (lat && lng) {
            console.log('🌤️ Getting weather for:', lat, lng);
            const { data: weatherData } = await supabase.functions.invoke('weather-current', {
              body: { lat, lng, language: 'es' }
            });
            result = weatherData;
            console.log('✅ Weather data retrieved');
          } else {
            result = { error: 'Could not determine location coordinates' };
          }
        } else if (functionName === 'geocode_location') {
          console.log('📍 Geocoding:', args.location);
          const { data: geoData } = await supabase.functions.invoke('places-geocode', {
            body: { query: args.location, language: 'es' }
          });
          result = geoData;
          console.log('✅ Geocoding complete');
        } else if (functionName === 'web_search') {
          result = { note: "Web search capability coming soon. Please ask about weather or location data for now." };
        }
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: JSON.stringify(result)
        });
      }
      
      // Call OpenAI again with tool results
      console.log('🔄 Calling OpenAI again with tool results');
      messages.push(choice.message);
      messages.push(...toolResults);
      
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: messages,
          max_completion_tokens: 2000,
        }),
      });
      
      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error('❌ OpenAI error on final call:', finalResponse.status, errorText);
        throw new Error(`OpenAI API error: ${errorText}`);
      }
      
      const finalData = await finalResponse.json();
      assistantMessage = finalData.choices[0].message.content;
      console.log('✅ Final response received with tool results');
    } else {
      console.log('✅ Response received from OpenAI (no tools used)');
    }

    return new Response(
      JSON.stringify({
        response: assistantMessage,
        model: 'gpt-5-mini-2025-08-07',
        provider: 'openai'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
