
import { EmailRequestV2 } from './types.ts';

export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MAX_EMAIL_LENGTH = 255;
  private static readonly MAX_SUBJECT_LENGTH = 200;
  private static readonly MAX_HTML_LENGTH = 100000;
  private static readonly MAX_SENDER_NAME_LENGTH = 100;
  private static readonly MAX_ORG_NAME_LENGTH = 100;

  static validate(request: EmailRequestV2): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate 'to' field
    if (!request.to) {
      errors.push('Missing required field: to');
    } else {
      if (typeof request.to !== 'string') {
        errors.push('Email address must be a string');
      } else if (request.to.length > this.MAX_EMAIL_LENGTH) {
        errors.push(`Email address exceeds maximum length of ${this.MAX_EMAIL_LENGTH} characters`);
      } else if (!this.EMAIL_REGEX.test(request.to)) {
        errors.push('Invalid email address format');
      }
    }

    // Validate 'subject' field
    if (!request.subject) {
      errors.push('Missing required field: subject');
    } else {
      if (typeof request.subject !== 'string') {
        errors.push('Subject must be a string');
      } else if (request.subject.trim().length === 0) {
        errors.push('Subject cannot be empty or whitespace only');
      } else if (request.subject.length > this.MAX_SUBJECT_LENGTH) {
        errors.push(`Subject exceeds maximum length of ${this.MAX_SUBJECT_LENGTH} characters`);
      }
    }

    // Validate 'html' field
    if (!request.html) {
      errors.push('Missing required field: html');
    } else {
      if (typeof request.html !== 'string') {
        errors.push('HTML content must be a string');
      } else if (request.html.trim().length === 0) {
        errors.push('HTML content cannot be empty or whitespace only');
      } else if (request.html.length > this.MAX_HTML_LENGTH) {
        errors.push(`HTML content exceeds maximum length of ${this.MAX_HTML_LENGTH} characters`);
      }
    }

    // Validate optional fields
    if (request.senderName && typeof request.senderName === 'string') {
      if (request.senderName.length > this.MAX_SENDER_NAME_LENGTH) {
        errors.push(`Sender name exceeds maximum length of ${this.MAX_SENDER_NAME_LENGTH} characters`);
      }
    }

    if (request.organizationName && typeof request.organizationName === 'string') {
      if (request.organizationName.length > this.MAX_ORG_NAME_LENGTH) {
        errors.push(`Organization name exceeds maximum length of ${this.MAX_ORG_NAME_LENGTH} characters`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
