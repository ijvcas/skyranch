import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log('💾 Save External Pedigree function called');
    
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

    const { pedigreeData, documentUrl } = await req.json();
    
    if (!pedigreeData || !pedigreeData.animalName) {
      throw new Error('Pedigree data with animal name is required');
    }

    console.log('📋 Saving pedigree for:', pedigreeData.animalName);

    // Check for duplicates
    const { data: existing } = await supabase
      .from('animals')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('name', pedigreeData.animalName)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: false,
        error: `Ya existe un animal con el nombre "${pedigreeData.animalName}" en tu base de datos.`,
        existingAnimalId: existing.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare animal data with complete 5-generation pedigree
    const animalData = {
      user_id: user.id,
      name: pedigreeData.animalName,
      species: pedigreeData.species || 'equino',
      breed: pedigreeData.breed || 'Sin especificar',
      gender: pedigreeData.gender || 'unknown',
      birth_date: pedigreeData.birthDate || null,
      tag: pedigreeData.registrationNumber || 'EXTERNAL',
      lifecycle_status: 'candidate',
      
      // Generation 1: Parents
      father_id: pedigreeData.father?.name || null,
      mother_id: pedigreeData.mother?.name || null,
      
      // Generation 2: Grandparents
      paternal_grandfather_id: pedigreeData.paternalGrandfather || null,
      paternal_grandmother_id: pedigreeData.paternalGrandmother || null,
      maternal_grandfather_id: pedigreeData.maternalGrandfather || null,
      maternal_grandmother_id: pedigreeData.maternalGrandmother || null,
      
      // Generation 3: Great-grandparents (8 animals)
      paternal_great_grandfather_paternal_id: pedigreeData.paternalGreatGrandparents?.[0] || null,
      paternal_great_grandmother_paternal_id: pedigreeData.paternalGreatGrandparents?.[1] || null,
      paternal_great_grandfather_maternal_id: pedigreeData.paternalGreatGrandparents?.[2] || null,
      paternal_great_grandmother_maternal_id: pedigreeData.paternalGreatGrandparents?.[3] || null,
      maternal_great_grandfather_paternal_id: pedigreeData.maternalGreatGrandparents?.[0] || null,
      maternal_great_grandmother_paternal_id: pedigreeData.maternalGreatGrandparents?.[1] || null,
      maternal_great_grandfather_maternal_id: pedigreeData.maternalGreatGrandparents?.[2] || null,
      maternal_great_grandmother_maternal_id: pedigreeData.maternalGreatGrandparents?.[3] || null,
      
      notes: `Importado desde documento de pedigrí el ${new Date().toLocaleDateString('es-ES')}${documentUrl ? `\nDocumento: ${documentUrl}` : ''}`
    };

    console.log('📝 Inserting animal with complete pedigree...');

    const { data: newAnimal, error: insertError } = await supabase
      .from('animals')
      .insert(animalData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting animal:', insertError);
      throw insertError;
    }

    console.log('✅ Animal saved successfully:', newAnimal.id);

    return new Response(JSON.stringify({
      success: true,
      animal: {
        id: newAnimal.id,
        name: newAnimal.name,
        breed: newAnimal.breed,
        gender: newAnimal.gender,
        birthDate: newAnimal.birth_date,
        tag: newAnimal.tag
      },
      message: `${newAnimal.name} ha sido guardado exitosamente en Skyranch como candidato de compra.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in save-external-pedigree:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error al guardar el pedigrí',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
