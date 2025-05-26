import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as SunCalc from 'suncalc';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [sunsetData, setSunsetData] = useState(null);

  // Obter geolocalização
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          setError("Permissão de localização negada ou erro ao obter dados.");
        }
      );
    } else {
      setError("Geolocalização não é suportada pelo navegador.");
    }
  }, []);

  // Calcular pôr do sol
  useEffect(() => {
    if (location) {
      // Obter horário do pôr do sol
      axios.get(`https://api.sunrise-sunset.org/json?lat=${location.lat}&lng=${location.lng}&formatted=0`)
        .then(response => {
          const sunsetTime = new Date(response.data.results.sunset);
          
          // Calcular direção
          const times = SunCalc.getTimes(new Date(), location.lat, location.lng);
          const sunsetPosition = SunCalc.getPosition(times.sunset, location.lat, location.lng);
          const azimuth = (sunsetPosition.azimuth * 180 / Math.PI + 180) % 360;

          setSunsetData({
            sunsetTime,
            azimuth
          });
        })
        .catch(err => {
          setError("Erro ao buscar dados do pôr do sol.");
        });
    }
  }, [location]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Direção do Pôr do Sol</h1>
        
        {error && <p className="error">{error}</p>}
        
        {!error && !location && <p>Obtendo localização...</p>}
        
        {sunsetData && (
          <div className="sunset-info">
            <div>
              <h2>Horário</h2>
              <p>{sunsetData.sunsetTime.toLocaleTimeString()}</p>
            </div>
            
            <div>
              <h2>Direção</h2>
              <div className="compass">
                <div 
                  className="arrow"
                  style={{ transform: `rotate(${sunsetData.azimuth}deg)` }}
                >↑</div>
              </div>
              <p>{sunsetData.azimuth.toFixed(1)}°</p>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;