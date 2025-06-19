import React from 'react';

const MoonPhase = ({ moonPhase }) => (
    <div className="info-card moon-phase card">
        <span>{moonPhase.emoji} Fase</span>
        <strong>{moonPhase.name}</strong>
        <div className="moon-phase-bar">
            <div
                className="moon-phase-fill"
                style={{ width: `${moonPhase.fraction * 100}%` }}
            ></div>
        </div>
        <span className="moon-percentage">
            {Math.round(moonPhase.fraction * 100)}% iluminada
        </span>
    </div>
)

export default MoonPhase;