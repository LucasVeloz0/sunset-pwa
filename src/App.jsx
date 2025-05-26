import React, { useState, useEffect } from 'react';
import * as SunCalc from 'suncalc';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [sunsetData, setSunsetData] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [error, setError] = useState(null);

  // 1. Obter geolocalização
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (err) => setError("Ative a localização para usar o app")
        );
      } else {
        setError("Geolocalização não suportada");
      }
    };
    getLocation();
  }, []);

  // 2. Calcular direção do pôr do sol
  useEffect(() => {
    if (location) {
      const now = new Date();
      const times = SunCalc.getTimes(now, location.lat, location.lng);
      const sunsetPos = SunCalc.getPosition(times.sunset, location.lat, location.lng);
      const azimuth = (sunsetPos.azimuth * 180 / Math.PI + 180) % 360;
      
      setSunsetData({
        time: times.sunset.toLocaleTimeString(),
        azimuth
      });
    }
  }, [location]);

  // 3. Configurar sensor de orientação
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.alpha !== null) {
        setDeviceOrientation(360 - e.alpha); // Normaliza para 0-360°
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 4. Calcular ângulo relativo
  const calculateRelativeAngle = () => {
    if (!sunsetData) return 0;
    return (sunsetData.azimuth - deviceOrientation + 360) % 360;
  };

  const isAligned = () => {
    const delta = Math.abs(relativeAngle);
    return delta < 15 || delta > 345; // margem de erro de ±15°
  };

  const relativeAngle = calculateRelativeAngle();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bússola do Pôr do Sol</h1>
        
        {error && <p className="error">{error}</p>}

        {sunsetData && (
          <div className="compass-container">
            <div className="compass">
              <div className="compass-circle">
              <div 
  className={`arrow ${isAligned() ? 'aligned' : ''}`} 
  style={{ transform: `rotate(${relativeAngle}deg)` }}
>
  <div className="arrow-head">▲</div>
                </div>
                <div className="sun-icon">☀️</div>
              </div>
            </div>
            
            <div className="info">
              <p>Horário: {sunsetData.time}</p>
              <p>Direção: {sunsetData.azimuth.toFixed(1)}°</p>
              <p className="help">Gire o celular para alinhar a bússola</p>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
