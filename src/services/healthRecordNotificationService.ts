
import { supabase } from '@/integrations/supabase/client';
import { pushService } from '@/services/notifications/pushService';

class HealthRecordNotificationService {
  // Check for health records due within 7 days and send notifications
  async checkAndSendDueDateNotifications(): Promise<boolean> {
    try {
      console.log('🔄 Checking health records for upcoming due dates...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user for health record notifications');
        return false;
      }

      // Calculate date range for 7 days from now
      const today = new Date();
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);
      
      const todayString = today.toISOString().split('T')[0];
      const sevenDaysString = sevenDaysFromNow.toISOString().split('T')[0];

      console.log(`📅 Checking for health records due between ${todayString} and ${sevenDaysString}`);

      // Get health records with due dates within the next 7 days
      const { data: healthRecords, error } = await supabase
        .from('health_records')
        .select(`
          id,
          title,
          record_type,
          next_due_date,
          animal_id,
          animals!health_records_animal_id_fkey(name)
        `)
        .gte('next_due_date', todayString)
        .lte('next_due_date', sevenDaysString)
        .not('next_due_date', 'is', null);

      console.log('📋 Found health records with upcoming due dates:', healthRecords);

      if (error) {
        console.error('❌ Error fetching health records for notifications:', error);
        return false;
      }

      if (!healthRecords || healthRecords.length === 0) {
        console.log('📋 No health records requiring notifications');
        return true;
      }

      // Send push notification for each record
      let successCount = 0;
      for (const record of healthRecords) {
        const animalName = record.animals?.name || 'Animal desconocido';
        const dueDate = new Date(record.next_due_date);
        const dueDateString = dueDate.toLocaleDateString('es-ES');
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let title, message;
        
        if (daysUntilDue === 0) {
          title = '🚨 Registro de salud vence HOY - SkyRanch';
          message = `${record.title} para ${animalName} vence HOY (${dueDateString}). Revisar urgentemente.`;
        } else if (daysUntilDue === 1) {
          title = '⚠️ Registro de salud vence MAÑANA - SkyRanch';
          message = `${record.title} para ${animalName} vence mañana (${dueDateString}). Preparar para realizar.`;
        } else {
          title = '📅 Registro de salud próximo a vencer - SkyRanch';
          message = `${record.title} para ${animalName} vence en ${daysUntilDue} días (${dueDateString}). Planificar atención.`;
        }
        
        console.log(`📱 Sending health record notification for ${animalName}: ${record.title} (${daysUntilDue} days)`);
        
        const success = await pushService.sendPushNotification(user.id, title, message);

        if (success) {
          console.log(`✅ Health record notification sent for ${animalName}: ${record.title}`);
          successCount++;
        } else {
          console.log(`❌ Failed to send health record notification for ${animalName}: ${record.title}`);
        }

        // Add a small delay between notifications to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`📱 Successfully sent ${successCount} out of ${healthRecords.length} health record notifications`);
      return true;
    } catch (error) {
      console.error('❌ Error in health record notification service:', error);
      return false;
    }
  }

  // Trigger the notification check manually (for testing or immediate checks)
  async triggerNotificationCheck(): Promise<boolean> {
    try {
      console.log('🔄 Triggering health record notification check...');
      return await this.checkAndSendDueDateNotifications();
    } catch (error) {
      console.error('❌ Error triggering health record notifications:', error);
      return false;
    }
  }

  // Check if a specific health record should trigger immediate notification setup
  async checkSingleRecord(healthRecordId: string): Promise<void> {
    try {
      console.log('🔍 Checking health record for notification setup:', healthRecordId);
      
      // Get the health record
      const { data: record, error } = await supabase
        .from('health_records')
        .select('next_due_date, title, animal_id, animals!health_records_animal_id_fkey(name)')
        .eq('id', healthRecordId)
        .single();

      if (error || !record) {
        console.error('❌ Error fetching health record:', error);
        return;
      }

      // Only process records with due dates
      if (!record.next_due_date) {
        console.log('⏭️ Health record has no due date');
        return;
      }

      // Check if due date is within 7 days
      const dueDate = new Date(record.next_due_date);
      const today = new Date();
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`📅 Days until due date: ${daysDifference}`);

      if (daysDifference <= 7 && daysDifference >= 0) {
        console.log('🚨 Health record is due within 7 days, triggering immediate notification check');
        await this.checkAndSendDueDateNotifications();
      } else {
        console.log(`⏰ Health record is due in ${daysDifference} days, will be picked up by daily checks when closer`);
      }
    } catch (error) {
      console.error('❌ Error in health record notification setup:', error);
    }
  }
}

export const healthRecordNotificationService = new HealthRecordNotificationService();
