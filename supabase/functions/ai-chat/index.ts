import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🤖 AI Chat - Simple ChatGPT-like assistant');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    let message: string;
    let file: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message') as string;
      file = formData.get('file') as File;
    } else {
      const body = await req.json();
      message = body.message;
    }
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Simple system prompt
    const systemPrompt = `You are a versatile AI assistant without topic restrictions.

You can:
- Answer any question on any topic
- Analyze images (photos, diagrams, documents, screenshots)
- Process and analyze documents (PDF, text, data)
- Provide detailed contextual analysis
- Help with technical, creative, analytical tasks

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
        max_completion_tokens: 2000,
        // temperature not supported on GPT-5
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('❌ OpenAI error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    console.log('✅ Response received from OpenAI');

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
