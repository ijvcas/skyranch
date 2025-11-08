
import { EmailContent } from '../interfaces/EmailTypes';
import { BaseEmailTemplate, BaseTemplateData } from './BaseEmailTemplate';

export interface TestEmailData extends BaseTemplateData {
  testType?: 'basic' | 'integration' | 'stress';
}

export class TestEmailTemplate extends BaseEmailTemplate {
  async render(data: TestEmailData): Promise<EmailContent> {
    const testType = data.testType || 'basic';
    const subject = `Test Email - ${data.organizationName || 'SkyRanch'}`;

    const content = `
      <div style="display: flex; justify-content: center; padding: 0 0 16px 0;">
        <div style="background-color: #0ea5e9; padding: 16px 32px; border-radius: 8px; text-align: center; max-width: 400px;">
          <h2 style="color: #ffffff; margin: 0 0 4px 0; font-size: 16px; font-weight: 500;">
            🧪 EMAIL DE PRUEBA
          </h2>
          <p style="color: #e0f2fe; margin: 0; font-size: 12px; font-weight: 400;">
            Verificación del sistema de email
          </p>
        </div>
      </div>

      <div style="padding: 0 0 24px 0;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px; font-weight: 500;">
          Hola ${data.userName || 'Usuario'},
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
          Este es un email de prueba para verificar que el sistema de notificaciones por correo electrónico está funcionando correctamente.
        </p>

        <!-- Test Details Card -->
        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h4 style="color: #0c4a6e; margin: 0 0 16px 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid #0ea5e9; padding-bottom: 8px;">
            🔍 Información de la Prueba
          </h4>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #0c4a6e; display: inline-block; width: 120px; font-size: 13px;">Tipo de prueba:</strong>
            <span style="color: #0369a1; font-size: 13px;">${this.getTestTypeLabel(testType)}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #0c4a6e; display: inline-block; width: 120px; font-size: 13px;">Fecha y hora:</strong>
            <span style="color: #0369a1; font-size: 13px;">${new Date().toLocaleString('es-ES')}</span>
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong style="color: #0c4a6e; display: inline-block; width: 120px; font-size: 13px;">Estado:</strong>
            <span style="color: #059669; font-size: 13px; font-weight: 600;">✅ Exitoso</span>
          </div>
        </div>

        <div style="background-color: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #047857; margin: 0; font-size: 14px; font-weight: 500;">
            ✅ Si recibes este email, el sistema de notificaciones está funcionando correctamente.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 16px;">
            Accede al sistema para gestionar tus preferencias de notificación
          </p>
          <a href="https://ahwhtxygyzoadsmdrwwg.supabase.co/settings" 
             style="background-color: #0ea5e9; 
                    color: white; 
                    text-decoration: none; 
                    padding: 12px 24px; 
                    border-radius: 6px; 
                    font-weight: 500; 
                    font-size: 14px; 
                    display: inline-block;">
            ⚙️ Ver Configuración
          </a>
        </div>
      </div>
    `;

    return await super.render({
      ...data,
      title: subject,
      content
    });
  }

  private getTestTypeLabel(testType: string): string {
    switch (testType) {
      case 'basic': return 'Prueba básica';
      case 'integration': return 'Prueba de integración';
      case 'stress': return 'Prueba de estrés';
      default: return 'Prueba general';
    }
  }
}
