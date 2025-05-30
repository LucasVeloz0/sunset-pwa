import React, { useState, useEffect, useRef } from 'react';
import * as SunCalc from 'suncalc';
import { getSunsetDirection, normalizeOrientation } from './utils/sunUtils';
import './App.css';


/**
 * Componente principal do aplicativo Guia Fotográfico do Pôr do Sol.
 * Gerencia:
 * - Geolocalização do usuário
 * - Cálculo da direção do sol
 * - Orientação do dispositivo
 * - Controle de câmera e captura de fotos
 * - Interface de bússola digital
 */

const App = () => {
  // Estados do aplicativo
  const [position, setPosition] = useState(null); // Armazena {lat, lng} do usuário
  const [sunAzimuth, setSunAzimuth] = useState(0); // Direção do sol em graus (0-360)
  const [deviceHeading, setDeviceHeading] = useState(0); // Direção do dispositivo em graus (0-360)
  const [error, setError] = useState(null); // Mensagens de erro
  const [cameraActive, setCameraActive] = useState(false); // Controle de estado da câmera
  const [photo, setPhoto] = useState(null); // URL da foto capturada
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (traseira) ou 'user' (frontal)

  // Referências para elementos DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // ======================================================================
  // EFEITOS PARA INICIALIZAÇÃO E GERENCIAMENTO DE RECURSOS
  // ======================================================================

  /**
   * Efeito para obtenção da geolocalização do usuário.
   * Executa apenas uma vez na montagem do componente.
   */  
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

    // Verifica suporte a geolocalização
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return;
    }

    // Solicita localização com alta precisão
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000
    });
  }, []);

  /**
   * Efeito para cálculo da direção do sol.
   * Executa sempre que a posição do usuário muda.
   */
  useEffect(() => {
    if (position) {
      // Calcula o azimute do pôr do sol usando a biblioteca SunCalc
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

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setError('Sensor de orientação não suportado neste dispositivo');
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // 4. Controle da câmera com useEffect
  useEffect(() => {
    let stream = null;
    
    const startCamera = async () => {
      try {
        if (videoRef.current && videoRef.current.srcObject) {
          return; // Já está ativo
        }
        
        const constraints = {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(err => {
              setError('Erro ao reproduzir vídeo: ' + err.message);
            });
          };
        }
      } catch (err) {
        setError('Erro ao acessar câmera: ' + err.message);
        setCameraActive(false);
      }
    };

    if (cameraActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPhoto(null);
  };

  // Efeito de limpeza global
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 5. Cálculos de direção
  const calculateRelativeAngle = () => {
    return (sunAzimuth - deviceHeading + 360) % 360;
  };

  const isAligned = Math.abs(calculateRelativeAngle()) < 5;

  return (
    <div className="app-container">
      <h1>🌅 Amantes do Pôr do Sol</h1>

      {cameraActive && (
        <div className="camera-container">
          <video
            ref={videoRef}
            className="camera-preview"
            playsInline
            muted
          />
          
          <div className="camera-controls">
            <button className="camera-btn flip-btn" onClick={toggleCamera}>
              🔄
            </button>
            <button className="camera-btn capture-btn" onClick={capturePhoto}>
              ⭕
            </button>
            <button className="camera-btn close-btn" onClick={closeCamera}>
              ✖
            </button>
          </div>

          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="Foto capturada" />
              <a 
                href={photo} 
                download={`por-do-sol-${Date.now()}.jpg`}
                className="download-button"
              >
                ⬇️ Baixar
              </a>

                <button 
                 onClick={() => setPhoto(null)} 
                  className="close-button" >
                  ❌ Fechar
                 </button>
            </div>
          )}
        </div>
      )}

      {!cameraActive && (
        <button 
          className="main-camera-btn"
          onClick={() => setCameraActive(true)}
        >
          📸 Ativar Câmera
        </button>
      )}

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

      {error && <div className="error-banner">{error}</div>}
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default App;