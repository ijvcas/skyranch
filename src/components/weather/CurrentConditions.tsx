import { useTranslation } from "react-i18next";
import { WiStrongWind, WiHumidity, WiRaindrop, WiThermometer, WiBarometer, WiDaySunny } from "react-icons/wi";

interface CurrentConditionsProps {
  windKph: number | null;
  humidity: number | null;
  precipitationChance: number | null;
  precipitationMm?: number | null;
  temperatureC: number | null;
  feelsLikeC?: number | null;
  high?: number;
  low?: number;
  uvIndex?: number | null;
  pressureHpa?: number | null;
  windDirection?: number | null;
  windCardinal?: string | null;
  windGustKph?: number | null;
}

export default function CurrentConditions({ 
  windKph, 
  humidity, 
  precipitationChance, 
  precipitationMm,
  feelsLikeC,
  high, 
  low,
  uvIndex,
  pressureHpa,
  windCardinal,
  windGustKph,
}: CurrentConditionsProps) {
  const { t } = useTranslation('weather');

  // Format wind display with direction and gusts
  const formatWind = () => {
    if (windKph === null) return "N/A";
    let wind = `${windKph.toFixed(1)} km/h`;
    if (windCardinal) wind = `${windCardinal} ${wind}`;
    if (windGustKph) wind += ` (${t('forecast.gusts')} ${windGustKph.toFixed(1)})`;
    return wind;
  };

  // Format precipitation with amount
  const formatPrecip = () => {
    if (precipitationChance === null) return "N/A";
    let precip = `${precipitationChance}%`;
    if (precipitationMm && precipitationMm > 0) {
      precip += ` (${precipitationMm.toFixed(1)}mm)`;
    }
    return precip;
  };

  // Get UV level description
  const getUvLevel = (uv: number) => {
    if (uv <= 2) return t('forecast.uvLow');
    if (uv <= 5) return t('forecast.uvModerate');
    if (uv <= 7) return t('forecast.uvHigh');
    if (uv <= 10) return t('forecast.uvVeryHigh');
    return t('forecast.uvExtreme');
  };
  
  return (
    <div className="weather-frosted-card" style={{ padding: '12px 16px' }}>
      <div className="weather-detail-grid" style={{ gap: '12px' }}>
        {/* Wind */}
        <div className="weather-detail-item">
          <WiStrongWind style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.wind')}</h4>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>{formatWind()}</p>
        </div>

        {/* Humidity */}
        <div className="weather-detail-item">
          <WiHumidity style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.humidity')}</h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>{humidity !== null ? `${humidity}%` : "N/A"}</p>
        </div>

        {/* Precipitation */}
        <div className="weather-detail-item">
          <WiRaindrop style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.rain')}</h4>
          <p style={{ fontSize: '18px', fontWeight: '600' }}>{formatPrecip()}</p>
        </div>

        {/* Min/Max or Feels Like */}
        <div className="weather-detail-item">
          <WiThermometer style={{ fontSize: '32px', color: 'white' }} />
          <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>
            {high && low ? `${t('forecast.min')}/${t('forecast.max')}` : t('forecast.feelsLike')}
          </h4>
          <p style={{ fontSize: '22px', fontWeight: '600' }}>
            {high && low 
              ? `${low.toFixed(1)}° / ${high.toFixed(1)}°`
              : feelsLikeC !== null && feelsLikeC !== undefined
                ? `${feelsLikeC.toFixed(1)}°`
                : "N/A"
            }
          </p>
        </div>

        {/* UV Index - only show if available */}
        {uvIndex !== null && uvIndex !== undefined && (
          <div className="weather-detail-item">
            <WiDaySunny style={{ fontSize: '32px', color: '#FBB040' }} />
            <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.uvIndex')}</h4>
            <p style={{ fontSize: '22px', fontWeight: '600' }}>{uvIndex}</p>
            <small style={{ fontSize: '10px', opacity: 0.6 }}>{getUvLevel(uvIndex)}</small>
          </div>
        )}

        {/* Pressure - only show if available */}
        {pressureHpa !== null && pressureHpa !== undefined && (
          <div className="weather-detail-item">
            <WiBarometer style={{ fontSize: '32px', color: 'white' }} />
            <h4 style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 2px' }}>{t('forecast.pressure')}</h4>
            <p style={{ fontSize: '22px', fontWeight: '600' }}>{pressureHpa.toFixed(0)} hPa</p>
          </div>
        )}
      </div>
    </div>
  );
}
