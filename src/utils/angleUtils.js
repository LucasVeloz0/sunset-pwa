// Normaliza o ângulo de orientação para 0-360 graus
export const normalizeOrientation = (alpha) => {
  if (alpha === null) return 0;
  return (360 - alpha) % 360;
};

// Normaliza qualquer ângulo para 0-360
export const normalizeAngle = (angle) => {
  return ((angle % 360) + 360) % 360;
};

// Suaviza a transição entre ângulos
export const smoothAngle = (current, target, factor) => {
  if (current === undefined) return target;
  let diff = (target - current + 180) % 360 - 180;
  diff = diff < -180 ? diff + 360 : diff;
  return current + diff * factor;
};

// Calcula a diferença angular entre dois ângulos (0-180)
export const calculateAngleDifference = (angle1, angle2) => {
  const diff = Math.abs(angle1 - angle2) % 360;
  return Math.min(diff, 360 - diff);
};