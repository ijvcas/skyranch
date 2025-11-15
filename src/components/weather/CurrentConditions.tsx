import { useTranslation } from "react-i18next";
import { WiStrongWind, WiHumidity, WiRaindrop, WiThermometer } from "react-icons/wi";

interface CurrentConditionsProps {
  windKph: number | null;
  humidity: number | null;
  precipitationChance: number | null;
  temperatureC: number | null;
  high?: number;
  low?: number;
}

export default function CurrentConditions({ windKph, humidity, precipitationChance, high, low }: CurrentConditionsProps) {
  const { t } = useTranslation();
  
  return (
    <div className="weather-frosted-card">
      <div className="weather-detail-grid">
        <div className="weather-detail-item">
          <WiStrongWind className="weather-detail-icon" />
          <h4 className="weather-detail-label">{t('weather.forecast.wind')}</h4>
          <p className="weather-detail-value">{windKph !== null ? `${Math.round(windKph)} km/h` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiHumidity className="weather-detail-icon" />
          <h4 className="weather-detail-label">{t('weather.forecast.humidity')}</h4>
          <p className="weather-detail-value">{humidity !== null ? `${humidity}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiRaindrop className="weather-detail-icon" />
          <h4 className="weather-detail-label">{t('weather.forecast.rain')}</h4>
          <p className="weather-detail-value">{precipitationChance !== null ? `${precipitationChance}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiThermometer className="weather-detail-icon" />
          <h4 className="weather-detail-label">{t('weather.forecast.min')}/Max</h4>
          <p className="weather-detail-value">
            {high && low ? `${Math.round(low)}° / ${Math.round(high)}°` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
