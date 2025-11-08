
import { EmailContent } from '../../interfaces/EmailTypes';
import { EmailContentBuilder } from './EmailContentBuilder';
import { supabase } from '@/integrations/supabase/client';

export class EmailTemplateRenderer {
  private readonly defaultLogoUrl = "https://id-preview--d956216c-86a1-4ff3-9df4-bdfbbabf459a.lovable.app/lovable-uploads/953e2699-9daf-4fea-86c8-e505a1e54eb3.png";
  private readonly defaultOrganizationName = "SkyRanch";
  private readonly defaultPrimaryColor = "#10b981";

  async renderFullTemplate(data: {
    userName?: string;
    organizationName?: string;
    logoUrl?: string;
    title: string;
    content: string;
  }): Promise<EmailContent> {
    // Fetch farm branding colors from database
    const { data: farmProfile } = await supabase
      .from('farm_profiles')
      .select('theme_primary_color, theme_secondary_color, farm_logo_url, farm_name')
      .single();

    const primaryColor = farmProfile?.theme_primary_color || this.defaultPrimaryColor;
    const logoUrl = data.logoUrl || farmProfile?.farm_logo_url || this.defaultLogoUrl;
    const organizationName = data.organizationName || farmProfile?.farm_name || this.defaultOrganizationName;
    const currentYear = new Date().getFullYear();

    const header = EmailContentBuilder.buildHeader(logoUrl, organizationName, primaryColor);
    const contentSection = `<div style="padding: 32px 28px;">${data.content}</div>`;
    const footer = EmailContentBuilder.buildFooter(organizationName, currentYear, primaryColor);
    const backgroundPattern = EmailContentBuilder.buildBackgroundPattern(primaryColor);

    const bodyContent = EmailContentBuilder.wrapInContainer(header + contentSection + footer) + backgroundPattern;

    const html = EmailContentBuilder.getEmailDoctype() + 
                 `<title>${data.title}</title>` +
                 bodyContent + 
                 EmailContentBuilder.getEmailClosing();

    // Generate simple text version
    const text = this.htmlToText(data.content);

    return {
      subject: data.title,
      html,
      text: `${data.title}\n\n${text}\n\n© ${currentYear} ${organizationName} - Sistema de Gestión Ganadera\n\nContacto: soporte@skyranch.es`
    };
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}
