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
  const { t } = useTranslation('weather');
  
  return (
    <div className="weather-frosted-card" style={{ padding: '12px 16px' }}>
      <div className="weather-detail-grid" style={{ gap: '12px' }}>
        <div className="weather-detail-item">
          <WiStrongWind style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.wind')}</h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>{windKph !== null ? `${Math.round(windKph)} km/h` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiHumidity style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.humidity')}</h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>{humidity !== null ? `${humidity}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiRaindrop style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.rain')}</h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>{precipitationChance !== null ? `${precipitationChance}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiThermometer style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.min')}/{t('forecast.max')}</h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>
            {high && low ? `${Math.round(low)}° / ${Math.round(high)}°` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
