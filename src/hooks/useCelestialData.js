import { useState, useEffect } from 'react';
import * as SunCalc from 'suncalc';
import { 
  getCurrentSunAzimuth, 
  getCurrentMoonAzimuth,
  getMoonPhaseEmoji,
  getMoonPhaseName
} from '../utils/celestialCalculations';

export default function useCelestialData(position) {
  const [sunAzimuth, setSunAzimuth] = useState(0);
  const [moonAzimuth, setMoonAzimuth] = useState(0);
  const [sunTimes, setSunTimes] = useState({ 
    sunrise: null, 
    sunset: null 
  });
  const [moonTimes, setMoonTimes] = useState({ 
    moonrise: null, 
    moonset: null 
  });
  const [moonPhase, setMoonPhase] = useState({
    fraction: 0,
    phase: 0,
    emoji: '🌑',
    name: 'Lua Nova'
  });
  const [isDaytime, setIsDaytime] = useState(false);

  useEffect(() => {
    if (!position) return;

    const updateData = () => {
      const now = new Date();
      
      // Sun data
      const times = SunCalc.getTimes(now, position.lat, position.lng);
      const sunPos = SunCalc.getPosition(now, position.lat, position.lng);
      
      setSunTimes({
        sunrise: times.sunrise,
        sunset: times.sunset
      });
      setIsDaytime(sunPos.altitude > 0);

      // Moon data
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

    updateData();
    const interval = setInterval(updateData, 60000);
    
    return () => clearInterval(interval);
  }, [position]);

  useEffect(() => {
    if (!position) return;

    const updateAzimuths = () => {
      setSunAzimuth(getCurrentSunAzimuth(position.lat, position.lng));
      setMoonAzimuth(getCurrentMoonAzimuth(position.lat, position.lng));
    };
    
    updateAzimuths();
    const interval = setInterval(updateAzimuths, 60000);
    
    return () => clearInterval(interval);
  }, [position]);

  return {
    sunAzimuth,
    moonAzimuth,
    sunTimes,
    moonTimes,
    moonPhase,
    isDaytime
  };
}