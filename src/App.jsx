import React, { useState, useEffect, useRef } from 'react';
import * as SunCalc from 'suncalc';
import { getSunsetDirection, normalizeOrientation } from './utils/sunUtils';
import './App.css';

const App = () => {
  const [position, setPosition] = useState(null);
  const [sunAzimuth, setSunAzimuth] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // 1. Obter geolocalização
  useEffect(() => {
    const handleSuccess = (pos) => {
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    };

    const handleError = (err) => {
      setError(err.message || 'Erro ao obter localização');
    };

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000
    });
  }, []);

  // 2. Calcular direção do sol
  useEffect(() => {
    if (position) {
      const azimuth = getSunsetDirection(position.lat, position.lng);
      setSunAzimuth(azimuth);
    }
  }, [position]);

  // 3. Configurar sensor de orientação
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        let alpha = event.alpha;
        if (typeof event.webkitCompassHeading !== 'undefined') {
          alpha = event.webkitCompassHeading;
        }
        setDeviceHeading(normalizeOrientation(alpha));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 4. Abrir aplicativo de câmera
  const handleOpenCamera = () => {
    // Tenta acessar a câmera diretamente pelo navegador
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          // Implementar preview da câmera
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          document.body.appendChild(video);
          
          // Lógica para tirar foto
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Botão de captura
          const captureBtn = document.createElement('button');
          captureBtn.textContent = 'Capturar Foto';
          captureBtn.onclick = () => {
            canvas.getContext('2d').drawImage(video, 0, 0);
            const photo = canvas.toDataURL('image/png');
            // Faça algo com a foto
          };
          
          document.body.appendChild(captureBtn);
        })
        .catch(err => {
          alert(`Erro: ${err.message}`);
        });
    } else {
      alert('Seu navegador não suporta acesso à câmera. Abra o app de câmera manualmente.');
    }
  };
  

  // 5. Calcular ângulo relativo
  const calculateRelativeAngle = () => {
    return (sunAzimuth - deviceHeading + 360) % 360;
  };

  // 6. Verificar alinhamento
  const isAligned = Math.abs(calculateRelativeAngle()) < 5;

  return (
    <div className="app-container">
      <h1>🌅 Guia do Pôr do Sol</h1>
      
      <button 
        className={`camera-button ${cameraActive ? 'active' : ''}`}
        onClick={handleOpenCamera}
      >
        📸 Abrir Câmera
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="compass-wrapper">
        <div className="compass">
          <div 
            className="direction-arrow"
            style={{ transform: `rotate(${calculateRelativeAngle()}deg)` }}
          >
            <div className="sun-indicator">☀️</div>
          </div>
          <div className="alignment-marker"></div>
        </div>

        <div className="info-panel">
          <p>⏱ Horário do pôr do sol: {
            position && 
            new Date(SunCalc.getTimes(new Date(), position.lat, position.lng).sunset)
              .toLocaleTimeString()
          }</p>
          <p>🧭 Direção: {sunAzimuth.toFixed(1)}°</p>
          <div className={`alignment-feedback ${isAligned ? 'aligned' : ''}`}>
            {isAligned ? '⭐ ALINHADO! ⭐' : 'Gire o dispositivo... ➡️'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;