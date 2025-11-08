export const detectWeatherCondition = (conditionText: string): string => {
  const text = conditionText.toLowerCase();
  
  // Thunderstorm patterns
  if (/tormenta|thunderstorm|orage|tempestade/.test(text)) return 'thunderstorm';
  
  // Rain patterns - heavy
  if (/lluvia intensa|heavy rain|pluie forte|chuva forte|aguacero/.test(text)) return 'heavy_rain';
  
  // Rain patterns - light
  if (/lluvia ligera|light rain|pluie légère|chuva leve|llovizna|drizzle|bruine|garoa/.test(text)) return 'light_rain';
  
  // Rain patterns - general
  if (/lluvi|rain|pluie|chuva/.test(text)) return 'rain';
  
  // Snow patterns - heavy
  if (/nevada intensa|heavy snow|neige forte|neve forte/.test(text)) return 'heavy_snow';
  
  // Snow patterns - light
  if (/nieve ligera|light snow|neige légère|neve leve/.test(text)) return 'light_snow';
  
  // Snow patterns - general
  if (/nieve|snow|neige|neve/.test(text)) return 'snow';
  
  // Sleet/Hail
  if (/aguanieve|sleet|grésil|granizo|hail|grêle/.test(text)) return 'sleet';
  
  // Fog/Mist
  if (/niebla|fog|brouillard/.test(text)) return 'fog';
  if (/neblina|mist|brume|névoa/.test(text)) return 'mist';
  
  // Wind
  if (/viento|ventoso|wind|windy|venteux/.test(text)) return 'wind';
  
  // Overcast
  if (/cubierto|overcast|couvert|encoberto/.test(text)) return 'overcast';
  
  // Cloudy
  if (/nublado|nubla|nubes|cloud|nuageux|nublado/.test(text)) return 'cloudy';
  
  // Partly cloudy
  if (/parcial|intervalos|partly|partiellement|parcialmente/.test(text)) return 'partly_cloudy';
  
  // Clear/Sunny
  if (/despejado|clear|dégagé|limpo/.test(text)) return 'clear';
  if (/soleado|sunny|ensoleillé|ensolarado/.test(text)) return 'sunny';
  
  // Default to partly cloudy
  return 'partly_cloudy';
};
