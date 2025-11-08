
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
      <div style="background-color: rgba(var(--primary-rgb, 16, 185, 129), 0.1); padding: 12px; text-align: center; margin-bottom: 24px; border-radius: 8px;">
        <p style="margin: 0; font-size: 11px; font-weight: 600; color: currentColor; letter-spacing: 0.5px; text-transform: uppercase;">
          🔔 Notificación de Evento
        </p>
      </div>

      <!-- Main Message -->
      <p style="color: currentColor; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">
        Estimado/a ${data.userName || 'Usuario'},
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
        Te informamos que el evento <strong>"${data.event.title}"</strong> ${actionText.toLowerCase()} 
        en el sistema de gestión ganadera.
      </p>

      <!-- Event Title Card -->
      <div style="background-color: #f8fafc; padding: 24px; text-align: center; margin-bottom: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 8px 0; font-size: 22px; color: currentColor; font-weight: 700;">
          ${data.event.title}
        </h3>
        <p style="margin: 0; color: #6b7280; font-weight: 500; font-size: 14px;">
          ${actionText}
        </p>
      </div>

      <!-- Event Details Table -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: currentColor; padding-bottom: 8px; border-bottom: 2px solid currentColor;">
          📋 Detalles del Evento
        </h4>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; width: 120px; vertical-align: top;">📝 Título:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0;">${data.event.title}</td>
          </tr>
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">📅 Fecha:</td>
            <td style="color: #374151; font-weight: 600; font-size: 13px; padding: 10px 0;">${eventDate}</td>
          </tr>
          ${data.event.eventType ? `
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">🏷️ Tipo:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0;">${this.getEventTypeLabel(data.event.eventType)}</td>
          </tr>
          ` : ''}
          ${data.event.reminderMinutes !== undefined && data.event.reminderMinutes > 0 ? `
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">🔔 Recordatorio:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0;">${this.getReminderText(data.event.reminderMinutes)}</td>
          </tr>
          ` : ''}
          ${data.event.description ? `
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">📄 Descripción:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0; line-height: 1.5;">${data.event.description}</td>
          </tr>
          ` : ''}
          ${data.event.location ? `
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">📍 Ubicación:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0;">${data.event.location}</td>
          </tr>
          ` : ''}
          ${data.event.veterinarian ? `
          <tr>
            <td style="color: currentColor; font-weight: 600; font-size: 13px; padding: 10px 0; vertical-align: top;">👨‍⚕️ Veterinario:</td>
            <td style="color: #374151; font-size: 13px; padding: 10px 0;">${data.event.veterinarian}</td>
          </tr>
          ` : ''}  
        </table>
      </div>

      ${data.eventType !== 'deleted' ? `
      <!-- Call to Action -->
      <div style="background-color: rgba(var(--primary-rgb, 16, 185, 129), 0.08); border: 1px solid rgba(var(--primary-rgb, 16, 185, 129), 0.2); border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <h3 style="color: currentColor; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
          🌟 Accede al Sistema
        </h3>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 16px; line-height: 1.5;">
          Gestiona todos tus eventos ganaderos de manera profesional y eficiente
        </p>
        <a href="https://id-preview--d956216c-86a1-4ff3-9df4-bdfbbabf459a.lovable.app/calendar" 
           style="display: inline-block; background-color: currentColor; color: white; text-decoration: none; 
                  padding: 12px 24px; font-weight: 600; font-size: 13px; border-radius: 6px; transition: opacity 0.2s;">
           📅 Ver Calendario Completo
        </a>
        <p style="color: #9ca3af; font-size: 10px; margin: 12px 0 0 0; font-style: italic;">
          Tecnología avanzada para el manejo eficiente de ganado
        </p>
      </div>
      ` : ''}
    `;
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
