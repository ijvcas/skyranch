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

    // If file is uploaded, process pedigree first
    if (file) {
      console.log('📄 Processing pedigree file:', file.name);
      
      // Create form data to send to analyze-pedigree function
      const pedigreeFormData = new FormData();
      pedigreeFormData.append('file', file);
      pedigreeFormData.append('fileType', fileType || '');

      const pedigreeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-pedigree`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: pedigreeFormData,
      });

      if (!pedigreeResponse.ok) {
        const errorText = await pedigreeResponse.text();
        console.error('❌ Pedigree analysis error:', errorText);
        
        // Try to parse error details and return proper error message
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.error || 'Error al analizar el pedigrí';
          
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
      
      // AUTO-UPDATE: Check if animal exists in database by name
      if (pedigreeData?.animalName) {
        console.log('🔍 Checking if animal exists:', pedigreeData.animalName);
        
        const { data: existingAnimal } = await supabase
          .from('animals')
          .select('id, name')
          .eq('user_id', user.id)
          .ilike('name', pedigreeData.animalName)
          .maybeSingle();
        
        if (existingAnimal) {
          console.log('✅ Found existing animal, auto-updating pedigree:', existingAnimal.name);
          
          // Call update-animal-pedigree function
          const updateResponse = await fetch(`${supabaseUrl}/functions/v1/update-animal-pedigree`, {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              animalId: existingAnimal.id,
              pedigreeData: pedigreeData
            }),
          });
          
          if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            console.log('✅ Pedigree auto-updated:', updateResult);
            
            // Add metadata to return to frontend
            pedigreeData._autoUpdated = true;
            pedigreeData._updateResult = updateResult;
          } else {
            console.warn('⚠️ Could not auto-update pedigree');
          }
        } else {
          console.log('ℹ️ Animal not found in database, treating as external');
        }
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

    // Special handling for auto-updated pedigree
    if (pedigreeData?._autoUpdated && pedigreeData?._updateResult) {
      const result = pedigreeData._updateResult;
      const stats = result.pedigreeStats;
      
      enhancedSystemPrompt += `\n\n✅ PEDIGRÍ ACTUALIZADO AUTOMÁTICAMENTE:

He actualizado el pedigrí de **${result.animal.name}** en Skyranch:
- ${stats.parents} padres
- ${stats.grandparents} abuelos
- ${stats.greatGrandparents} bisabuelos
- ${stats.gen4 || 0} generación 4
- ${stats.gen5 || 0} generación 5

**TU TAREA:**
1. Confirma al usuario que el pedigrí de ${result.animal.name} ha sido actualizado
2. Resume brevemente los ancestros principales que se agregaron
3. Menciona que puede ver el árbol genealógico completo en la página del animal
4. Sé breve y conversacional

**NO** hagas análisis de consanguinidad ni sugerencias de compra. Solo confirma la actualización del pedigrí.`;
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

    // Prepare messages for AI
    const messages = [
      {
        role: 'system',
        content: enhancedSystemPrompt,
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
          model: 'gpt-4o',
          messages,
          max_tokens: 1500,
          temperature: 0.7,
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
