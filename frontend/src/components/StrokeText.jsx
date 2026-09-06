import React, { useEffect, useState, useRef } from 'react';

const StrokeText = ({
  text = "Draw Attention",
  strokeColor = "#000000",
  fillColor = "#000000",
  strokeWidth = 1.4,
  drawDuration = 1.6,
  fillDelay = 0.2,
  stagger = 0.05,
  ease = "power2.out",
  trigger = "mount",
  fillMode = "wipe",
  fontSize = 128,
  fontWeight = 800,
  letterSpacing = -4,
  reverse = false,
  className = "",
  style = {}
}) => {
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const characters = text.split("");
  const estimatedCharWidth = fontSize * 0.62 + letterSpacing;
  const totalWidth = Math.max(text.length * estimatedCharWidth + 40, 300);
  const totalHeight = fontSize * 1.25;

  return (
    <div className={`stroke-text-wrapper ${className}`} style={{ width: '100%', overflow: 'hidden', ...style }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      >
        <style>
          {`
            @keyframes oxStrokeDraw {
              0% {
                stroke-dashoffset: 500;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
            @keyframes oxFillWipe {
              0% {
                fill-opacity: 0;
              }
              100% {
                fill-opacity: 1;
              }
            }
          `}
        </style>

        <g>
          {characters.map((char, index) => {
            const charDelay = (reverse ? characters.length - 1 - index : index) * stagger;
            const xPos = index * estimatedCharWidth + 10;
            return (
              <text
                key={index}
                x={xPos}
                y={fontSize * 0.9}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="'Plus Jakarta Sans', 'Space Mono', sans-serif"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
                fillOpacity={mounted ? 1 : 0}
                strokeDasharray="500"
                strokeDashoffset="500"
                style={{
                  animation: mounted
                    ? `oxStrokeDraw ${drawDuration}s cubic-bezier(0.215, 0.61, 0.355, 1) ${charDelay}s forwards, oxFillWipe 0.5s ease-out ${charDelay + drawDuration + fillDelay}s forwards`
                    : "none"
                }}
              >
                {char === " " ? "\u00A0" : char}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default StrokeText;
