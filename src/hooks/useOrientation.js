import { useState, useEffect } from 'react';
import { normalizeOrientation } from '../utils/angleUtils';

export default function useOrientation() {
    const [deviceHeading, setDeviceHeading] = useState(null);
    const [error, setError] = useState(null);
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

    return {
        deviceHeading,
        error
    };
}
