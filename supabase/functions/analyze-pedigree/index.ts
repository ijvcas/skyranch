import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log('Processing file:', file.name, 'Type:', fileType);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found in environment');
      throw new Error('OpenAI API key not configured. Please add it in your Supabase secrets.');
    }

    console.log('Processing file with OpenAI vision API');

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    const extractedData = await extractWithVisionAPI(base64, fileType, OPENAI_API_KEY);

    // Upload file to storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pedigree-documents')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pedigree-documents')
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({
      success: true,
      extractedData,
      documentUrl: publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-pedigree:', error);
    
    let errorMessage = 'Error al analizar el pedigrí';
    
    // Check for OpenAI rate limit errors
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      errorMessage = 'Límite de solicitudes de OpenAI excedido. Por favor, intenta de nuevo en unas horas. Tu cuenta de OpenAI ha alcanzado el límite de uso.';
    } else if (error.message?.includes('OpenAI API error')) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message
    }), {
      status: 200, // Return 200 so error message reaches client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to convert ArrayBuffer to base64 (prevents stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  // Iterate byte by byte to avoid stack overflow from spread operator
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

async function extractWithVisionAPI(base64Image: string, mimeType: string, apiKey: string) {
  console.log('Calling OpenAI API with model: gpt-4o (supports PDFs)');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this pedigree document and extract ALL available information up to 5 GENERATIONS.

Extract in this exact JSON structure:
{
  "animalName": "Name of the main animal",
  "gender": "male" or "female",
  "breed": "Breed name",
  "species": "equino", "ovino", "caninos", etc.
  "birthDate": "YYYY-MM-DD or YYYY",
  "registrationNumber": "Any registration/UELN numbers",
  
  "father": {"name": "...", "details": {}},
  "mother": {"name": "...", "details": {}},
  
  "paternalGrandfather": "Name",
  "paternalGrandmother": "Name",
  "maternalGrandfather": "Name",
  "maternalGrandmother": "Name",
  
  "paternalGreatGrandparents": [
    "paternal grandfather's father",
    "paternal grandfather's mother",
    "paternal grandmother's father",
    "paternal grandmother's mother"
  ],
  "maternalGreatGrandparents": [
    "maternal grandfather's father",
    "maternal grandfather's mother",
    "maternal grandmother's father",
    "maternal grandmother's mother"
  ],
  
  "generation4": {
    "paternalLine": ["8 names from paternal side"],
    "maternalLine": ["8 names from maternal side"]
  },
  
  "generation5": {
    "paternalLine": ["16 names from paternal side"],
    "maternalLine": ["16 names from maternal side"]
  }
}

Extract ALL names visible in the pedigree document. Use null for missing information. Return ONLY valid JSON.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }
  
  return JSON.parse(jsonStr.trim());
}
