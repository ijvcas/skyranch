
import { EmailContent, EmailTemplate } from '../interfaces/EmailTypes';
import { EmailTemplateRenderer } from './core/EmailTemplateRenderer';

export interface BaseTemplateData {
  userName?: string;
  organizationName?: string;
  logoUrl?: string;
  title: string;
  content: string;
}

export class BaseEmailTemplate implements EmailTemplate {
  protected renderer: EmailTemplateRenderer;

  constructor() {
    this.renderer = new EmailTemplateRenderer();
  }

  async render(data: BaseTemplateData): Promise<EmailContent> {
    return await this.renderer.renderFullTemplate(data);
  }

  protected htmlToText(html: string): string {
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
