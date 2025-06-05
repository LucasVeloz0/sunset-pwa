import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [position, setPosition] = useState(null);
  const [sunAzimuth, setSunAzimuth] = useState(0);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isDaytime, setIsDaytime] = useState(false);
  const [sunTimes, setSunTimes] = useState({ 
    sunrise: null, 
    sunset: null, 
    solarNoon: null 
  });

  // Referências para elementos DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const notificationTimeout = useRef(null);

  // Estados para notificações
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationScheduled, setNotificationScheduled] = useState(false);

  // ======================================================================
  // EFEITOS PARA INICIALIZAÇÃO E GERENCIAMENTO DE RECURSOS
  // ======================================================================

  /**
   * Efeito para obtenção da geolocalização do usuário.
   * Executa apenas uma vez na montagem do componente.
   */  
  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  // Obter geolocalização do usuário
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
  // Calcular direção do sol
  useEffect(() => {
    if (position) {
      // Calcula o azimute do pôr do sol usando a biblioteca SunCalc
      const azimuth = getSunsetDirection(position.lat, position.lng);
      setSunAzimuth(azimuth);
    }
  }, [position]);
  /**
   * Efeito para configuração do sensor de orientação.
   * Adiciona listener para eventos de orientação do dispositivo.
   */

  // Configurar sensor de orientação
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        let alpha = event.alpha;
        // Tratamento especial para iOS (webkitCompassHeading)
        if (typeof event.webkitCompassHeading !== 'undefined') {
          alpha = event.webkitCompassHeading;
        }

        // Normaliza e atualiza a direção do dispositivo
        setDeviceHeading(normalizeOrientation(alpha));
      }
    };

    // Verifica suporte ao sensor
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setError('Sensor de orientação não suportado neste dispositivo');
    }
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Verificar se é dia ou noite e calcular horários do sol
  useEffect(() => {
    if (position) {
      const updateSunData = () => {
        const now = new Date();
        const times = SunCalc.getTimes(now, position.lat, position.lng);
        const sunPos = SunCalc.getPosition(now, position.lat, position.lng);
        
        setSunTimes({
          sunrise: times.sunrise,
          sunset: times.sunset,
          solarNoon: times.solarNoon
        });
        setIsDaytime(sunPos.altitude > 0);
      };
      
      updateSunData();
      const interval = setInterval(updateSunData, 60000);
      
      return () => {
        clearInterval(interval);
        // Limpar timeout ao desmontar
        if (notificationTimeout.current) {
          clearTimeout(notificationTimeout.current);
        }
      };
    }
  }, [position]);

    /**
   * Efeito para controle da câmera.
   * Gerencia ciclo de vida do stream de vídeo:
   * - Inicia câmera quando cameraActive é true
   * - Para stream quando desativado ou ao desmontar
   * - Alterna entre câmeras quando facingMode muda
   */
  // Agendar notificação quando os horários do sol mudarem
  useEffect(() => {
    if (sunTimes.sunset && notificationPermission === 'granted' && !notificationScheduled) {
      scheduleSunsetNotification();
    }
  }, [sunTimes, notificationPermission, notificationScheduled]);

  // Função para agendar notificação do pôr do sol
  const scheduleSunsetNotification = useCallback(() => {
    // Limpar notificações anteriores
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    if (!sunTimes.sunset) return;

    // Calcular 15 minutos antes do pôr do sol
    const notificationTime = new Date(sunTimes.sunset.getTime() - 15 * 60000);
    const now = new Date();
    
    // Verificar se o horário ainda não passou
    if (notificationTime <= now) return;
    
    const timeUntilNotification = notificationTime - now;
    
    notificationTimeout.current = setTimeout(() => {
      if (notificationPermission === 'granted') {
        new Notification('O pôr do sol está próximo!', {
          body: 'Faltam 15 minutos para o pôr do sol. Prepare-se para capturar uma foto perfeita!',
          icon: '/sunset-icon.png'
        });
      }
      // Resetar estado para permitir novo agendamento
      setNotificationScheduled(false);
    }, timeUntilNotification);
    
    setNotificationScheduled(true);
  }, [sunTimes, notificationPermission]);

  // Controle da câmera
  useEffect(() => {
    let stream = null;
    
    const startCamera = async () => {
      try {
        // Evita múltiplas inicializações
        if (videoRef.current && videoRef.current.srcObject) {
          return;
        }
        
        // Configurações da câmera
        const constraints = {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        // Antes de pedir novo stream, pare o anterior se existir
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        // Agora peça o novo stream normalmente

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        // Configura elemento de vídeo        
        
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

    // Inicia câmera se estiver ativa    
    if (cameraActive) {
      startCamera();
    }

    // Limpeza: para todos os tracks ao desmontar ou mudar dependências
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, facingMode]);

  // ======================================================================
  // FUNÇÕES DE CONTROLE DA CÂMERA
  // ======================================================================

  /** Alterna entre câmeras frontal e traseira */
  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  /** Captura uma foto do vídeo atual e gera data URL */  
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Verifica se o vídeo está pronto    
    if (video && canvas && video.readyState >= 2) {
      // Configura canvas com dimensões do vídeo      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Aplica flip horizontal apenas para câmera frontal      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      // Captura frame atual do vídeo      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Gera URL da imagem e atualiza estado      
      setPhoto(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  /** Fecha a câmera e libera recursos */  
  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      // Para todos os tracks de mídia
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null; 
    }
    setCameraActive(false);
    setPhoto(null);
  };

  // Limpeza global
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      // Limpar timeout ao desmontar
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, []);

  // ======================================================================
  // FUNÇÕES DE CÁLCULO E RENDERIZAÇÃO
  // ======================================================================

  /** 
   * Calcula ângulo relativo entre direção do sol e dispositivo 
   * @ returns number Ângulo em graus 0-360
    */
  const calculateRelativeAngle = () => {
    let relativeAngle = (sunAzimuth - deviceHeading + 360) % 360;
  
  // Suaviza a transição quando passa pelo ponto 0/360
    if (relativeAngle > 180) {
      relativeAngle -= 360;
    }
    return relativeAngle;
  };

  /** Verifica se dispositivo está alinhado com o sol (margem de 15 graus) */  
  const isAligned = Math.abs(calculateRelativeAngle()) < 15;

  // ======================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // ======================================================================

  return (
    <div className={`app-container ${isDaytime ? 'day-theme' : 'night-theme'}`}>
      <h1>🌅 Localizando o Pôr do Sol</h1>
          {/* Seção de informações solares */}
      
      <div className="sun-info">
        <div className="info-card">
          <span>☀️ Nascer do sol</span>
          <strong>{formatTime(sunTimes?.sunrise)}</strong>
        </div>
        <div className="info-card">
          <span>🌇 Pôr do sol</span>
          <strong>{formatTime(sunTimes?.sunset)}</strong>
        </div>
      </div>
      {/* Área da câmera */}
      
      {cameraActive && (
        <div className="camera-container">
          <video
            ref={videoRef}
            className={`camera-preview${facingMode === 'user' ? ' mirrored' : ''}`}
            playsInline
            muted
          />

          <div className="camera-controls">
            <button className="camera-btn" onClick={toggleCamera} aria-label="Alternar câmera">
              🔄
            </button>
            <button className="camera-btn capture-btn" onClick={capturePhoto} aria-label="Capturar foto">
              ⭕
            </button>
            <button className="camera-btn" onClick={closeCamera} aria-label="Fechar câmera">
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
              <button onClick={() => setPhoto(null)} className="close-button">
                ❌ Fechar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bússola digital e informações */}
      <div className="compass-wrapper">
        <div className="compass">
          {/* Seta direcional que aponta para o sol */}          
          <div 
            className="direction-arrow" 
            style={{ transform: `rotate(${calculateRelativeAngle()}deg)` }}
          >
            <div className="sun-indicator">☀️</div>
          </div>
          {/* Marcador de alinhamento */}          
          <div className="alignment-marker"></div>
        </div>

        {/* Botão para ativar câmera */}
        {!cameraActive && (
          <button 
            className="main-camera-btn"
            onClick={() => setCameraActive(true)}
          >
            📸 Ativar Câmera
          </button>
        )}

        {/* Painel de informações */}
        <div className="info-panel">
         
          {/* Direção do sol */}          
          <p>🧭 Direção: {sunAzimuth.toFixed(1)}°</p>
          {/* Feedback de alinhamento */}          
          <div className={`alignment-feedback ${isAligned ? 'aligned' : ''}`}>
            {isAligned ? '⭐ ALINHADO! ⭐' : 'Gire o dispositivo... ➡️'}
          </div>
        </div>
      </div>

      {/* Exibição de erros */}
      {error && <div className="error-banner">{error}</div>}
      
      {/* Canvas oculto para captura de fotos */}      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Função utilitária para formatar horários
function formatTime(date) {
  if (!date) return '--:--';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default App;