import React from 'react';
import { formatTime } from '../../utils/timeUtils';

const SunInfo = ({ sunTimes, isDaytime }) => (
    <div className="info-cards">
        <div className="info-card">
            <span>☀️ Nascer do sol</span>
            <strong>{formatTime(sunTimes?.sunrise)}</strong>
        </div>
        <div className="info-card">
            <span>🌇 Pôr do sol</span>
            <strong>{formatTime(sunTimes?.sunset)}</strong>
        </div>
    </div>
);

export default SunInfo;