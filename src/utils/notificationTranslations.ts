// Utility for translating notification text patterns
// This helps maintain consistency across notification translations

export const notificationPatterns = {
  calendar: {
    es: /Evento programado:/,
    en: /Scheduled Event:/,
    pt: /Evento Agendado:/,
    fr: /Événement Programmé:/
  },
  health: {
    es: /Recordatorio de salud:/,
    en: /Health Reminder:/,
    pt: /Lembrete de Saúde:/,
    fr: /Rappel de Santé:/
  },
  breeding: {
    es: /Actualización de reproducción/,
    en: /Breeding Update/,
    pt: /Atualização de Reprodução/,
    fr: /Mise à Jour de Reproduction/
  }
};

export const detectNotificationLanguage = (title: string): string => {
  for (const [type, patterns] of Object.entries(notificationPatterns)) {
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(title)) {
        return lang;
      }
    }
  }
  return 'es'; // Default to Spanish
};

export const translateNotificationText = (
  text: string, 
  fromLang: string, 
  toLang: string
): string => {
  if (fromLang === toLang) return text;
  
  const translations: Record<string, Record<string, string>> = {
    es: {
      'Evento programado:': 'Evento programado:',
      'Tienes un evento programado': 'Tienes un evento programado',
      'para': 'para',
      'Acción requerida': 'Acción requerida'
    },
    en: {
      'Evento programado:': 'Scheduled Event:',
      'Tienes un evento programado': 'You have a scheduled event',
      'para': 'for',
      'Acción requerida': 'Action Required'
    },
    pt: {
      'Evento programado:': 'Evento Agendado:',
      'Tienes un evento programado': 'Você tem um evento agendado',
      'para': 'para',
      'Acción requerida': 'Ação Necessária'
    },
    fr: {
      'Evento programado:': 'Événement Programmé:',
      'Tienes un evento programado': 'Vous avez un événement programmé',
      'para': 'pour',
      'Acción requerida': 'Action Requise'
    }
  };

  const sourceDict = translations[fromLang];
  const targetDict = translations[toLang];
  
  if (!sourceDict || !targetDict) return text;
  
  let translated = text;
  Object.keys(sourceDict).forEach(key => {
    if (text.includes(key)) {
      translated = translated.replace(new RegExp(key, 'g'), targetDict[key]);
    }
  });
  
  return translated;
};
