
import { EmailRequestV2, EmailPayload } from './types.ts';
import { TagManager } from './tagManager.ts';

export class PayloadBuilder {
  static build(request: EmailRequestV2): EmailPayload {
    const recipientDomain = request.to.split('@')[1];
    
    // Use your verified skyranch.es domain
    const fromEmail = "noreply@skyranch.es";
    const fromName = request.senderName || "FARMIKA - Sistema de Gestión Ganadera";

    const finalTags = TagManager.prepareTags(request.metadata?.tags);

    return {
      from: `${fromName} <${fromEmail}>`,
      to: [request.to],
      subject: request.subject,
      html: request.html,
      headers: {
        'X-Entity-Ref-ID': 'farmika-sistema-ganadero-v2',
        'Organization': request.organizationName || 'FARMIKA',
        'X-Mailer': 'FARMIKA Sistema de Gestión Ganadera v2',
        'X-Debug-Domain': recipientDomain,
        'X-Debug-Timestamp': new Date().toISOString(),
        ...(request.metadata?.headers || {})
      },
      tags: finalTags
    };
  }
}
