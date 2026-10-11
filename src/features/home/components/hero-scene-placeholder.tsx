export function HeroScenePlaceholder({ hidden }: { hidden: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full transition-opacity duration-700"
      data-testid="hero-scene-placeholder"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: hidden ? 0 : 1 }}
      viewBox="0 0 1600 900"
    >
      <defs>
        <linearGradient id="hero-placeholder-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hero-bg)" />
          <stop offset="0.62" stopColor="var(--hero-fog)" />
          <stop offset="1" stopColor="var(--hero-terrain)" />
        </linearGradient>
        <linearGradient id="hero-placeholder-mountain" x1="0" x2="0.9" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hero-terrain-high)" stopOpacity="0.84" />
          <stop offset="1" stopColor="var(--hero-terrain-mid)" />
        </linearGradient>
        <linearGradient id="hero-placeholder-foreground" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--hero-terrain-mid)" />
          <stop offset="1" stopColor="var(--hero-terrain-low)" />
        </linearGradient>
        <linearGradient id="hero-placeholder-mist" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--hero-fog)" stopOpacity="0" />
          <stop offset="0.55" stopColor="var(--hero-fog)" stopOpacity="0.42" />
          <stop offset="1" stopColor="var(--hero-fog)" stopOpacity="0.08" />
        </linearGradient>
        <filter id="hero-placeholder-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="hero-placeholder-sheen" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <path id="hero-placeholder-tree" d="M0 0 10 28H5l8 22H-13l8-22h-5Z" />
      </defs>

      <rect fill="url(#hero-placeholder-sky)" height="900" width="1600" />
      <path
        d="M0 562C128 522 206 510 310 475c116-39 147-126 264-98 87 21 125 83 229 48 91-31 133-105 240-102 92 3 139 93 239 65 117-33 164-97 318-65v587H0Z"
        fill="url(#hero-placeholder-mountain)"
        opacity="0.64"
      />
      <path
        d="M0 670c170-56 260-32 377-93 105-54 155-132 275-98 113 32 146 118 283 76 117-36 151-104 281-73 117 28 205 83 384 4v414H0Z"
        fill="url(#hero-placeholder-foreground)"
      />
      <path
        d="M0 670c170-56 260-32 377-93 105-54 155-132 275-98 113 32 146 118 283 76 117-36 151-104 281-73 117 28 205 83 384 4"
        fill="none"
        stroke="var(--hero-ridge)"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <path
        d="M0 710c224-63 373 23 585-66s339-101 534-40c188 59 309-4 481-89v385H0Z"
        fill="var(--hero-terrain-low)"
        opacity="0.58"
      />
      <path
        d="M322 588c172-78 294-53 422-12s219 30 353-13 248-38 393-5"
        fill="none"
        stroke="url(#hero-placeholder-mist)"
        strokeLinecap="round"
        strokeWidth="46"
      />

      <g fill="var(--hero-trees)" opacity="0.82">
        <use href="#hero-placeholder-tree" transform="translate(780 520) scale(.8)" />
        <use href="#hero-placeholder-tree" transform="translate(834 536) scale(.58)" />
        <use href="#hero-placeholder-tree" transform="translate(913 527) scale(.72)" />
        <use href="#hero-placeholder-tree" transform="translate(1034 493) scale(.68)" />
        <use href="#hero-placeholder-tree" transform="translate(1088 483) scale(.9)" />
        <use href="#hero-placeholder-tree" transform="translate(1192 486) scale(.62)" />
        <use href="#hero-placeholder-tree" transform="translate(1315 516) scale(.78)" />
      </g>

      <g className="hero-placeholder-route">
        <path
          d="M1242 814C1176 752 1196 690 1112 650c-78-37-34-104-122-124-86-20-58-102-138-122"
          fill="none"
          filter="url(#hero-placeholder-glow)"
          stroke="var(--hero-route)"
          strokeLinecap="round"
          strokeWidth="5"
        />
        {[
          [1238, 810],
          [1138, 666],
          [1012, 536],
          [854, 406],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              fill="none"
              r="16"
              stroke="var(--hero-route)"
              strokeOpacity="0.34"
              strokeWidth="2"
            />
            <circle
              cx={cx}
              cy={cy}
              fill="#ffffff"
              r="12"
              stroke="var(--hero-route)"
              strokeWidth="4"
            />
            <text
              dominantBaseline="central"
              fill="#102117"
              fontFamily="Arial, sans-serif"
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
              x={cx}
              y={cy + 0.5}
            >
              {index + 1}
            </text>
          </g>
        ))}
      </g>

      <rect
        className="hero-placeholder-sheen"
        fill="url(#hero-placeholder-sheen)"
        height="900"
        width="420"
        x="-520"
      />
    </svg>
  );
}
