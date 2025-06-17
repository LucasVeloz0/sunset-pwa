import React from 'react';

const PhotoPreview = ({ photo, closePreview }) => (
    <div className="photo-preview">
              <img src={photo} alt="Foto capturada" />
              <a
                href={photo}
                download={`por-do-sol-${Date.now()}.jpg`}
                className="download-button"
              >
                ⬇️ Baixar
              </a>
              <button 
              onClick={closePreview} 
              className="close-button"
              >
                ❌ Fechar
              </button>
            </div>
)

export default PhotoPreview;