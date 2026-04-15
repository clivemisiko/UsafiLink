import React from 'react';

/**
 * Animated illustration of an exhauster truck service
 * Shows realistic truck movement and waste extraction process
 */
const ServiceAnimation = () => {
  return (
    <div className="w-full max-w-lg mx-auto">
      <svg
        viewBox="0 0 500 350"
        className="w-full h-auto"
        style={{ 
          filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.15))',
          maxWidth: '100%'
        }}
      >
        <defs>
          {/* Sky gradient */}
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#e0f2fe', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#bae6fd', stopOpacity: 1 }} />
          </linearGradient>

          {/* Tank gradient */}
          <linearGradient id="tankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#7c2d12', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#5a1f0f', stopOpacity: 1 }} />
          </linearGradient>

          {/* Truck body gradient */}
          <linearGradient id="truckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#047857', stopOpacity: 1 }} />
          </linearGradient>

          {/* Water gradient */}
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.7 }} />
            <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 0.9 }} />
          </linearGradient>

          <filter id="shadow">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
          </filter>

          <style>{`
            @keyframes drive {
              0% { transform: translateX(0px); }
              50% { transform: translateX(15px); }
              100% { transform: translateX(0px); }
            }
            @keyframes wheelRotate {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes waterLevel {
              0%, 100% { height: 35px; }
              50% { height: 55px; }
            }
            @keyframes waterFlow {
              0% { transform: translateY(-15px); opacity: 1; }
              100% { transform: translateY(70px); opacity: 0; }
            }
            @keyframes hoseFlow {
              0%, 100% { stroke-dashoffset: 40; }
              50% { stroke-dashoffset: 0; }
            }
            .truck-main { animation: drive 3s ease-in-out infinite; }
            .wheel-front { animation: wheelRotate 0.6s linear infinite; }
            .wheel-back { animation: wheelRotate 0.6s linear infinite; }
            .tank-water { animation: waterLevel 2.5s ease-in-out infinite; }
            .water-drop { animation: waterFlow 1.2s linear infinite; }
            .hose-line { 
              stroke-dasharray: 40;
              animation: hoseFlow 1.5s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* Sky background */}
        <rect width="500" height="350" fill="url(#skyGrad)" />

        {/* Clouds */}
        <ellipse cx="80" cy="40" rx="35" ry="20" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="110" cy="45" rx="45" ry="25" fill="rgba(255,255,255,0.6)" />
        <ellipse cx="380" cy="60" rx="40" ry="22" fill="rgba(255,255,255,0.65)" />
        <ellipse cx="415" cy="68" rx="35" ry="18" fill="rgba(255,255,255,0.55)" />

        {/* Ground */}
        <rect y="280" width="500" height="70" fill="#92a81b" />
        <rect y="280" width="500" height="8" fill="#7a8a15" />
        <rect y="288" width="500" height="4" fill="rgba(0,0,0,0.1)" />

        {/* Septic Tank (stationary, left side) */}
        <g>
          {/* Tank exterior */}
          <ellipse cx="80" cy="220" rx="45" ry="35" fill="url(#tankGrad)" stroke="#3f1f0a" strokeWidth="2" filter="url(#shadow)" />
          <ellipse cx="80" cy="195" rx="45" ry="12" fill="#8b5a44" stroke="#3f1f0a" strokeWidth="2" />
          <ellipse cx="80" cy="250" rx="45" ry="12" fill="#5a1f0f" stroke="#3f1f0a" strokeWidth="2" />

          {/* Water level inside */}
          <g className="tank-water">
            <ellipse cx="80" cy="240" rx="40" ry="8" fill="url(#waterGrad)" opacity="0.8" />
            <rect x="40" y="240" width="80" height="35" fill="url(#waterGrad)" opacity="0.7" />
          </g>

          {/* Tank opening */}
          <rect x="70" y="188" width="20" height="15" fill="#734a2c" stroke="#3f1f0a" strokeWidth="1" />

          {/* Label */}
          <text x="80" y="275" textAnchor="middle" fontSize="13" fill="#1f2937" fontWeight="bold">
            Septic Tank
          </text>
        </g>

        {/* Suction Hose (from tank to truck) */}
        <g>
          {/* Hose pipe with animated stroke */}
          <path
            d="M 120 210 Q 200 180, 280 160"
            stroke="#1f2937"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hose-line"
          />
          
          {/* Hose highlight */}
          <path
            d="M 120 210 Q 200 180, 280 160"
            stroke="#6b7280"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Water droplets flowing through hose */}
          <g className="water-drop">
            <circle cx="140" cy="206" r="3" fill="#00d9ff" opacity="0.9" filter="url(#shadow)" />
            <circle cx="170" cy="195" r="3" fill="#00d9ff" opacity="0.7" filter="url(#shadow)" />
            <circle cx="200" cy="185" r="3" fill="#00d9ff" opacity="0.5" filter="url(#shadow)" />
            <circle cx="240" cy="172" r="3" fill="#00d9ff" opacity="0.3" filter="url(#shadow)" />
          </g>
        </g>

        {/* EXHAUSTER TRUCK (realistic) */}
        <g className="truck-main" filter="url(#shadow)">
          {/* Truck cabin */}
          <rect x="310" y="140" width="50" height="45" rx="6" fill="url(#truckGrad)" stroke="#047857" strokeWidth="2" />

          {/* Cabin roof */}
          <path d="M 310 140 L 330 120 L 360 120 L 360 140" fill="#059669" stroke="#047857" strokeWidth="2" />

          {/* Windshield */}
          <rect x="318" y="142" width="24" height="20" fill="#bfdbfe" stroke="#047857" strokeWidth="1" rx="2" opacity="0.7" />

          {/* Cabin door */}
          <rect x="346" y="145" width="12" height="35" fill="#047857" stroke="#1f2937" strokeWidth="1" rx="1" />

          {/* Door handle */}
          <circle cx="355" cy="162" r="1.5" fill="#fbbf24" />

          {/* Truck bed/tank container - large cylinder */}
          <g>
            {/* Tank back */}
            <ellipse cx="410" cy="165" rx="55" ry="38" fill="#1f2937" stroke="#111827" strokeWidth="2" opacity="0.9" />
            {/* Tank top */}
            <ellipse cx="410" cy="135" rx="55" ry="15" fill="#374151" stroke="#111827" strokeWidth="2" />
            {/* Tank bottom (rear) */}
            <ellipse cx="410" cy="200" rx="55" ry="15" fill="#0f172a" stroke="#111827" strokeWidth="2" />

            {/* Tank access latch */}
            <rect x="405" y="125" width="10" height="8" fill="#fbbf24" stroke="#111827" strokeWidth="1" rx="1" />
          </g>

          {/* Hose connection inlet on tank */}
          <circle cx="355" cy="160" r="5" fill="#34d399" stroke="#047857" strokeWidth="2" />

          {/* Exhaust pipe */}
          <rect x="320" y="190" width="6" height="25" fill="#4b5563" stroke="#1f2937" strokeWidth="1" />
          <ellipse cx="323" cy="215" rx="4" ry="3" fill="#6b7280" />

          {/* Front wheels */}
          <g className="wheel-front" style={{ transformOrigin: '340px 200px' }}>
            <circle cx="340" cy="200" r="12" fill="#111827" stroke="#1f2937" strokeWidth="2" />
            <circle cx="340" cy="200" r="8" fill="#374151" />
            <circle cx="340" cy="200" r="4" fill="#4b5563" />
            {/* Wheel tread */}
            <line x1="332" y1="200" x2="348" y2="200" stroke="#666" strokeWidth="1" opacity="0.5" />
            <line x1="340" y1="192" x2="340" y2="208" stroke="#666" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Back wheels (dual) */}
          <g className="wheel-back" style={{ transformOrigin: '425px 200px' }}>
            <circle cx="415" cy="200" r="12" fill="#111827" stroke="#1f2937" strokeWidth="2" />
            <circle cx="415" cy="200" r="8" fill="#374151" />
            <circle cx="415" cy="200" r="4" fill="#4b5563" />
            <line x1="407" y1="200" x2="423" y2="200" stroke="#666" strokeWidth="1" opacity="0.5" />
            <line x1="415" y1="192" x2="415" y2="208" stroke="#666" strokeWidth="1" opacity="0.5" />
          </g>

          <g className="wheel-back" style={{ transformOrigin: '440px 200px' }}>
            <circle cx="430" cy="200" r="12" fill="#111827" stroke="#1f2937" strokeWidth="2" />
            <circle cx="430" cy="200" r="8" fill="#374151" />
            <circle cx="430" cy="200" r="4" fill="#4b5563" />
            <line x1="422" y1="200" x2="438" y2="200" stroke="#666" strokeWidth="1" opacity="0.5" />
            <line x1="430" y1="192" x2="430" y2="208" stroke="#666" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Truck bumper */}
          <rect x="455" y="170" width="12" height="40" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1.5" rx="2" />
        </g>

        {/* Sun */}
        <circle cx="450" cy="45" r="22" fill="#fbbf24" opacity="0.85" />
        <circle cx="450" cy="45" r="18" fill="#fcd34d" opacity="0.6" />

        {/* Title text */}
        <text x="250" y="320" textAnchor="middle" fontSize="16" fill="#1f2937" fontWeight="bold">
          On-Demand Exhauster Service
        </text>
      </svg>
    </div>
  );
};

export default ServiceAnimation;
