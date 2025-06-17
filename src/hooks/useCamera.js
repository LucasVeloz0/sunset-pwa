import { useState, useRef, useEffect, useCallback } from 'react';

export default function useCamera() {
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) return;

      const constraints = {
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            setError('Erro ao reproduzir vídeo: ' + err.message);
          });
        };
      }
    } catch (err) {
      setError('Erro ao acessar câmera: ' + err.message);
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [cameraActive, startCamera]);

  useEffect(() => {
    if (cameraActive) {
      startCamera();
    }
  }, [facingMode, cameraActive, startCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas && video.readyState >= 2) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL('image/jpeg', 0.9));
    }
  }, [facingMode]);

  const closeCamera = useCallback(() => {
    setCameraActive(false);
    setPhoto(null);
  }, []);

  return {
    cameraActive,
    setCameraActive,
    photo,
    setPhoto,
    facingMode,
    toggleCamera,
    capturePhoto,
    closeCamera,
    videoRef,
    canvasRef,
    cameraError: error
  };
}