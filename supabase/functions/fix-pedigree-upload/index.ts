import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔧 Fix Pedigree Upload function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ User authenticated: ${user.id}`);

    const formData = await req.formData();
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;
    const animalId = formData.get('animalId') as string | null;

    console.log(`📋 Received params:`, {
      message,
      animalId,
      fileName: file?.name,
      hasFile: !!file
    });

    if (!file) {
      console.error('❌ No file provided');
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📄 Processing file: ${file.name} Type: ${file.type}`);

    // Convert file to base64 using SAFE method
    console.log('🔄 Converting file to base64...');
    const fileBytes = await file.arrayBuffer();
    const fileBase64 = arrayBufferToBase64(fileBytes);
    console.log(`✅ Base64 conversion complete: ${fileBase64.length} chars`);

    // Call OpenAI directly
    console.log('🤖 Calling OpenAI Vision API...');
    const pedigreeData = await extractWithVisionAPI(fileBase64, file.type, openaiApiKey);
    console.log('✅ Pedigree extracted:', JSON.stringify(pedigreeData, null, 2));

    if (!pedigreeData || !pedigreeData.animalName) {
      console.error('❌ No animal name in pedigree data');
      return new Response(JSON.stringify({ error: 'Could not extract animal name from pedigree' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the animal using multiple strategies
    let existingAnimal: any = null;

    // Try 0: Direct ID lookup (if animalId provided)
    if (animalId) {
      console.log(`🔍 Try 0: Direct ID lookup for: ${animalId}`);
      const { data: idMatch, error: idError } = await supabase
        .from('animals')
        .select('id, name, tag')
        .eq('user_id', user.id)
        .eq('id', animalId)
        .maybeSingle();
      
      if (idError) {
        console.error(`❌ ID lookup error:`, idError);
      }
      
      if (idMatch) {
        console.log(`✅ Found by ID: "${idMatch.name}"`);
        existingAnimal = idMatch;
      } else {
        console.log(`   Result: Not found by ID`);
      }
    }

    // Try 1: Direct name match (wildcard) - only if not found by ID
    if (!existingAnimal && pedigreeData.animalName) {
      console.log(`🔍 Try 1: Name wildcard search for: "${pedigreeData.animalName}"`);
      const { data: nameMatch, error: nameError } = await supabase
        .from('animals')
        .select('id, name, tag')
        .eq('user_id', user.id)
        .ilike('name', `%${pedigreeData.animalName}%`)
        .maybeSingle();

      if (nameError) {
        console.error(`❌ Name lookup error:`, nameError);
      }
      
      if (nameMatch) {
        console.log(`✅ Found by name: "${nameMatch.name}"`);
        existingAnimal = nameMatch;
      } else {
        console.log(`   Result: Not found by name`);
      }
    }

    // Try 2: Tag/registration number match
    if (!existingAnimal && pedigreeData.registrationNumber) {
      console.log(`🔍 Try 2: Tag search for "${pedigreeData.registrationNumber}"...`);
      const { data: tagMatch, error: tagError } = await supabase
        .from('animals')
        .select('id, name, tag')
        .eq('user_id', user.id)
        .ilike('tag', `%${pedigreeData.registrationNumber}%`)
        .maybeSingle();
        
      if (tagError) {
        console.error(`❌ Tag lookup error:`, tagError);
      }
      console.log(`   Result:`, tagMatch ? `Found: "${tagMatch.name}"` : 'Not found');
      
      if (tagMatch) {
        console.log(`✅ Matched by tag: ${tagMatch.tag}`);
        existingAnimal = tagMatch;
      }
    }

    // Try 3: Check all animals and extract parenthetical names
    if (!existingAnimal) {
      console.log('🔍 Try 3: Checking all animals for parenthetical matches...');
      const { data: allAnimals, error: allError } = await supabase
        .from('animals')
        .select('id, name, tag')
        .eq('user_id', user.id);
        
      if (allError) {
        console.error(`❌ Get all animals error:`, allError);
      }
      console.log(`   Found ${allAnimals?.length || 0} animals to check`);
      
      for (const animal of allAnimals || []) {
        console.log(`   Checking: "${animal.name}"`);
        const nameMatch = animal.name.match(/\(([^)]+)\)/);
        if (nameMatch) {
          console.log(`      Extracted from parentheses: "${nameMatch[1]}"`);
          console.log(`      Comparing: "${nameMatch[1].toUpperCase()}" vs "${pedigreeData.animalName.toUpperCase()}"`);
          if (nameMatch[1].toUpperCase() === pedigreeData.animalName.toUpperCase()) {
            console.log(`✅ Matched by parenthetical name: ${animal.name}`);
            existingAnimal = animal;
            break;
          }
        }
      }
    }

    if (!existingAnimal) {
      console.error(`❌ Animal not found after all search strategies`);
      return new Response(JSON.stringify({ 
        error: `Animal "${pedigreeData.animalName}" not found in database`,
        searched: pedigreeData.animalName,
        registrationNumber: pedigreeData.registrationNumber || 'none'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Found animal to update: "${existingAnimal.name}" (ID: ${existingAnimal.id})`);

    // Build update object with all pedigree data
    const updateData: any = {};

    // Validate generation data
    console.log('📊 Validating extracted data structure:');
    console.log('   Gen4 Paternal:', pedigreeData.generation4?.paternalLine?.length || 0, 'ancestors');
    console.log('   Gen4 Maternal:', pedigreeData.generation4?.maternalLine?.length || 0, 'ancestors');
    console.log('   Gen5 Paternal:', pedigreeData.generation5?.paternalLine?.length || 0, 'ancestors');
    console.log('   Gen5 Maternal:', pedigreeData.generation5?.maternalLine?.length || 0, 'ancestors');

    // Gen 4 - Paternal line (8 ancestors)
    if (pedigreeData.generation4?.paternalLine) {
      const patLine = pedigreeData.generation4.paternalLine;
      
      if (!Array.isArray(patLine)) {
        console.warn('⚠️ Gen4 paternal line is not an array:', patLine);
      } else if (patLine.length < 8) {
        console.warn(`⚠️ Gen4 paternal line incomplete: ${patLine.length}/8 ancestors`);
      }
      
      updateData.gen4_paternal_ggggf_p = patLine[0] || null;
      updateData.gen4_paternal_ggggm_p = patLine[1] || null;
      updateData.gen4_paternal_gggmf_p = patLine[2] || null;
      updateData.gen4_paternal_gggmm_p = patLine[3] || null;
      updateData.gen4_paternal_ggfgf_p = patLine[4] || null;
      updateData.gen4_paternal_ggfgm_p = patLine[5] || null;
      updateData.gen4_paternal_ggmgf_p = patLine[6] || null;
      updateData.gen4_paternal_ggmgm_p = patLine[7] || null;
      console.log(`   ✓ Gen4 Paternal: Mapped ${patLine.length} ancestors`);
    }

    // Gen 4 - Maternal line (8 ancestors)
    if (pedigreeData.generation4?.maternalLine) {
      const matLine = pedigreeData.generation4.maternalLine;
      
      if (!Array.isArray(matLine)) {
        console.warn('⚠️ Gen4 maternal line is not an array:', matLine);
      } else if (matLine.length < 8) {
        console.warn(`⚠️ Gen4 maternal line incomplete: ${matLine.length}/8 ancestors`);
      }
      
      updateData.gen4_maternal_ggggf_m = matLine[0] || null;
      updateData.gen4_maternal_ggggm_m = matLine[1] || null;
      updateData.gen4_maternal_gggmf_m = matLine[2] || null;
      updateData.gen4_maternal_gggmm_m = matLine[3] || null;
      updateData.gen4_maternal_ggfgf_m = matLine[4] || null;
      updateData.gen4_maternal_ggfgm_m = matLine[5] || null;
      updateData.gen4_maternal_ggmgf_m = matLine[6] || null;
      updateData.gen4_maternal_ggmgm_m = matLine[7] || null;
      console.log(`   ✓ Gen4 Maternal: Mapped ${matLine.length} ancestors`);
    }

    // Gen 5 - Paternal line (16 ancestors)
    if (pedigreeData.generation5?.paternalLine) {
      const patLine = pedigreeData.generation5.paternalLine;
      
      if (!Array.isArray(patLine)) {
        console.warn('⚠️ Gen5 paternal line is not an array:', patLine);
      } else {
        if (patLine.length < 16) {
          console.warn(`⚠️ Gen5 paternal line incomplete: ${patLine.length}/16 ancestors`);
        }
        
        for (let i = 0; i < 16 && i < patLine.length; i++) {
          updateData[`gen5_paternal_${i + 1}`] = patLine[i] || null;
        }
        console.log(`   ✓ Gen5 Paternal: Mapped ${patLine.length} ancestors`);
      }
    }

    // Gen 5 - Maternal line (16 ancestors)
    if (pedigreeData.generation5?.maternalLine) {
      const matLine = pedigreeData.generation5.maternalLine;
      
      if (!Array.isArray(matLine)) {
        console.warn('⚠️ Gen5 maternal line is not an array:', matLine);
      } else {
        if (matLine.length < 16) {
          console.warn(`⚠️ Gen5 maternal line incomplete: ${matLine.length}/16 ancestors`);
        }
        
        for (let i = 0; i < 16 && i < matLine.length; i++) {
          updateData[`gen5_maternal_${i + 1}`] = matLine[i] || null;
        }
        console.log(`   ✓ Gen5 Maternal: Mapped ${matLine.length} ancestors`);
      }
    }

    console.log(`🔄 Attempting update with ${Object.keys(updateData).length} fields`);
    console.log(`📋 Update fields:`, Object.keys(updateData).join(', '));

    // Perform the update
    const { data: updatedAnimal, error: updateError } = await supabase
      .from('animals')
      .update(updateData)
      .eq('id', existingAnimal.id)
      .select()
      .single();

    if (updateError) {
      console.error(`❌ Database update failed:`, updateError);
      console.error(`Update data that failed:`, JSON.stringify(updateData, null, 2));
      return new Response(JSON.stringify({ 
        error: 'Update failed',
        details: updateError,
        fields: Object.keys(updateData)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Successfully updated ${Object.keys(updateData).length} fields for "${existingAnimal.name}"`);

    // Count the ancestors
    const gen4Count = Object.keys(updateData).filter(k => k.startsWith('gen4_')).length;
    const gen5Count = Object.keys(updateData).filter(k => k.startsWith('gen5_')).length;

    return new Response(JSON.stringify({ 
      success: true,
      animal: existingAnimal.name,
      updated: {
        gen4: gen4Count,
        gen5: gen5Count,
        total: Object.keys(updateData).length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Exception:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// SAFE base64 conversion - processes byte by byte to avoid crashes
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

// Direct OpenAI extraction
async function extractWithVisionAPI(base64Image: string, mimeType: string, apiKey: string) {
  console.log('🤖 Calling OpenAI API with model: gpt-4o');
  
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
    console.error('❌ OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content in AI response');
  }

  console.log('📝 Raw AI response length:', content.length);

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
  
  console.log('🔍 Attempting to parse JSON...');
  
  try {
    return JSON.parse(jsonStr.trim());
  } catch (parseError) {
    console.error('❌ JSON parse error:', parseError);
    console.error('🔧 Attempting to clean JSON...');
    
    let cleaned = jsonStr.trim()
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/^[^{]*({)/, '$1');
    
    try {
      return JSON.parse(cleaned);
    } catch (secondError) {
      console.error('❌ Failed to parse even after cleaning:', secondError);
      throw new Error(`Unable to parse pedigree data: ${secondError.message}`);
    }
  }
}
