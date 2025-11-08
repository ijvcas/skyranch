import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimezone } from '@/hooks/useTimezone';
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';
import { Clock, Calendar, Euro, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RegionalSettings = () => {
  const { timezone, setTimezone, dateFormat, setDateFormat, currency, setCurrency } = useTimezone();
  const { language, changeLanguage } = useLanguage();
  const { t } = useTranslation();

  const timezones = [
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'America/Lima', label: 'Lima, Peru (UTC-5)' },
    { value: 'America/Mexico_City', label: 'Mexico City (UTC-6)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Australia/Sydney', label: 'Sydney (UTC+10)' },
  ];

  const dateFormats = [
    { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY (Europeo)' },
    { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY (Americano)' },
    { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD (ISO)' },
  ];

  const currencies = [
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'USD', label: 'Dólar Americano ($)', symbol: '$' },
    { value: 'COP', label: 'Peso Colombiano (COP)', symbol: '$' },
    { value: 'MXN', label: 'Peso Mexicano (MX$)', symbol: '$' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          <CardTitle>{t('settings:regional.title')}</CardTitle>
        </div>
        <CardDescription>
          {t('settings:regional.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language */}
        <div>
          <Label htmlFor="language" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('settings:language.title')}
          </Label>
          <Select value={language} onValueChange={(value) => changeLanguage(value as Language)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span>{flag}</span>
                    <span>{name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone */}
        <div>
          <Label htmlFor="timezone" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('settings:regional.timezone')}
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('settings:regional.selectTimezone')} />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Format */}
        <div>
          <Label htmlFor="dateFormat" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('settings:regional.dateFormat')}
          </Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('settings:regional.selectDateFormat')} />
            </SelectTrigger>
            <SelectContent>
              {dateFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency */}
        <div>
          <Label htmlFor="currency" className="flex items-center gap-2">
            <Euro className="w-4 h-4" />
            {t('settings:regional.currency')}
          </Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('settings:regional.selectCurrency')} />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Current Settings Display */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded space-y-1">
          <p className="font-semibold mb-2">{t('settings:regional.currentSettings')}</p>
          <p><strong>{t('settings:regional.currentTimezone')}</strong> {timezone}</p>
          <p><strong>{t('settings:regional.currentDateFormat')}</strong> {dateFormat}</p>
          <p><strong>{t('settings:regional.currentCurrency')}</strong> {currencies.find(c => c.value === currency)?.label || 'Euro (€)'}</p>
          <p><strong>{t('settings:regional.localTime')}</strong> {new Date().toLocaleString('es-ES', { timeZone: timezone })}</p>
          <p><strong>{t('settings:regional.dateExample')}</strong> {
            (() => {
              const today = new Date();
              const day = today.getDate().toString().padStart(2, '0');
              const month = (today.getMonth() + 1).toString().padStart(2, '0');
              const year = today.getFullYear();
              
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
            })()
          }</p>
          <p><strong>{t('settings:regional.currencyExample')}</strong> {currencies.find(c => c.value === currency)?.symbol || '€'}1.234,56</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegionalSettings;
