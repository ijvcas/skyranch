
import { useState, useEffect } from 'react';
import type { TimezoneHook, DateFormat, Currency } from './timezone/types';
import { loadSettingsFromStorage, saveToStorage, updateAppSettings } from './timezone/storage';
import { formatDate, formatDateTime, formatDateInput, parseDateInput } from './timezone/dateFormatters';
import { formatCurrency } from './timezone/currencyFormatters';

export const useTimezone = (): TimezoneHook => {
  const [timezone, setTimezoneState] = useState<string>('Europe/Madrid');
  const [dateFormat, setDateFormatState] = useState<DateFormat>('dd/mm/yyyy');
  const [currency, setCurrencyState] = useState<Currency>('EUR');

  const setTimezone = (tz: string) => {
    console.log('🕒 Setting timezone to:', tz);
    setTimezoneState(tz);
    saveToStorage('selectedTimezone', tz);
    updateAppSettings('timezone', tz);
  };

  const setDateFormat = (format: DateFormat) => {
    console.log('📅 Setting date format to:', format);
    setDateFormatState(format);
    saveToStorage('selectedDateFormat', format);
    updateAppSettings('dateFormat', format);
  };

  const setCurrency = (curr: Currency) => {
    console.log('💰 Setting currency to:', curr);
    setCurrencyState(curr);
    saveToStorage('selectedCurrency', curr);
    updateAppSettings('currency', curr);
  };

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettingsFromStorage();
    
    if (settings.timezone !== timezone) {
      console.log('🕒 Loading timezone from storage:', settings.timezone);
      setTimezoneState(settings.timezone);
    }
    
    if (settings.dateFormat !== dateFormat) {
      console.log('📅 Loading date format from storage:', settings.dateFormat);
      setDateFormatState(settings.dateFormat as DateFormat);
    }

    if (settings.currency !== currency) {
      console.log('💰 Loading currency from storage:', settings.currency);
      setCurrencyState(settings.currency as Currency);
    }
  }, []);

  return {
    timezone,
    setTimezone,
    dateFormat,
    setDateFormat,
    currency,
    setCurrency,
    formatDate: (date: Date | string) => formatDate(date, timezone),
    formatDateTime: (date: Date | string) => formatDateTime(date, timezone, dateFormat),
    formatDateInput: (date: string) => formatDateInput(date, dateFormat),
    parseDateInput: (input: string) => parseDateInput(input, dateFormat),
    formatCurrency: (amount: number) => formatCurrency(amount, currency)
  };
};
