import * as SunCalc from 'suncalc';

export const getCurrentSunAzimuth = (lat, lng) => {
  const now = new Date();
  const sunPos = SunCalc.getPosition(now, lat, lng);
  return normalizeAngle((sunPos.azimuth * 180 / Math.PI + 180) % 360);
};

export const getCurrentMoonAzimuth = (lat, lng) => {
  const now = new Date();
  const moonPos = SunCalc.getMoonPosition(now, lat, lng);
  return normalizeAngle((moonPos.azimuth * 180 / Math.PI + 180) % 360);
};

export const getMoonPhaseEmoji = (fraction) => {
  if (fraction === 0) return '🌑';
  if (fraction < 0.25) return '🌒';
  if (fraction < 0.5) return '🌓';
  if (fraction < 0.75) return '🌔';
  if (fraction === 1) return '🌕';
  if (fraction > 0.75) return '🌖';
  if (fraction > 0.5) return '🌗';
  return '🌘';
};

export const getMoonPhaseName = (phase) => {
  if (phase === 0 || phase === 1) return 'Lua Nova';
  if (phase < 0.25) return 'Crescente Inicial';
  if (phase === 0.25) return 'Quarto Crescente';
  if (phase < 0.5) return 'Gibosa Crescente';
  if (phase === 0.5) return 'Lua Cheia';
  if (phase < 0.75) return 'Gibosa Minguante';
  if (phase === 0.75) return 'Quarto Minguante';
  return 'Minguante Final';
};

// Função auxiliar para normalizar ângulos
const normalizeAngle = (angle) => {
  return ((angle % 360) + 360) % 360;
};