import React, { useRef, useEffect } from 'react';

const ShapeGrid = ({
  speed = 0.5,
  squareSize = 40,
  size,
  direction = 'diagonal',
  borderColor = '#2F293A',
  hoverFillColor = '#222222',
  hoverColor,
  shape = 'square',
  hoverTrailAmount = 0,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const trailRef = useRef([]);

  const effectiveSize = size || squareSize || 40;
  const effectiveHoverColor = hoverFillColor || hoverColor || '#222222';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offsetX = 0;
    let offsetY = 0;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePosRef.current = { x, y };

      if (hoverTrailAmount > 0) {
        trailRef.current.unshift({ x, y, alpha: 1.0 });
        if (trailRef.current.length > hoverTrailAmount + 5) {
          trailRef.current.pop();
        }
      }
    };

    const handleMouseLeave = () => {
      mousePosRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    handleResize();

    const drawShape = (ctx, x, y, size, shapeType) => {
      const radius = size / 2;
      const cx = x + radius;
      const cy = y + radius;

      ctx.beginPath();
      if (shapeType === 'circle') {
        ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      } else if (shapeType === 'hexagon') {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + radius * 0.7 * Math.cos(angle);
          const hy = cy + radius * 0.7 * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
      } else if (shapeType === 'triangle') {
        ctx.moveTo(cx, cy - radius * 0.7);
        ctx.lineTo(cx + radius * 0.7, cy + radius * 0.7);
        ctx.lineTo(cx - radius * 0.7, cy + radius * 0.7);
        ctx.closePath();
      } else {
        // square
        ctx.rect(x + 2, y + 2, size - 4, size - 4);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Offset movement based on direction
      const step = speed * 0.4;
      if (direction === 'up') offsetY -= step;
      else if (direction === 'down') offsetY += step;
      else if (direction === 'left') offsetX -= step;
      else if (direction === 'right') offsetX += step;
      else if (direction === 'diagonal') {
        offsetX += step;
        offsetY += step;
      }

      offsetX = offsetX % effectiveSize;
      offsetY = offsetY % effectiveSize;

      const cols = Math.ceil(canvas.width / effectiveSize) + 2;
      const rows = Math.ceil(canvas.height / effectiveSize) + 2;

      ctx.lineWidth = 1;
      ctx.strokeStyle = borderColor;

      const mouse = mousePosRef.current;

      for (let i = -1; i < cols; i++) {
        for (let j = -1; j < rows; j++) {
          const x = i * effectiveSize + offsetX;
          const y = j * effectiveSize + offsetY;

          // Check hover proximity
          const cx = x + effectiveSize / 2;
          const cy = y + effectiveSize / 2;
          const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
          const isHovered = dist < effectiveSize * 0.8;

          let trailAlpha = 0;
          if (hoverTrailAmount > 0 && !isHovered) {
            for (let t = 0; t < trailRef.current.length; t++) {
              const item = trailRef.current[t];
              const tDist = Math.hypot(item.x - cx, item.y - cy);
              if (tDist < effectiveSize * 0.8) {
                trailAlpha = Math.max(trailAlpha, (1 - t / trailRef.current.length) * 0.5);
              }
            }
          }

          drawShape(ctx, x, y, effectiveSize, shape);

          if (isHovered) {
            ctx.fillStyle = effectiveHoverColor;
            ctx.fill();
          } else if (trailAlpha > 0) {
            ctx.fillStyle = effectiveHoverColor;
            ctx.globalAlpha = trailAlpha;
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, squareSize, size, direction, borderColor, hoverFillColor, hoverColor, shape, hoverTrailAmount]);

  return (
    <canvas
      ref={canvasRef}
      className={`position-fixed top-0 start-0 w-100 h-100 ${className}`}
      style={{
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.85
      }}
    />
  );
};

export default ShapeGrid;
