import React, { useState, useEffect, useRef } from 'react';
import * as SunCalc from 'suncalc';
import { getSunsetDirection, normalizeOrientation } from './utils/sunUtils';
import './App.css';

const App = () => {
  const [position, setPosition] = useState(null);
  const [sunAzimuth, setSunAzimuth] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [error, setError] = useState(null);
  const [arMode, setArMode] = useState(false);
  const videoRef = useRef(null);

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
        // Correção para iOS
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

  // 4. Ativar modo AR
  const activateAR = async () => {
    try {
      const constraints = { video: true }; // Câmera padrão do dispositivo

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            setError('Falha ao iniciar a câmera: ' + err.message);
          });
        };
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              setError('Falha ao iniciar a câmera: ' + err.message);
            });
          }
        }, 500);
      }
      setArMode(true);
    } catch (err) {
      console.error('Erro AR:', err);
      if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera foi encontrada neste dispositivo.');
      } else if (err.name === 'NotAllowedError') {
        setError('Permissão para acessar a câmera negada.');
      } else {
        setError(`Código: ${err.name} - ${err.message}`);
      }
      setArMode(false);
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
      {arMode && (
        <video 
          ref={videoRef}
          className="ar-video"
          autoPlay
          playsInline
        />
      )}

      <h1>🌅 Caçador de Pôr do Sol</h1>
      
      <button 
        className="ar-button"
        onClick={() => {
          if (arMode) {
            setArMode(false);
            if (videoRef.current && videoRef.current.srcObject) {
              // Para a câmera ao sair do modo AR
              const tracks = videoRef.current.srcObject.getTracks();
              tracks.forEach(track => track.stop());
              videoRef.current.srcObject = null;
            }
          } else {
            activateAR();
          }
        }}
      >
        {arMode ? '📷 Sair do AR' : '🌍 Modo AR'}
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className={`compass-wrapper ${arMode ? 'ar-active' : ''}`}>
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