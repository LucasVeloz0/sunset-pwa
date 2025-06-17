import React from 'react';
import { formatTime } from '../../utils/timeUtils';
import MoonPhase from './MoonPhase';

const MoonInfo = ({ moonTimes, moonPhase }) => (
    <div className="info-cards">
        <div className="info-card">
            <span>🌕 Nascer da lua</span>
            <strong>{formatTime(moonTimes?.moonrise)}</strong>
        </div>
        <div className="info-card">
            <span>🌑 Pôr da lua</span>
            <strong>{formatTime(moonTimes?.moonset)}</strong>            
        </div>
        <MoonPhase moonPhase={moonPhase}
        className="info-card" />
        
    </div>
);

export default MoonInfo;