import * as SunCalc from 'suncalc'; // Adicione esta linha no topo

/**
 * Calcula a direção do pôr do sol em graus
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {number} Azimute em graus (0 = Norte, 90 = Leste)
 */
export const getSunsetDirection = (lat, lng) => {
  const now = new Date();
  const sunsetTime = SunCalc.getTimes(now, lat, lng).sunset;
  const sunPos = SunCalc.getPosition(sunsetTime, lat, lng);
  return ((sunPos.azimuth * 180 / Math.PI) + 180) % 360;
};

/**
 * Normaliza a orientação do dispositivo
 * @param {number} alpha - Ângulo da bússola (0-360)
 * @returns {number} Ângulo ajustado
 */
export const normalizeOrientation = (alpha) => {
  return (360 - alpha) % 360;
};