interface RecommendationsProps {
  windKph: number | null;
  temperatureC: number | null;
  precipitationChance: number | null;
}

export default function Recommendations({ windKph, temperatureC, precipitationChance }: RecommendationsProps) {
  const tips: string[] = [];
  
  if (windKph && windKph > 40) {
    tips.push("⚠️ Viento fuerte — asegura cobertizos y estructuras.");
  }
  if (temperatureC && temperatureC > 32) {
    tips.push("🔥 Calor extremo — provee sombra y agua abundante al ganado.");
  }
  if (temperatureC && temperatureC < 0) {
    tips.push("❄️ Temperaturas bajo cero — protege al ganado del frío.");
  }
  if (precipitationChance && precipitationChance > 80) {
    tips.push("💧 Lluvia intensa — mueve el ganado a refugio cubierto.");
  }
  
  if (tips.length === 0) return null;
  
  return (
    <div className="weather-recommendations">
      {tips.map((tip, index) => (
        <p key={index} className="weather-recommendation-item">{tip}</p>
      ))}
    </div>
  );
}
