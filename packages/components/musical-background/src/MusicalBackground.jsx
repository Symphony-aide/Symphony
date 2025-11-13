import React, { useEffect, useRef } from 'react';

export default function MusicalBackground({ 
  className = '',
  animated = true,
  gradientMesh = true
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !animated) return;

    const svg = svgRef.current;
    
    // Define curve configurations
    const curves = [
      { id: 'waveGrad1', offset: 0, scale: 1, strokeWidth: 2, delay: 0 },
      { id: 'waveGrad2', offset: 30, scale: 1.2, strokeWidth: 1.8, delay: 0.8 },
      { id: 'waveGrad3', offset: 60, scale: 1.4, strokeWidth: 1.5, delay: 1.6 }
    ];

    // Generate reciprocal function curves
    curves.forEach((curve, index) => {
      let pathData = '';
      const points = 300;
      
      for (let i = 0; i < points; i++) {
        const x = (i / points) * 1000;
        // Reciprocal function: y = k/(x + offset) shifted and scaled
        const xShifted = (i / points) * 10 + 0.5; // Start from 0.5 to avoid division by zero
        const y = (curve.offset + 150 / (xShifted * curve.scale)) + 50;
        
        if (i === 0) {
          pathData += `M ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      }
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'musical-line');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', `url(#${curve.id})`);
      path.setAttribute('stroke-width', curve.strokeWidth);
      path.setAttribute('stroke-linecap', 'round');
      path.style.animationDelay = `${curve.delay}s`;
      
      svg.appendChild(path);
    });

    // Cleanup
    return () => {
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
    };
  }, [animated]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Gradient Mesh Background */}
      {gradientMesh && (
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 27% 37%, rgba(91, 143, 249, 0.12) 0px, transparent 50%),
              radial-gradient(at 97% 21%, rgba(74, 122, 216, 0.12) 0px, transparent 50%),
              radial-gradient(at 52% 99%, rgba(59, 109, 216, 0.10) 0px, transparent 50%),
              radial-gradient(at 10% 29%, rgba(123, 165, 250, 0.08) 0px, transparent 50%)
            `
          }}
        />
      )}

      {/* Musical Staff Lines SVG */}
      <svg 
        ref={svgRef}
        viewBox="0 0 1000 800" 
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Gradient Definitions */}
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#5B8FF9', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#5B8FF9', stopOpacity: 0.2 }} />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#7BA5FA', stopOpacity: 0.5 }} />
            <stop offset="100%" style={{ stopColor: '#7BA5FA', stopOpacity: 0.15 }} />
          </linearGradient>
          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4A7AD8', stopOpacity: 0.4 }} />
            <stop offset="100%" style={{ stopColor: '#4A7AD8', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Animation Styles */}
      {animated && (
        <style jsx>{`
          @keyframes wave-flow {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
          }
          
          .musical-line {
            animation: wave-flow 4s ease-in-out infinite;
          }
        `}</style>
      )}
    </div>
  );
}
