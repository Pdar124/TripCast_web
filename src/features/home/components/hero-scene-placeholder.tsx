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
          <stop offset="0" stopColor="var(--hero-wire)" stopOpacity="0.72" />
          <stop offset="1" stopColor="var(--hero-terrain)" />
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
        <pattern id="hero-placeholder-grid" height="34" patternUnits="userSpaceOnUse" width="52">
          <path
            d="M 52 0 L 0 0 0 34"
            fill="none"
            stroke="var(--hero-wire)"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      <rect fill="url(#hero-placeholder-sky)" height="900" width="1600" />
      <path
        d="M0 530 130 474 250 510 392 382 500 456 654 316 788 438 914 348 1048 430 1178 294 1314 404 1450 336 1600 396V900H0Z"
        fill="url(#hero-placeholder-mountain)"
        opacity="0.58"
      />
      <path
        d="M0 648 142 590 282 624 438 494 574 568 724 430 874 538 1010 462 1172 528 1324 414 1456 494 1600 446V900H0Z"
        fill="var(--hero-terrain)"
      />
      <path
        d="M0 648 142 590 282 624 438 494 574 568 724 430 874 538 1010 462 1172 528 1324 414 1456 494 1600 446"
        fill="none"
        stroke="var(--hero-ridge)"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <path
        d="M0 706C242 650 382 706 582 618S920 518 1122 586s292-12 478-92V900H0Z"
        fill="url(#hero-placeholder-grid)"
        opacity="0.78"
      />

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
        ].map(([cx, cy]) => (
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
            <circle cx={cx} cy={cy} fill="var(--hero-route)" r="5" />
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
