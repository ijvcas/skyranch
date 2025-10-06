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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found in environment');
      throw new Error('AI service not configured. Please contact support.');
    }

    console.log('LOVABLE_API_KEY is set:', !!LOVABLE_API_KEY);

    // Convert file to base64 to avoid stack overflow
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    const extractedData = await extractWithVisionAPI(base64, fileType, LOVABLE_API_KEY);

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
    return new Response(JSON.stringify({ 
      error: error.message || 'Error analyzing pedigree' 
    }), {
      status: 500,
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

async function extractWithVisionAPI(base64Image: string, mimeType: string, apiKey: string | undefined) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  console.log('Calling Lovable AI API with model: google/gemini-2.5-flash');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this pedigree document and extract ALL available information in a structured JSON format. 
              
              Extract:
              - animalName: The name of the main animal in the pedigree
              - gender: male or female (if visible)
              - breed: The breed of the animal
              - birthDate: Date of birth if available (format: YYYY-MM-DD)
              - registrationNumber: Any registration or identification numbers
              - father: Object with name and any available details
              - mother: Object with name and any available details
              - paternalGrandfather: Name if available
              - paternalGrandmother: Name if available
              - maternalGrandfather: Name if available
              - maternalGrandmother: Name if available
              - paternalGreatGrandparents: Array of names if available (4 animals)
              - maternalGreatGrandparents: Array of names if available (4 animals)
              
              Return ONLY valid JSON. If information is not available, use null.`
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
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', errorText);
    throw new Error(`Vision API error: ${response.status}`);
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
