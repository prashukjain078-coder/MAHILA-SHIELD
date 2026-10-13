import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-6 h-6',
  size,
  showText = false
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${showText ? '' : ''}`}>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
        aria-label="Mahila Shield Logo"
        role="img"
      >
        {/* Outer Protective Shield Boundary */}
        <path
          d="M 256 94 C 214 116, 166 130, 124 142 C 121 143, 118 146, 118 152 C 118 252, 148 342, 253 410 C 255 411, 257 411, 259 410 C 364 342, 394 252, 394 152 C 394 146, 391 143, 388 142 C 346 130, 298 116, 256 94 Z"
          stroke="#173859"
          strokeWidth="28"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dashed Journey Corridor (S-Curve path with rounded caps) */}
        {/* Bottom straight dashes under origin pin */}
        <path
          d="M 236 312 L 270 312"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M 281 312 L 296 312"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
        />
        {/* Lower curve sweeping up */}
        <path
          d="M 307 311 C 326 308, 340 297, 340 280"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
        {/* Middle loop sweeping left */}
        <path
          d="M 340 270 C 340 256, 328 250, 314 250 L 285 250"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
        {/* Upper curve sweeping up to destination */}
        <path
          d="M 273 244 C 273 230, 282 220, 296 214"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 308 211 L 322 211"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path
          d="M 330 211 L 336 211"
          stroke="#2565B0"
          strokeWidth="15"
          strokeLinecap="round"
        />

        {/* Origin Map Pin (Left, Royal Blue with Navy Center Dot) */}
        <path
          d="M 215 320 C 195 292, 170 268, 170 238 A 45 45 0 1 1 260 238 C 260 268, 235 292, 215 320 Z"
          fill="#2565B0"
        />
        <circle cx="215" cy="238" r="18" fill="#173859" />

        {/* Destination Map Pin with Heart Cutout (Top Right) */}
        <g transform="translate(330, 172)">
          <path
            d="M 0 34 C -8 24, -18 16, -18 0 A 18 18 0 1 1 18 0 C 18 16, 8 24, 0 34 Z"
            fill="#2565B0"
          />
          {/* White Heart Cutout */}
          <path
            d="M 0 6 C -1 4, -8 -1, -8 -5 C -8 -9, -4 -11, -1 -9 C 0 -8, 0 -8, 0 -8 C 0 -8, 0 -8, 1 -9 C 4 -11, 8 -9, 8 -5 C 8 -1, 1 4, 0 6 Z"
            fill="#ffffff"
          />
        </g>
      </svg>

      {showText && (
        <span className="font-semibold text-base text-[#202124] tracking-tight">
          Mahila Shield
        </span>
      )}
    </div>
  );
};
export default AppLogo;
