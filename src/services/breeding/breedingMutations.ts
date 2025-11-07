
import { supabase } from '@/integrations/supabase/client';
import { pregnancyNotificationService } from '@/services/pregnancyNotificationService';
import { BreedingRecordInput, BreedingRecordUpdate } from './types';
import { createOffspringAnimals } from './offspringAnimalService';

export const deleteBreedingRecord = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('breeding_records')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting breeding record:', error);
    return false;
  }

  return true;
};

export const updateBreedingRecord = async (
  id: string, 
  updatedData: BreedingRecordUpdate
): Promise<boolean> => {
  // Auto-update status to birth_completed when actual birth date is set
  let finalStatus = updatedData.status;
  if (updatedData.actualBirthDate && !finalStatus) {
    finalStatus = 'birth_completed';
    console.log('🍼 Auto-updating status to birth_completed because birth date was set');
  } else if (updatedData.actualBirthDate && finalStatus !== 'birth_completed') {
    finalStatus = 'birth_completed';
    console.log('🍼 Overriding status to birth_completed because birth date was set');
  }

  const { error } = await supabase
    .from('breeding_records')
    .update({
      ...(updatedData.motherId !== undefined && { mother_id: updatedData.motherId }),
      ...(updatedData.fatherId !== undefined && { father_id: updatedData.fatherId }),
      ...(updatedData.breedingDate && { breeding_date: updatedData.breedingDate }),
      ...(updatedData.breedingMethod && { breeding_method: updatedData.breedingMethod }),
      ...(updatedData.expectedDueDate !== undefined && { expected_due_date: updatedData.expectedDueDate || null }),
      ...(updatedData.actualBirthDate !== undefined && { actual_birth_date: updatedData.actualBirthDate || null }),
      ...(updatedData.pregnancyConfirmed !== undefined && { pregnancy_confirmed: updatedData.pregnancyConfirmed }),
      ...(updatedData.pregnancyConfirmationDate !== undefined && { pregnancy_confirmation_date: updatedData.pregnancyConfirmationDate || null }),
      ...(updatedData.pregnancyMethod !== undefined && { pregnancy_method: updatedData.pregnancyMethod || null }),
      ...(updatedData.offspringCount !== undefined && { offspring_count: updatedData.offspringCount }),
      ...(updatedData.breedingNotes !== undefined && { breeding_notes: updatedData.breedingNotes || null }),
      ...(updatedData.veterinarian !== undefined && { veterinarian: updatedData.veterinarian || null }),
      ...(updatedData.cost !== undefined && { cost: updatedData.cost || null }),
      status: finalStatus || updatedData.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating breeding record:', error);
    return false;
  }

  // Auto-create offspring animals if birth is confirmed and offspring count > 0
  if (updatedData.actualBirthDate && (updatedData.offspringCount || 0) > 0) {
    try {
      console.log('🍼 Birth confirmed with offspring, creating animal records...');
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for animal creation');
      } else {
        // Get the breeding record to access parent IDs
        const { data: breedingRecord } = await supabase
          .from('breeding_records')
          .select('mother_id, father_id')
          .eq('id', id)
          .single();

        if (breedingRecord) {
          const animalIds = await createOffspringAnimals({
            breedingRecordId: id,
            motherId: breedingRecord.mother_id,
            fatherId: breedingRecord.father_id,
            actualBirthDate: updatedData.actualBirthDate,
            offspringCount: updatedData.offspringCount || 0,
            userId: user.id
          });

          if (animalIds.length > 0) {
            console.log(`✅ Successfully created ${animalIds.length} offspring animal records`);
          }
        }
      }
    } catch (animalCreationError) {
      console.error('Error creating offspring animals:', animalCreationError);
      // Don't fail the breeding record update if animal creation fails
    }
  }

  // Handle notification logic based on changes
  if (updatedData.pregnancyConfirmed === true && !updatedData.actualBirthDate) {
    console.log('🤰 Pregnancy confirmed, setting up notifications');
    await pregnancyNotificationService.checkAndSetupNotifications(id);
  } else if (updatedData.actualBirthDate || finalStatus === 'birth_completed') {
    console.log('👶 Birth completed, notifications will stop automatically due to status/birth date');
    
    // Mark related notifications as read to reduce noise
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('type', 'breeding')
          .like('metadata', `%"breeding_record_id":"${id}"%`);
        console.log('📝 Marked related pregnancy notifications as read');
      }
    } catch (notificationError) {
      console.error('Error marking notifications as read:', notificationError);
      // Don't fail the update for notification errors
    }
  }

  return true;
};

export const createBreedingRecord = async (
  recordData: BreedingRecordInput
): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  // Auto-update status to birth_completed if birth date is provided on creation
  let finalStatus = recordData.status || 'planned';
  if (recordData.actualBirthDate) {
    finalStatus = 'birth_completed';
    console.log('🍼 Auto-setting status to birth_completed because birth date was provided');
  }

  const { data, error } = await supabase
    .from('breeding_records')
    .insert({
      user_id: user.id,
      mother_id: recordData.motherId,
      father_id: recordData.fatherId,
      breeding_date: recordData.breedingDate,
      breeding_method: recordData.breedingMethod,
      expected_due_date: recordData.expectedDueDate || null,
      actual_birth_date: recordData.actualBirthDate || null,
      pregnancy_confirmed: recordData.pregnancyConfirmed || false,
      pregnancy_confirmation_date: recordData.pregnancyConfirmationDate || null,
      pregnancy_method: recordData.pregnancyMethod || null,
      offspring_count: recordData.offspringCount || 0,
      breeding_notes: recordData.breedingNotes || null,
      veterinarian: recordData.veterinarian || null,
      cost: recordData.cost || null,
      status: finalStatus
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating breeding record:', error);
    return null;
  }

  const recordId = data.id;

  // Auto-create financial entry if cost exists
  if (recordData.cost && recordData.cost > 0) {
    try {
      await supabase.from('farm_ledger').insert({
        transaction_type: 'expense',
        reference_id: recordId,
        reference_type: 'breeding_record',
        amount: -Math.abs(recordData.cost),
        description: `Reproducción: ${recordData.breedingMethod}`,
        transaction_date: recordData.breedingDate,
        user_id: user.id,
        category: 'Reproducción',
        payment_method: 'cash',
        metadata: { 
          mother_id: recordData.motherId, 
          father_id: recordData.fatherId,
          veterinarian: recordData.veterinarian 
        }
      });
    } catch (ledgerError) {
      console.error('Error creating ledger entry:', ledgerError);
      // Don't fail the breeding record creation
    }
  }

  // Auto-create offspring animals if birth date is provided and offspring count > 0 on creation
  if (recordData.actualBirthDate && (recordData.offspringCount || 0) > 0) {
    try {
      console.log('🍼 New breeding record with birth confirmed, creating animal records...');
      
      const animalIds = await createOffspringAnimals({
        breedingRecordId: recordId,
        motherId: recordData.motherId,
        fatherId: recordData.fatherId,
        actualBirthDate: recordData.actualBirthDate,
        offspringCount: recordData.offspringCount || 0,
        userId: user.id
      });

      if (animalIds.length > 0) {
        console.log(`✅ Successfully created ${animalIds.length} offspring animal records on creation`);
      }
    } catch (animalCreationError) {
      console.error('Error creating offspring animals on creation:', animalCreationError);
      // Don't fail the breeding record creation if animal creation fails
    }
  }

  // Check if pregnancy is confirmed on creation and no birth date
  if (recordData.pregnancyConfirmed && !recordData.actualBirthDate) {
    console.log('🤰 New pregnancy confirmed, setting up notifications');
    await pregnancyNotificationService.checkAndSetupNotifications(recordId);
  }

  return recordId;
};
