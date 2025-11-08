
// Core email system type definitions
export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailMetadata {
  senderName?: string;
  organizationName?: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

export interface EmailRequest {
  to: EmailAddress | EmailAddress[];
  from?: EmailAddress;
  content: EmailContent;
  metadata?: EmailMetadata;
  eventDetails?: EventDetails;
}

export interface EventDetails {
  title: string;
  description?: string;
  eventDate: string;
  eventType?: string;
  location?: string;
  veterinarian?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface EmailTemplate {
  render(data: any): Promise<EmailContent>;
}

export interface EmailTransport {
  send(request: EmailRequest): Promise<EmailResult>;
}

export interface EmailLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
}
