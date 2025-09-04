
import type { DateFormat } from './types';

export const formatDate = (date: Date | string, timezone: string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Fecha inválida';
  }
};

export const formatDateTime = (date: Date | string, timezone: string, dateFormat: DateFormat = 'dd/mm/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Get locale based on date format preference
    let locale = 'es-ES'; // default
    let options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    };

    // Set date format options based on user preference
    switch (dateFormat) {
      case 'mm/dd/yyyy':
        locale = 'en-US';
        options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
        break;
      case 'yyyy-mm-dd':
        locale = 'sv-SE'; // Uses ISO format
        options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
        break;
      case 'dd/mm/yyyy':
      default:
        locale = 'es-ES';
        options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' };
        break;
    }
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Fecha inválida';
  }
};

export const formatDateInput = (dateString: string, dateFormat: DateFormat): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (dateFormat) {
      case 'dd/mm/yyyy':
        return `${day}/${month}/${year}`;
      case 'mm/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-mm-dd':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date input:', error);
    return dateString;
  }
};

export const parseDateInput = (input: string, dateFormat: DateFormat): string => {
  if (!input || input.length < 8) return '';
  
  try {
    let day: number, month: number, year: number;
    
    if (dateFormat === 'yyyy-mm-dd') {
      const parts = input.split('-');
      if (parts.length !== 3) return '';
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
      day = parseInt(parts[2]);
    } else {
      const parts = input.split('/');
      if (parts.length !== 3) return '';
      
      if (dateFormat === 'dd/mm/yyyy') {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      } else { // mm/dd/yyyy
        month = parseInt(parts[0]);
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    }
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error parsing date input:', error);
    return '';
  }
};
