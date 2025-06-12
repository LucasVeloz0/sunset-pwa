import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as SunCalc from 'suncalc';
import { getCurrentSunAzimuth, getCurrentMoonAzimuth, normalizeOrientation, smoothAngle, normalizeAngle } from './utils/sunUtils';
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
  const [celestialBody, setCelestialBody] = useState('sun'); // 'sun' ou 'moon'
  const [moonAzimuth, setMoonAzimuth] = useState(0);
  const [moonTimes, setMoonTimes] = useState({ 
    moonrise: null, 
    moonset: null 
  });

  const [moonPhase, setMoonPhase] = useState({
    fraction: 0,
    phase: 0,
    emoji: '🌑'
  });

  // Referências para elementos DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const notificationTimeout = useRef(null);

  // Estados para notificações
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationScheduled, setNotificationScheduled] = useState(false);

    // Novos estados para suavização
const [smoothedSunAngle, setSmoothedSunAngle] = useState(deviceHeading || 0);
const [smoothedMoonAngle, setSmoothedMoonAngle] = useState(deviceHeading || 0);

    // ======================================================================
  // FUNÇÕES UTILITÁRIAS PARA A LUA
  // ======================================================================
  
  /**
   * Determina o emoji da fase lunar com base na fração iluminada
   * @param {number} fraction - Fração iluminada (0 a 1)
   * @returns {string} Emoji representando a fase lunar
   */
  const getMoonPhaseEmoji = (fraction) => {
    if (fraction === 0) return '🌑';         // Lua nova
    if (fraction < 0.25) return '🌒';        // Crescente inicial
    if (fraction < 0.5) return '🌓';         // Quarto crescente
    if (fraction < 0.75) return '🌔';        // Gibosa crescente
    if (fraction === 1) return '🌕';         // Lua cheia
    if (fraction > 0.75) return '🌖';        // Gibosa minguante
    if (fraction > 0.5) return '🌗';         // Quarto minguante
    return '🌘';                             // Minguante final
  };

  /**
   * Obtém o nome da fase lunar com base no valor da fase
   * @param {number} phase - Valor da fase (0 a 1)
   * @returns {string} Nome da fase lunar
   */
  const getMoonPhaseName = (phase) => {
    if (phase === 0 || phase === 1) return 'Lua Nova';
    if (phase < 0.25) return 'Crescente Inicial';
    if (phase === 0.25) return 'Quarto Crescente';
    if (phase < 0.5) return 'Gibosa Crescente';
    if (phase === 0.5) return 'Lua Cheia';
    if (phase < 0.75) return 'Gibosa Minguante';
    if (phase === 0.75) return 'Quarto Minguante';
    return 'Minguante Final';
  };

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

        // Configurar atualização contínua
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  /**
   * Efeito para cálculo da direção do sol.
   * Executa sempre que a posição do usuário muda.
   */
/**
   * Efeito para cálculo da direção do sol E DA LUA
   */
  useEffect(() => {
    if (position) {
      const updateAzimuths = () => {
        // Calcular azimute do sol
        const sunAzimuth = getCurrentSunAzimuth(position.lat, position.lng);
        setSunAzimuth(sunAzimuth);

        // Calcular azimute da lua
        const moonAzimuth = getCurrentMoonAzimuth(position.lat, position.lng);
        setMoonAzimuth(moonAzimuth);
      };
      
      updateAzimuths();
      const interval = setInterval(updateAzimuths, 60000);
      
      return () => clearInterval(interval);
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

  /**
   * Efeito para cálculo dos horários do sol E DA LUA
   */
  useEffect(() => {
    if (position) {
      const updateCelestialData = () => {
        const now = new Date();
        
        // Dados do sol
        const times = SunCalc.getTimes(now, position.lat, position.lng);
        const sunPos = SunCalc.getPosition(now, position.lat, position.lng);
        
        setSunTimes({
          sunrise: times.sunrise,
          sunset: times.sunset,
          solarNoon: times.solarNoon
        });
        setIsDaytime(sunPos.altitude > 0);

        // Dados da lua
        const moonTimes = SunCalc.getMoonTimes(now, position.lat, position.lng);
        setMoonTimes({
          moonrise: moonTimes.rise,
          moonset: moonTimes.set
        });

        const moonIllumination = SunCalc.getMoonIllumination(now);
        setMoonPhase({
          fraction: moonIllumination.fraction,
          phase: moonIllumination.phase,
          emoji: getMoonPhaseEmoji(moonIllumination.fraction),
          name: getMoonPhaseName(moonIllumination.phase)
        });
      };
      
      updateCelestialData();
      const interval = setInterval(updateCelestialData, 60000);
      
      return () => {
        clearInterval(interval);
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
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }
    
    if (!sunTimes.sunset) return;

    const notificationTime = new Date(sunTimes.sunset.getTime() - 15 * 60000);
    const now = new Date();
    
    if (notificationTime <= now) return;
    
    const timeUntilNotification = notificationTime - now;
    
    notificationTimeout.current = setTimeout(() => {
      if (notificationPermission === 'granted') {
        new Notification('O pôr do sol está próximo!', {
          body: 'Faltam 15 minutos para o pôr do sol. Prepare-se para capturar uma foto perfeita!',
          icon: '/sunset-icon.png'
        });
      }
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
   * Calcula a diferença angular para feedback de alinhamento
   * @param {number} targetAzimuth
   * @returns number Diferença angular em graus 0-180
   */
  const calculateAngleDifference = (targetAzimuth) => {
    const diff = Math.abs(targetAzimuth - deviceHeading) % 360;
    return Math.min(diff, 360 - diff);
  };

  const calculateRelativeAngle = (targetAzimuth) => {
    return normalizeAngle(targetAzimuth - deviceHeading);
  };



// Suaviza os ângulos de rotação
useEffect(() => {
  if (sunAzimuth === null || moonAzimuth === null || deviceHeading === null) return;

  const sunAngle = calculateRelativeAngle(sunAzimuth);
  const moonAngle = calculateRelativeAngle(moonAzimuth);

  setSmoothedSunAngle(prev => smoothAngle(prev, sunAngle, 0.2));
  setSmoothedMoonAngle(prev => smoothAngle(prev, moonAngle, 0.2));
}, [sunAzimuth, moonAzimuth, deviceHeading]);

  /** Verifica alinhamento com o corpo celeste selecionado */
  const targetAzimuth = celestialBody === 'sun' ? sunAzimuth : moonAzimuth;
  const isAligned = calculateAngleDifference(targetAzimuth) < 15;


  // ======================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // ======================================================================

  return (
 <div className={`app-container ${isDaytime ? 'day-theme' : 'night-theme'}`}>
      <h1>{celestialBody === 'sun' ? '🌅 Localizando o Sol' : '🌙 Localizando a Lua'}</h1>
      
      {/* Botão de alternância */}
      <div className="celestial-toggle">
        <button 
          className={celestialBody === 'sun' ? 'active' : ''}
          onClick={() => setCelestialBody('sun')}
        >
          ☀️ Sol
        </button>
        <button 
          className={celestialBody === 'moon' ? 'active' : ''}
          onClick={() => setCelestialBody('moon')}
        >
          🌙 Lua
        </button>
      </div>

      {/* Informações do corpo celeste */}
      <div className="celestial-info">
        {celestialBody === 'sun' ? (
          <div className="info-cards">
            <div className="info-card">
              <span>☀️ Nascer do sol</span>
              <strong>{formatTime(sunTimes?.sunrise)}</strong>
            </div>
            <div className="info-card">
              <span>🌇 Pôr do sol</span>
              <strong>{formatTime(sunTimes?.sunset)}</strong>
            </div>
          </div>
        ) : (
          <div className="info-cards">
            <div className="info-card">
              <span>🌕 Nascer da lua</span>
              <strong>{formatTime(moonTimes?.moonrise)}</strong>
            </div>
            <div className="info-card">
              <span>🌑 Pôr da lua</span>
              <strong>{formatTime(moonTimes?.moonset)}</strong>
            </div>
            {/* Novo card para fase lunar */}
            <div className="info-card moon-phase moon-phase-card">
              <span>{moonPhase.emoji} Fase</span>
              <strong>{moonPhase.name}</strong>
              <div className="moon-phase-bar">
                <div 
                  className="moon-phase-fill"
                  style={{ width: `${moonPhase.fraction * 100}%` }}
                ></div>
              </div>
              <span className="moon-percentage">
                {Math.round(moonPhase.fraction * 100)}% iluminada
              </span>
            </div>
          </div>
        )}
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
      <div className="compass-wrapper ">
        <div className="compass">
          {/* Ponteiro do Sol (sempre visível) */}
         <div 
  className={`direction-arrow ${celestialBody === 'sun' ? 'active' : 'secondary'}`} 
  style={{ 
    transform: `rotate(${smoothedSunAngle}deg)` 
  }}
>
  <div className="celestial-indicator sun-indicator">☀️</div>
</div>

{/* Ponteiro da Lua */}
<div 
  className={`direction-arrow ${celestialBody === 'moon' ? 'active' : 'secondary'}`} 
  style={{ 
    transform: `rotate(${smoothedMoonAngle}deg)` 
  }}
>
  <div className="celestial-indicator moon-indicator">
    {moonPhase.emoji}              
  </div>            
 </div>   
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
          <p>
            🧭 Direção: {celestialBody === 'sun'
              ? `${sunAzimuth.toFixed(1)}° (Sol)`
              : `${moonAzimuth.toFixed(1)}° (Lua)`}
          </p>
          <div className={`alignment-feedback ${isAligned ? 'aligned' : ''}`}>
            {isAligned
              ? `⭐ ALINHADO COM ${celestialBody === 'sun' ? 'O SOL' : 'A LUA'}! ⭐`
              : `Gire o dispositivo para ${celestialBody === 'sun' ? 'o Sol' : 'a Lua'}... ➡️`}
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