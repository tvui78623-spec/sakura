
import React from 'react';

export default function SakuraEffect() {
  return (
    <div className="sakura-background" aria-hidden="true">
      {Array.from({ length: 25 }, (_, i) => (
        <span
          key={i}
          className="sakura-petal"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 10) * 1.3}s`,
            animationDuration: `${8 + (i % 8)}s`,
            fontSize: `${12 + (i % 15)}px`,
          }}
        >
          🌸
        </span>
      ))}

      <style>{`
        .sakura-background {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .sakura-petal {
          position: absolute;
          top: -40px;
          animation: sakura-fall linear infinite;
          opacity: 0.65;
        }

        @keyframes sakura-fall {
          0% {
            transform: translateY(-40px) rotate(0deg);
            opacity: 0;
          }
          15% { opacity: 0.65; }
          85% { opacity: 0.65; }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
