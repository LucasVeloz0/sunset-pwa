import * as SunCalc from 'suncalc';

// Dentro do useEffect que depende de location:
if (location) {
  const times = SunCalc.getTimes(new Date(), location.lat, location.lng);
  const sunsetPosition = SunCalc.getPosition(times.sunset, location.lat, location.lng);
  
  // Converter radianos para graus e ajustar direção
  const azimuth = (sunsetPosition.azimuth * 180 / Math.PI + 180) % 360;
  setSunsetData(prev => ({ ...prev, azimuth }));
}

// Adicione no JSX:
{sunsetData?.azimuth && (
  <div>
    <h2>Direção</h2>
    <div className="compass">
      <div 
        className="arrow"
        style={{ transform: `rotate(${sunsetData.azimuth}deg)` }}
      >↑</div>
    </div>
    <p>{sunsetData.azimuth.toFixed(1)}°</p>
  </div>
)}