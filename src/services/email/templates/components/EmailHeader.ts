
export class EmailHeader {
  static render(logoUrl: string, organizationName: string): string {
    return `
      <!-- Clean SkyRanch Header -->
      <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%); padding: 24px 16px; text-align: center; position: relative; overflow: hidden;">
        <!-- Logo -->
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-block; margin-bottom: 10px; padding: 6px; background: rgba(255,255,255,0.8); border-radius: 12px; border: 2px solid rgba(17, 102, 61, 0.2);">
            <img src="${logoUrl}" alt="${organizationName} Logo" style="width: 48px; height: 48px; border-radius: 8px; display: block;">
          </div>
          
          <!-- Brand Title -->
          <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #11663d; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; letter-spacing: 0.5px;">
            ${organizationName.toUpperCase()}
          </h1>
          
          <!-- Divider -->
          <div style="width: 40px; height: 1px; background: rgba(17, 102, 61, 0.3); margin: 8px auto;"></div>
          
          <!-- Subtitle -->
          <p style="margin: 0; font-size: 10px; color: #11663d; letter-spacing: 0.4px; text-transform: uppercase; font-weight: 500; opacity: 0.8;">
            Sistema de Gestión Ganadera
          </p>
        </div>
      </div>
    `;
  }
}
