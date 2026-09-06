import React, { useRef, useEffect } from 'react';

const GridScan = ({
  sensitivity = 0.15,
  lineThickness = 0.75,
  linesColor = '#E2E8F0',
  gridScale = 0.06,
  scanColor = '#94A3B8',
  scanOpacity = 0.08,
  enablePost = false,
  bloomIntensity = 0,
  chromaticAberration = 0,
  noiseIntensity = 0,
  lineJitter = 0,
  scanGlow = 0.1,
  scanSoftness = 3,
  enableWebcam = false,
  showPreview = false,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef(null);

  // Eye-soothing color fallback mapper if legacy harsh neon colors were passed
  const safeLinesColor = (linesColor === '#2F293A' || !linesColor) ? '#E2E8F0' : linesColor;
  const safeScanColor = (scanColor === '#FF9FFC' || !scanColor) ? '#94A3B8' : scanColor;
  const safeOpacity = scanOpacity > 0.15 ? 0.08 : scanOpacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let scanY = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || window.innerWidth;
        canvas.height = parent.clientHeight || window.innerHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle architectural grid cell size
      const cellSize = Math.max(28, Math.min(width, height) * (gridScale || 0.06));
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      // Slow, smooth ambient sweep motion
      scanY = (scanY + 0.8 * (1 + sensitivity * 0.2)) % (height + 150);

      // Draw Soft Subtle Grid Lines
      ctx.lineWidth = lineThickness;
      ctx.strokeStyle = safeLinesColor;

      for (let i = 0; i <= cols; i++) {
        const x = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = j * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Soft Ambient Light Trace (Zero glare, smooth gradient sweep)
      const beamHeight = 60 * (scanSoftness || 2);
      const gradient = ctx.createLinearGradient(0, scanY - beamHeight, 0, scanY + beamHeight);
      
      gradient.addColorStop(0, 'rgba(255,255,255,0)');
      gradient.addColorStop(0.5, safeScanColor);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      ctx.save();
      ctx.globalAlpha = safeOpacity;
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - beamHeight, width, beamHeight * 2);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [sensitivity, lineThickness, safeLinesColor, gridScale, safeScanColor, safeOpacity, scanSoftness]);

  return (
    <div
      className={`position-fixed top-0 start-0 w-100 h-100 ${className}`}
      style={{
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 0%, #FAFAFC 0%, #F4F4F7 100%)',
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-100 h-100 d-block"
      />
    </div>
  );
};

export default GridScan;
