import React from 'react';

const DirectionArrow = ({ angle, isActive, indicator, className }) => (
  <div 
    className={`direction-arrow ${isActive ? 'active' : 'secondary'} ${className}`} 
    style={{ 
      transform: `rotate(${angle}deg)` 
    }}
  >
    <div className="celestial-indicator">
      {indicator}
    </div>
  </div>
);

export default DirectionArrow;