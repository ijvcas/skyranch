import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

export const LanguageSelector = () => {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t('settings:language.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings:language.select')}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('settings:language.current')}
          </label>
          <Select value={language} onValueChange={(value) => changeLanguage(value as Language)}>
            <SelectTrigger className="w-full">
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
      </div>
    </Card>
  );
};
