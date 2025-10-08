import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to clean pedigree names (remove "Nº UELN" and other artifacts)
function cleanPedigreeName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  return name
    .replace(/Nº\s*UELN[:\s]*/gi, '')
    .replace(/UELN[:\s]*/gi, '')
    .replace(/\s*\([^)]*\)/g, '') // Remove content in parentheses
    .trim() || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Update Animal Pedigree function called');
    
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

    const { animalId, pedigreeData } = await req.json();
    
    if (!animalId || !pedigreeData) {
      throw new Error('Animal ID and pedigree data are required');
    }

    console.log('📋 Updating pedigree for animal:', animalId);

    // Verify animal belongs to user
    const { data: animal, error: fetchError } = await supabase
      .from('animals')
      .select('id, name, user_id')
      .eq('id', animalId)
      .single();

    if (fetchError || !animal) {
      throw new Error('Animal not found');
    }

    if (animal.user_id !== user.id) {
      throw new Error('Unauthorized: Animal does not belong to user');
    }

    // Prepare pedigree update (only pedigree fields, cleaned)
    const pedigreeUpdate: any = {
      // Generation 1: Parents
      father_id: cleanPedigreeName(pedigreeData.father?.name),
      mother_id: cleanPedigreeName(pedigreeData.mother?.name),
      
      // Generation 2: Grandparents
      paternal_grandfather_id: cleanPedigreeName(pedigreeData.paternalGrandfather),
      paternal_grandmother_id: cleanPedigreeName(pedigreeData.paternalGrandmother),
      maternal_grandfather_id: cleanPedigreeName(pedigreeData.maternalGrandfather),
      maternal_grandmother_id: cleanPedigreeName(pedigreeData.maternalGrandmother),
      
      // Generation 3: Great-grandparents (8 animals)
      paternal_great_grandfather_paternal_id: cleanPedigreeName(pedigreeData.paternalGreatGrandparents?.[0]),
      paternal_great_grandmother_paternal_id: cleanPedigreeName(pedigreeData.paternalGreatGrandparents?.[1]),
      paternal_great_grandfather_maternal_id: cleanPedigreeName(pedigreeData.paternalGreatGrandparents?.[2]),
      paternal_great_grandmother_maternal_id: cleanPedigreeName(pedigreeData.paternalGreatGrandparents?.[3]),
      maternal_great_grandfather_paternal_id: cleanPedigreeName(pedigreeData.maternalGreatGrandparents?.[0]),
      maternal_great_grandmother_paternal_id: cleanPedigreeName(pedigreeData.maternalGreatGrandparents?.[1]),
      maternal_great_grandfather_maternal_id: cleanPedigreeName(pedigreeData.maternalGreatGrandparents?.[2]),
      maternal_great_grandmother_maternal_id: cleanPedigreeName(pedigreeData.maternalGreatGrandparents?.[3]),
    };

    // Count how many fields we're actually populating
    const populatedFields = Object.values(pedigreeUpdate).filter(v => v !== null).length;

    console.log('📝 Updating with', populatedFields, 'pedigree fields...');

    const { data: updatedAnimal, error: updateError } = await supabase
      .from('animals')
      .update(pedigreeUpdate)
      .eq('id', animalId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating animal:', updateError);
      throw updateError;
    }

    console.log('✅ Pedigree updated successfully');

    // Count generations for response
    const generations = {
      parents: (pedigreeUpdate.father_id ? 1 : 0) + (pedigreeUpdate.mother_id ? 1 : 0),
      grandparents: [
        pedigreeUpdate.paternal_grandfather_id,
        pedigreeUpdate.paternal_grandmother_id,
        pedigreeUpdate.maternal_grandfather_id,
        pedigreeUpdate.maternal_grandmother_id
      ].filter(Boolean).length,
      greatGrandparents: [
        pedigreeUpdate.paternal_great_grandfather_paternal_id,
        pedigreeUpdate.paternal_great_grandmother_paternal_id,
        pedigreeUpdate.paternal_great_grandfather_maternal_id,
        pedigreeUpdate.paternal_great_grandmother_maternal_id,
        pedigreeUpdate.maternal_great_grandfather_paternal_id,
        pedigreeUpdate.maternal_great_grandmother_paternal_id,
        pedigreeUpdate.maternal_great_grandfather_maternal_id,
        pedigreeUpdate.maternal_great_grandmother_maternal_id
      ].filter(Boolean).length
    };

    return new Response(JSON.stringify({
      success: true,
      animal: {
        id: updatedAnimal.id,
        name: updatedAnimal.name,
      },
      pedigreeStats: generations,
      message: `Pedigrí de ${animal.name} actualizado: ${generations.parents} padres, ${generations.grandparents} abuelos, ${generations.greatGrandparents} bisabuelos`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in update-animal-pedigree:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error al actualizar el pedigrí',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
