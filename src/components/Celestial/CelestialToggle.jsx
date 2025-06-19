import React from 'react';

const CelestialToggle = ({ celestialBody, setCelestialBody }) => (
  <>
    {/* Botão de alternância */}
    <div className="celestial-toggle, btn">
      <button
        className={celestialBody === 'sun' ? 'active' : ''}
        onClick={() => setCelestialBody('sun')}
      >
        ☀️ Sol
      </button>
      <button
        className={celestialBody === 'moon' ? 'active' : ''}
        onClick={() => setCelestialBody('moon')}
      >
        🌙 Lua
      </button>
    </div>
  </>
);

export default CelestialToggle;