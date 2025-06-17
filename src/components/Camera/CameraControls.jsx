import React from 'react';

const CameraControls = ({toggleCamera, capturePhoto, closeCamera}) =>  (
        <div className="camera-controls">
            <button 
            className="camera-btn" 
            onClick={toggleCamera} 
            aria-label="Alternar câmera"
            >
              🔄
            </button>
            <button 
            className="camera-btn capture-btn" 
            onClick={capturePhoto} 
            aria-label="Capturar foto"
            >
              ⭕
            </button>
            <button 
            className="camera-btn" 
            onClick={closeCamera} 
            aria-label="Fechar câmera"
            >
              ✖
            </button>
          </div>
    );


export default CameraControls;