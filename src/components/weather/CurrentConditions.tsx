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
  return (
    <div className="weather-frosted-card">
      <div className="weather-detail-grid">
        <div className="weather-detail-item">
          <WiStrongWind className="weather-detail-icon" />
          <h4 className="weather-detail-label">Viento</h4>
          <p className="weather-detail-value">{windKph ? `${Math.round(windKph)} km/h` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiHumidity className="weather-detail-icon" />
          <h4 className="weather-detail-label">Humedad</h4>
          <p className="weather-detail-value">{humidity ? `${humidity}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiRaindrop className="weather-detail-icon" />
          <h4 className="weather-detail-label">Lluvia</h4>
          <p className="weather-detail-value">{precipitationChance ? `${precipitationChance}%` : "N/A"}</p>
        </div>
        <div className="weather-detail-item">
          <WiThermometer className="weather-detail-icon" />
          <h4 className="weather-detail-label">Min/Max</h4>
          <p className="weather-detail-value">
            {high && low ? `${Math.round(low)}° / ${Math.round(high)}°` : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
