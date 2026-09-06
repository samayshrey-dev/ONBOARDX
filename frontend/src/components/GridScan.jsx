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

  // Eye-soothing color fallback mapper
  const safeLinesColor = (linesColor === '#2F293A' || !linesColor) ? '#E2E8F0' : linesColor;
  const safeScanColor = (scanColor === '#FF9FFC' || !scanColor) ? '#94A3B8' : scanColor;
  const safeOpacity = scanOpacity > 0.15 ? 0.08 : scanOpacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let scanY = 0;

    const handleResize = () => {
      try {
        const parent = canvas.parentElement;
        if (parent) {
          canvas.width = parent.clientWidth || window.innerWidth || 1024;
          canvas.height = parent.clientHeight || window.innerHeight || 768;
        } else {
          canvas.width = window.innerWidth || 1024;
          canvas.height = window.innerHeight || 768;
        }
      } catch (e) {
        console.warn('GridScan resize error:', e);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      try {
        const width = canvas.width || window.innerWidth || 1024;
        const height = canvas.height || window.innerHeight || 768;

        if (!width || !height || isNaN(width) || isNaN(height)) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        // Subtle architectural grid cell size
        const cellSize = Math.max(28, Math.min(width, height) * (gridScale || 0.06));
        const cols = Math.ceil(width / cellSize) + 1;
        const rows = Math.ceil(height / cellSize) + 1;

        // Slow, smooth ambient sweep motion
        scanY = (scanY + 0.8 * (1 + (sensitivity || 0.15) * 0.2)) % (height + 150);

        // Draw Soft Subtle Grid Lines
        ctx.lineWidth = lineThickness || 0.75;
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

        // Soft Ambient Light Trace with safety bounds
        const beamHeight = 60 * (scanSoftness || 2);
        const yStart = Math.max(-200, Math.min(height + 200, scanY - beamHeight));
        const yEnd = Math.max(-200, Math.min(height + 300, scanY + beamHeight));

        if (isFinite(yStart) && isFinite(yEnd) && yEnd > yStart) {
          const gradient = ctx.createLinearGradient(0, yStart, 0, yEnd);
          gradient.addColorStop(0, 'rgba(255,255,255,0)');
          gradient.addColorStop(0.5, safeScanColor);
          gradient.addColorStop(1, 'rgba(255,255,255,0)');

          ctx.save();
          ctx.globalAlpha = safeOpacity;
          ctx.fillStyle = gradient;
          ctx.fillRect(0, yStart, width, Math.max(10, yEnd - yStart));
          ctx.restore();
        }
      } catch (err) {
        console.warn('GridScan render exception caught safely:', err);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
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
