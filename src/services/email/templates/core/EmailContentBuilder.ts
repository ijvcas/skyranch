
import { BaseTemplateData } from '../BaseEmailTemplate';

// Helper to convert hex color to HSL format for email gradients
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHsl = (r: number, g: number, b: number): string => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

const hexToHsl = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'hsl(142, 71%, 45%)'; // Default green fallback
  return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

export class EmailContentBuilder {
  static buildHeader(logoUrl: string, organizationName: string, primaryColor: string = '#10b981'): string {
    const primaryHsl = hexToHsl(primaryColor);
    const lighterPrimary = primaryColor + 'dd'; // Add transparency for lighter shade
    
    return `
      <!-- Clean SkyRanch Header -->
      <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}ee 25%, ${primaryColor}cc 75%, ${primaryColor}99 100%); padding: 40px 24px; text-align: center; position: relative; overflow: hidden;">
        <!-- Subtle background pattern -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"80\" height=\"80\" viewBox=\"0 0 80 80\"%3E%3Ccircle cx=\"40\" cy=\"40\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.08\"/%3E%3Ccircle cx=\"15\" cy=\"15\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.12\"/%3E%3Ccircle cx=\"65\" cy=\"65\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.12\"/%3E%3C/svg%3E'); opacity: 0.4;"></div>
        
        <!-- Logo -->
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-block; margin-bottom: 16px; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 16px; border: 2px solid rgba(255,255,255,0.2);">
            <img src="${logoUrl}" alt="${organizationName} Logo" style="width: 60px; height: 60px; border-radius: 12px; display: block;">
          </div>
          
          <!-- Brand Title -->
          <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.2); letter-spacing: 1px;">
            ${organizationName.toUpperCase()}
          </h1>
          
          <!-- Divider -->
          <div style="width: 60px; height: 1px; background: rgba(255,255,255,0.6); margin: 12px auto;"></div>
          
          <!-- Subtitle -->
          <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.9); letter-spacing: 0.5px; text-transform: uppercase; font-weight: 500;">
            Sistema de Gestión Ganadera
          </p>
        </div>
      </div>
    `;
  }

  static buildFooter(organizationName: string, currentYear: number, primaryColor: string = '#10b981'): string {
    return `
      <!-- Clean SkyRanch Footer -->
      <div style="background: #f8fafc; padding: 32px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <!-- Contact Information -->
        <div style="margin-bottom: 20px;">
          <h3 style="color: ${primaryColor}; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;">
            Contacto Profesional
          </h3>
          <div style="background: ${primaryColor}1a; padding: 12px 18px; border-radius: 8px; display: inline-block; border: 1px solid ${primaryColor}33;">
            <p style="color: ${primaryColor}; margin: 0 0 4px 0; font-size: 13px; font-weight: 600;">
              📧 soporte@skyranch.es
            </p>
            <p style="color: #6b7280; margin: 0; font-size: 11px;">
              Sistema de Gestión Ganadera
            </p>
          </div>
        </div>
        
        <!-- Disclaimer -->
        <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 11px; line-height: 1.5;">
          Este es un mensaje automático del sistema <strong style="color: ${primaryColor};">${organizationName}</strong>.<br>
          Por favor, no respondas a este correo electrónico.
        </p>
        
        <!-- Copyright -->
        <p style="color: #9ca3af; margin: 0; font-size: 10px;">
          © ${currentYear} <span style="color: ${primaryColor}; font-weight: 600;">${organizationName}</span> - Todos los derechos reservados
        </p>
      </div>
    `;
  }

  static buildBackgroundPattern(primaryColor: string = '#10b981'): string {
    return `
      <!-- Background accent -->
      <div style="text-align: center; margin-top: 20px; padding: 16px;">
        <div style="display: inline-block; padding: 8px 16px; background: ${primaryColor}0d; border-radius: 20px; border: 1px solid ${primaryColor}26;">
          <p style="color: ${primaryColor}; font-size: 10px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">
            🌿 GESTIÓN GANADERA PROFESIONAL 🌿
          </p>
        </div>
      </div>
    `;
  }

  static wrapInContainer(content: string): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${content}
      </div>
    `;
  }

  static getEmailDoctype(): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    `;
  }

  static getEmailClosing(): string {
    return `
      </body>
      </html>
    `;
  }
}
