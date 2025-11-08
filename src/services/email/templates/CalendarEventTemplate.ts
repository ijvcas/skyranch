
import { EmailContent } from '../interfaces/EmailTypes';
import { BaseEmailTemplate, BaseTemplateData } from './BaseEmailTemplate';

export interface CalendarEventData extends BaseTemplateData {
  eventType: 'created' | 'updated' | 'deleted' | 'reminder';
  event: {
    title: string;
    description?: string;
    eventDate: string;
    endDate?: string;
    allDay?: boolean;
    eventType?: string;
    location?: string;
    veterinarian?: string;
    reminderMinutes?: number;
  };
}

export class CalendarEventTemplate extends BaseEmailTemplate {
  async render(data: CalendarEventData): Promise<EmailContent> {
    console.log('🎨 [CALENDAR EMAIL TEMPLATE] Rendering clean template with proper time display');
    
    const eventDate = this.formatEventDateTime(data.event.eventDate, data.event.endDate, data.event.allDay);
    const actionText = this.getActionText(data.eventType);
    const subject = this.getSubject(data.eventType, data.event.title);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background-color: #f8fafc; line-height: 1.6; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <!-- Enhanced Header - Bigger Logo/Branding Section -->
          <div style="background-color: #ffffff; padding: 60px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <div style="display: inline-block; margin-bottom: 24px;">
              <img src="https://id-preview--d956216c-86a1-4ff3-9df4-bdfbbabf459a.lovable.app/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png" alt="SkyRanch Logo" style="width: 100px; height: 100px; border-radius: 16px;">
            </div>
            <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #10b981; letter-spacing: 2px;">
              SKYRANCH
            </h1>
            <div style="width: 120px; height: 3px; background: #10b981; margin: 20px auto;"></div>
            <p style="margin: 16px 0 0 0; font-size: 18px; color: #6b7280; font-weight: 500;">
              Sistema de Gestión Ganadera
            </p>
          </div>

          <!-- Smaller Event Notification Header -->
          <div style="background-color: #ffffff; padding: 8px; text-align: center;">
            <div style="display: inline-block; background-color: #10b981; color: white; padding: 4px 8px; border-radius: 3px;">
              <h2 style="margin: 0; font-size: 10px; font-weight: 600; color: #ffffff;">
                🔔 NOTIFICACIÓN DE EVENTO
              </h2>
            </div>
          </div>

          <!-- Main Content -->
          <div style="padding: 25px; background-color: #ffffff;">
            <p style="color: #10b981; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
              Estimado/a ${data.userName || 'Usuario'},
            </p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
              Te informamos que el evento <strong style="color: #10b981;">"${data.event.title}"</strong> ${actionText.toLowerCase()} 
              en el sistema de gestión ganadera SkyRanch.
            </p>

            <!-- Event Title - Clean styling without frames -->
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; font-size: 20px; color: #10b981; font-weight: 600;">
                ${data.event.title}
              </h3>
              <p style="margin: 0; color: #6b7280; font-weight: 500; font-size: 14px;">
                ${actionText}
              </p>
            </div>

            <!-- Event Details -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 8px;">
                📋 Detalles del Evento
              </h4>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; width: 100px; vertical-align: top;">📝 Título:</td>
                  <td style="color: #374151; font-size: 13px; padding: 8px 0;">${data.event.title}</td>
                </tr>
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">📅 Fecha:</td>
                  <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0;">${eventDate}</td>
                </tr>
                ${data.event.eventType ? `
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">🏷️ Tipo:</td>
                  <td style="color: #374151; font-size: 13px; padding: 8px 0;">${this.getEventTypeLabel(data.event.eventType)}</td>
                </tr>
                ` : ''}
                ${data.event.reminderMinutes !== undefined && data.event.reminderMinutes > 0 ? `
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">🔔 Recordatorio:</td>
                  <td style="color: #374151; font-size: 13px; padding: 8px 0;">${this.getReminderText(data.event.reminderMinutes)}</td>
                </tr>
                ` : ''}
                ${data.event.description ? `
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">📄 Descripción:</td>
                  <td style="color: #374141; font-size: 13px; padding: 8px 0;">${data.event.description}</td>
                </tr>
                ` : ''}
                ${data.event.location ? `
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">📍 Ubicación:</td>
                  <td style="color: #374151; font-size: 13px; padding: 8px 0;">${data.event.location}</td>
                </tr>
                ` : ''}
                ${data.event.veterinarian ? `
                <tr>
                  <td style="color: #10b981; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">👨‍⚕️ Veterinario:</td>
                  <td style="color: #374151; font-size: 13px; padding: 8px 0;">${data.event.veterinarian}</td>
                </tr>
                ` : ''}  
              </table>
            </div>

            ${data.eventType !== 'deleted' ? `
            <!-- Call to Action -->
            <div style="background-color: #f0f9f4; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #10b981; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                🌟 Accede al Sistema
              </h3>
              <p style="color: #6b7280; font-size: 13px; margin-bottom: 15px;">
                Gestiona todos tus eventos ganaderos de manera profesional y eficiente
              </p>
              <a href="https://id-preview--d956216c-86a1-4ff3-9df4-bdfbbabf459a.lovable.app/calendar" 
                 style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; 
                        padding: 10px 20px; font-weight: 600; font-size: 13px; border-radius: 6px;">
                 📅 Ver Calendario Completo
              </a>
              <p style="color: #9ca3af; font-size: 10px; margin: 12px 0 0 0; font-style: italic;">
                Tecnología avanzada para el manejo eficiente de ganado
              </p>
            </div>
            ` : ''}
          </div>

          <!-- Clean Footer -->
          <div style="background-color: #f0f9f4; padding: 20px; text-align: center; border-top: 1px solid #d1fae5;">
            <div style="margin-bottom: 15px;">
              <h3 style="color: #10b981; margin: 0 0 8px 0; font-size: 13px; font-weight: 600;">
                Contacto Profesional
              </h3>
              <p style="color: #10b981; margin: 0 0 4px 0; font-size: 12px; font-weight: 600;">
                📧 soporte@skyranch.es
              </p>
              <p style="color: #6b7280; margin: 0; font-size: 10px;">
                Sistema de Gestión Ganadera
              </p>
            </div>
            
            <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 10px; line-height: 1.4;">
              Este es un mensaje automático del sistema <strong style="color: #10b981;">SkyRanch</strong>.<br>
              Por favor, no respondas a este correo electrónico.
            </p>
            
            <p style="color: #9ca3af; margin: 0; font-size: 9px;">
              © ${new Date().getFullYear()} <span style="color: #10b981; font-weight: 600;">SkyRanch</span> - Todos los derechos reservados
            </p>
          </div>
        </div>

        <!-- Background accent -->
        <div style="text-align: center; margin-top: 15px; padding: 12px;">
          <div style="display: inline-block; padding: 6px 12px; background-color: #f0f9f4; border-radius: 15px; border: 1px solid #d1fae5;">
            <p style="color: #10b981; font-size: 9px; margin: 0; font-weight: 600; letter-spacing: 0.3px;">
              🌿 GESTIÓN GANADERA PROFESIONAL 🌿
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Generate simple text version
    const text = `${subject}\n\nEstimado/a ${data.userName || 'Usuario'},\n\nTe informamos que el evento "${data.event.title}" ${actionText.toLowerCase()} en el sistema de gestión ganadera SkyRanch.\n\nDetalles del evento:\n- Título: ${data.event.title}\n- Fecha: ${eventDate}\n${data.event.description ? `- Descripción: ${data.event.description}\n` : ''}${data.event.location ? `- Ubicación: ${data.event.location}\n` : ''}${data.event.veterinarian ? `- Veterinario: ${data.event.veterinarian}\n` : ''}${data.event.reminderMinutes && data.event.reminderMinutes > 0 ? `- Recordatorio: ${this.getReminderText(data.event.reminderMinutes)}\n` : ''}\n\n© ${new Date().getFullYear()} SkyRanch - Sistema de Gestión Ganadera\n\nContacto: soporte@skyranch.es`;

    console.log('✅ [CALENDAR EMAIL TEMPLATE] Template rendered with proper date/time formatting');
    
    return {
      subject,
      html,
      text
    };
  }

  private formatEventDateTime(eventDate: string, endDate?: string, allDay?: boolean): string {
    const startDate = new Date(eventDate);
    
    if (allDay) {
      return startDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) + ' (Todo el día)';
    }

    let dateTimeString = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    dateTimeString += ' a las ' + startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (endDate) {
      const endDateTime = new Date(endDate);
      dateTimeString += ' - ' + endDateTime.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return dateTimeString;
  }

  private getReminderText(minutes: number): string {
    if (minutes === 0) return 'Sin recordatorio';
    if (minutes < 60) return `${minutes} minutos antes`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} horas antes`;
    return `${Math.floor(minutes / 1440)} días antes`;
  }

  private getEventTypeLabel(eventType: string): string {
    const eventTypeMap: Record<string, string> = {
      'reminder': '⏰ Recordatorio',
      'appointment': '📅 Cita',
      'vaccination': '💉 Vacunación',
      'medication': '💊 Medicación',
      'breeding': '🐄 Reproducción',
      'health_check': '🩺 Revisión de Salud',
      'feeding': '🌾 Alimentación',
      'weighing': '⚖️ Pesaje',
      'other': '📝 Otro'
    };

    return eventTypeMap[eventType] || eventType;
  }

  private getActionText(eventType: string): string {
    switch (eventType) {
      case 'created': return 'Se ha creado exitosamente';
      case 'updated': return 'Se ha actualizado correctamente';
      case 'deleted': return 'Se ha cancelado';
      case 'reminder': return 'Recordatorio importante';
      default: return 'Se ha modificado';
    }
  }

  private getSubject(eventType: string, eventTitle: string): string {
    switch (eventType) {
      case 'created': return `✨ Nuevo evento: ${eventTitle}`;
      case 'updated': return `🔄 Evento actualizado: ${eventTitle}`;
      case 'deleted': return `❌ Evento cancelado: ${eventTitle}`;
      case 'reminder': return `⏰ Recordatorio: ${eventTitle}`;
      default: return `📝 Evento: ${eventTitle}`;
    }
  }
}
