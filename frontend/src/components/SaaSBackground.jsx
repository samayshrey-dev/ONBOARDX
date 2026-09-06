import React, { useEffect, useRef } from 'react';

const SaaSBackground = ({ className = '', style = {} }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    resize();

    const dotSpacing = 28;
    const dotBaseRadius = 1.2;

    const render = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Floating ambient glowing orb 1
      const orb1X = width * 0.2 + Math.sin(time * 0.0005) * 80;
      const orb1Y = height * 0.25 + Math.cos(time * 0.0006) * 60;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 350);
      grad1.addColorStop(0, 'rgba(0, 0, 0, 0.04)');
      grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad1;
      ctx.beginPath();
      ctx.arc(orb1X, orb1Y, 350, 0, Math.PI * 2);
      ctx.fill();

      // Floating ambient glowing orb 2
      const orb2X = width * 0.8 - Math.cos(time * 0.0004) * 90;
      const orb2Y = height * 0.7 - Math.sin(time * 0.0005) * 70;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 400);
      grad2.addColorStop(0, 'rgba(0, 0, 0, 0.03)');
      grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(orb2X, orb2Y, 400, 0, Math.PI * 2);
      ctx.fill();

      // Render Interactive Dot Grid
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;
      const mouse = mouseRef.current;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * dotSpacing;
          const y = j * dotSpacing;

          const dist = Math.hypot(mouse.x - x, mouse.y - y);
          const maxDist = 140;

          let r = dotBaseRadius;
          let alpha = 0.15;
          let color = '#000000';

          if (dist < maxDist) {
            const factor = 1 - dist / maxDist;
            r = dotBaseRadius + factor * 2.2;
            alpha = 0.15 + factor * 0.55;
          }

          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`position-fixed top-0 start-0 w-100 h-100 ${className}`}
      style={{
        zIndex: -1,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
};


export default SaaSBackground;
