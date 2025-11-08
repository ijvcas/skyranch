
export class EmailHeader {
  static render(logoUrl: string, organizationName: string): string {
    return `
      <!-- Simple Centered Header -->
      <div style="padding: 40px 20px 20px; text-align: center; background-color: #ffffff;">
        <img src="${logoUrl}" alt="${organizationName}" style="width: 80px; height: 80px; margin: 0 auto 16px; display: block;">
        <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: #10b981; letter-spacing: 2px;">
          ${organizationName}
        </h1>
        <div style="width: 200px; height: 3px; background-color: #10b981; margin: 0 auto 12px;"></div>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          Sistema de Gestión Ganadera
        </p>
      </div>
    `;
  }
}
