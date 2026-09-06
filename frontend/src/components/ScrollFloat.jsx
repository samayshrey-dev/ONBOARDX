import React, { useEffect, useRef, useState } from 'react';

const ScrollFloat = ({
  children,
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  className = '',
  style = {}
}) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.15,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const textContent = typeof children === 'string' ? children : '';
  const words = textContent ? textContent.split(' ') : [];

  const getTransitionEase = (easeProp) => {
    if (easeProp && easeProp.includes('back')) {
      return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    return 'cubic-bezier(0.25, 1, 0.5, 1)';
  };

  return (
    <span
      ref={containerRef}
      className={`scroll-float-container ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'top',
        ...style
      }}
    >
      {words.length > 0 ? (
        words.map((word, wordIdx) => (
          <span
            key={wordIdx}
            style={{
              display: 'inline-block',
              marginRight: '0.25em',
              whiteSpace: 'nowrap'
            }}
          >
            {word.split('').map((char, charIdx) => {
              const globalIndex = wordIdx * 4 + charIdx;
              const delay = globalIndex * stagger;
              return (
                <span
                  key={charIdx}
                  style={{
                    display: 'inline-block',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.94)',
                    transition: `opacity ${animationDuration}s ${getTransitionEase(ease)} ${delay}s, transform ${animationDuration}s ${getTransitionEase(ease)} ${delay}s`,
                    willChange: 'transform, opacity'
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        ))
      ) : (
        <span
          style={{
            display: 'inline-block',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity ${animationDuration}s ${getTransitionEase(ease)} 0s, transform ${animationDuration}s ${getTransitionEase(ease)} 0s`
          }}
        >
          {children}
        </span>
      )}
    </span>
  );
};

export default ScrollFloat;
