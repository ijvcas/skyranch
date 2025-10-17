import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🤖 AI Chat function called - v2');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let message: string;
    let file: File | null = null;
    let fileType: string | null = null;
    let pedigreeData: any = null;

    // Check if request has file upload (multipart/form-data)
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      console.log('📥 Parsing multipart form data...');
      const formData = await req.formData();
      message = formData.get('message') as string;
      file = formData.get('file') as File;
      fileType = formData.get('fileType') as string;
      console.log('📝 Message:', message, 'File:', file?.name, 'Type:', fileType);
    } else {
      console.log('📥 Parsing JSON body...');
      const body = await req.json();
      message = body.message;
      console.log('📝 Message received:', message);
    }
    
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

// Function to detect if user is requesting image generation
function isImageGenerationRequest(message: string): boolean {
  const imageKeywords = [
    // Spanish keywords
    'genera imagen', 'crea imagen', 'dibuja', 'ilustra', 'diseña imagen', 
    'produce imagen', 'haz una imagen', 'genera swatch', 'crea swatch',
    'genera color', 'crea color', 'genera un logo', 'crea un logo',
    'diseña un logo', 'genera banner', 'crea banner', 'genera una foto',
    'crea una foto', 'genera gráfico', 'crea gráfico',
    // English conversational patterns
    'make image', 'create image', 'generate image', 'draw',
    'make a picture', 'create a picture', 'generate a picture',
    'produce downloadable image', 'produce image', 'create downloadable',
    'generate downloadable', 'make downloadable', 'i want image',
    'i need image', 'can you make image', 'can you create image',
    'can you generate image', 'produce swatch', 'make swatch',
    'create swatch', 'generate swatch', 'want downloadable image',
    'need downloadable image', 'would like you to produce',
    'produce links of downloadable', 'produce downloadable'
  ];
  
  const lowerMessage = message.toLowerCase();
  const matched = imageKeywords.find(keyword => lowerMessage.includes(keyword));
  
  if (matched) {
    console.log(`🎯 Image generation keyword matched: "${matched}"`);
  }
  
  return !!matched;
}

// Function to generate images with OpenAI gpt-image-1
async function generateImagesWithOpenAI(
      prompt: string, 
      apiKey: string, 
      count: number = 1
    ): Promise<Array<{ imageUrl: string, revisedPrompt?: string }> | null> {
      console.log(`🎨 Generating ${count} image(s) with OpenAI gpt-image-1...`);
      
      const images: Array<{ imageUrl: string, revisedPrompt?: string }> = [];
      
      // Generate images (max 10 per OpenAI limits)
      for (let i = 0; i < Math.min(count, 10); i++) {
        try {
          const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-image-1',
              prompt: count > 1 ? `${prompt} (variation ${i + 1})` : prompt,
              n: 1,
              size: '1024x1024',
              // Note: gpt-image-1 doesn't support response_format parameter
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error generating image ${i + 1}:`, response.status, errorText);
            continue;
          }

          const data = await response.json();
          console.log(`📊 Response data for image ${i + 1}:`, JSON.stringify(data).substring(0, 200));
          
          // gpt-image-1 returns URL by default, fetch and convert to base64
          const imageUrl = data.data[0].url;
          const revisedPrompt = data.data[0].revised_prompt;
          
          if (!imageUrl) {
            console.error(`❌ No URL returned for image ${i + 1}`);
            continue;
          }
          
          // Fetch the image and convert to base64
          console.log(`📥 Fetching image from URL...`);
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          const arrayBuffer = await imageBlob.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          images.push({
            imageUrl: `data:image/png;base64,${base64}`,
            revisedPrompt
          });
          
          console.log(`✅ Image ${i + 1}/${count} generated and converted to base64`);
        } catch (error) {
          console.error(`❌ Error generating image ${i + 1}:`, error);
          continue;
        }
      }
      
      if (images.length === 0) {
        console.error('❌ Image generation failed');
        return null;
      }
      
      return images;
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      return null;
    }
  }

    // If file is uploaded, determine handling strategy
    let imageDataForVision: string | null = null;
    if (file) {
      console.log('📄 Processing uploaded file:', file.name, 'Type:', file.type);
      
      // Check if it's a general image (not pedigree) for vision analysis
      const isImage = file.type.startsWith('image/');
      const isPedigreeKeywords = message.toLowerCase().includes('pedigr') || 
                                  message.toLowerCase().includes('genealog') ||
                                  message.toLowerCase().includes('ancestr');
      
      // If it's an image but NOT a pedigree request, use GPT-5 Vision
      if (isImage && !isPedigreeKeywords) {
      console.log('🖼️ Image detected for general analysis, converting to base64...');
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(
        bytes.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      imageDataForVision = `data:${file.type};base64,${base64}`;
      console.log('✅ Image prepared for vision analysis');
      } else if (isImage && isPedigreeKeywords) {
        console.log('📄 Processing as pedigree file:', file.name);
        
        let attempts = 0;
        const maxAttempts = 2;
        let pedigreeResponse: Response | null = null;
        
        while (attempts < maxAttempts && !pedigreeData) {
        attempts++;
        console.log(`🔄 Pedigree extraction attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Create form data to send to analyze-pedigree function
          const pedigreeFormData = new FormData();
          pedigreeFormData.append('file', file);
          pedigreeFormData.append('fileType', fileType || '');

          pedigreeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-pedigree`, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
            },
            body: pedigreeFormData,
          });

          if (pedigreeResponse.ok) {
            const result = await pedigreeResponse.json();
            if (result.extractedData) {
              pedigreeData = result.extractedData;
              console.log('✅ Pedigree extracted successfully on attempt', attempts);
              break;
            }
          }
        } catch (err) {
          console.error(`⚠️ Attempt ${attempts} failed:`, err);
          if (attempts >= maxAttempts) {
            throw err;
          }
        }
      }

      if (!pedigreeResponse || !pedigreeResponse.ok) {
        const errorText = pedigreeResponse ? await pedigreeResponse.text() : 'No response';
        console.error('❌ Pedigree analysis failed after all attempts:', errorText);
        
        // Try to parse error details and return proper error message
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.error || 'No se pudo extraer el pedigrí de la imagen. Por favor, intenta con una imagen más clara.';
          
          // Return 200 with error in body so client can display it
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              response: errorMessage
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch {
          return new Response(
            JSON.stringify({ 
              error: 'Error al analizar el documento de pedigrí',
              response: 'Error al analizar el documento de pedigrí'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const pedigreeResult = await pedigreeResponse.json();
      pedigreeData = pedigreeResult.extractedData;
      console.log('✅ Pedigree extracted:', pedigreeData);
      
      // Smart animal lookup with multiple strategies
      console.log(`🔍 Looking for animal: "${pedigreeData.animalName}"`);

      // Try 1: Name wildcard match
      let { data: existingAnimal, error: nameError } = await supabase
        .from('animals')
        .select('id, name, tag')
        .eq('user_id', user.id)
        .ilike('name', `%${pedigreeData.animalName}%`)
        .maybeSingle();

      if (nameError) {
        console.error(`❌ Name lookup error:`, nameError);
      }
      console.log(`🔍 Try 1 (name wildcard) result:`, existingAnimal ? `Found: ${existingAnimal.name}` : 'Not found');

      // Try 2: Tag/registration number match
      if (!existingAnimal && pedigreeData.registrationNumber) {
        const { data: tagMatch, error: tagError } = await supabase
          .from('animals')
          .select('id, name, tag')
          .eq('user_id', user.id)
          .ilike('tag', `%${pedigreeData.registrationNumber}%`)
          .maybeSingle();
        
        if (tagError) {
          console.error(`❌ Tag lookup error:`, tagError);
        }
        console.log(`🔍 Try 2 (tag match) result:`, tagMatch ? `Found: ${tagMatch.name}` : 'Not found');
        
        if (tagMatch) {
          console.log(`✅ Matched by tag: ${tagMatch.tag}`);
          existingAnimal = tagMatch;
        }
      }

      // Try 3: Parenthetical name extraction (LUNA (NIOUININON) → NIOUININON)
      if (!existingAnimal) {
        const { data: allAnimals, error: allError } = await supabase
          .from('animals')
          .select('id, name, tag')
          .eq('user_id', user.id);
        
        if (allError) {
          console.error(`❌ Get all animals error:`, allError);
        }
        console.log(`🔍 Try 3 (parenthetical) - found ${allAnimals?.length || 0} animals to check`);
        
        for (const animal of allAnimals || []) {
          console.log(`  Checking: "${animal.name}" for parenthetical match with "${pedigreeData.animalName}"`);
          const nameMatch = animal.name.match(/\(([^)]+)\)/);
          if (nameMatch) {
            console.log(`    Extracted: "${nameMatch[1]}" vs "${pedigreeData.animalName}"`);
          }
          if (nameMatch && nameMatch[1].toUpperCase() === pedigreeData.animalName.toUpperCase()) {
            console.log(`✅ Matched by parenthetical name: ${animal.name}`);
            existingAnimal = animal;
            break;
          }
        }
      }

      if (!existingAnimal) {
        console.log(`❌ No animal found matching "${pedigreeData.animalName}"`);
      }
        
        if (existingAnimal) {
          console.log(`[${new Date().toISOString()}] ✅ Found existing animal: ${existingAnimal.name} (ID: ${existingAnimal.id})`);
          const updateStartTime = Date.now();
          
          try {
            // Update pedigree DIRECTLY in database
            console.log(`[${new Date().toISOString()}] 💾 Updating pedigree in database...`);
            
            // Helper function to clean names
            const cleanName = (name: string | null | undefined): string | null => {
              if (!name) return null;
              return name
                .replace(/Nº\s*UELN[:\s]*/gi, '')
                .replace(/UELN[:\s]*/gi, '')
                .replace(/\s*\([^)]*\)/g, '')
                .trim() || null;
            };
            
            // Build update object with all pedigree fields
            const pedigreeUpdate: any = {};
            
            // Gen 1 (Parents)
            if (pedigreeData.father?.name) pedigreeUpdate.father_id = cleanName(pedigreeData.father.name);
            if (pedigreeData.mother?.name) pedigreeUpdate.mother_id = cleanName(pedigreeData.mother.name);
            
            // Gen 2 (Grandparents)
            if (pedigreeData.paternalGrandfather) pedigreeUpdate.paternal_grandfather_id = cleanName(pedigreeData.paternalGrandfather);
            if (pedigreeData.paternalGrandmother) pedigreeUpdate.paternal_grandmother_id = cleanName(pedigreeData.paternalGrandmother);
            if (pedigreeData.maternalGrandfather) pedigreeUpdate.maternal_grandfather_id = cleanName(pedigreeData.maternalGrandfather);
            if (pedigreeData.maternalGrandmother) pedigreeUpdate.maternal_grandmother_id = cleanName(pedigreeData.maternalGrandmother);
            
            // Gen 3 (Great-grandparents) - Paternal
            if (pedigreeData.paternalGreatGrandparents) {
              if (pedigreeData.paternalGreatGrandparents[0]) pedigreeUpdate.paternal_great_grandfather_paternal_id = cleanName(pedigreeData.paternalGreatGrandparents[0]);
              if (pedigreeData.paternalGreatGrandparents[1]) pedigreeUpdate.paternal_great_grandmother_paternal_id = cleanName(pedigreeData.paternalGreatGrandparents[1]);
              if (pedigreeData.paternalGreatGrandparents[2]) pedigreeUpdate.paternal_great_grandfather_maternal_id = cleanName(pedigreeData.paternalGreatGrandparents[2]);
              if (pedigreeData.paternalGreatGrandparents[3]) pedigreeUpdate.paternal_great_grandmother_maternal_id = cleanName(pedigreeData.paternalGreatGrandparents[3]);
            }
            
            // Gen 3 (Great-grandparents) - Maternal
            if (pedigreeData.maternalGreatGrandparents) {
              if (pedigreeData.maternalGreatGrandparents[0]) pedigreeUpdate.maternal_great_grandfather_paternal_id = cleanName(pedigreeData.maternalGreatGrandparents[0]);
              if (pedigreeData.maternalGreatGrandparents[1]) pedigreeUpdate.maternal_great_grandmother_paternal_id = cleanName(pedigreeData.maternalGreatGrandparents[1]);
              if (pedigreeData.maternalGreatGrandparents[2]) pedigreeUpdate.maternal_great_grandfather_maternal_id = cleanName(pedigreeData.maternalGreatGrandparents[2]);
              if (pedigreeData.maternalGreatGrandparents[3]) pedigreeUpdate.maternal_great_grandmother_maternal_id = cleanName(pedigreeData.maternalGreatGrandparents[3]);
            }
            
            // Gen 4 - Paternal Line (8 ancestors)
            if (pedigreeData.generation4?.paternalLine) {
              const p = pedigreeData.generation4.paternalLine;
              if (p[0]) pedigreeUpdate.gen4_paternal_ggggf_p = cleanName(p[0]);
              if (p[1]) pedigreeUpdate.gen4_paternal_ggggm_p = cleanName(p[1]);
              if (p[2]) pedigreeUpdate.gen4_paternal_gggmf_p = cleanName(p[2]);
              if (p[3]) pedigreeUpdate.gen4_paternal_gggmm_p = cleanName(p[3]);
              if (p[4]) pedigreeUpdate.gen4_paternal_ggmgf_p = cleanName(p[4]);
              if (p[5]) pedigreeUpdate.gen4_paternal_ggmgm_p = cleanName(p[5]);
              if (p[6]) pedigreeUpdate.gen4_paternal_ggfgf_p = cleanName(p[6]);
              if (p[7]) pedigreeUpdate.gen4_paternal_ggfgm_p = cleanName(p[7]);
            }
            
            // Gen 4 - Maternal Line (8 ancestors)
            if (pedigreeData.generation4?.maternalLine) {
              const m = pedigreeData.generation4.maternalLine;
              if (m[0]) pedigreeUpdate.gen4_maternal_ggggf_m = cleanName(m[0]);
              if (m[1]) pedigreeUpdate.gen4_maternal_ggggm_m = cleanName(m[1]);
              if (m[2]) pedigreeUpdate.gen4_maternal_gggmf_m = cleanName(m[2]);
              if (m[3]) pedigreeUpdate.gen4_maternal_gggmm_m = cleanName(m[3]);
              if (m[4]) pedigreeUpdate.gen4_maternal_ggmgf_m = cleanName(m[4]);
              if (m[5]) pedigreeUpdate.gen4_maternal_ggmgm_m = cleanName(m[5]);
              if (m[6]) pedigreeUpdate.gen4_maternal_ggfgf_m = cleanName(m[6]);
              if (m[7]) pedigreeUpdate.gen4_maternal_ggfgm_m = cleanName(m[7]);
            }
            
            // Gen 5 - Paternal Line (16 ancestors)
            if (pedigreeData.generation5?.paternalLine) {
              const p5 = pedigreeData.generation5.paternalLine;
              for (let i = 0; i < 16 && i < p5.length; i++) {
                if (p5[i]) pedigreeUpdate[`gen5_paternal_${i + 1}`] = cleanName(p5[i]);
              }
            }
            
            // Gen 5 - Maternal Line (16 ancestors)
            if (pedigreeData.generation5?.maternalLine) {
              const m5 = pedigreeData.generation5.maternalLine;
              for (let i = 0; i < 16 && i < m5.length; i++) {
                if (m5[i]) pedigreeUpdate[`gen5_maternal_${i + 1}`] = cleanName(m5[i]);
              }
            }
            
            // Log the update data before attempting update
            console.log(`📝 Attempting to update animal ID: ${existingAnimal.id}`);
            console.log(`📝 Update data contains ${Object.keys(pedigreeUpdate).length} fields:`, Object.keys(pedigreeUpdate).join(', '));
            console.log(`📝 Full update data:`, JSON.stringify(pedigreeUpdate, null, 2));

            // Perform the update
            const { data: updatedAnimal, error: updateError } = await supabase
              .from('animals')
              .update(pedigreeUpdate)
              .eq('id', existingAnimal.id)
              .eq('user_id', user.id)
              .select()
              .single();
            
            if (updateError) {
              console.error(`[${new Date().toISOString()}] ❌ Database update failed:`, updateError);
              console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));
              console.error('❌ Failed update data:', JSON.stringify(pedigreeUpdate, null, 2));
              pedigreeData._autoUpdated = false;
              pedigreeData._updateError = updateError.message;
            } else {
              const updateDuration = Date.now() - updateStartTime;
              const fieldsUpdated = Object.keys(pedigreeUpdate).length;
              console.log(`[${new Date().toISOString()}] ✅ Pedigree updated in ${updateDuration}ms: ${fieldsUpdated} fields saved`);
              console.log('✅ Updated animal data:', JSON.stringify(updatedAnimal, null, 2));
              
              pedigreeData._autoUpdated = true;
              pedigreeData._updateResult = {
                fieldsUpdated,
                animalName: updatedAnimal.name,
                duration: updateDuration
              };
            }
          } catch (updateError: any) {
            console.error(`[${new Date().toISOString()}] ❌ Exception updating pedigree:`, updateError);
            pedigreeData._autoUpdated = false;
            pedigreeData._updateError = `Error: ${updateError.message}`;
          }
        } else {
        console.log(`[${new Date().toISOString()}] ℹ️ Animal "${pedigreeData.animalName}" not found in database, treating as external`);
        }
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        console.log('📄 PDF file detected but not for pedigree - informing user');
        // PDF handling without pedigree extraction would go here
      } else if (file.type.startsWith('text/')) {
        console.log('📝 Text file detected, reading content...');
        const textContent = await file.text();
        message += `\n\n[Contenido del archivo ${file.name}]:\n${textContent}`;
        console.log('✅ Text file content appended to message');
      }
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
    const defaultPrompt = `Eres un asistente de IA versátil y poderoso sin restricciones temáticas.

CAPACIDADES PRINCIPALES:
- Responder cualquier pregunta en cualquier dominio (ciencia, tecnología, negocios, cultura, educación, etc.)
- Analizar imágenes de cualquier tipo (fotografías, diagramas, documentos, capturas de pantalla)
- Procesar y analizar documentos (PDF, texto, datos)
- Proporcionar análisis detallados y contextualizados
- Asistir con tareas técnicas, creativas, analíticas y de planificación
- **GENERAR IMÁGENES** a partir de descripciones textuales

CONTEXTO ESPECIALIZADO:
Cuando dispones de contexto específico del rancho (datos de animales, pedigrís, clima, lotes), úsalo para enriquecer tus respuestas sobre gestión ganadera. Cuando el usuario pregunta sobre otros temas o sube imágenes/documentos generales, responde con tu conocimiento amplio.

GENERACIÓN DE IMÁGENES:
Puedes generar imágenes fotorrealistas y diseños desde cero. Cuando el usuario solicite:
- "genera imagen", "crea imagen", "dibuja", "diseña", "ilustra"
- "make image", "create image", "generate", "draw"
- Logos, banners, swatches, gráficos, ilustraciones

El sistema automáticamente activará la generación de imágenes con OpenAI gpt-image-1 y recibirás imágenes PNG de 1024x1024 píxeles en formato base64.

Simplemente responde que estás generando la imagen y el sistema se encargará del resto. Las imágenes aparecerán automáticamente con botones de descarga en la interfaz.

GENERACIÓN DE CONTENIDO DESCARGABLE:
Cuando generes archivos descargables (HTML, JSON, CSV, imágenes, etc.), sigue estas reglas ESTRICTAMENTE:

1. **Archivos de texto** (HTML, JSON, CSV, XML, SVG, código):
   - Envuelve el contenido completo en bloques de código con el identificador del lenguaje
   - Formatos válidos: \`\`\`html, \`\`\`json, \`\`\`csv, \`\`\`xml, \`\`\`svg, \`\`\`javascript, \`\`\`css, etc.
   - SIEMPRE menciona el nombre del archivo sugerido ANTES del bloque de código
   - Ejemplo correcto:
     "Aquí está tu archivo gen0_swatches.html para descargar:"
     \`\`\`html
     <!DOCTYPE html>
     <html>...
     \`\`\`

2. **Imágenes generadas** (PNG, JPEG, etc.):
   - El sistema las generará automáticamente cuando detecte la solicitud
   - Aparecerán como base64: data:image/png;base64,iVBORw0KG...
   - Tendrán botones de descarga automáticos
   - Tú solo necesitas confirmar que las estás generando

3. **Interfaz automática**:
   - NO necesitas explicar cómo descargar - el usuario verá botones automáticos
   - Solo enfócate en generar el contenido correcto y nombrar el archivo

ESTILO DE COMUNICACIÓN:
- Sé conversacional, preciso y útil
- Adapta tu tono y profundidad según las necesidades del usuario
- Proporciona respuestas claras y accionables
- Cuando analices imágenes, describe lo que ves con detalle
- Cuando generes imágenes, describe brevemente lo que crearás

Eres un asistente completo capaz de ayudar con cualquier consulta o tarea, incluyendo la generación de imágenes.`;
    
    const systemPrompt = settings?.system_prompt || defaultPrompt;
    const enableAnimalContext = settings?.enable_animal_context ?? true;
    const enableBreedingContext = settings?.enable_breeding_context ?? true;
    const enableLotsContext = settings?.enable_lots_context ?? true;
    const enableWeatherContext = settings?.enable_weather_context ?? true;

    // Build context based on settings
    let contextData: any = {};

    // If pedigree was analyzed, add it to context
    if (pedigreeData) {
      contextData.uploadedPedigree = pedigreeData;
      
      // Call analyze-inbreeding function for deterministic calculation
      console.log('🧬 Calling analyze-inbreeding function...');
      try {
        const inbreedingResponse = await fetch(
          `${supabaseUrl}/functions/v1/analyze-inbreeding`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pedigreeData: pedigreeData,
              userId: user.id
            })
          }
        );

        if (inbreedingResponse.ok) {
          const inbreedingAnalysis = await inbreedingResponse.json();
          contextData.inbreedingAnalysis = inbreedingAnalysis;
          console.log('✅ Inbreeding analysis completed:', {
            compatible: inbreedingAnalysis.compatiblePairings?.length || 0,
            cautious: inbreedingAnalysis.cautiousPairings?.length || 0,
            avoid: inbreedingAnalysis.avoidPairings?.length || 0
          });
        } else {
          console.warn('⚠️ Inbreeding analysis failed, continuing without it');
        }
      } catch (inbreedingError: any) {
        console.warn('⚠️ Could not perform inbreeding analysis:', inbreedingError.message);
      }
    }

    if (enableAnimalContext) {
      // Fetch detailed animal information including full pedigree data
      const { data: animals } = await supabase
        .from('animals')
        .select('id, name, tag, species, breed, gender, birth_date, father_id, mother_id, paternal_grandfather_id, paternal_grandmother_id, maternal_grandfather_id, maternal_grandmother_id')
        .eq('user_id', user.id)
        .eq('lifecycle_status', 'active')
        .limit(100);
      
      if (animals) {
        // Always populate farmAnimals for pedigree analysis
        contextData.farmAnimals = animals;
        
        // Also keep the legacy structure for backward compatibility
        contextData.animals = {
          total: animals.length,
          bySpecies: animals.reduce((acc: any, a: any) => {
            acc[a.species] = (acc[a.species] || 0) + 1;
            return acc;
          }, {}),
          detailedList: animals, // Include full animal details with pedigree info
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

    // Build enhanced system prompt
    let enhancedSystemPrompt = systemPrompt;

    // ALWAYS inform AI about Skyranch database access if animals are available
    if (contextData.farmAnimals && contextData.farmAnimals.length > 0) {
      enhancedSystemPrompt += `\n\n🐴 **BASE DE DATOS SKYRANCH - ACCESO COMPLETO:**

Tienes acceso a la información de ${contextData.farmAnimals.length} animales activos en la base de datos de Skyranch:

${contextData.farmAnimals.map((a: any) => 
  `- **${a.name}** (Tag: ${a.tag}) - ${a.species} ${a.breed || 'sin raza'}
  Género: ${a.gender || 'no especificado'} | Nacimiento: ${a.birth_date || 'no registrado'}
  Padre ID: ${a.father_id || 'desconocido'} | Madre ID: ${a.mother_id || 'desconocida'}
  Abuelos paternos: ${a.paternal_grandfather_id || 'N/A'}, ${a.paternal_grandmother_id || 'N/A'}
  Abuelos maternos: ${a.maternal_grandfather_id || 'N/A'}, ${a.maternal_grandmother_id || 'N/A'}`
).join('\n\n')}

**IMPORTANTE:** Esta información de la base de datos de Skyranch está disponible para análisis de consanguinidad, cruces genéticos, y cualquier consulta sobre los animales del rancho.`;
    }

    // Phase 3: Enhanced error handling for pedigree extraction
    if (file && !pedigreeData) {
      enhancedSystemPrompt += `\n\n❌ ERROR EN EXTRACCIÓN DE PEDIGRÍ:

No se pudo extraer información del documento cargado. Esto puede deberse a:
- Imagen de baja calidad o poco legible
- Formato de pedigrí no reconocido
- Error en el servicio de análisis

**TU TAREA:**
1. Informa al usuario que hubo un problema al leer el documento de pedigrí
2. Sugiere que intente con una imagen más clara o en mejor resolución
3. Ofrece ayuda manual: puede escribir los datos del pedigrí y tú lo procesarás
4. Sé amable y ofrece alternativas

**NO** inventes datos ni hagas suposiciones sobre el contenido del documento.`;
    }

    // Phase 2: Auto-update confirmation (no permission asking)
    if (pedigreeData?._autoUpdated && pedigreeData?._updateResult) {
      const result = pedigreeData._updateResult;
      const fieldsUpdated = result.fieldsUpdated;
      
      enhancedSystemPrompt += `\n\n✅ PEDIGRÍ ACTUALIZADO AUTOMÁTICAMENTE (NO PEDIR PERMISO):

He extraído y guardado automáticamente el pedigrí de 5 generaciones de **${pedigreeData.animalName}**:
- ${fieldsUpdated} campos actualizados en la base de datos
- El animal ya existe en Skyranch y su pedigrí está completo

**INSTRUCCIONES CRÍTICAS:**
1. Confirma: "✅ He extraído y guardado automáticamente el pedigrí de 5 generaciones de ${pedigreeData.animalName}. El pedigrí está completo con ${fieldsUpdated} campos actualizados."
2. NO preguntes si desea actualizar - YA ESTÁ ACTUALIZADO
3. NO pidas permiso ni confirmación - el sistema ya lo hizo automáticamente
4. Sé directo y confirma lo que se hizo

**NO** hagas análisis de consanguinidad ni sugerencias. Solo confirma la actualización exitosa.`;
    } else if (pedigreeData?._autoUpdated === false && pedigreeData?._updateError) {
      // Update failed - inform AI to notify user
      enhancedSystemPrompt += `\n\n⚠️ ERROR AL ACTUALIZAR PEDIGRÍ:

La extracción del pedigrí fue exitosa, pero hubo un error al guardar los datos en la base de datos:
**Error:** ${pedigreeData._updateError}

**TU TAREA:**
1. Informa al usuario que se extrajo el pedigrí de ${pedigreeData.animalName} correctamente
2. Explica que hubo un problema técnico al guardar los datos automáticamente
3. Sugiere que el usuario intente de nuevo o contacte al administrador
4. Sé amable y tranquilizador

**NO** proceder con análisis de consanguinidad hasta que el pedigrí esté guardado.`;
    } else if (pedigreeData && contextData.inbreedingAnalysis) {
      const analysis = contextData.inbreedingAnalysis;
      
      enhancedSystemPrompt += `\n\n🧬 ANÁLISIS DE CONSANGUINIDAD COMPLETADO:

Se ha analizado el pedigrí de **${pedigreeData.animalName}** contra ${analysis.totalAnimalsAnalyzed} animales de Skyranch usando el coeficiente de Wright.

**RESULTADOS DETERMINÍSTICOS:**
`;

      if (analysis.compatiblePairings && analysis.compatiblePairings.length > 0) {
        enhancedSystemPrompt += `\n✅ **EMPAREJAMIENTOS COMPATIBLES** (< 3% consanguinidad):
${analysis.compatiblePairings.slice(0, 5).map((p: any) => 
  `- **${p.animalName}** (${p.animalTag}): ${p.inbreedingPercentage.toFixed(2)}% consanguinidad
   ${p.commonAncestors.length > 0 ? `Ancestros comunes: ${p.commonAncestors.map((a: any) => a.name).join(', ')}` : 'Sin ancestros comunes detectados'}
   ${p.recommendation}`
).join('\n\n')}
${analysis.compatiblePairings.length > 5 ? `\n... y ${analysis.compatiblePairings.length - 5} más` : ''}
`;
      }

      if (analysis.cautiousPairings && analysis.cautiousPairings.length > 0) {
        enhancedSystemPrompt += `\n⚠️ **EMPAREJAMIENTOS PRECAUTORIOS** (3-8% consanguinidad):
${analysis.cautiousPairings.map((p: any) => 
  `- **${p.animalName}** (${p.animalTag}): ${p.inbreedingPercentage.toFixed(2)}%
   Ancestros comunes: ${p.commonAncestors.map((a: any) => a.name).join(', ')}
   ${p.recommendation}`
).join('\n\n')}
`;
      }

      if (analysis.avoidPairings && analysis.avoidPairings.length > 0) {
        enhancedSystemPrompt += `\n🚫 **EMPAREJAMIENTOS A EVITAR** (> 8% consanguinidad):
${analysis.avoidPairings.map((p: any) => 
  `- **${p.animalName}** (${p.animalTag}): ${p.inbreedingPercentage.toFixed(2)}%
   Ancestros comunes: ${p.commonAncestors.map((a: any) => a.name).join(', ')}
   ${p.recommendation}`
).join('\n\n')}
`;
      }

      enhancedSystemPrompt += `\n**TU TAREA:**
1. Presenta estos resultados en español conversacional y claro
2. Explica qué significa cada nivel de consanguinidad para la salud de las crías
3. Da una recomendación clara: ¿COMPRAR o NO COMPRAR ${pedigreeData.animalName}?
4. Justifica tu recomendación basándote en los datos de consanguinidad
5. Pregunta: "¿Quieres que guarde ${pedigreeData.animalName} en la base de datos de Skyranch?"

**IMPORTANTE:** Estos son cálculos determinísticos usando el coeficiente de Wright. NO inventes porcentajes ni análisis. USA SOLO los datos proporcionados arriba.`;
    } else if (pedigreeData) {
      // Fallback if inbreeding analysis failed
      enhancedSystemPrompt += `\n\n🧬 ANÁLISIS DE PEDIGRÍ:

El pedigrí de ${pedigreeData.animalName || 'este animal'} (${pedigreeData.breed || 'raza no especificada'}) ha sido procesado.

**DATOS EXTRAÍDOS:**
Animal: ${pedigreeData.animalName} | Nacimiento: ${pedigreeData.birthDate}
Padre: ${pedigreeData.father?.name} | Madre: ${pedigreeData.mother?.name}
Abuelos paternos: ${pedigreeData.paternalGrandfather}, ${pedigreeData.paternalGrandmother}
Abuelos maternos: ${pedigreeData.maternalGrandfather}, ${pedigreeData.maternalGrandmother}

**TU TAREA:**
1. Resume los datos del pedigrí claramente
2. Menciona que el análisis de consanguinidad automático no está disponible temporalmente
3. Recomienda revisión manual comparando con los animales de Skyranch
4. Pregunta: "¿Quieres que guarde ${pedigreeData.animalName} en Skyranch para análisis futuro?"

Sé conciso y directo.`;
    }

    // Add full context as JSON for reference
    console.log('📊 Context data being sent:', {
      hasPedigreeData: !!pedigreeData,
      farmAnimalsCount: contextData.farmAnimals?.length || 0,
      hasAnimalsContext: !!contextData.animals,
      hasBreedingContext: !!contextData.breeding,
      hasLotsContext: !!contextData.lots,
      hasWeatherContext: !!contextData.weather
    });

    if (Object.keys(contextData).length > 0) {
      enhancedSystemPrompt += '\n\n[Datos completos del contexto en JSON para referencia técnica]:\n' + JSON.stringify(contextData, null, 2);
    }

    // Fetch conversation history from database for context
    console.log('📜 Fetching conversation history...');
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_history')
      .select('role, message')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100); // Last 100 messages for context
    
    if (historyError) {
      console.warn('⚠️ Error fetching chat history:', historyError);
    }
    
    console.log(`✅ Loaded ${chatHistory?.length || 0} messages from conversation history`);

    // Prepare messages for AI with conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
      },
      // Include conversation history for context
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === 'system' ? 'system' : msg.role,
        content: msg.message,
      })),
    ];
    
    // Add current message with optional image for vision analysis
    if (imageDataForVision) {
      console.log('🖼️ Adding multimodal message with image for GPT-5 Vision');
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { 
            type: 'image_url', 
            image_url: { 
              url: imageDataForVision,
              detail: 'high' // High detail for better analysis
            } 
          }
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: message,
      });
    }

    // Check for OPENAI_API_KEY
    console.log('🔑 Checking for OPENAI_API_KEY...');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ API key found');

    // Check if this is an image generation request
    const isImageRequest = isImageGenerationRequest(message);
    
    if (isImageRequest) {
      console.log('🎨 Image generation request detected');
      console.log(`📝 Original request: "${message.substring(0, 100)}..."`);
      
      // Extract number of images requested (default: 1)
      const countMatch = message.match(/(\d+)\s+(imagen|imágenes|image|images|swatch|swatches|logo|logos)/i);
      const imageCount = countMatch ? parseInt(countMatch[1]) : 1;
      
      console.log(`🔢 Generating ${imageCount} image(s)...`);
      
      try {
        const imageResults = await generateImagesWithOpenAI(message, OPENAI_API_KEY, imageCount);
        
        if (imageResults && imageResults.length > 0) {
          // Build response with all generated images
          let aiResponseText = imageCount > 1 
            ? `He generado ${imageResults.length} imagen(es) para ti:\n\n`
            : `He generado la imagen que solicitaste:\n\n`;
          
          imageResults.forEach((result, index) => {
            aiResponseText += `${result.imageUrl}\n\n`;
            if (result.revisedPrompt && imageCount === 1) {
              aiResponseText += `Descripción: ${result.revisedPrompt}\n\n`;
            }
          });
          
          aiResponseText += imageCount > 1
            ? `Haz clic en cualquier imagen para descargarla.`
            : `Haz clic en la imagen para descargarla.`;
          
          console.log(`✅ Successfully generated ${imageResults.length} image(s)`);
          
          return new Response(
            JSON.stringify({ 
              response: aiResponseText,
              metadata: {
                imageGeneration: true,
                imageCount: imageResults.length,
                contextUsed: ['image_generation']
              }
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          console.error('❌ Image generation returned no results');
          return new Response(
            JSON.stringify({ 
              error: 'No pude generar la imagen. Por favor, intenta de nuevo con una descripción diferente.',
              response: 'Hubo un error al generar la imagen. Por favor, intenta de nuevo.'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (error) {
        console.error('❌ Image generation error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Error al generar la imagen: ' + (error.message || 'Unknown error'),
            response: 'Hubo un error al generar la imagen. Por favor, intenta de nuevo.'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
        console.error('❌ Image generation failed');
        return new Response(
          JSON.stringify({ 
            error: 'No pude generar la imagen. Por favor, intenta de nuevo con una descripción diferente.',
            response: 'Hubo un error al generar la imagen. Por favor, intenta nuevamente o proporciona más detalles en tu solicitud.'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // If not an image request, continue with regular chat
    console.log('💬 Processing as regular chat request, calling OpenAI...');

    // Add timeout to prevent hanging (55s = Supabase max)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07', // Faster, cheaper, supports vision, no reasoning token overhead
          messages,
          max_completion_tokens: 16000, // High limit for complete responses
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('❌ OpenAI API error:', aiResponse.status, errorText);
        
        let errorMessage = 'Error del servicio de OpenAI';
        if (aiResponse.status === 429) {
          errorMessage = 'Límite de solicitudes de OpenAI excedido. Por favor, intenta de nuevo más tarde.';
        } else if (aiResponse.status === 402) {
          errorMessage = 'Se requiere pago en OpenAI para continuar. Por favor verifica tu cuenta de OpenAI.';
        }
        
        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            response: errorMessage,
            details: errorText 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ AI response received');
      const aiData = await aiResponse.json();
      console.log('📊 Full AI response:', JSON.stringify(aiData, null, 2));
      
      // Check if there's an error in the response
      if (aiData.error) {
        console.error('❌ OpenAI returned error:', aiData.error);
        return new Response(
          JSON.stringify({ 
            error: `Error de OpenAI: ${aiData.error.message || JSON.stringify(aiData.error)}`,
            response: `Error: ${aiData.error.message || 'Error desconocido del servicio de IA'}`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const responseText = aiData.choices?.[0]?.message?.content;
      
      if (!responseText) {
        console.error('❌ No content in AI response. Full response:', JSON.stringify(aiData));
        return new Response(
          JSON.stringify({ 
            error: 'No se recibió respuesta del servicio de IA',
            response: 'Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.',
            debug: aiData
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
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
    } catch (timeoutError: any) {
      if (timeoutError.name === 'AbortError') {
        console.error('⏱️ Request timeout after 55 seconds');
        return new Response(
          JSON.stringify({ 
            error: 'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo.',
            response: 'Tiempo de espera agotado. Por favor, intenta de nuevo.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw timeoutError; // Re-throw other errors
    }

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
