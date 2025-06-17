import React from 'react';

const CameraPreview = ({ videoRef, facingMode }) => {
    return (
    <video
        ref={videoRef}
        className={`camera-preview${facingMode === 'user' ? ' mirrored' : ''}`}
        playsInline
        muted
    />

)};

export default CameraPreview;