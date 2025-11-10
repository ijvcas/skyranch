
import { BreedingRecord, User, NotificationResult } from './types.ts';

// Simple i18n for edge function
const translations: Record<string, Record<string, string>> = {
  es: {
    overdueTitle: '🚨 Parto vencido',
    overdueMessage: '{{motherName}} tenía fecha de parto el {{dueDate}} ({{daysDifference}} días vencido). Es urgente revisar y registrar el parto si ya ocurrió.',
    todayTitle: '🚨 Parto hoy',
    todayMessage: '{{motherName}} está programada para dar a luz HOY ({{dueDate}}). Mantén vigilancia constante y área de parto preparada.',
    upcomingTitle: '🤰 Parto próximo',
    upcomingMessage: '{{motherName}} está programada para dar a luz en {{daysDifference}} días ({{dueDate}}). Prepara el área de parto y mantén atención veterinaria disponible.'
  },
  en: {
    overdueTitle: '🚨 Overdue Birth',
    overdueMessage: '{{motherName}} was due to give birth on {{dueDate}} ({{daysDifference}} days overdue). It is urgent to check and register the birth if it has already occurred.',
    todayTitle: '🚨 Birth Today',
    todayMessage: '{{motherName}} is scheduled to give birth TODAY ({{dueDate}}). Maintain constant surveillance and have the birthing area prepared.',
    upcomingTitle: '🤰 Upcoming Birth',
    upcomingMessage: '{{motherName}} is scheduled to give birth in {{daysDifference}} days ({{dueDate}}). Prepare the birthing area and keep veterinary attention available.'
  },
  pt: {
    overdueTitle: '🚨 Parto Atrasado',
    overdueMessage: '{{motherName}} estava prevista para dar à luz em {{dueDate}} ({{daysDifference}} dias de atraso). É urgente verificar e registrar o parto se já ocorreu.',
    todayTitle: '🚨 Parto Hoje',
    todayMessage: '{{motherName}} está programada para dar à luz HOJE ({{dueDate}}). Mantenha vigilância constante e área de parto preparada.',
    upcomingTitle: '🤰 Parto Próximo',
    upcomingMessage: '{{motherName}} está programada para dar à luz em {{daysDifference}} dias ({{dueDate}}). Prepare a área de parto e mantenha atenção veterinária disponível.'
  },
  fr: {
    overdueTitle: '🚨 Mise Bas En Retard',
    overdueMessage: '{{motherName}} devait mettre bas le {{dueDate}} ({{daysDifference}} jours de retard). Il est urgent de vérifier et d\'enregistrer la mise bas si elle a déjà eu lieu.',
    todayTitle: '🚨 Mise Bas Aujourd\'hui',
    todayMessage: '{{motherName}} est prévue pour mettre bas AUJOURD\'HUI ({{dueDate}}). Maintenez une surveillance constante et préparez la zone de mise bas.',
    upcomingTitle: '🤰 Mise Bas Prochaine',
    upcomingMessage: '{{motherName}} est prévue pour mettre bas dans {{daysDifference}} jours ({{dueDate}}). Préparez la zone de mise bas et gardez l\'attention vétérinaire disponible.'
  }
};

const t = (key: string, lang: string, vars?: Record<string, string>): string => {
  let text = translations[lang]?.[key] || translations['es'][key] || key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
  }
  return text;
};

export class NotificationService {
  constructor(private supabase: any) {}

  async sendNotificationsForPregnancies(
    breedingRecords: BreedingRecord[],
    users: User[],
    motherMap: Record<string, string>,
    today: Date
  ): Promise<NotificationResult> {
    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const record of breedingRecords) {
      const motherName = motherMap[record.mother_id] || 'Animal desconocido';
      const dueDate = new Date(record.expected_due_date);
      const dueDateString = dueDate.toLocaleDateString('es-ES');
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine if overdue or upcoming
      const isOverdue = daysUntilDue < 0;
      const daysDifference = Math.abs(daysUntilDue);

      const { notificationTitle, notificationMessage } = this.generateNotificationContent(
        motherName, 
        dueDateString, 
        isOverdue, 
        daysDifference, 
        daysUntilDue
      );

      console.log(`🤰 Processing pregnancy for ${motherName}: ${isOverdue ? 'overdue' : 'upcoming'} (${daysDifference} days)`);

      for (const user of users) {
        try {
          // Get user's language preference (default to 'es')
          const userLanguage = user.preferred_language || 'es';
          
          // Generate translated content
          const { notificationTitle: translatedTitle, notificationMessage: translatedMessage } = 
            this.generateNotificationContent(motherName, dueDateString, isOverdue, daysDifference, daysUntilDue, userLanguage);
          
          // Check if we already sent a notification for this pregnancy today
          const alreadySent = await this.checkIfNotificationSentToday(user.id, motherName, today);
          
          if (alreadySent) {
            console.log(`⏭️ Notification already sent today for ${motherName} to user ${user.email}`);
            continue;
          }

          // Create in-app notification
          const success = await this.createNotification(
            user.id,
            translatedTitle,
            translatedMessage,
            motherName,
            record,
            daysDifference,
            isOverdue
          );

          if (success) {
            console.log(`✅ Notification created for ${user.email} about ${motherName} in ${userLanguage}`);
            notificationsSent++;
          } else {
            notificationsFailed++;
          }
        } catch (error) {
          console.error(`❌ Error processing notification for user ${user.email}:`, error);
          notificationsFailed++;
        }
      }
    }

    return { notificationsSent, notificationsFailed };
  }

  private generateNotificationContent(
    motherName: string,
    dueDateString: string,
    isOverdue: boolean,
    daysDifference: number,
    daysUntilDue: number,
    language: string = 'es'
  ): { notificationTitle: string; notificationMessage: string } {
    let notificationMessage: string;
    let notificationTitle: string;

    if (isOverdue) {
      notificationTitle = t('overdueTitle', language);
      notificationMessage = t('overdueMessage', language, { 
        motherName, 
        dueDate: dueDateString, 
        daysDifference: String(daysDifference) 
      });
    } else if (daysUntilDue === 0) {
      notificationTitle = t('todayTitle', language);
      notificationMessage = t('todayMessage', language, { 
        motherName, 
        dueDate: dueDateString 
      });
    } else {
      notificationTitle = t('upcomingTitle', language);
      notificationMessage = t('upcomingMessage', language, { 
        motherName, 
        dueDate: dueDateString, 
        daysDifference: String(daysDifference) 
      });
    }

    return { notificationTitle, notificationMessage };
  }

  private async checkIfNotificationSentToday(userId: string, motherName: string, today: Date): Promise<boolean> {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingNotifications } = await this.supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'breeding')
      .like('message', `%${motherName}%`)
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    return existingNotifications && existingNotifications.length > 0;
  }

  private async createNotification(
    userId: string,
    title: string,
    message: string,
    motherName: string,
    record: BreedingRecord,
    daysDifference: number,
    isOverdue: boolean
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'breeding',
        priority: 'high', // All pregnancy notifications are high priority
        title: title,
        message: message,
        read: false,
        action_required: true,
        animal_name: motherName,
        metadata: {
          breeding_record_id: record.id,
          due_date: record.expected_due_date,
          days_difference: daysDifference,
          is_overdue: isOverdue
        }
      });

    return !error;
  }
}
