/**
 * Service Lookup Service
 * Handles non-product barcodes like QR codes with URLs, event tickets, etc.
 */

export interface ServiceQRCode {
  type: 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard' | 'event' | 'unknown';
  raw: string;
  parsed?: {
    url?: string;
    title?: string;
    description?: string;
    favicon?: string;
    email?: string;
    phone?: string;
    text?: string;
    [key: string]: any;
  };
}

export class ServiceLookupService {
  /**
   * Parse QR code data and identify service type
   */
  static async parse(data: string): Promise<ServiceQRCode> {
    // URL detection
    if (this.isURL(data)) {
      return await this.parseURL(data);
    }

    // Email detection
    if (data.startsWith('mailto:')) {
      return this.parseEmail(data);
    }

    // Phone detection
    if (data.startsWith('tel:')) {
      return this.parsePhone(data);
    }

    // SMS detection
    if (data.startsWith('sms:') || data.startsWith('smsto:')) {
      return this.parseSMS(data);
    }

    // WiFi detection
    if (data.startsWith('WIFI:')) {
      return this.parseWiFi(data);
    }

    // vCard detection
    if (data.startsWith('BEGIN:VCARD')) {
      return this.parseVCard(data);
    }

    // Event/Calendar detection
    if (data.startsWith('BEGIN:VEVENT')) {
      return this.parseEvent(data);
    }

    // Plain text
    return {
      type: 'text',
      raw: data,
      parsed: { text: data },
    };
  }

  private static isURL(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return str.startsWith('http://') || str.startsWith('https://');
    }
  }

  private static async parseURL(url: string): Promise<ServiceQRCode> {
    try {
      // Try to fetch metadata (only if CORS allows)
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');

      return {
        type: 'url',
        raw: url,
        parsed: {
          url,
          contentType: contentType || undefined,
        },
      };
    } catch {
      return {
        type: 'url',
        raw: url,
        parsed: { url },
      };
    }
  }

  private static parseEmail(data: string): ServiceQRCode {
    const email = data.replace('mailto:', '').split('?')[0];
    return {
      type: 'email',
      raw: data,
      parsed: { email },
    };
  }

  private static parsePhone(data: string): ServiceQRCode {
    const phone = data.replace('tel:', '');
    return {
      type: 'phone',
      raw: data,
      parsed: { phone },
    };
  }

  private static parseSMS(data: string): ServiceQRCode {
    const parts = data.replace(/^sms(to)?:/, '').split(':');
    return {
      type: 'sms',
      raw: data,
      parsed: {
        phone: parts[0],
        message: parts[1],
      },
    };
  }

  private static parseWiFi(data: string): ServiceQRCode {
    const params: Record<string, string> = {};
    const parts = data.replace('WIFI:', '').split(';');
    
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        params[key] = value;
      }
    });

    return {
      type: 'wifi',
      raw: data,
      parsed: {
        ssid: params.S,
        password: params.P,
        security: params.T,
      },
    };
  }

  private static parseVCard(data: string): ServiceQRCode {
    const lines = data.split('\n');
    const parsed: Record<string, string> = {};

    lines.forEach(line => {
      if (line.startsWith('FN:')) parsed.name = line.replace('FN:', '');
      if (line.startsWith('TEL:')) parsed.phone = line.replace('TEL:', '');
      if (line.startsWith('EMAIL:')) parsed.email = line.replace('EMAIL:', '');
      if (line.startsWith('ORG:')) parsed.organization = line.replace('ORG:', '');
    });

    return {
      type: 'vcard',
      raw: data,
      parsed,
    };
  }

  private static parseEvent(data: string): ServiceQRCode {
    const lines = data.split('\n');
    const parsed: Record<string, string> = {};

    lines.forEach(line => {
      if (line.startsWith('SUMMARY:')) parsed.title = line.replace('SUMMARY:', '');
      if (line.startsWith('DTSTART:')) parsed.start = line.replace('DTSTART:', '');
      if (line.startsWith('DTEND:')) parsed.end = line.replace('DTEND:', '');
      if (line.startsWith('LOCATION:')) parsed.location = line.replace('LOCATION:', '');
    });

    return {
      type: 'event',
      raw: data,
      parsed,
    };
  }
}
