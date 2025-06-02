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
    // Converte radianos para graus e normaliza para 0-360
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

/**
 * Normaliza um ângulo para o intervalo [-180, 180]
 * Isso permite transições suaves através do ponto 0/360
 */
export const normalizeAngle = (angle) => {
  angle = angle % 360;
  if (angle > 180) {
    angle -= 360;
  }
  if (angle < -180) {
    angle += 360;
  }
  return angle;
};

/**
 * Calcula a diferença angular mais curta entre dois ângulos
 */
export const shortestAngleDiff = (target, current) => {
  const diff = normalizeAngle(target - current);
  return diff;
};

