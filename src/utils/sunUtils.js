import * as SunCalc from 'suncalc';

export const getSunsetDirection = (lat, lng) => {
  const now = new Date();
  const sunsetTime = SunCalc.getTimes(now, lat, lng).sunset;
  const sunPos = SunCalc.getPosition(sunsetTime, lat, lng);
  return ((sunPos.azimuth * 180 / Math.PI) + 180) % 360;
};

export const normalizeOrientation = (alpha) => {
  return (360 - alpha) % 360;
};

export const smoothAngle = (previous, current, factor) => {
  let diff = current - previous;
  
  // Ajusta para o menor caminho circular
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  return previous + diff * factor;
};

/**
 * Normaliza um ângulo para o intervalo [-180, 180]
 */
export const normalizeAngle = (angle) => {
  angle = angle % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
};