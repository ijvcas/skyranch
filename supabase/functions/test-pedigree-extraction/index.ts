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

    console.log('[TEST] Processing file:', file.name, 'Type:', fileType);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('[TEST] OPENAI_API_KEY not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('[TEST] Converting file to base64...');
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    console.log('[TEST] Calling OpenAI Vision API...');
    const extractedData = await extractWithVisionAPI(base64, fileType, OPENAI_API_KEY);

    console.log('[TEST] ✅ Extraction successful!');
    console.log('[TEST] Extracted data:', JSON.stringify(extractedData, null, 2));

    return new Response(JSON.stringify({
      success: true,
      message: 'Pedigree extraction test completed successfully',
      extractedData,
      extractionStats: {
        parents: !!(extractedData.father?.name || extractedData.mother?.name),
        grandparents: !!(extractedData.paternalGrandfather || extractedData.paternalGrandmother || extractedData.maternalGrandfather || extractedData.maternalGrandmother),
        greatGrandparents: !!(extractedData.paternalGreatGrandparents?.length || extractedData.maternalGreatGrandparents?.length),
        gen4Count: (extractedData.generation4?.paternalLine?.length || 0) + (extractedData.generation4?.maternalLine?.length || 0),
        gen5Count: (extractedData.generation5?.paternalLine?.length || 0) + (extractedData.generation5?.maternalLine?.length || 0),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[TEST] ❌ Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      details: error.stack
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

async function extractWithVisionAPI(base64Image: string, mimeType: string, apiKey: string) {
  console.log('[TEST] Calling OpenAI API with model: gpt-4o');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: "json_object" },
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
    console.error('[TEST] OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  console.log('[TEST] Raw AI response length:', content.length);
  console.log('[TEST] First 300 chars:', content.substring(0, 300));

  // Extract JSON from response
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
  
  console.log('[TEST] Attempting to parse JSON...');
  
  try {
    return JSON.parse(jsonStr.trim());
  } catch (parseError) {
    console.error('[TEST] JSON parse error:', parseError);
    console.error('[TEST] Attempting to clean JSON...');
    
    let cleaned = jsonStr.trim()
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/^[^{]*({)/, '$1');
    
    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('[TEST] Failed to parse even after cleaning:', secondError);
      console.error('[TEST] Raw content:', content.substring(0, 500));
      throw new Error(`Unable to parse pedigree data: ${secondError.message}`);
    }
  }
}
