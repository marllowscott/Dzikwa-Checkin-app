import React from "react";

interface AnimatedLogoProps {
  className?: string;
  size?: number;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className = "", size = 120 }) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="drop-shadow-2xl"
        style={{
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}
      >
        <defs>
          {/* Gradient for subtle lighting effect */}
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#05636d" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#05636d" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#05636d" stopOpacity="0.9" />
          </linearGradient>

          {/* Shadow filter for depth */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="2" dy="2" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.2" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Logo container with flag-like animation */}
        <g transform="translate(100, 100)">
          {/* Main logo with fabric-like wave animation */}
          <g filter="url(#shadow)">
            {/* Logo path with multiple wave animations */}
            <path
              d="M -40,-30 Q -20,-35 0,-30 T 40,-30 L 40,30 Q 20,35 0,30 T -40,30 Z"
              fill="url(#logoGradient)"
              stroke="#05636d"
              strokeWidth="1"
              opacity="0"
            >
              {/* Fade in animation */}
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="1s"
                begin="0s"
                fill="freeze"
              />

              {/* Gentle wave animation - horizontal ripples */}
              <animateTransform
                attributeName="transform"
                type="skewY"
                values="0; 2; 0; -2; 0; 1; 0"
                dur="8s"
                begin="1s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
              />

              {/* Vertical wave for fabric effect */}
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1; 1.05,0.98; 1,1; 0.98,1.02; 1,1; 1.02,0.99; 1,1"
                dur="6s"
                begin="1.5s"
                repeatCount="indefinite"
                additive="sum"
                calcMode="spline"
                keySplines="0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1"
              />
            </path>

            {/* Inner detail with synchronized wave */}
            <path
              d="M -30,-20 Q -15,-23 0,-20 T 30,-20 L 30,20 Q 15,23 0,20 T -30,20 Z"
              fill="#ffffff"
              opacity="0"
            >
              {/* Fade in with slight delay */}
              <animate
                attributeName="opacity"
                from="0"
                to="0.3"
                dur="1s"
                begin="0.3s"
                fill="freeze"
              />

              {/* Synchronized wave animation */}
              <animateTransform
                attributeName="transform"
                type="skewY"
                values="0; 1.5; 0; -1.5; 0; 0.8; 0"
                dur="8s"
                begin="1.3s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
              />

              {/* Subtle scale animation */}
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1,1; 1.03,0.99; 1,1; 0.99,1.01; 1,1; 1.01,0.995; 1,1"
                dur="6s"
                begin="1.8s"
                repeatCount="indefinite"
                additive="sum"
                calcMode="spline"
                keySplines="0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1; 0.3 0 0.7 1"
              />
            </path>

            {/* Center emblem with rotation */}
            <circle
              cx="0"
              cy="0"
              r="8"
              fill="#ffffff"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                from="0"
                to="0.8"
                dur="1s"
                begin="0.6s"
                fill="freeze"
              />

              {/* Gentle rotation */}
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="20s"
                begin="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Center dot */}
            <circle
              cx="0"
              cy="0"
              r="3"
              fill="#05636d"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="1s"
                begin="0.8s"
                fill="freeze"
              />
            </circle>
          </g>

          {/* Subtle shimmer effect */}
          <rect
            x="-50"
            y="-40"
            width="100"
            height="80"
            fill="url(#shimmerGradient)"
            opacity="0"
          >
            <defs>
              <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>

            <animate
              attributeName="opacity"
              values="0; 0.3; 0"
              dur="4s"
              begin="3s"
              repeatCount="indefinite"
            />

            <animateTransform
              attributeName="transform"
              type="translate"
              values="-100,0; 100,0; -100,0"
              dur="4s"
              begin="3s"
              repeatCount="indefinite"
            />
          </rect>
        </g>
      </svg>
    </div>
  );
};
