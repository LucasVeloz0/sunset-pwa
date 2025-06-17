import React from 'react';
import DirectionArrow from './DirectionArrow';

const Compass = ({
    celestialBody,
    smoothedSunAngle,
    smoothedMoonAngle,
    moonPhase
}) => (
      <div className="compass-wrapper">
    <div className="compass">
      <DirectionArrow 
        angle={smoothedSunAngle}
        isActive={celestialBody === 'sun'}
        indicator="☀️"
        className="sun-indicator"
      />
      <DirectionArrow 
        angle={smoothedMoonAngle}
        isActive={celestialBody === 'moon'}
        indicator={moonPhase.emoji}
        className="moon-indicator"
      />
    </div>
  </div>
);

export default Compass;
