import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage, LANGUAGES, type Language } from '@/hooks/useLanguage';

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();
  const currentLang = LANGUAGES[language as Language];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xl">
          {currentLang?.flag || '🌐'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
            <Button
              key={code}
              variant={language === code ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => changeLanguage(code as Language)}
            >
              <span className="mr-2">{flag}</span>
              <span>{name}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageToggle;
