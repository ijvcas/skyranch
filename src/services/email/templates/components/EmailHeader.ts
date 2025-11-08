
export class EmailHeader {
  static render(logoUrl: string, organizationName: string): string {
    return `
      <!-- Simple Header -->
      <div style="padding: 20px; text-align: center; background-color: #f9fafb;">
        <img src="${logoUrl}" alt="${organizationName}" style="width: 60px; height: 60px; margin: 0 auto; display: block;">
        <h2 style="margin: 12px 0 4px 0; font-size: 18px; font-weight: 700; color: #11663d;">
          ${organizationName}
        </h2>
        <p style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">
          Sistema de Gestión Ganadera
        </p>
      </div>
    `;
  }
}
