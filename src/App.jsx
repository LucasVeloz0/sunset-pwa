import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import AppContainer from './components/Layout/AppContainer';
import CameraPreview from './components/Camera/CameraPreview';
import CameraControls from './components/Camera/CameraControls';
import PhotoPreview from './components/Camera/PhotoPreview';
import CelestialToggle from './components/Celestial/CelestialToggle';
import SunInfo from './components/Celestial/SunInfo';
import MoonInfo from './components/Celestial/MoonInfo';
import Compass from './components/Compass/Compass';
import ErrorBanner from './components/Layout/ErrorBanner';
import useGeolocation from './hooks/useGeolocation';
import useOrientation from './hooks/useOrientation';
import useCamera from './hooks/useCamera';
import useCelestialData from './hooks/useCelestialData';
import {
  normalizeOrientation,
  smoothAngle,
  normalizeAngle,
  calculateAngleDifference
} from './utils/angleUtils';
import { formatTime } from './utils/timeUtils';


/**
 * Componente principal do aplicativo Guia Fotográfico do Pôr do Sol.
 * Gerencia:
 * - alização do usuário
 * - Cálculo da direção do sol
 * - Orientação do dispositivo
 * - Controle de câmera e captura de fotos
 * - Interface de bússola digital
 */

const App = () => {
  const [celestialBody, setCelestialBody] = useState('sun'); // 'sun' ou 'moon'// 
  const [smoothedSunAngle, setSmoothedSunAngle] = useState(0);
  const [smoothedMoonAngle, setSmoothedMoonAngle] = useState(0);

  const { position, error: geoError } = useGeolocation();
  const { deviceHeading, error: orientationError } = useOrientation();
  const {
    sunAzimuth,
    moonAzimuth,
    sunTimes,
    moonTimes,
    moonPhase,
    isDaytime
  } = useCelestialData(position);

  const {
    cameraActive,
    setCameraActive,
    photo,
    setPhoto,
    facingMode,
    toggleCamera,
    capturePhoto,
    closeCamera,
    videoRef,
    canvasRef,
    error: cameraError
  } = useCamera();

  const notificationTimeout = useRef(null);
  // Estados para notificações
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [notificationScheduled, setNotificationScheduled] = useState(false);
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

  // Função para agendar notificação do pôr do sol
  const scheduleSunsetNotification = useCallback(() => {
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
    }

    if (!sunTimes?.sunset) return;

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

  // Agendar notificação quando os horários do sol mudarem
  useEffect(() => {
    if (sunTimes?.sunset && notificationPermission === 'granted' && !notificationScheduled) {
      scheduleSunsetNotification();
    }
  }, [sunTimes, notificationPermission, notificationScheduled, scheduleSunsetNotification]);  

 


  // Suaviza os ângulos de rotação
  useEffect(() => {
    if (sunAzimuth === null || moonAzimuth === null || deviceHeading === null) return;

    const sunAngle = normalizeAngle(sunAzimuth - deviceHeading);
    const moonAngle = normalizeAngle(moonAzimuth - deviceHeading);

    setSmoothedSunAngle(prev => smoothAngle(prev, sunAngle, 0.2));
    setSmoothedMoonAngle(prev => smoothAngle(prev, moonAngle, 0.2));
  }, [sunAzimuth, moonAzimuth, deviceHeading]);

  // Verificar alinhamento
  const targetAzimuth = celestialBody === 'sun' ? sunAzimuth : moonAzimuth;
  const isAligned = targetAzimuth !== null &&
                    deviceHeading !== null &&
                    calculateAngleDifference(targetAzimuth, deviceHeading) < 15;

  const errors = [geoError, orientationError, cameraError].filter(Boolean);



  // ======================================================================
  // RENDERIZAÇÃO DA INTERFACE
  // ======================================================================

  return (
    <AppContainer isDaytime={isDaytime}>
      <h1>{celestialBody === 'sun' ? '🌅 Localizando o Sol' : '🌙 Localizando a Lua'}</h1>

      <CelestialToggle
        celestialBody={celestialBody}
        setCelestialBody={setCelestialBody}
      />

      {celestialBody === 'sun' ? (
        <SunInfo sunTimes={sunTimes} />
      ) : (
        <MoonInfo moonTimes={moonTimes} moonPhase={moonPhase} />
      )}

      {/* Área da câmera */}
      {cameraActive && (
        <div className="camera-container">
          <CameraPreview
            videoRef={videoRef}
            facingMode={facingMode}
          />
          <CameraControls
            toggleCamera={toggleCamera}
            capturePhoto={capturePhoto}
            closeCamera={closeCamera}
          />
          {photo && (
            <PhotoPreview
              photo={photo}
              closePreview={() => setPhoto(null)}
            />
          )}
        </div>
      )}

       <Compass
        celestialBody={celestialBody}
        smoothedSunAngle={smoothedSunAngle}
        smoothedMoonAngle={smoothedMoonAngle}
        moonPhase={moonPhase}
      />

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
              ? `${sunAzimuth ? sunAzimuth.toFixed(1) : '--'}° (Sol)`
              : `${moonAzimuth ? moonAzimuth.toFixed(1) : '--'}° (Lua)`}
          </p>
          <div className={`alignment-feedback ${isAligned ? 'aligned' : ''}`}>
            {isAligned
              ? `⭐ ALINHADO COM ${celestialBody === 'sun' ? 'O SOL' : 'A LUA'}! ⭐`
              : `Gire o dispositivo para ${celestialBody === 'sun' ? 'o Sol' : 'a Lua'}... ➡️`}
          </div>
        </div>

        {errors.length > 0 && <ErrorBanner messages={errors} />}

      {/* Canvas oculto para captura de fotos */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

    </AppContainer>
  );
};

export default App;