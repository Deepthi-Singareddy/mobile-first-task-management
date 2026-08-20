import React from 'react';
import { CloudSun, Droplets, Wind, Thermometer } from 'lucide-react';

const WeatherBadge = ({ weather, compact = false }) => {
  if (!weather) return null;

  const iconUrl = weather.icon
    ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
    : null;

  if (compact) {
    return (
      <div className="weather-badge-compact">
        {iconUrl ? (
          <img src={iconUrl} alt={weather.description} className="weather-icon-sm" />
        ) : (
          <CloudSun size={14} />
        )}
        <span>{weather.temp}°C</span>
        <span className="weather-desc">{weather.description}</span>
      </div>
    );
  }

  return (
    <div className="weather-badge">
      <div className="weather-badge-header">
        <CloudSun size={18} />
        <span>Weather in {weather.cityName}{weather.country ? `, ${weather.country}` : ''}</span>
      </div>
      <div className="weather-badge-body">
        {iconUrl && (
          <img src={iconUrl} alt={weather.description} className="weather-icon" />
        )}
        <div className="weather-info">
          <div className="weather-temp">
            <Thermometer size={16} />
            <span className="weather-temp-value">{weather.temp}°C</span>
            {weather.feelsLike !== undefined && (
              <span className="weather-feels">Feels like {weather.feelsLike}°C</span>
            )}
          </div>
          <p className="weather-description">{weather.description}</p>
          <div className="weather-details">
            {weather.humidity !== undefined && (
              <span className="weather-detail">
                <Droplets size={14} />
                {weather.humidity}%
              </span>
            )}
            {weather.windSpeed !== undefined && (
              <span className="weather-detail">
                <Wind size={14} />
                {weather.windSpeed} m/s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherBadge;
