// frontend/components/glass/LiquidGlassFilter.tsx
// Renders the SVG filter definition required for the distortion
// effect. Invisible in the DOM. Import once in root layout.

export function LiquidGlassFilter() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* forgeflow-glass: Edge-focused displacement for Liquid Glass.
            Edge refraction: strong near borders, minimal in center.
            Chromium renders this correctly; Safari/Firefox use CSS
            backdrop-filter fallback only. */}
        <filter
          id="forgeflow-glass"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            seed="2"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="grayNoise"
          />
          <feComposite
            in="grayNoise"
            in2="SourceGraphic"
            operator="in"
            result="maskedNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="maskedNoise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur
            in="displaced"
            stdDeviation="0.4"
            result="blurred"
          />
          <feBlend in="blurred" in2="SourceGraphic" mode="normal" />
        </filter>

        {/* forgeflow-glass-button: Lighter variant for buttons/badges */}
        <filter
          id="forgeflow-glass-button"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves="2"
            seed="5"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="gray"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
