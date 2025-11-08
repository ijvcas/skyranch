
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
    console.log('🎨 [CALENDAR EMAIL TEMPLATE] Rendering template with farm branding colors');
    
    const eventDate = this.formatEventDateTime(data.event.eventDate, data.event.endDate, data.event.allDay);
    const actionText = this.getActionText(data.eventType);
    const subject = this.getSubject(data.eventType, data.event.title);
    
    // Build content HTML for the template renderer
    const content = this.buildEventContent(data, eventDate, actionText);

    // Use the parent renderer which fetches farm colors
    return await this.renderer.renderFullTemplate({
      userName: data.userName,
      organizationName: data.organizationName,
      logoUrl: data.logoUrl,
      title: subject,
      content
    });
  }

  private buildEventContent(data: CalendarEventData, eventDate: string, actionText: string): string {
    
    return `
      <!-- Event Notification Badge -->
      <div style="background-color: currentColor; padding: 16px; text-align: center; margin-bottom: 32px; border-radius: 8px;">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: white; letter-spacing: 0.5px; text-transform: uppercase;">
          🔔 NOTIFICACIÓN DE EVENTO
        </p>
      </div>

      <!-- Main Message -->
      <p style="color: #374151; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
        Estimado/a ${data.userName || 'Usuario'},
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; line-height: 1.6;">
        Te informamos que el evento <strong>"${data.event.title}"</strong> ${actionText.toLowerCase()}.
      </p>

      <!-- Event Details -->
      <div style="background-color: #f9fafb; border-left: 4px solid currentColor; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #111827; font-weight: 700;">
          📅 ${data.event.title}
        </h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">
          ${actionText}
        </p>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0; width: 100px; vertical-align: top;">📅 Fecha:</td>
              <td style="color: #111827; font-weight: 600; font-size: 13px; padding: 8px 0;">${eventDate}</td>
            </tr>
            ${data.event.eventType ? `
            <tr>
              <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">🏷️ Tipo:</td>
              <td style="color: #111827; font-size: 13px; padding: 8px 0;">${this.getEventTypeLabel(data.event.eventType)}</td>
            </tr>
            ` : ''}
            ${data.event.description ? `
            <tr>
              <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">📄 Detalles:</td>
              <td style="color: #111827; font-size: 13px; padding: 8px 0; line-height: 1.5;">${data.event.description}</td>
            </tr>
            ` : ''}
            ${data.event.location ? `
            <tr>
              <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">📍 Ubicación:</td>
              <td style="color: #111827; font-size: 13px; padding: 8px 0;">${data.event.location}</td>
            </tr>
            ` : ''}
            ${data.event.veterinarian ? `
            <tr>
              <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 8px 0; vertical-align: top;">👨‍⚕️ Veterinario:</td>
              <td style="color: #111827; font-size: 13px; padding: 8px 0;">${data.event.veterinarian}</td>
            </tr>
            ` : ''}  
          </table>
        </div>
      </div>

      ${data.eventType !== 'deleted' ? `
      <!-- Call to Action -->
      <div style="text-align: center; margin: 32px 0;">
        <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">
          📲 Agregar al Calendario:
        </p>
        <div style="margin-bottom: 16px;">
          <a href="${this.generateGoogleCalendarLink(data)}" 
             target="_blank"
             style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; 
                    padding: 12px 24px; font-weight: 600; font-size: 13px; border-radius: 6px; margin: 4px;">
             📅 Google Calendar
          </a>
          <a href="${this.generateOutlookCalendarLink(data)}" 
             target="_blank"
             style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; 
                    padding: 12px 24px; font-weight: 600; font-size: 13px; border-radius: 6px; margin: 4px;">
             📅 Outlook
          </a>
        </div>
        <a href="https://id-preview--d956216c-86a1-4ff3-9df4-bdfbbabf459a.lovable.app/calendar" 
           style="display: inline-block; color: #10b981; text-decoration: none; font-size: 13px; font-weight: 500;">
           🌐 Ver Calendario Completo →
        </a>
      </div>
      ` : ''}
    `;
  }

  private generateGoogleCalendarLink(data: CalendarEventData): string {
    const event = data.event;
    const startDate = new Date(event.eventDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: event.description || '',
      location: event.location || ''
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  private generateOutlookCalendarLink(data: CalendarEventData): string {
    const event = data.event;
    const startDate = new Date(event.eventDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const formatOutlookDate = (date: Date) => {
      return date.toISOString();
    };

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: formatOutlookDate(startDate),
      enddt: formatOutlookDate(endDate),
      body: event.description || '',
      location: event.location || ''
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
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
