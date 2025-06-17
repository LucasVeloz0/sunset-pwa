import { useState, useEffect } from 'react';

export default function useGeolocation() {
const [position, setPosition] = useState(null);
const [error, setError] = useState(null);

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

  return { position, error };
}